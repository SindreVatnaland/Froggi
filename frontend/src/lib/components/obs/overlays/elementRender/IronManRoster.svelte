<script lang="ts">
	import type { GridContentItemStyle } from '$lib/models/types/overlay';
	import type { IronManRoster, IronManSession, IronManSettings } from '$lib/models/types/ironman';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';

	// Overlay element version of the Iron Man block on /obs/game-preview: per player a name pill +
	// progress count, the roster grid and a progress bar (P2 only in versus). Sized with container
	// query units so it scales with the element box — usable in OBS or injected into Dolphin.
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let session: IronManSession | null;
	export let currentChar: { localCharId: number | null; oppCharId: number | null };

	const PREVIEW_SETTINGS: IronManSettings = {
		variant: 'standard',
		rosterSize: 8,
		hideOpponent: false,
		stocksPerChar: 4,
		charOrder: 'fixed',
		charSelection: 'pick',
		randomSync: 'shared',
	};
	const previewRoster = (depleted: number): IronManRoster => ({
		slots: [2, 20, 9, 15, 0, 19, 12, 1].map((characterId, i) => ({ characterId, depleted: i < depleted, completed: false, stocksRemaining: 4 })),
		currentIndex: depleted,
	});

	$: settings = defaultPreview ? PREVIEW_SETTINGS : session?.settings;
	$: variant = settings?.variant ?? 'standard';
	$: localRoster = defaultPreview ? previewRoster(3) : session?.localRoster ?? null;
	$: oppRoster = defaultPreview ? previewRoster(5) : session?.role !== 'solo' ? session?.opponentRoster ?? null : null;
	$: localName = defaultPreview ? 'Player 1' : session?.localName ?? 'You';
	$: oppName = defaultPreview ? 'Player 2' : session?.opponentName ?? 'Opponent';
	$: showMarker = settings?.charOrder !== 'free';

	// standard tracks depleted characters, full_roster / challenge track completed ones.
	const progress = (roster: IronManRoster | null) =>
		roster ? roster.slots.filter((s) => (variant === 'standard' ? s.depleted : s.completed)).length : 0;
	const pct = (roster: IronManRoster | null) => (roster?.slots.length ? Math.min(100, (progress(roster) / roster.slots.length) * 100) : 0);
</script>

<div class="im-el" style={style.cssValue}>
	{#if settings && localRoster}
		<div class="im-section">
			<div class="im-head">
				<span class="im-name">{localName}</span>
				<span class="im-count">{progress(localRoster)}/{localRoster.slots.length}</span>
			</div>
			<IronManRosterGrid
				roster={localRoster}
				{settings}
				isLocal={true}
				{variant}
				activeGameCharId={defaultPreview ? null : currentChar.localCharId}
				iconSizeOverride="9cqmin"
				cols={8}
				showActiveMarker={showMarker}
			/>
			<div class="im-pb"><div class="im-pb-fill im-pb-fill--local" style="width:{pct(localRoster)}%" /></div>
		</div>
		{#if oppRoster}
			<div class="im-section">
				<div class="im-head">
					<span class="im-name">{oppName}</span>
					<span class="im-count">{progress(oppRoster)}/{oppRoster.slots.length}</span>
				</div>
				<IronManRosterGrid
					roster={oppRoster}
					{settings}
					isLocal={false}
					obscured={!defaultPreview && settings.hideOpponent}
					{variant}
					activeGameCharId={defaultPreview ? null : currentChar.oppCharId}
					iconSizeOverride="9cqmin"
					cols={8}
					showActiveMarker={showMarker}
				/>
				<div class="im-pb"><div class="im-pb-fill im-pb-fill--opp" style="width:{pct(oppRoster)}%" /></div>
			</div>
		{/if}
	{:else}
		<div class="im-idle">No active Iron Man session</div>
	{/if}
</div>

<style>
	.im-el {
		width: 100%;
		height: 100%;
		container-type: size;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3cqmin;
	}

	.im-section {
		display: flex;
		flex-direction: column;
		gap: 1.5cqmin;
	}

	.im-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.im-name {
		background: rgba(0, 0, 0, 0.55);
		padding: 0.9cqmin 2.7cqmin;
		border-radius: 4px;
		color: #fff;
		font-weight: 700;
		font-size: 4cqmin;
	}

	.im-count {
		color: #fff;
		font-weight: 700;
		font-size: 4cqmin;
	}

	.im-pb {
		height: 1.5cqmin;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 999px;
		overflow: hidden;
	}

	.im-pb-fill {
		height: 100%;
		transition: width 0.4s ease;
	}

	.im-pb-fill--local {
		background: rgba(74, 222, 128, 0.85);
	}

	.im-pb-fill--opp {
		background: rgba(248, 113, 113, 0.85);
	}

	.im-idle {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		opacity: 0.5;
		color: #fff;
	}
</style>
