<script lang="ts" context="module">
	import { InGameState } from '$lib/models/enum';
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import { GameStartTypeExtended, Player } from '$lib/models/types/slippiData';
	import { getOffStageZone } from '$lib/utils/gamePredicates';
	import { gameSettings } from '$lib/utils/store.svelte';
	import type {
		FrameEntryType,
		GameStartType,
		PreFrameUpdateType,
		Stage,
	} from '@slippi/slippi-js';
	import { isNil } from 'lodash';

	export const inGameVisibilityOption = (
		option: SelectedVisibilityCondition,
		currentPlayers: Player[],
		gameSettings: GameStartTypeExtended,
		gameFrame: FrameEntryType | undefined | null,
		gameState: InGameState,
		gameScore: number[],
	) => {
		if (option[VisibilityOption.InGameRunning] === VisibilityToggle.True)
			if (gameState === InGameState.Running) return true;
		if (option[VisibilityOption.InGameRunning] === VisibilityToggle.False)
			if (gameState !== InGameState.Running) return true;

		if (option[VisibilityOption.InGamePaused] === VisibilityToggle.True)
			if (gameState === InGameState.Paused) return true;
		if (option[VisibilityOption.InGamePaused] === VisibilityToggle.False)
			if (gameState !== InGameState.Paused) return true;

		if (option[VisibilityOption.InGameReady] === VisibilityToggle.True)
			if (isGameReady(gameFrame)) return true;
		if (option[VisibilityOption.InGameReady] === VisibilityToggle.False)
			if (!isGameReady(gameFrame)) return true;

		if (option[VisibilityOption.InGameGo] === VisibilityToggle.True)
			if (isGameGo(gameFrame)) return true;
		if (option[VisibilityOption.InGameGo] === VisibilityToggle.False)
			if (!isGameGo(gameFrame)) return true;

		const seconds = (gameSettings?.startingTimerSeconds ?? 0) - (gameFrame?.frame ?? 0) / 60;
		if (option[VisibilityOption.InGameCountdown] === VisibilityToggle.True) {
			if (isGameCountdown(seconds)) return true;
		}
		if (option[VisibilityOption.InGameCountdown] === VisibilityToggle.False) {
			if (!isGameCountdown(seconds)) return true;
		}

		if (option[VisibilityOption.InGameEnd] === VisibilityToggle.True)
			if (isGameEnd(gameState)) return true;
		if (option[VisibilityOption.InGameEnd] === VisibilityToggle.False)
			if (!isGameEnd(gameState)) return true;

		if (option[VisibilityOption.InGameTime] === VisibilityToggle.True)
			if (isGameTime(gameState)) return true;
		if (option[VisibilityOption.InGameTime] === VisibilityToggle.False)
			if (!isGameTime(gameState)) return true;

		if (option[VisibilityOption.InGameTie] === VisibilityToggle.True)
			if (isGameTie(gameState)) return true;
		if (option[VisibilityOption.InGameTie] === VisibilityToggle.False)
			if (!isGameTie(gameState)) return true;

		if (option[VisibilityOption.InGamePlayer1OffStage] === VisibilityToggle.True)
			if (
				isOffStage(
					gameFrame?.players?.[currentPlayers.at(0)?.playerIndex ?? 0]?.pre,
					gameSettings?.stageId,
				)
			)
				return true;
		if (option[VisibilityOption.InGamePlayer1OffStage] === VisibilityToggle.False)
			if (
				!isOffStage(
					gameFrame?.players?.[currentPlayers.at(0)?.playerIndex ?? 0]?.pre,
					gameSettings?.stageId,
				)
			)
				return true;
		if (option[VisibilityOption.InGamePlayer2OffStage] === VisibilityToggle.True)
			if (
				isOffStage(
					gameFrame?.players?.[currentPlayers.at(1)?.playerIndex ?? 1]?.pre,
					gameSettings?.stageId,
				)
			)
				return true;
		if (option[VisibilityOption.InGamePlayer2OffStage] === VisibilityToggle.False)
			if (
				!isOffStage(
					gameFrame?.players?.[currentPlayers.at(1)?.playerIndex ?? 1]?.pre,
					gameSettings?.stageId,
				)
			)
				return true;

		if (option[VisibilityOption.InGameIsGame1] === VisibilityToggle.True)
			if (isGameNumber(gameScore, 1)) return true;
		if (option[VisibilityOption.InGameIsGame1] === VisibilityToggle.False)
			if (!isGameNumber(gameScore, 1)) return true;
		if (option[VisibilityOption.InGameIsGame2] === VisibilityToggle.True)
			if (isGameNumber(gameScore, 2)) return true;
		if (option[VisibilityOption.InGameIsGame2] === VisibilityToggle.False)
			if (!isGameNumber(gameScore, 2)) return true;
		if (option[VisibilityOption.InGameIsGame3] === VisibilityToggle.True)
			if (isGameNumber(gameScore, 3)) return true;
		if (option[VisibilityOption.InGameIsGame3] === VisibilityToggle.False)
			if (!isGameNumber(gameScore, 3)) return true;
		if (option[VisibilityOption.InGameIsGame4] === VisibilityToggle.True)
			if (isGameNumber(gameScore, 4)) return true;
		if (option[VisibilityOption.InGameIsGame4] === VisibilityToggle.False)
			if (!isGameNumber(gameScore, 4)) return true;
		if (option[VisibilityOption.InGameIsGame5] === VisibilityToggle.True)
			if (isGameNumber(gameScore, 5)) return true;
		if (option[VisibilityOption.InGameIsGame5] === VisibilityToggle.False)
			if (!isGameNumber(gameScore, 5)) return true;

		return false;
	};

	const isGameReady = (gameFrame: FrameEntryType | null | undefined) => {
		if (isNil(gameFrame)) return false;
		return (gameFrame?.frame ?? 0) <= -36;
	};

	const isGameGo = (gameFrame: FrameEntryType | null | undefined) => {
		if (isNil(gameFrame)) return false;
		return (gameFrame?.frame ?? 0) >= -36 && (gameFrame?.frame ?? 0) < 0;
	};

	const isGameCountdown = (seconds: number) => {
		return seconds > 0 && seconds < 5;
	};

	const isGameEnd = (gameState: InGameState) => {
		return gameState === InGameState.End;
	};

	const isGameTime = (gameState: InGameState) => {
		return gameState === InGameState.Time;
	};

	const isGameTie = (gameState: InGameState) => {
		return gameState === InGameState.Tie;
	};

	const isGameNumber = (gameScore: number[], assumedGameNumber: number) => {
		return gameScore.reduce((a, b) => a + b, 1) === assumedGameNumber;
	};

	const isOffStage = (
		playerFrame: PreFrameUpdateType | undefined,
		stageId: number | undefined | null,
	): boolean => {
		if (isNil(playerFrame) || isNil(stageId)) return false;
		const offStageZone = getOffStageZone(stageId);
		if (isNil(offStageZone)) return false;
		if ((playerFrame?.positionX ?? 0) < offStageZone[0][0]) return true;
		if ((playerFrame?.positionX ?? 0) > offStageZone[1][0]) return true;
		if ((playerFrame?.positionY ?? 0) < offStageZone[0][1]) return true;
		if ((playerFrame?.positionY ?? 0) > offStageZone[1][1]) return true;
		return false;
	};
</script>
