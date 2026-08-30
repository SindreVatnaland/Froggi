import {
	AnimationTrigger,
	type SelectedAnimationTriggerCondition,
} from '$lib/models/types/animationOption';
import type {
	CurrentPlayer,
	GameStartTypeExtended,
	Player,
} from '$lib/models/types/slippiData';
import type { FrameEntryType } from '@slippi/slippi-js';

export const inGameStateTrigger = (
	option: SelectedAnimationTriggerCondition,
	gameSettings: GameStartTypeExtended,
	gameFrame: FrameEntryType | null | undefined,
	prevGameFrame: FrameEntryType | null | undefined,
) => {
	if (!gameFrame) return;
	let trigger = false;
	const prevSecond = Math.ceil(
		(gameSettings?.startingTimerSeconds ?? 480) - (prevGameFrame?.frame ?? 0) / 60,
	);
	const currentSecond = Math.ceil(
		(gameSettings?.startingTimerSeconds ?? 480) - (gameFrame?.frame ?? 0) / 60,
	);

	if (option[AnimationTrigger.InGameGameCountdown])
		trigger =
			(currentSecond > 0 && currentSecond < 6 && currentSecond != (prevSecond ?? 0)) ||
			trigger;

	return trigger;
};

export const currentPlayerInGameTrigger = (
	option: SelectedAnimationTriggerCondition,
	player: CurrentPlayer | undefined,
	gameFrame: FrameEntryType | null | undefined,
	prevGameFrame: FrameEntryType | null | undefined,
) => {
	if (!player || !gameFrame) return;
	let trigger = false;

	if (option[AnimationTrigger.InGameCurrentPlayerPercent])
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) >
			(prevGameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) ||
			trigger;

	if (option[AnimationTrigger.InGameCurrentPlayerStockLost])
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.post.stocksRemaining ?? 0) >
			(prevGameFrame?.players?.[player.playerIndex]?.post.stocksRemaining ??
				0) || trigger;

	if (option[AnimationTrigger.InGameCurrentPlayerCharacterChange])
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.post.internalCharacterId ?? 0) !==
			(prevGameFrame?.players?.[player.playerIndex]?.post
				.internalCharacterId ?? 0) || trigger;

	if (option[AnimationTrigger.InGameCurrentPlayerStateChange])
		trigger =
			gameFrame?.players?.[player.playerIndex]?.post.actionStateId !==
			prevGameFrame?.players?.[player.playerIndex]?.post.actionStateId || trigger;

	return trigger;
};

export const player1InGameTrigger = (
	option: SelectedAnimationTriggerCondition,
	player: Player | undefined,
	gameFrame: FrameEntryType | null | undefined,
	prevGameFrame: FrameEntryType | null | undefined,
) => {
	if (!player || !gameFrame) return;
	let trigger: boolean = false;

	if (option[AnimationTrigger.InGamePlayer1Percent])
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) >
			(prevGameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) || trigger;

	if (option[AnimationTrigger.InGamePlayer1StockLost])
		trigger =
			(prevGameFrame?.players?.[player.playerIndex]?.post.stocksRemaining ?? 0) >
			(gameFrame?.players?.[player.playerIndex]?.post.stocksRemaining ?? 0) ||
			trigger;



	if (option[AnimationTrigger.InGamePlayer1CharacterChange]) {
		trigger =
			gameFrame?.players?.[player.playerIndex]?.post.internalCharacterId !==
			prevGameFrame?.players?.[player.playerIndex]?.post.internalCharacterId ||
			trigger;
	}

	if (option[AnimationTrigger.InGamePlayer1StateChange])
		trigger =
			gameFrame?.players?.[player.playerIndex]?.post.actionStateId !==
			prevGameFrame?.players?.[player.playerIndex]?.post.actionStateId || trigger;

	return trigger;
};


export const player2InGameTrigger = (
	option: SelectedAnimationTriggerCondition,
	player: Player | undefined,
	gameFrame: FrameEntryType | null | undefined,
	prevGameFrame: FrameEntryType | null | undefined,
) => {
	if (!player || !gameFrame) return;
	let trigger = false;

	if (option[AnimationTrigger.InGamePlayer2Percent])
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) >
			(prevGameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) || trigger;

	if (option[AnimationTrigger.InGamePlayer2StockLost])
		trigger =
			(prevGameFrame?.players?.[player.playerIndex]?.post.stocksRemaining ?? 0) >
			(gameFrame?.players?.[player.playerIndex]?.post.stocksRemaining ?? 0) ||
			trigger;

	if (option[AnimationTrigger.InGamePlayer2CharacterChange])
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.post.internalCharacterId ?? 0) !==
			(prevGameFrame?.players?.[player.playerIndex]?.post.internalCharacterId ??
				0) || trigger;

	if (option[AnimationTrigger.InGamePlayer2StateChange])
		trigger =
			gameFrame?.players?.[player.playerIndex]?.post.actionStateId !==
			prevGameFrame?.players?.[player.playerIndex]?.post.actionStateId || trigger;

	return trigger;
};

// Technique-change trigger: fires when a newer technique was detected for the player (the store's
// frame advanced). Threaded from AnimationLayer since techniques come from a separate event store.
export const techniqueChangeTrigger = (
	option: SelectedAnimationTriggerCondition,
	trigger: AnimationTrigger,
	current: { frame: number } | null | undefined,
	prev: { frame: number } | null | undefined,
) => {
	if (!option[trigger] || !current) return false;
	return (current.frame ?? -1) !== (prev?.frame ?? -1);
};
