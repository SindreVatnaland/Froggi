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

	export let settings: ViewerSettings | null | undefined;
	export let frame: ViewerFrame | null | undefined;
	export let showStage = true;
	/** Full-fidelity history accessor (start-of-action facing, rotations). Optional. */
	export let getStateOnFrame: RenderOptions['getStateOnFrame'] | undefined = undefined;
	/** 'static' = fixed full-stage view (radar); 'live' = camera that follows + zooms on the players. */
	export let camera: 'static' | 'live' = 'static';
	/** Extra zoom multiplier applied on top of the live camera. */
	export let zoom = 1;

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
		for (const p of Object.values(frame.players)) {
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
		for (const [idxStr, player] of Object.entries(frame.players)) {
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
		for (const [idxStr, player] of Object.entries(frame.players)) {
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
</script>

{#if stageId != null}
	<svg class="w-full h-full" {viewBox}>
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
			</g>
		</g>
	</svg>
{/if}

<style>
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
