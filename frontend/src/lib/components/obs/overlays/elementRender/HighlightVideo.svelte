<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { electronEmitter, highlightReels, isElectron, serverClockOffset, urls, videoVolumes } from '$lib/utils/store.svelte';
	import { clipSeconds, type HighlightClip, type HighlightReel } from '$lib/utils/highlightReel';
	import { isVideoFile } from '$lib/utils/overlayAssets';

	// Media: a file uploaded to the element (plays / shows on loop), or what a flow puts on `key` ("Set media":
	// a video or image file, a web link, a highlight's replay-buffer clip; older flows: a reel of clips).
	// Every device plays the same position: (server now − startedAt) mod length. Three <video>s: one plays
	// while the next clips are loaded and seeked ahead, then they swap — a clip only shows once ready; one that
	// fails is skipped. Nothing on the key = nothing shown (also in the editor).
	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	/** Overlay list / thumbnail renders: never start or play a reel. */
	export let preview = false;
	export let overlayId: string | undefined = $page.params.overlay;

	const DRIFT = 0.4; // s — reseek the playing clip when it is further off the shared clock
	const LOAD_TIMEOUT_MS = 10000;

	// payload.video {key, volume 0–100, source 'key' | 'file', file, fit}; older elements: payload.highlight {key, sound}.
	type Settings = { key?: string; volume?: number; source?: 'key' | 'file'; file?: string; fit?: 'cover' | 'contain' };
	$: settings = ((data): Settings => data?.video ?? (data?.highlight ? { key: data.highlight.key, volume: data.highlight.sound ? 100 : 0 } : {}))(
		dataItem?.data as { video?: Settings; highlight?: { key?: string; sound?: boolean } },
	);
	$: fit = settings.fit ?? 'cover';
	$: key = settings.key?.trim() || 'game';
	$: fileMode = settings.source === 'file';
	/** A flow's "Set media volume" wins over the element's own volume (key mode). */
	$: volume = (fileMode ? undefined : $videoVolumes[key]) ?? settings.volume ?? 0;
	$: for (const v of [...videos, fileVideo]) if (v) {
		v.volume = Math.min(1, Math.max(0, volume / 100));
		v.muted = volume <= 0;
	}
	$: base = ($isElectron ? $urls?.localResource : $urls?.externalResource) ?? '';
	$: fileUrl = fileMode && settings.file ? `${base}/public/custom/${overlayId}/image/${encodeURI(settings.file)}` : null;
	$: reel = fileMode ? null : ($highlightReels[key] ?? null);
	$: isImage = reel?.kind === 'image';
	const srcOf = (clip: HighlightClip) => (/^https?:\/\//i.test(clip.url) ? clip.url : `${base}${clip.url}`);

	/** Video players: the clip on screen + the next 2 loaded and seeked, ready to swap in. */
	const SLOTS = 3;
	let videos: HTMLVideoElement[] = [];
	let fileVideo: HTMLVideoElement | undefined;
	/** Per slot: which clip it holds, ready = seeked to the clip start. */
	let slots = Array.from({ length: SLOTS }, () => ({ clip: -1, ready: false, failed: false }));
	let shown = -1;
	let reelId: string | null = null;
	/** Bumped on every reset — loads from an older reel stop. */
	let generation = 0;
	/** Per clip: start / end in its video (s), once its video's length is known. */
	let bounds: ({ start: number; end: number } | null)[] = [];

	/** Where a clip starts / ends in its video: seconds from the start (links, ranges) or from the end (replay buffers). */
	const boundsOf = (clip: HighlightClip, duration: number) => {
		const start = clip.start ?? (clip.fromEnd ? Math.max(0, duration - clip.fromEnd) : 0);
		const end = clip.end ?? (Number.isFinite(duration) ? duration - (clip.toEnd ?? 0) : start);
		return { start, end: Math.max(start, end) };
	};
	/** A clip's length before its video loaded: known for replay-buffer clips and full ranges. */
	const knownLength = (clip: HighlightClip, i: number) =>
		bounds[i] ? bounds[i]!.end - bounds[i]!.start : clipSeconds(clip) > 0 ? clipSeconds(clip) : clip.start != null && clip.end != null ? clip.end - clip.start : null;
	const elapsed = (r: HighlightReel) => (Date.now() + $serverClockOffset - (r.startedAt ?? 0)) / 1000;

	/** Drop the videos right away (reel replaced, cleared, or element gone) — frees the files. */
	function reset() {
		generation++;
		for (const v of videos) {
			if (!v) continue;
			v.pause();
			v.removeAttribute('src');
			v.load();
		}
		slots = slots.map(() => ({ clip: -1, ready: false, failed: false }));
		shown = -1;
		bounds = [];
	}

	$: onReel(reel);
	function onReel(r: HighlightReel | null) {
		if (r?.id === reelId) return;
		reelId = r?.id ?? null;
		reset();
		if (!r || preview) return;
		if (r.startedAt === null && (r.clips.length || r.highlights?.length)) $electronEmitter.emit('HighlightReelShown', r.key, r.id);
	}

	const once = (v: HTMLVideoElement, event: string) =>
		new Promise<void>((resolve, reject) => {
			const done = () => (cleanup(), resolve());
			const fail = () => (cleanup(), reject(new Error(v.error?.message || 'load failed')));
			const timer = setTimeout(fail, LOAD_TIMEOUT_MS);
			const cleanup = () => (clearTimeout(timer), v.removeEventListener(event, done), v.removeEventListener('error', fail));
			v.addEventListener(event, done, { once: true });
			v.addEventListener('error', fail, { once: true });
		});

	/** Load clip `index` into `slot` and seek to its start (paused). */
	async function load(slot: number, index: number) {
		const v = videos[slot];
		const clip = reel?.clips[index];
		if (!v || !clip) return;
		const gen = generation;
		slots[slot] = { clip: index, ready: false, failed: false };
		try {
			const src = srcOf(clip);
			if (v.getAttribute('src') !== src) {
				v.src = src;
				await once(v, 'loadedmetadata');
			}
			if (gen !== generation) return;
			bounds[index] = boundsOf(clip, v.duration);
			v.currentTime = bounds[index]!.start;
			await once(v, 'seeked');
			if (gen === generation) slots[slot] = { clip: index, ready: true, failed: false };
		} catch {
			if (gen === generation) slots[slot] = { clip: index, ready: false, failed: true };
		}
	}

	/** Browsers may block autoplay with sound (phones) — then play muted. */
	const play = (v: HTMLVideoElement) =>
		void v.play().catch(() => {
			v.muted = true;
			void v.play().catch(() => {});
		});

	/** Which clip and how far into it after `t` seconds, looping over the clip lengths. */
	function position(lengths: number[], t: number) {
		const total = lengths.reduce((a, b) => a + b, 0);
		if (total <= 0) return null;
		let rest = ((t % total) + total) % total;
		for (let index = 0; index < lengths.length; index++) {
			if (rest < lengths[index]) return { index, offset: rest };
			rest -= lengths[index];
		}
		return { index: lengths.length - 1, offset: 0 };
	}

	function tick() {
		if (!reel || isImage || !reel.clips.length || reel.startedAt === null || preview || videos.filter(Boolean).length < SLOTS) return;
		const lengths = reel.clips.map((c, i) => knownLength(c, i));
		const n = reel.clips.length;
		if (lengths.some((l) => l === null)) {
			// Lengths come from the videos (web links, whole files): load those first.
			for (let i = 0; i < n && i < SLOTS; i++) if (lengths[i] === null && !slots.some((s) => s.clip === i)) void load(slots.findIndex((s) => s.clip === -1), i);
			if (lengths.some((l) => l === null)) return;
		}
		const pos = position(lengths as number[], elapsed(reel));
		if (!pos) return;
		// This clip and the next 2: each in a slot (loading or ready) — a free slot is one not on screen.
		const wanted = [...new Set(Array.from({ length: Math.min(SLOTS, n) }, (_, k) => (pos.index + k) % n))];
		for (const w of wanted) {
			if (slots.some((s) => s.clip === w)) continue;
			const free = slots.findIndex((s, i) => i !== shown && !wanted.includes(s.clip));
			if (free !== -1) void load(free, w);
		}
		const slot = slots.findIndex((s) => s.clip === pos.index);
		// Its turn but not ready: freeze the previous clip's last frame rather than play past its end.
		if (slot !== shown && shown !== -1 && !slots[slot]?.ready) videos[shown]?.pause();
		if (slot === -1) return;
		const v = videos[slot];
		if (slots[slot].failed) {
			// Skipped: nothing on screen for this clip's turn.
			if (shown !== -1) videos[shown]?.pause();
			shown = -1;
		} else if (slots[slot].ready && bounds[pos.index]) {
			const target = bounds[pos.index]!.start + pos.offset;
			if (shown !== slot) {
				v.currentTime = target;
				play(v);
				if (shown !== -1) videos[shown]?.pause();
				shown = slot;
			} else if (Math.abs(v.currentTime - target) > DRIFT) {
				v.currentTime = target;
			}
			if (v.paused) play(v);
		}
	}

	let interval: ReturnType<typeof setInterval>;
	onMount(() => (interval = setInterval(tick, 200)));
	onDestroy(() => {
		clearInterval(interval);
		reset();
	});
</script>

<!-- data-trigger-value: element triggers fire when the key gets new media, not on every clip swap. -->
<div class={`w-full h-full relative ${style.classValue}`} style={style.cssValue} data-trigger-value={fileMode ? settings.file ?? '' : reel?.id ?? ''}>
	{#if fileMode}
		{#if fileUrl && isVideoFile(settings.file)}
			<!-- svelte-ignore a11y-media-has-caption -->
			<video bind:this={fileVideo} class="clip clip--shown" style:object-fit={fit} src={fileUrl} autoplay={!preview} loop playsinline disablepictureinpicture />
		{:else if fileUrl}
			<img class="clip clip--shown" style:object-fit={fit} src={fileUrl} alt="" />
		{/if}
	{:else if isImage && reel?.clips[0]}
		<img class="clip clip--shown" style:object-fit={fit} src={srcOf(reel.clips[0])} alt="" />
	{:else if !preview && reel?.clips.length}
		{#each Array.from({ length: SLOTS }, (_, i) => i) as i (i)}
			<!-- svelte-ignore a11y-media-has-caption -->
			<video
				bind:this={videos[i]}
				class="clip"
				class:clip--shown={shown === i}
				style:object-fit={fit}
				preload="auto"
				playsinline
				disablepictureinpicture
			/>
		{/each}
	{/if}
</div>

<style>
	.clip { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; }
	.clip--shown { opacity: 1; }
</style>
