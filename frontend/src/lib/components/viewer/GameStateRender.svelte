<script lang="ts">
	/**
	 * Static-camera SVG game view. Reconstructs a single moment of a Melee game
	 * from a GameStart + one frame, drawing the stage, animated character renders,
	 * and projectiles in shared world-space coordinates.
	 *
	 * Faithful SVG port of SlippiLab's viewer (MIT) — character art is SlippiLab's
	 * per-frame animation data, lazy-loaded per character. Living camera and HUD
	 * are layered on later; this component is the no-HUD building block.
	 */
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import StageRender from '$lib/components/obs/overlays/element/inGame/StageRender.svelte';
	import ViewerItem from './ViewerItem.svelte';
	import { fetchAnimations, prefetchAnimations, type CharacterAnimations } from '$lib/utils/viewer/animationCache';
	import {
		computeRenderData,
		resolveFetchExternalId,
		toViewerState,
		type RenderData,
		type RenderOptions,
		type ViewerFrame,
		type ViewerSettings,
	} from '$lib/utils/viewer/renderData';
	import { characterNameByExternalId, characterNameByInternalId } from '$lib/utils/viewer/ids';
	import { detectKos, koPlacement, KO_DURATION_MS, type KoKind, type Rect } from '$lib/utils/viewer/koEffects';
	import { onDestroy } from 'svelte';

	export let settings: ViewerSettings | null | undefined;
	export let frame: ViewerFrame | null | undefined;
	export let showStage = true;
	/** Full-fidelity history accessor (start-of-action facing, rotations). Optional. */
	export let getStateOnFrame: RenderOptions['getStateOnFrame'] | undefined = undefined;
	/** 'static' = fixed full-stage view (radar); 'live' = camera that follows + zooms on the players. */
	export let camera: 'static' | 'live' = 'static';
	/** Extra zoom multiplier applied on top of the live camera. */
	export let zoom = 1;
	/** 'contain' letterboxes to fit; 'cover' fills the container (crops overflow). */
	export let fit: 'contain' | 'cover' = 'contain';

	$: stageId = settings?.stageId ?? null;
	$: stageData = stageId != null ? STAGE_DATA[stageId] : undefined;
	// Live camera uses a fixed viewBox and pans/zooms via a transform; static frames the whole stage.
	$: viewBox = camera === 'live' ? '-365 -300 730 600' : stageData?.viewbox ?? '-365 -300 730 600';

	// ── Live camera (ported from SlippiLab Camera.tsx, MIT) ─────────────
	// Causal bounding-box follow: smooth center + scale toward the players each
	// frame (no future-frame lookahead, so it works in realtime).
	const smooth = (from: number, to: number, byPercent: number) => from + (to - from) * byPercent;
	let camCenter: [number, number] | null = null;
	let camScale: number | null = null;
	let camStageId: number | null = null;

	$: if (camera === 'live' && frame) {
		// Reset smoothing when the game/stage changes.
		if (camStageId !== (stageId ?? null)) {
			camStageId = stageId ?? null;
			camCenter = null;
			camScale = null;
		}
		const FOLLOW = 0.04;
		const PAD = 25;
		const MIN = 100;
		const xs: number[] = [];
		const ys: number[] = [];
		for (const p of Object.values(frame.players ?? {})) {
			if (!p?.post) continue;
			xs.push(p.post.positionX ?? 0);
			ys.push(p.post.positionY ?? 0);
		}
		if (xs.length) {
			const xMin = Math.min(...xs) - PAD;
			const xMax = Math.max(...xs) + PAD;
			const yMin = Math.min(...ys) - PAD;
			const yMax = Math.max(...ys) + PAD;
			const ncx = (xMin + xMax) / 2;
			const ncy = (yMin + yMax) / 2;
			const xRange = Math.max(xMax - xMin, MIN);
			const yRange = Math.max(yMax - yMin, MIN);
			const scaling = Math.min(640 / xRange, 480 / yRange);
			camCenter = [smooth(camCenter?.[0] ?? ncx, ncx, FOLLOW), smooth(camCenter?.[1] ?? ncy, ncy, FOLLOW)];
			camScale = zoom * smooth(camScale ?? 5, scaling, FOLLOW);
		}
	}

	$: cameraTransform =
		camera === 'live' && camCenter && camScale != null
			? `scale(${camScale}) translate(${-camCenter[0]} ${-camCenter[1]})`
			: '';

	// Lazy-loaded animations per playerIndex; reassigned on load to trigger render.
	let animationsByPlayer: Record<number, CharacterAnimations> = {};
	let loadedExternalId: Record<number, number> = {};

	function externalFromInternal(internalId: number): number {
		const name = characterNameByInternalId[internalId];
		const ext = (characterNameByExternalId as readonly string[]).indexOf(name);
		return ext >= 0 ? ext : 0;
	}

	function ensureAnimations(playerIndex: number, internalCharacterId: number, settingsExternalId: number | undefined) {
		const base = settingsExternalId ?? externalFromInternal(internalCharacterId);
		const fetchId = resolveFetchExternalId(internalCharacterId, base);
		if (loadedExternalId[playerIndex] === fetchId) return;
		loadedExternalId = { ...loadedExternalId, [playerIndex]: fetchId };
		fetchAnimations(fetchId)
			.then((anims) => {
				animationsByPlayer = { ...animationsByPlayer, [playerIndex]: anims };
			})
			.catch(() => {
				/* leave unloaded; player simply won't render until data arrives */
			});
	}

	function settingsExternalId(playerIndex: number): number | undefined {
		const p = settings?.players?.find((pl) => pl?.playerIndex === playerIndex);
		return p?.characterId ?? undefined;
	}

	// Prefetch both characters' animation data on GameStart so the one-time unzip
	// happens up front, not as an in-game hitch.
	$: if (settings?.players) {
		prefetchAnimations(
			settings.players
				.filter(Boolean)
				.map((p) => resolveFetchExternalId(p!.characterId ?? 0, p!.characterId ?? 0)),
		);
	}

	// Kick off animation loads for present players whenever the frame changes.
	$: if (frame) {
		for (const [idxStr, player] of Object.entries(frame.players ?? {})) {
			if (!player?.post) continue;
			ensureAnimations(Number(idxStr), player.post.internalCharacterId ?? 0, settingsExternalId(Number(idxStr)));
		}
	}

	$: renderOptions = {
		isTeams: settings?.isTeams ?? false,
		getStateOnFrame,
	} as RenderOptions;

	$: renderDatas = ((): RenderData[] => {
		if (!frame) return [];
		const out: RenderData[] = [];
		for (const [idxStr, player] of Object.entries(frame.players ?? {})) {
			if (!player?.post) continue;
			const playerIndex = Number(idxStr);
			const anims = animationsByPlayer[playerIndex];
			if (!anims) continue;
			const teamId = settings?.players?.find((p) => p?.playerIndex === playerIndex)?.teamId ?? undefined;
			const state = toViewerState(player.post, player.pre ?? undefined, frame.frame ?? 0);
			const rd = computeRenderData(state, anims, { ...renderOptions, teamId: teamId ?? undefined });
			if (rd) out.push(rd);
		}
		return out;
	})();

	$: items = frame?.items ?? [];

	// ── KO effects (utils/viewer/koEffects.ts): Melee-style blast off the sides / bottom, star off the top ──
	export let koEffects = true;
	/** size = scale of the effect (blasts: world size 1; stars: same size on screen at any zoom). */
	type Effect = { id: number; kind: KoKind; x: number; y: number; angle: number; color: string; size: number };
	let effects: Effect[] = [];
	let effectId = 0;
	let prevActions: Record<number, number | undefined> = {};
	/** Each player's position on the previous frame — a KO effect appears where the player last was. */
	let prevPositions: Record<number, { x: number; y: number }> = {};
	const timers = new Set<ReturnType<typeof setTimeout>>();
	onDestroy(() => timers.forEach(clearTimeout));
	const PALETTE = ['#b91c1c', '#1d4ed8', '#eab308', '#15803d'];

	// The stage's blast zones (world space) — blasts start there.
	$: blastZone = ((z) => (z ? { xMin: z[0][0], yMin: z[0][1], xMax: z[1][0], yMax: z[1][1] } : null))(
		(stageData as { blastZones?: number[][] } | undefined)?.blastZones,
	);
	// What the camera shows, in world space (y up).
	$: viewNumbers = viewBox.split(' ').map(Number);
	$: visible = ((): Rect => {
		if (camera === 'live' && camCenter && camScale) {
			const hw = 365 / camScale;
			const hh = 300 / camScale;
			return { xMin: camCenter[0] - hw, xMax: camCenter[0] + hw, yMin: camCenter[1] - hh, yMax: camCenter[1] + hh };
		}
		const [vx, vy, vw, vh] = viewNumbers;
		return { xMin: vx, xMax: vx + vw, yMin: -(vy + vh), yMax: -vy };
	})();

	$: if (frame && koEffects) {
		const players = Object.entries(frame.players ?? {})
			.filter(([, p]) => p?.post)
			.map(([i, p]) => ({ playerIndex: Number(i), actionStateId: p!.post!.actionStateId ?? -1, x: p!.post!.positionX ?? 0, y: p!.post!.positionY ?? 0 }));
		for (const ko of detectKos(prevActions, players)) {
			const at = koPlacement({ ...ko, ...(prevPositions[ko.playerIndex] ?? {}) }, visible, blastZone);
			const color = renderDatas.find((rd) => rd.playerState.playerIndex === ko.playerIndex)?.innerColor ?? PALETTE[ko.playerIndex] ?? '#ffffff';
			// Blasts are world-sized (like Melee's beam from the blast zone); stars keep one size on screen.
			const size = ko.kind === 'blast' ? 0.65 : (visible.xMax - visible.xMin) / 700;
			const effect: Effect = { id: ++effectId, kind: ko.kind, ...at, color, size };
			effects = [...effects, effect];
			const t = setTimeout(() => {
				timers.delete(t);
				effects = effects.filter((e) => e.id !== effect.id);
			}, KO_DURATION_MS[ko.kind]);
			timers.add(t);
		}
		prevActions = Object.fromEntries(players.map((p) => [p.playerIndex, p.actionStateId]));
		prevPositions = Object.fromEntries(players.map((p) => [p.playerIndex, { x: p.x, y: p.y }]));
	}
	// The blast's beams: [tilt in degrees, size, opacity] — the main one + two smaller, fainter ones tilted to each side.
	const BEAMS: [number, number, number][] = [[-17, 0.6, 0.6], [17, 0.6, 0.6], [0, 1, 1]];
	// Sparks along the beam: [x, y, delay ms, size].
	const SPARKS: [number, number, number, number][] = [[50, -44, 60, 7], [100, 30, 120, 6], [150, -18, 180, 8], [200, 12, 240, 5], [250, -6, 300, 6], [80, -58, 90, 5]];
</script>

{#if stageId != null}
	<!-- stroke defaults: otherwise the host element's CSS (Outline: stroke #fff, width 3) is inherited by every
	     shape without its own stroke — lasers, shields and KO effects got thick white outlines. -->
	<svg class="w-full h-full" {viewBox} preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'} stroke="none" stroke-width="1">
		<g class="-scale-y-100">
			<g transform={cameraTransform}>
			{#if showStage}
				<g class="viewer-stage">
					<StageRender {stageId} {frame} />
				</g>
			{/if}

			{#each renderDatas as rd (rd.playerState.playerIndex)}
				{#if rd.path}
					<path
						class:char-invuln={rd.invulnerable}
						transform={rd.transforms.join(' ')}
						d={rd.path}
						fill={rd.innerColor}
						stroke={rd.outerColor}
						stroke-width="2"
					/>
				{/if}
				{#if rd.shield}
					<circle cx={rd.shield.cx} cy={rd.shield.cy} r={rd.shield.r} fill={rd.shield.color} opacity="0.6" />
				{/if}
			{/each}

			{#each items as item, i (i)}
				<ViewerItem {item} />
			{/each}

			{#each effects as e (e.id)}
				<g transform={`translate(${e.x} ${e.y}) rotate(${e.angle}) scale(${e.size})`}>
					{#if e.kind === 'blast'}
						<!-- KO blast: wide at the blast zone, tapering into the stage — player colour, white core, flash at its base -->
						<!-- three beams: the main one + two smaller, tilted to each side -->
						{#each BEAMS as [tilt, scale, opacity]}
							<g transform={`rotate(${tilt}) scale(${scale})`} {opacity}>
								<g class="ko-beam">
									<path d="M0 -74 Q-26 0 0 74 Q60 64 340 3 L340 -3 Q60 -64 0 -74 Z" fill={e.color} opacity="0.55" />
									<path d="M0 -46 Q-16 0 0 46 Q50 38 310 2 L310 -2 Q50 -38 0 -46 Z" fill={e.color} />
									<path d="M0 -18 Q-7 0 0 18 Q40 14 270 1 L270 -1 Q40 -14 0 -18 Z" fill="#ffffff" opacity="0.95" />
								</g>
							</g>
						{/each}
						<g class="ko-flash">
							<circle r="46" fill={e.color} opacity="0.6" />
							<circle r="26" fill="#ffffff" />
						</g>
						{#each SPARKS as [x, y, delay, r]}
							<g transform={`translate(${x} ${y})`}>
								<path class="ko-spark" style={`animation-delay: ${delay}ms`} d={`M0 ${-r * 2} L${r * 0.5} ${-r * 0.5} L${r * 2} 0 L${r * 0.5} ${r * 0.5} L0 ${r * 2} L${-r * 0.5} ${r * 0.5} L${-r * 2} 0 L${-r * 0.5} ${-r * 0.5} Z`} fill="#ffffff" />
							</g>
						{/each}
					{:else}
						<g class="ko-star">
							<circle r="22" fill="#fff7cc" opacity="0.35" />
							<path d="M0 -18 L4 -4 L18 0 L4 4 L0 18 L-4 4 L-18 0 L-4 -4 Z" fill="#ffffff" />
							<circle r="4" fill={e.color} />
						</g>
					{/if}
				</g>
			{/each}
			</g>
		</g>
	</svg>
{/if}

<style>
	/* KO effects: CSS animations on inner groups (their parents carry position, direction and size). */
	.ko-beam { transform-box: fill-box; transform-origin: left center; animation: ko-beam 1.1s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
	@keyframes ko-beam {
		0% { transform: scale(0.05, 0.5); opacity: 1; }
		14% { transform: scale(1, 1.1); opacity: 1; }
		55% { transform: scale(1.05, 0.8); opacity: 0.95; }
		100% { transform: scale(1.1, 0.05); opacity: 0; }
	}
	.ko-flash { transform-box: fill-box; transform-origin: center; animation: ko-flash 0.55s ease-out forwards; }
	@keyframes ko-flash {
		0% { transform: scale(0.3); opacity: 1; }
		100% { transform: scale(1.8); opacity: 0; }
	}
	.ko-spark { transform-box: fill-box; transform-origin: center; opacity: 0; animation: ko-spark 0.6s ease-out forwards; }
	@keyframes ko-spark {
		0% { transform: scale(0) rotate(0deg); opacity: 0; }
		30% { transform: scale(1.3) rotate(30deg); opacity: 1; }
		100% { transform: scale(0) rotate(90deg); opacity: 0; }
	}
	.ko-star { transform-box: fill-box; transform-origin: center; animation: ko-star 1.4s ease-in-out forwards; }
	@keyframes ko-star {
		0% { transform: scale(0) rotate(0deg); opacity: 0; }
		18% { transform: scale(1.6) rotate(20deg); opacity: 1; }
		45% { transform: scale(0.8) rotate(45deg); opacity: 1; }
		70% { transform: scale(1.2) rotate(70deg); opacity: 0.9; }
		100% { transform: scale(0) rotate(110deg); opacity: 0; }
	}

	/* Invulnerable / intangible (e.g. respawn platform) — vague opacity blink. */
	.char-invuln { animation: invuln-blink 0.5s ease-in-out infinite; }
	@keyframes invuln-blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.45; }
	}

	/* Stage rendered as thin outlines so the character renders read clearly. */
	.viewer-stage :global(polyline) {
		fill: none;
		stroke: var(--secondary-color, #888);
		stroke-width: 1.5;
		opacity: 0.55;
	}
	.viewer-stage :global(rect) {
		fill: none;
		stroke: var(--secondary-color, #888);
		stroke-width: 0.5;
		opacity: 0.2;
	}
</style>
