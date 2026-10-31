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
	import { getOffStageZone } from '$lib/utils/gamePredicates';
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
	import { detectKos, koKind, koPlacement, KO_DURATION_MS, STAR_FRAMES, starEnd, starFlight, type KoKind, type KoStart, type Rect } from '$lib/utils/viewer/koEffects';
	import { onDestroy, onMount } from 'svelte';

	export let settings: ViewerSettings | null | undefined;
	export let frame: ViewerFrame | null | undefined;
	export let showStage = true;
	/** Full-fidelity history accessor (start-of-action facing, rotations). Optional. */
	export let getStateOnFrame: RenderOptions['getStateOnFrame'] | undefined = undefined;
	/** 'static' = fixed full-stage view (radar); 'live' = camera that follows + zooms on the players. */
	export let camera: 'static' | 'live' = 'static';
	/** Extra zoom multiplier applied on top of the live camera. */
	export let zoom = 1;
	/** 'contain' letterboxes to fit; 'cover' fills the container (crops overflow). The live camera always frames
	 *  a 73:60 view (the game's own) and a wider or taller box shows more around it, outside the camera limits. */
	export let fit: 'contain' | 'cover' = 'contain';
	$: aspect = camera === 'live' || fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';

	// The box's size (px) — what is on screen beyond the 73:60 frame.
	let svgEl: SVGSVGElement | undefined;
	let boxW = 0;
	let boxH = 0;
	onMount(() => {
		const ro = new ResizeObserver(([e]) => ((boxW = e.contentRect.width), (boxH = e.contentRect.height)));
		const watch = () => svgEl && ro.observe(svgEl);
		watch();
		const t = setInterval(() => svgEl && (watch(), clearInterval(t)), 200);
		return () => (ro.disconnect(), clearInterval(t));
	});

	$: stageId = settings?.stageId ?? null;
	$: stageData = stageId != null ? STAGE_DATA[stageId] : undefined;
	// Live camera uses a fixed viewBox and pans/zooms via a transform; static frames the whole stage.
	$: viewBox = camera === 'live' ? '-365 -300 730 600' : stageData?.viewbox ?? '-365 -300 730 600';

	// ── Live camera (ported from SlippiLab Camera.tsx, MIT) ─────────────
	// Causal bounding-box follow: smooth center + scale toward the players each
	// frame (no future-frame lookahead, so it works in realtime).
	const smooth = (from: number, to: number, byPercent: number) => from + (to - from) * byPercent;
	/** Dead action states 0–10 (DeadDown … DeadUpFallHitCameraIce). */
	const isDead = (state: number | null | undefined) => state != null && state >= 0 && state <= 10;
	/** The camera's centre moves like a damped spring toward where it should look: a fast move can swing a little
	 *  past its target (≈ 10 %) and settle back — but never past the off-stage zone's edge. */
	const CAMERA_SPRING = 0.025;
	const CAMERA_DAMPING = 0.82;
	/** The star twinkle (KO_DURATION_MS.star) in frames — the camera keeps a star KO in view until it is over. */
	const STAR_TWINKLE_FRAMES = Math.ceil((KO_DURATION_MS.star / 1000) * 60);
	let camCenter: [number, number] | null = null;
	let camScale: number | null = null;
	let camVelocity: [number, number] = [0, 0];
	let camStageId: number | null = null;

	$: if (camera === 'live' && frame) {
		// Reset smoothing when the game/stage changes.
		if (camStageId !== (stageId ?? null)) {
			camStageId = stageId ?? null;
			camCenter = null;
			camScale = null;
			camVelocity = [0, 0];
		}
		const FOLLOW = 0.04;
		const PAD = 25;
		const MIN = 100;
		const xs: number[] = [];
		const ys: number[] = [];
		// Players still alive — and a star-KO'd one flying into the background, where they are drawn (until the
		// star has twinkled; the flight ends inside the off-stage zone); a KO'd player's last spot (e.g. below a low
		// stage) doesn't pull the camera.
		for (const [i, p] of Object.entries(frame.players ?? {})) {
			if (!p?.post) continue;
			const state = p.post.actionStateId;
			let x = p.post.positionX ?? 0;
			let y = p.post.positionY ?? 0;
			if (koKind(state) === 'star') {
				const start = starStartOf(Number(i));
				const t = (frame.frame ?? 0) - (start?.frame ?? 0);
				if (!start || t > STAR_FRAMES + STAR_TWINKLE_FRAMES) continue;
				const at = starFlight(start, start.end, t);
				x = at.x;
				y = at.y;
			} else if (isDead(state)) continue;
			xs.push(x);
			ys.push(y);
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
			camScale = zoom * smooth(camScale ?? 5, scaling, FOLLOW);
			// Like Melee's camera, the 73:60 view aims inside the off-stage zone (the inner border drawn on the
			// radar — utils/gamePredicates.ts getOffStageZone), never out at the blast zones.
			// The centre's limits: the view's edges on the zone's edges.
			let lim: { x: [number, number]; y: [number, number] } | null = null;
			const zone = stageId != null ? getOffStageZone(stageId) : undefined;
			if (zone) {
				const [[left, bottom], [right, top]] = zone;
				camScale = Math.max(camScale, 730 / (right - left), 600 / (top - bottom)); // never bigger than the zone
				const hw = 365 / camScale;
				const hh = 300 / camScale;
				lim = { x: [left + hw, right - hw], y: [bottom + hh, top - hh] };
			}
			const keep = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));
			const target: [number, number] = lim ? [keep(ncx, lim.x), keep(ncy, lim.y)] : [ncx, ncy];
			const from = camCenter ?? target;
			camVelocity = [camVelocity[0] * CAMERA_DAMPING + (target[0] - from[0]) * CAMERA_SPRING, camVelocity[1] * CAMERA_DAMPING + (target[1] - from[1]) * CAMERA_SPRING];
			camCenter = [from[0] + camVelocity[0], from[1] + camVelocity[1]];
			// The view never leaves the zone: on its edge the camera stops there (no swing past).
			if (lim) {
				const [x, y] = camCenter;
				camCenter = [keep(x, lim.x), keep(y, lim.y)];
				if (camCenter[0] !== x) camVelocity[0] = 0;
				if (camCenter[1] !== y) camVelocity[1] = 0;
			}
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
			const dying = koKind(player.post.actionStateId) === 'star';
			const start = starStartOf(playerIndex);
			const t = (frame.frame ?? 0) - (start?.frame ?? 0);
			// Star KO: not drawn once the star has twinkled (until the respawn), nor when the flight's start wasn't seen.
			if (dying && (!start || t >= STAR_FRAMES)) continue;
			const raw = toViewerState(player.post, player.pre ?? undefined, frame.frame ?? 0);
			// The flight has no animation here: a still tumble pose (DamageFlyN, 88) that spins like a wheel instead.
			const state = dying ? { ...raw, actionStateId: 88, actionStateFrameCounter: 0 } : raw;
			const rd = computeRenderData(state, anims, { ...renderOptions, teamId: teamId ?? undefined });
			if (rd && dying && start) {
				const x = player.post.positionX ?? 0;
				const y = player.post.positionY ?? 0;
				const at = starFlight(start, start.end, t, raw.facingDirection);
				// Feet → origin, spin around the body's middle (0, 8), shrink, then to where the flight has got to.
				rd.transforms = [`translate(${at.x} ${at.y}) scale(${at.scale}) rotate(${at.angle} 0 8) translate(${-x} ${-y})`, ...rd.transforms];
			}
			if (rd) out.push(rd);
		}
		return out;
	})();

	$: items = frame?.items ?? [];

	// ── KO effects (utils/viewer/koEffects.ts): Melee-style blast off the sides / bottom, star off the top ──
	export let koEffects = true;
	/** The last frame there is (a highlight's window): a star KO still in flight twinkles there instead of never. */
	export let lastFrame: number | null = null;
	/** True while a star twinkles — a highlight replay holds its last frame until it is done. */
	export let twinkling = false;
	$: twinkling = effects.some((e) => e.kind === 'star');
	/** size = scale of the effect (blasts: world size 1; stars: same size on screen at any zoom). */
	type Effect = { id: number; kind: KoKind; x: number; y: number; angle: number; color: string; size: number };
	let effects: Effect[] = [];
	let effectId = 0;
	let prevActions: Record<number, number | undefined> = {};
	/** Each player's stocks on the previous frame — a star KO twinkles when the game takes the stock. */
	let prevStocks: Record<number, number | null | undefined> = {};
	const stockLost = (p: { playerIndex: number; stocks: number | null }) => {
		const before = prevStocks[p.playerIndex];
		return before != null && p.stocks != null && p.stocks < before;
	};
	/** Star KOs: player → where and when the flight started, and whether the star has twinkled (it then
	 *  stays here, the player hidden, until they leave the dead state). */
	type StarStart = { frame: number; x: number; y: number; end: { x: number; y: number }; twinkled?: boolean };
	const starStarts: Record<number, StarStart> = {};
	// Read through a function: the render must not re-run on (or depend on) the KO block's bookkeeping.
	const starStartOf = (i: number) => starStarts[i] as StarStart | undefined;
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
			// meet: the 730 × 600 frame fits the box; the rest of the box shows more world around it.
			const fitScale = boxW && boxH ? Math.min(boxW / 730, boxH / 600) : 1;
			const hw = (boxW && boxH ? boxW / fitScale / 2 : 365) / camScale;
			const hh = (boxW && boxH ? boxH / fitScale / 2 : 300) / camScale;
			return { xMin: camCenter[0] - hw, xMax: camCenter[0] + hw, yMin: camCenter[1] - hh, yMax: camCenter[1] + hh };
		}
		const [vx, vy, vw, vh] = viewNumbers;
		return { xMin: vx, xMax: vx + vw, yMin: -(vy + vh), yMax: -vy };
	})();

	$: if (frame && koEffects) {
		const players = Object.entries(frame.players ?? {})
			.filter(([, p]) => p?.post)
			.map(([i, p]) => ({ playerIndex: Number(i), actionStateId: p!.post!.actionStateId ?? -1, x: p!.post!.positionX ?? 0, y: p!.post!.positionY ?? 0, stocks: p!.post!.stocksRemaining ?? null }));
		const now = frame.frame ?? 0;
		const due: KoStart[] = [];
		for (const ko of detectKos(prevActions, players)) {
			if (ko.kind === 'star') {
				const from = prevPositions[ko.playerIndex] ?? { x: ko.x, y: ko.y };
				// Where the flight ends: toward the middle, inside the off-stage zone (no stage data: the view).
				const z = stageId != null ? getOffStageZone(stageId) : undefined;
				const zone = z ? { xMin: z[0][0], yMin: z[0][1], xMax: z[1][0], yMax: z[1][1] } : visible;
				starStarts[ko.playerIndex] = { frame: now, ...from, end: starEnd(from, zone) };
			}
			else due.push({ ...ko, ...(prevPositions[ko.playerIndex] ?? {}) });
		}
		// A star twinkles where the player ended up, once the flight is over (or the player is back).
		for (const [i, start] of Object.entries(starStarts)) {
			const p = players.find((x) => x.playerIndex === Number(i));
			const flying = !!p && koKind(p.actionStateId) === 'star';
			const twinkle = () => {
				start.twinkled = true;
				due.push({ playerIndex: Number(i), actionStateId: 4, ...start.end, kind: 'star' });
			};
			if (now < start.frame || !flying) {
				// Jumped back (a replay loops) or back from the dead (respawn): the KO is over.
				if (now >= start.frame && !start.twinkled) twinkle();
				delete starStarts[Number(i)];
			} else if (!start.twinkled && (stockLost(p!) || now - start.frame >= STAR_FRAMES || (lastFrame != null && now >= lastFrame))) {
				// The game takes the stock (on the last one: game end) — the star twinkles on that very frame. Also when
				// that frame isn't seen: the flight's length is up, or the frames end first (the end of a highlight).
				twinkle();
			}
		}
		for (const ko of due) {
			const at = koPlacement(ko, visible, blastZone);
			const color = renderDatas.find((rd) => rd.playerState.playerIndex === ko.playerIndex)?.innerColor ?? PALETTE[ko.playerIndex] ?? '#ffffff';
			// Blasts are world-sized (like Melee's beam from the blast zone); stars keep one size on screen.
			const size = ko.kind === 'blast' ? 0.65 : ((visible.xMax - visible.xMin) / 700) * 0.64;
			const effect: Effect = { id: ++effectId, kind: ko.kind, ...at, color, size };
			effects = [...effects, effect];
			const t = setTimeout(() => {
				timers.delete(t);
				effects = effects.filter((e) => e.id !== effect.id);
			}, KO_DURATION_MS[ko.kind]);
			timers.add(t);
		}
		prevActions = Object.fromEntries(players.map((p) => [p.playerIndex, p.actionStateId]));
		prevStocks = Object.fromEntries(players.map((p) => [p.playerIndex, p.stocks]));
		prevPositions = Object.fromEntries(players.map((p) => [p.playerIndex, { x: p.x, y: p.y }]));
	}
	// ── Magnifying glass (like Melee's): a player completely off screen shows in a bubble glued to the screen's edge,
	// with a pointer toward them. Not for KO'd players (incl. a star KO's flight). ──
	const MAG_RADIUS = 34; // viewBox units — the same size on screen at any zoom
	const BODY = { halfWidth: 10, height: 22 };
	const uid = Math.random().toString(36).slice(2, 8);
	type Magnifier = { rd: RenderData; key: number; bx: number; by: number; r: number; m: number; cx: number; cy: number; angle: number };
	$: magnifiers = ((): Magnifier[] => {
		if (camera !== 'live' || !camScale) return [];
		const r = MAG_RADIUS / camScale;
		const inset = r * 1.25;
		return renderDatas.flatMap((rd) => {
			const s = rd.playerState;
			// The game's own state (a star KO is drawn with a stand-in pose): gone the moment the player is KO'd, and
			// none while they come back on the respawn platform (Rebirth 12 / RebirthWait 13, above the screen).
			const own = frame?.players?.[s.playerIndex]?.post?.actionStateId;
			if (!rd.path || isDead(own) || own === 12 || own === 13) return [];
			const x = s.xPosition;
			const y = s.yPosition;
			const off = x + BODY.halfWidth < visible.xMin || x - BODY.halfWidth > visible.xMax || y + BODY.height < visible.yMin || y > visible.yMax;
			if (!off) return [];
			const cx = x;
			const cy = y + BODY.height / 2;
			const bx = Math.min(visible.xMax - inset, Math.max(visible.xMin + inset, cx));
			const by = Math.min(visible.yMax - inset, Math.max(visible.yMin + inset, cy));
			// The player at a size that fits the bubble; the pointer aims at where they really are.
			return [{ rd, key: s.playerIndex, bx, by, r, m: (r * 1.3) / BODY.height, cx, cy, angle: (Math.atan2(cy - by, cx - bx) * 180) / Math.PI }];
		});
	})();

	// The blast's beams: [tilt in degrees, size, opacity] — the main one + two smaller, fainter ones tilted to each side.
	const BEAMS: [number, number, number][] = [[-17, 0.6, 0.6], [17, 0.6, 0.6], [0, 1, 1]];
	// Sparks along the beam: [x, y, delay ms, size].
	const SPARKS: [number, number, number, number][] = [[50, -44, 60, 7], [100, 30, 120, 6], [150, -18, 180, 8], [200, 12, 240, 5], [250, -6, 300, 6], [80, -58, 90, 5]];
</script>

{#if stageId != null}
	<!-- stroke defaults: otherwise the host element's CSS (Outline: stroke #fff, width 3) is inherited by every
	     shape without its own stroke — lasers, shields and KO effects got thick white outlines. -->
	<svg bind:this={svgEl} class="w-full h-full" {viewBox} preserveAspectRatio={aspect} stroke="none" stroke-width="1">
		<g class="-scale-y-100">
			<g transform={cameraTransform}>
			{#if showStage}
				<g class="viewer-stage">
					<StageRender {stageId} {frame} />
				</g>
			{/if}

			{#each renderDatas as rd (rd.playerState.playerIndex)}
				{#if rd.playerState.actionStateId === 12 || rd.playerState.actionStateId === 13}
					<!-- The respawn platform: under the player's feet while they stand on it -->
					<g transform={`translate(${rd.playerState.xPosition} ${rd.playerState.yPosition})`}>
						<ellipse cx="0" cy="-1.5" rx="13" ry="3.2" fill={rd.innerColor} opacity="0.35" />
						<rect x="-11" y="-2.6" width="22" height="2.6" rx="1.3" fill="#ffffff" opacity="0.9" />
						<rect x="-11" y="-2.6" width="22" height="1" rx="0.5" fill={rd.innerColor} opacity="0.8" />
					</g>
				{/if}
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
				<ViewerItem
					{item}
					ownerX={item.owner != null ? frame?.players?.[item.owner]?.post?.positionX ?? null : null}
					ownerY={item.owner != null ? frame?.players?.[item.owner]?.post?.positionY ?? null : null}
					ownerFacing={(item.owner != null ? frame?.players?.[item.owner]?.post?.facingDirection : 1) ?? 1}
				/>
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

			{#each magnifiers as g (g.key)}
				<g class="magnifier">
					<clipPath id={`mag-${uid}-${g.key}`}><circle cx={g.bx} cy={g.by} r={g.r} /></clipPath>
					<circle cx={g.bx} cy={g.by} r={g.r} fill="#0b1220" opacity="0.55" />
					<g clip-path={`url(#mag-${uid}-${g.key})`}>
						<g transform={`translate(${g.bx} ${g.by}) scale(${g.m}) translate(${-g.cx} ${-g.cy})`}>
							<path transform={g.rd.transforms.join(' ')} d={g.rd.path} fill={g.rd.innerColor} stroke={g.rd.outerColor} stroke-width="2" />
						</g>
					</g>
					<circle cx={g.bx} cy={g.by} r={g.r} fill="none" stroke="#ffffff" stroke-width={g.r * 0.09} />
					<!-- pointer toward the player: starts on the rim, drawn over it (nothing of it inside the lens) -->
					<g transform={`translate(${g.bx} ${g.by}) rotate(${g.angle})`}>
						<path d={`M${g.r * 0.96} ${-g.r * 0.28} L${g.r * 1.32} 0 L${g.r * 0.96} ${g.r * 0.28} Z`} fill="#ffffff" />
					</g>
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
	.ko-star { transform-box: fill-box; transform-origin: center; animation: ko-star 0.7s ease-in-out forwards; }
	@keyframes ko-star {
		0% { transform: scale(0) rotate(0deg); opacity: 0; }
		35% { transform: scale(1.6) rotate(25deg); opacity: 1; }
		100% { transform: scale(0) rotate(60deg); opacity: 0; }
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
