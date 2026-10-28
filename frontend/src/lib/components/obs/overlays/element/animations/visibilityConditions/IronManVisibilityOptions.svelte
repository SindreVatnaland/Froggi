<script lang="ts" context="module">
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import type { IronManSession } from '$lib/models/types/ironman';

	/** Iron Man conditions. Player 1 = this Froggi's player, Player 2 = the opponent. */
	export const ironManVisibilityOption = (option: SelectedVisibilityCondition, session: IronManSession | null | undefined): boolean => {
		const conditions: [VisibilityOption, boolean][] = [
			[VisibilityOption.IronManActive, !!session],
			[VisibilityOption.IronManModeStandard, session?.settings.variant === 'standard'],
			[VisibilityOption.IronManModeFullRoster, session?.settings.variant === 'full_roster'],
			[VisibilityOption.IronManModeChallenge, session?.settings.variant === 'challenge'],
			[VisibilityOption.IronManPlayer1Won, session?.winner === 'local'],
			[VisibilityOption.IronManPlayer2Won, session?.winner === 'opponent'],
			[VisibilityOption.IronManCarryOverPending, (session?.pendingCarryStocks ?? 0) > 0],
		];
		for (const [opt, cond] of conditions) {
			if (option[opt] === VisibilityToggle.True && cond) return true;
			if (option[opt] === VisibilityToggle.False && !cond) return true;
		}
		return false;
	};
</script>
