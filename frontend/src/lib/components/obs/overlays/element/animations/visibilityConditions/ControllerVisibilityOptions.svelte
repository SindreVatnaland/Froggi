<script lang="ts" context="module">
	import { SelectedVisibilityCondition, VisibilityToggle } from '$lib/models/types/animationOption';
	import type { CurrentPlayer, Player } from '$lib/models/types/slippiData';
	import type { PlayerController } from '$lib/models/types/controller';
	import type { FrameEntryType } from '../../../../../../models/types/slippiTypes';
	import { CONTROLLER_CHECKS, controllerState } from '$lib/utils/controllerConditions';

	// "<player> Controller <check>" labels (VisibilityOption) → the player + CONTROLLER_CHECKS entry.
	const PLAYERS: [string, 'current' | 0 | 1][] = [
		['Current Player Controller ', 'current'],
		['Player 1 Controller ', 0],
		['Player 2 Controller ', 1],
	];

	export const controllerVisibilityOption = (
		option: SelectedVisibilityCondition,
		gameFrame: FrameEntryType | null | undefined,
		currentPlayers: Player[],
		currentPlayer: CurrentPlayer | undefined,
		memory: PlayerController | undefined,
	): boolean => {
		for (const [label, toggle] of Object.entries(option)) {
			if (toggle !== VisibilityToggle.True && toggle !== VisibilityToggle.False) continue;
			const player = PLAYERS.find(([prefix]) => label.startsWith(prefix));
			const check = player && CONTROLLER_CHECKS[label.slice(player[0].length)];
			if (!player || !check) continue;
			const index = player[1] === 'current' ? currentPlayer?.playerIndex : currentPlayers?.[player[1]]?.playerIndex;
			if (index === undefined || index === null) continue;
			const on = check(controllerState(gameFrame?.players?.[index]?.pre, memory?.[index]));
			if ((toggle === VisibilityToggle.True && on) || (toggle === VisibilityToggle.False && !on)) return true;
		}
		return false;
	};
</script>
