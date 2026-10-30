<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';
	import type { FrameEntryType } from '../../../../models/types/slippiTypes';
	import { secondsLeft, winChances, type SideState } from '$lib/utils/winProbability';
	import { liveFightStats } from '$lib/utils/store.svelte';
	import type { FightStatsByPlayer } from '$lib/utils/fightStats';
	import { playerKey } from '$lib/utils/teams';
	import type { GameStartType } from '../../../../models/types/slippiTypes';
	import { WIN_CHANCE_ELEMENTS } from '../elementCategories';
	import TextElement from '../element/TextElement.svelte';

	// "64%": chance Player 1 / 2 (doubles: their team) wins this game or the set — see utils/winProbability.ts.
	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	/** All players in slot order: singles [P1, P2]; doubles [T1P1, T2P1, T1P2, T2P2]. */
	export let allPlayers: Player[];
	export let frame: FrameEntryType | null | undefined;
	export let score: number[];
	export let bestOf: number;
	export let gameSettings: GameStartType | null | undefined;

	const PREVIEW = { game: ['64%', '36%'], set: ['72%', '28%'] };

	function textFor(id: number, players: Player[], f: FrameEntryType | null | undefined, sc: number[], bo: number, settings: GameStartType | null | undefined, stockSeconds: number[] | undefined, match: FightStatsByPlayer | undefined): string {
		const def = WIN_CHANCE_ELEMENTS.get(id);
		if (!def) return '';
		if (defaultPreview) return PREVIEW[def.set ? 'set' : 'game'][def.side];
		const side = (s: 0 | 1): SideState[] =>
			players.flatMap((p, i) => {
				const post = p && i % 2 === s ? f?.players?.[p.playerIndex]?.post : undefined;
				const set = match?.[playerKey(p)];
				return post ? [{ stocks: post.stocksRemaining ?? 0, percent: post.percent ?? 0, deaths: set?.deaths, deathPercent: set?.deathPercent }] : [];
			});
		const left = secondsLeft(settings, f?.frame);
		const chances = winChances(side(0), side(1), [sc[0] ?? 0, sc[1] ?? 0], bo, left != null ? { secondsLeft: left, stockSeconds } : null);
		if (!def.set && !chances.live) return '–'; // no game running
		return `${Math.round((def.set ? chances.set : chances.game)[def.side] * 100)}%`;
	}
	$: text = textFor(dataItem.elementId, allPlayers, frame, score, bestOf, gameSettings, $liveFightStats?.stockSeconds?.match, $liveFightStats?.match);
</script>

<TextElement {style} {dataItem}>{text}</TextElement>
