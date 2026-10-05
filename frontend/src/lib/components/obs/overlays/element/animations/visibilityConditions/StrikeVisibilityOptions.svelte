<script lang="ts" context="module">
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import type { StrikeState } from '$lib/models/types/stageStriking';
	import { STRIKE_STAGES, stageStatus } from '$lib/utils/strikeStageStatus';

	export const strikeVisibilityOption = (
		option: SelectedVisibilityCondition,
		strikeState: StrikeState | undefined,
	): boolean => {
		const phase = strikeState?.phase;

		const check = (opt: VisibilityOption, cond: boolean): boolean | undefined => {
			if (option[opt] === VisibilityToggle.True && cond) return true;
			if (option[opt] === VisibilityToggle.False && !cond) return true;
			return undefined;
		};

		if (check(VisibilityOption.StrikePhaseRps, phase === 'rps') != null)
			return check(VisibilityOption.StrikePhaseRps, phase === 'rps')!;
		if (check(VisibilityOption.StrikePhaseStriking, phase === 'striking') != null)
			return check(VisibilityOption.StrikePhaseStriking, phase === 'striking')!;
		if (check(VisibilityOption.StrikePhaseCharSelect, phase === 'charSelect') != null)
			return check(VisibilityOption.StrikePhaseCharSelect, phase === 'charSelect')!;
		if (check(VisibilityOption.StrikePhasePlaying, phase === 'playing') != null)
			return check(VisibilityOption.StrikePhasePlaying, phase === 'playing')!;
		if (check(VisibilityOption.StrikePhaseComplete, phase === 'setComplete') != null)
			return check(VisibilityOption.StrikePhaseComplete, phase === 'setComplete')!;
		const phaseChecks: [VisibilityOption, boolean][] = [
			[VisibilityOption.StrikePhaseRpsResult, phase === 'rpsResult'],
			[VisibilityOption.StrikePhaseStageBan, phase === 'stageBan'],
			[VisibilityOption.StrikePhaseStagePick, phase === 'stagePick'],
			[VisibilityOption.StrikePhaseCharacterPick, phase === 'charLock' || phase === 'charPick'],
			[VisibilityOption.StrikeAgreementPending, !!strikeState?.agreement],
			[VisibilityOption.StrikeIsFirstGame, !!strikeState && strikeState.gameNum === 1 && !strikeState.lastWinner],
		];
		for (const [opt, cond] of phaseChecks) {
			const v = check(opt, cond);
			if (v != null) return v;
		}
		// Per-stage display state — exactly one is true per stage.
		for (const stage of STRIKE_STAGES) {
			const status = stageStatus(strikeState, stage.stageId);
			for (const [s, opt] of Object.entries(stage.conditions)) {
				const v = check(opt, status === s);
				if (v != null) return v;
			}
		}

		if (check(VisibilityOption.StrikeIsPlayer1Turn, strikeState?.currentStriker === 1) != null)
			return check(VisibilityOption.StrikeIsPlayer1Turn, strikeState?.currentStriker === 1)!;
		if (check(VisibilityOption.StrikeIsPlayer2Turn, strikeState?.currentStriker === 2) != null)
			return check(VisibilityOption.StrikeIsPlayer2Turn, strikeState?.currentStriker === 2)!;

		const hasFinal = strikeState?.finalStageId != null;
		if (check(VisibilityOption.StrikeIsStageFinal, hasFinal) != null)
			return check(VisibilityOption.StrikeIsStageFinal, hasFinal)!;

		const p1RpsSelected = strikeState?.rps?.p1 != null;
		const p2RpsSelected = strikeState?.rps?.p2 != null;
		if (check(VisibilityOption.StrikePlayer1RpsSelected, p1RpsSelected) != null)
			return check(VisibilityOption.StrikePlayer1RpsSelected, p1RpsSelected)!;
		if (check(VisibilityOption.StrikePlayer2RpsSelected, p2RpsSelected) != null)
			return check(VisibilityOption.StrikePlayer2RpsSelected, p2RpsSelected)!;

		const p1CharSelected = strikeState?.characters?.p1 != null;
		const p2CharSelected = strikeState?.characters?.p2 != null;
		if (check(VisibilityOption.StrikePlayer1CharacterSelected, p1CharSelected) != null)
			return check(VisibilityOption.StrikePlayer1CharacterSelected, p1CharSelected)!;
		if (check(VisibilityOption.StrikePlayer2CharacterSelected, p2CharSelected) != null)
			return check(VisibilityOption.StrikePlayer2CharacterSelected, p2CharSelected)!;

		// Per-stage struck (stage is in current strikes[] list)
		const strikes = [...(strikeState?.strikes ?? []), ...(strikeState?.bans ?? [])];
		const struckChecks: [VisibilityOption, number][] = [
			[VisibilityOption.StrikeIsFoDStruck, 2],
			[VisibilityOption.StrikeIsBFStruck,  31],
			[VisibilityOption.StrikeIsFDStruck,  32],
			[VisibilityOption.StrikeIsDLStruck,  28],
			[VisibilityOption.StrikeIsYSStruck,  8],
			[VisibilityOption.StrikeIsPSStruck,  3],
		];
		for (const [opt, id] of struckChecks) {
			const v = check(opt, strikes.includes(id));
			if (v != null) return v;
		}

		// Per-stage disabled: not in current stages pool (DSR or counterpick not yet available)
		const stagePool = strikeState?.stages ?? [];
		const disabledChecks: [VisibilityOption, number][] = [
			[VisibilityOption.StrikeIsFoDDisabled, 2],
			[VisibilityOption.StrikeIsBFDisabled,  31],
			[VisibilityOption.StrikeIsFDDisabled,  32],
			[VisibilityOption.StrikeIsDLDisabled,  28],
			[VisibilityOption.StrikeIsYSDisabled,  8],
			[VisibilityOption.StrikeIsPSDisabled,  3],
		];
		for (const [opt, id] of disabledChecks) {
			const v = check(opt, !stagePool.includes(id));
			if (v != null) return v;
		}

		return false;
	};
</script>
