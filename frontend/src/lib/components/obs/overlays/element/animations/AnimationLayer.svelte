<script lang="ts">
	import type { GridContentItem, TriggerAnimation } from '$lib/models/types/overlay';
	import { SELF, elementTriggerFires, hasTriggerAnimation } from '$lib/utils/elementTriggers';
	import { Animation } from '$lib/models/enum';
	import * as easingFunctions from 'svelte/easing';
	import { onDestroy } from 'svelte';
	import { startCount, type CountRun } from './elementCount';
	import { elementValues } from '$lib/utils/store.svelte';
	import {
		localEmitter,
		previewTestAnimation,
		gameFrame,
		gameSettings,
		currentPlayer,
		currentPlayers,
		gameScore,
		sessionStats,
		isIframe,
		isElectron,
	} from '$lib/utils/store.svelte';
	import { onMount } from 'svelte';
	import {
		currentPlayerInGameTrigger,
		inGameStateTrigger,
		player1InGameTrigger,
		player2InGameTrigger,
		techniqueChangeTrigger,
	} from '$lib/components/obs/overlays/element/animations/animationTriggers/InGameStateTriggers';
	import { AnimationTrigger } from '$lib/models/types/animationOption';
	import { techniqueEvents } from '$lib/utils/store.svelte';
	import type { TechniqueDetectedPayload } from '$lib/models/types/actionState';
	import { rankStateTrigger } from '$lib/components/obs/overlays/element/animations/animationTriggers/RankChangeTriggers';
	import { matchStateTrigger } from '$lib/components/obs/overlays/element/animations/animationTriggers/MatchChangeTriggers';
	import type { FrameEntryType } from '@slippi/slippi-js';
	import {
		CurrentPlayer,
		GameStartTypeExtended,
		Player,
		SessionStats,
	} from '$lib/models/types/slippiData';
	import { sessionStatsTrigger } from './animationTriggers/SessionStatsTriggers';
	import { strikeStateTrigger } from './animationTriggers/StrikeTriggers';
	import { strikeState } from '$lib/utils/store.svelte';
	import type { StrikeState } from '$lib/models/types/stageStriking';
	import {
		player1RankDataTrigger,
		player2RankDataTrigger,
	} from './animationTriggers/SlippiDataChangeTriggers';
	export let animationIn: Function;
	export let animationOut: Function;
	export let dataItem: GridContentItem;
	export let edit: boolean = false;
	export let isDemo: boolean = false;
	export let preview: boolean = false;
	export let overlayId: string | undefined = undefined;
	/** The animation this layer plays (animation 1 = data.animationTrigger, see AnimationStack). */
	export let trigger: TriggerAnimation = dataItem?.data.animationTrigger;

	let key: number | undefined = 0;
	let prevGameFrame: FrameEntryType | null | undefined;
	let prevScore: number[] | undefined;
	let prevPlayer: CurrentPlayer | undefined;
	let prevPlayers: Player[] | undefined;
	let prevSettings: GameStartTypeExtended | undefined;
	let prevSessionStats: SessionStats | undefined;
	let prevStrikeState: StrikeState | undefined;
	let prevTechniques: Record<number, TechniqueDetectedPayload | null> = {};
	const updateKeyValue = (
		gameFrame: FrameEntryType | undefined | null,
		currentPlayer: CurrentPlayer,
		currentPlayers: Player[],
		gameSettings: GameStartTypeExtended,
		sessionStats: SessionStats | undefined | null,
		gameScore: number[],
	): number | undefined => {
		if (!dataItem || $isIframe || $isElectron || !hasTriggerAnimation(trigger)) return key;
		const option = trigger.selectedOptions ?? {};

		if (inGameStateTrigger(option, gameSettings, gameFrame, prevGameFrame))
			return Math.random();
		if (currentPlayerInGameTrigger(option, currentPlayer, gameFrame, prevGameFrame))
			return Math.random();
		if (player1RankDataTrigger(option, currentPlayers?.at(0), prevPlayers?.[0]))
			return Math.random();
		if (player2RankDataTrigger(option, currentPlayers?.at(1), prevPlayers?.[1]))
			return Math.random();
		if (player1InGameTrigger(option, currentPlayers?.at(0), gameFrame, prevGameFrame))
			return Math.random();
		if (player2InGameTrigger(option, currentPlayers?.at(1), gameFrame, prevGameFrame))
			return Math.random();
		const cpIdx = currentPlayer?.playerIndex ?? -1;
		const p1Idx = currentPlayers?.at(0)?.playerIndex ?? -1;
		const p2Idx = currentPlayers?.at(1)?.playerIndex ?? -1;
		if (techniqueChangeTrigger(option, AnimationTrigger.InGameCurrentPlayerTechniqueChange, $techniqueEvents[cpIdx], prevTechniques[cpIdx]))
			return Math.random();
		if (techniqueChangeTrigger(option, AnimationTrigger.InGamePlayer1TechniqueChange, $techniqueEvents[p1Idx], prevTechniques[p1Idx]))
			return Math.random();
		if (techniqueChangeTrigger(option, AnimationTrigger.InGamePlayer2TechniqueChange, $techniqueEvents[p2Idx], prevTechniques[p2Idx]))
			return Math.random();
		if (
			matchStateTrigger(
				option,
				currentPlayers,
				prevPlayers,
				gameScore,
				prevScore,
				gameSettings,
				prevSettings,
			)
		)
			return Math.random();
		if (rankStateTrigger(option, currentPlayer.rank, prevPlayer?.rank)) return Math.random();
		if (sessionStatsTrigger(option, sessionStats, prevSessionStats)) return Math.random();
		if (strikeStateTrigger(option, $strikeState, prevStrikeState)) return Math.random();

		return key;
	};

	const updateTriggerValues = (
		gameFrame: FrameEntryType | undefined | null,
		currentPlayer: CurrentPlayer,
		currentPlayers: Player[],
		gameSettings: GameStartTypeExtended,
		sessionStats: SessionStats | undefined | null,
		gameScore: number[],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_techniqueEvents?: Record<number, TechniqueDetectedPayload | null>,
	) => {
		const next = updateKeyValue(
			gameFrame,
			currentPlayer,
			currentPlayers,
			gameSettings,
			sessionStats,
			gameScore,
		);
		if (next !== key) fire();
		prevGameFrame = { ...(gameFrame ?? {}) } as FrameEntryType;
		prevScore = { ...gameScore };
		prevSettings = { ...gameSettings };
		prevPlayer = { ...currentPlayer };
		prevPlayers = { ...currentPlayers };
		prevSessionStats = { ...(sessionStats ?? {}) } as SessionStats;
		prevStrikeState = $strikeState ? { ...$strikeState } : undefined;
		prevTechniques = { ...$techniqueEvents };
	};

	$: updateTriggerValues(
		$gameFrame,
		$currentPlayer,
		$currentPlayers,
		$gameSettings,
		$sessionStats,
		$gameScore,
		$techniqueEvents,
	);

	// Element triggers: this or another element of the scene changed what it shows.
	let prevElementValues: Record<string, string | undefined> = {};
	const elementTriggerFired = (values: Record<string, string>) => {
		const list = trigger?.elementTriggers ?? [];
		const sourceOf = (source: string) => (source === SELF ? dataItem?.id : source) ?? '';
		const fired = list.some((t) => elementTriggerFires(t.when, prevElementValues[sourceOf(t.source)], values[sourceOf(t.source)]));
		prevElementValues = Object.fromEntries(list.map((t) => [sourceOf(t.source), values[sourceOf(t.source)]]));
		return fired && !!dataItem && !$isIframe && !$isElectron && hasTriggerAnimation(trigger);
	};

	// A trigger fired: replay the element — or, for a Count animation, count its number to the new value
	// when that value arrives (utils/countUp.ts; only when old and new are both pure numbers).
	$: isCount = trigger?.in?.type === Animation.Count;
	let contentEl: HTMLElement | undefined;
	let pendingCountUntil = 0;
	let countRun: CountRun | null = null;
	const fire = () => {
		if (isCount) pendingCountUntil = performance.now() + 250;
		else key = Math.random();
	};
	const onValues = (values: Record<string, string>) => {
		if (elementTriggerFired(values)) fire();
	};
	$: onValues($elementValues);

	// Count elements watch their OWN text and start counting the moment it changes — before it is painted
	// (via the per-frame published value the new number flashed for a frame first). Only Count elements do
	// this; everything else keeps the per-frame publishing (an observer per element per mutation hung the HUD).
	const shownText = (el: Element) => (el.textContent ?? '').trim();
	let ownObserver: MutationObserver | null = null;
	let lastOwnText: string | null = null;
	const onOwnText = () => {
		if (!contentEl) return;
		const now = shownText(contentEl);
		// While counting, the count's own watcher follows real changes (retarget); just track what is shown.
		if (countRun?.running) {
			lastOwnText = now;
			return;
		}
		if (now === lastOwnText) return;
		const prev = lastOwnText;
		lastOwnText = now;
		if (prev === null || $isIframe || $isElectron) return;
		const selfFires = (trigger?.elementTriggers ?? []).some((t) => t.source === SELF && elementTriggerFires(t.when, prev, now));
		if (!selfFires && performance.now() > pendingCountUntil) return;
		pendingCountUntil = 0;
		const holder = contentEl.querySelector('[style*="display: contents"]')?.firstElementChild ?? null;
		const easing = (easingFunctions as unknown as Record<string, (t: number) => number>)[trigger.in.options.easing] ?? ((t: number) => t);
		countRun = startCount(contentEl, holder, prev, now, Number(trigger.in.options.duration), Number(trigger.in.options.delay ?? 0), easing);
	};
	const watchOwn = (el: HTMLElement | undefined, on: boolean) => {
		ownObserver?.disconnect();
		ownObserver = null;
		if (!el || !on) return;
		lastOwnText = shownText(el);
		ownObserver = new MutationObserver(onOwnText);
		ownObserver.observe(el, { subtree: true, childList: true, characterData: true });
	};
	$: watchOwn(contentEl, isCount);
	onDestroy(() => ownObserver?.disconnect());
	onDestroy(() => countRun?.stop());

	const replay = () => {
		const tempTrigger = key;
		key = Math.random();
		setTimeout(() => {
			key = tempTrigger;
		});
	};

	onMount(() => {
		if (isDemo) {
			$localEmitter.on('TestAnimationTrigger', replay);
			return () => $localEmitter.off('TestAnimationTrigger', replay);
		}
	});

	// Preview renders replay on request (see previewTestAnimation in store.svelte).
	let lastTest = $previewTestAnimation?.n ?? 0;
	$: if (preview && $previewTestAnimation && $previewTestAnimation.n !== lastTest) {
		const req = $previewTestAnimation;
		lastTest = req.n;
		const matches = (!req.overlayId || !overlayId || req.overlayId === overlayId) && (!req.itemId || req.itemId === dataItem?.id);
		if (matches) replay();
	}
</script>

{#if edit}
	<div class="w-full h-full absolute top-0 left-0">
		<slot />
	</div>
{:else}
	{#key key}
		<div
			bind:this={contentEl}
			class="w-full h-full absolute top-0 left-0"
			in:animationIn|local
			out:animationOut|local
		>
			<slot />
		</div>
	{/key}
{/if}
