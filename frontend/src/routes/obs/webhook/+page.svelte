<script lang="ts">
	import { electronEmitter, webhookProfiles, webhooksEnabled } from '$lib/utils/store.svelte';
	import { WebhookEvent, type WebhookAuthType, type WebhookProfile } from '$lib/models/types/webhook';
	import { fly } from 'svelte/transition';

	const EVENT_LABELS: Record<WebhookEvent, string> = {
		[WebhookEvent.GameStart]: 'Game Start',
		[WebhookEvent.GameEnd]: 'Game End',
		[WebhookEvent.GameScore]: 'Game Score',
		[WebhookEvent.StrikeState]: 'Strike State',
		[WebhookEvent.RankChange]: 'Rank Change',
		[WebhookEvent.PercentChange]: 'Percent Change',
		[WebhookEvent.StockChange]: 'Stock Change',
		[WebhookEvent.PlayerInfo]: 'Player Info',
	};

	const RANK_PROFILE_OBJ = {
		rating: 1612.4,
		rank: 'Gold 2',
		wins: 42,
		losses: 38,
		totalGames: 80,
		leaderboardPlacement: null,
		characters: [{ characterId: 20, characterName: 'Falco', gameCount: 72 }],
	};

	const STAT_DIFF = (code: string, name: string, isCurrent: boolean, prev: number, curr: number) => ({
		connectCode: code,
		displayName: name,
		isCurrentPlayer: isCurrent,
		prev,
		current: curr,
		diff: curr - prev,
	});

	const SCHEMAS_DATA: Record<WebhookEvent, unknown> = {
		[WebhookEvent.GameStart]: {
			eventName: 'GameStart',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: {
				stageId: 8,
				mode: 'ranked',
				matchId: 'mode.ranked-2026-...',
				gameNumber: 1,
				bestOf: 5,
				players: [
					{ playerIndex: 0, port: 1, characterId: 20, characterColor: 0, connectCode: 'ABC#123', displayName: 'Player 1' },
					{ playerIndex: 1, port: 2, characterId: 9, characterColor: 2, connectCode: 'XYZ#456', displayName: 'Player 2' },
				],
			},
		},
		[WebhookEvent.GameEnd]: {
			eventName: 'GameEnd',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: { score: [1, 0], stageId: 8, mode: 'ranked', timestamp: '2026-01-01T00:00:00.000Z' },
		},
		[WebhookEvent.GameScore]: {
			eventName: 'GameScore',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: [1, 0],
		},
		[WebhookEvent.StrikeState]: {
			eventName: 'StrikeState',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: {
				p1Name: 'Player 1',
				p2Name: 'Player 2',
				bestOf: 5,
				score: { p1: 0, p2: 0 },
				gameNum: 1,
				phase: 'striking',
				starters: [2, 3, 8, 28, 31],
				counterpicks: [3],
				strikes: [2],
				finalStageId: null,
				currentStriker: 2,
				rps: { p1: null, p2: null, winner: null },
				characters: { p1: null, p2: null },
				dsrStages: { p1: [], p2: [] },
				lastWinner: null,
				games: [],
			},
		},
		[WebhookEvent.RankChange]: {
			eventName: 'RankChange',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: {
				connectCode: 'ABC#123',
				displayName: 'Player 1',
				before: RANK_PROFILE_OBJ,
				after: { ...RANK_PROFILE_OBJ, rating: 1628.1, wins: 43, totalGames: 81 },
				diff: { rating: 15.7, wins: 1, losses: 0, rankChanged: false },
			},
		},
		[WebhookEvent.PercentChange]: {
			eventName: 'PercentChange',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: {
				p1: STAT_DIFF('ABC#123', 'Player 1', true, 45.3, 67.8),
				p2: STAT_DIFF('XYZ#456', 'Player 2', false, 23.1, 28.9),
				currentPlayer: STAT_DIFF('ABC#123', 'Player 1', true, 45.3, 67.8),
			},
		},
		[WebhookEvent.StockChange]: {
			eventName: 'StockChange',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: {
				p1: STAT_DIFF('ABC#123', 'Player 1', true, 4, 3),
				p2: null,
				currentPlayer: STAT_DIFF('ABC#123', 'Player 1', true, 4, 3),
			},
		},
		[WebhookEvent.PlayerInfo]: {
			eventName: 'PlayerInfo',
			timestamp: '2026-01-01T00:00:00.000Z',
			payload: {
				p1: { playerIndex: 0, port: 1, characterId: 20, characterColor: 0, connectCode: 'ABC#123', displayName: 'Player 1', rank: RANK_PROFILE_OBJ },
				p2: { playerIndex: 1, port: 2, characterId: 9, characterColor: 2, connectCode: 'XYZ#456', displayName: 'Player 2', rank: null },
				currentPlayer: { playerIndex: 0, port: 1, characterId: 20, characterColor: 0, connectCode: 'ABC#123', displayName: 'Player 1', rank: RANK_PROFILE_OBJ },
			},
		},
	};

	const SCHEMAS: Record<WebhookEvent, string> = Object.fromEntries(
		Object.entries(SCHEMAS_DATA).map(([k, v]) => [k, JSON.stringify(v, null, 2)]),
	) as Record<WebhookEvent, string>;

	const emptyProfile = (): WebhookProfile => ({
		id: '',
		name: '',
		url: '',
		enabled: true,
		authType: 'bearer',
		bearerToken: '',
		clientId: '',
		clientSecret: '',
		loginUrl: '',
		events: [],
	});

	let showModal = false;
	let editingProfile: WebhookProfile = emptyProfile();
	let deleteConfirmId: string | null = null;
	let expandedSchema: WebhookEvent | null = null;
	let testingId: string | null = null;

	const openCreate = () => {
		editingProfile = emptyProfile();
		showModal = true;
	};

	const openEdit = (profile: WebhookProfile) => {
		editingProfile = { ...profile, events: [...profile.events] };
		showModal = true;
	};

	const closeModal = () => { showModal = false; };

	const save = () => {
		if (!formValid) return;
		if (!editingProfile.id) editingProfile.id = crypto.randomUUID();
		$electronEmitter.emit('SetWebhookProfile', editingProfile);
		showModal = false;
	};

	const remove = (id: string) => {
		$electronEmitter.emit('DeleteWebhookProfile', id);
		deleteConfirmId = null;
	};

	const toggleEnabled = (profile: WebhookProfile) => {
		$electronEmitter.emit('SetWebhookProfile', { ...profile, enabled: !profile.enabled });
	};

	const toggleGlobal = () => {
		$electronEmitter.emit('SetWebhooksEnabled', !$webhooksEnabled);
	};

	const toggleEvent = (event: WebhookEvent) => {
		const idx = editingProfile.events.indexOf(event);
		editingProfile.events = idx >= 0
			? editingProfile.events.filter((e) => e !== event)
			: [...editingProfile.events, event];
	};

	const toggleSchema = (event: WebhookEvent) => {
		expandedSchema = expandedSchema === event ? null : event;
	};

	const testProfile = async (id: string) => {
		testingId = id;
		$electronEmitter.emit('TestWebhookProfile', id);
		await new Promise((r) => setTimeout(r, 1200));
		testingId = null;
	};

	$: formValid =
		editingProfile.name.trim().length > 0 &&
		editingProfile.url.trim().length > 0 &&
		editingProfile.events.length > 0 &&
		(editingProfile.authType === 'bearer'
			? editingProfile.bearerToken.trim().length > 0
			: editingProfile.clientId.trim().length > 0 &&
			  editingProfile.clientSecret.trim().length > 0 &&
			  editingProfile.loginUrl.trim().length > 0);
</script>

<h1 class="text-xl font-semibold text-secondary-color mb-6">Webhooks</h1>

<div class="webhook-page">
	<div class="global-row border-secondary">
		<div>
			<p class="global-label">Webhooks Active</p>
			<p class="global-hint">Master switch — disables all outbound webhook calls.</p>
		</div>
		<label class="toggle-row" style="margin: 0;">
			<input type="checkbox" class="toggle-check" checked={$webhooksEnabled} on:change={toggleGlobal} />
		</label>
	</div>

	<div class="header-row">
		<p class="section-label">Profiles</p>
		<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={openCreate}>
			New Profile
		</button>
	</div>

	{#if $webhookProfiles.length === 0}
		<p class="empty-hint">No webhook profiles. Create one to start sending events.</p>
	{:else}
		<div class="profile-list">
			{#each $webhookProfiles as profile (profile.id)}
				<div class="profile-card border-secondary" class:profile-card--disabled={!profile.enabled} in:fly={{ duration: 200, y: -8 }}>
					<div class="profile-main">
						<div class="profile-info">
							<span class="profile-name">{profile.name}</span>
							<span class="profile-url">{profile.url}</span>
							<div class="profile-tags">
								{#each profile.events as event}
									<span class="tag">{EVENT_LABELS[event]}</span>
								{/each}
							</div>
						</div>
						<div class="profile-actions">
							<label class="toggle-row" style="margin: 0;" title={profile.enabled ? 'Disable' : 'Enable'}>
								<input
									type="checkbox"
									class="toggle-check"
									checked={profile.enabled}
									on:change={() => toggleEnabled(profile)}
								/>
							</label>
							<button
								class="action-btn"
								disabled={testingId === profile.id}
								on:click={() => testProfile(profile.id)}
							>
								{testingId === profile.id ? 'Sending…' : 'Test'}
							</button>
							<button class="action-btn" on:click={() => openEdit(profile)}>Edit</button>
							{#if deleteConfirmId === profile.id}
								<button class="action-btn action-btn--danger" on:click={() => remove(profile.id)}>Confirm</button>
								<button class="action-btn" on:click={() => (deleteConfirmId = null)}>Cancel</button>
							{:else}
								<button class="action-btn" on:click={() => (deleteConfirmId = profile.id)}>Delete</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="schemas-section">
		<p class="section-label">Event Schemas</p>
		<p class="schemas-hint">All webhooks POST JSON with this wrapper structure.</p>
		{#each Object.values(WebhookEvent) as event}
			<div class="schema-item border-secondary">
				<button class="schema-header" on:click={() => toggleSchema(event)}>
					<span class="schema-name">{EVENT_LABELS[event]}</span>
					<span class="schema-toggle">{expandedSchema === event ? '▲' : '▼'}</span>
				</button>
				{#if expandedSchema === event}
					<pre class="schema-body" in:fly={{ duration: 150, y: -5 }}>{SCHEMAS[event]}</pre>
				{/if}
			</div>
		{/each}
	</div>
</div>

{#if showModal}
	<div class="modal-backdrop" on:click|self={closeModal} role="presentation">
		<div class="confirm-box background-primary-color border-secondary" in:fly={{ duration: 200, y: 20 }}>
			<p class="modal-title">{editingProfile.id ? 'Edit Profile' : 'New Profile'}</p>

			<div class="form-fields">
				<div class="field">
					<p class="field-label">Name</p>
					<input
						class="field-input border-secondary"
						type="text"
						placeholder="My Webhook"
						bind:value={editingProfile.name}
					/>
				</div>

				<div class="field">
					<p class="field-label">URL</p>
					<input
						class="field-input border-secondary"
						type="url"
						placeholder="https://example.com/webhook"
						bind:value={editingProfile.url}
					/>
				</div>

				<div class="field">
					<p class="field-label">Auth Type</p>
					<div class="auth-tabs">
						<button
							class="auth-tab"
							class:auth-tab--active={editingProfile.authType === 'bearer'}
							on:click={() => (editingProfile.authType = 'bearer')}
						>Bearer Token</button>
						<button
							class="auth-tab"
							class:auth-tab--active={editingProfile.authType === 'oauth2'}
							on:click={() => (editingProfile.authType = 'oauth2')}
						>OAuth2 Client Credentials</button>
					</div>
				</div>

				{#if editingProfile.authType === 'bearer'}
					<div class="field" in:fly={{ duration: 150, x: 20 }}>
						<p class="field-label">Bearer Token</p>
						<input class="field-input border-secondary" type="password" placeholder="eyJ…" bind:value={editingProfile.bearerToken} />
					</div>
				{:else}
					<div class="field" in:fly={{ duration: 150, x: 20 }}>
						<p class="field-label">Login URL</p>
						<input class="field-input border-secondary" type="url" placeholder="https://auth.example.com/oauth/token" bind:value={editingProfile.loginUrl} />
					</div>
					<div class="field">
						<p class="field-label">Client ID</p>
						<input class="field-input border-secondary" type="text" placeholder="client_id" bind:value={editingProfile.clientId} />
					</div>
					<div class="field">
						<p class="field-label">Client Secret</p>
						<input class="field-input border-secondary" type="password" placeholder="client_secret" bind:value={editingProfile.clientSecret} />
					</div>
				{/if}

				<div class="field">
					<p class="field-label">Events</p>
					<div class="event-checkboxes">
						{#each Object.values(WebhookEvent) as event}
							<label class="event-check-row">
								<input type="checkbox" checked={editingProfile.events.includes(event)} on:change={() => toggleEvent(event)} />
								<span>{EVENT_LABELS[event]}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={closeModal}>Cancel</button>
				<button class="btn confirm-ok text-xs h-8 px-4 rounded disabled:opacity-40" disabled={!formValid} on:click={save}>Save</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.webhook-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.global-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem;
		border-radius: 0.375rem;
	}

	.global-label {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.global-hint {
		font-size: 0.72rem;
		opacity: 0.4;
		margin-top: 0.15rem;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.empty-hint {
		font-size: 0.8rem;
		opacity: 0.4;
	}

	.profile-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.profile-card {
		border-radius: 0.375rem;
		padding: 0.875rem 1rem;
		transition: opacity 0.2s;
	}

	.profile-card--disabled { opacity: 0.45; }

	.profile-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.profile-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.profile-name { font-size: 0.9rem; font-weight: 600; }

	.profile-url {
		font-size: 0.72rem;
		opacity: 0.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 260px;
	}

	.profile-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.tag {
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		opacity: 0.5;
		border: 1px solid currentColor;
		border-radius: 0.2rem;
		padding: 0.1rem 0.35rem;
	}

	.profile-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.action-btn {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		opacity: 0.55;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--secondary-color);
		padding: 0.2rem 0.4rem;
		border-radius: 0.2rem;
		transition: opacity 0.15s;
	}

	.action-btn:hover:not(:disabled) { opacity: 1; }
	.action-btn:disabled { opacity: 0.25; cursor: default; }
	.action-btn--danger { color: rgb(239, 68, 68); opacity: 0.8; }
	.action-btn--danger:hover { opacity: 1; }

	.schemas-section { margin-top: 0.25rem; }

	.schemas-hint {
		font-size: 0.72rem;
		opacity: 0.35;
		margin-top: 0.3rem;
		margin-bottom: 0.75rem;
	}

	.schema-item {
		border-radius: 0.25rem;
		margin-bottom: 0.5rem;
		overflow: hidden;
	}

	.schema-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.6rem 0.875rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--secondary-color);
		text-align: left;
	}

	.schema-name { font-size: 0.8rem; font-weight: 600; }
	.schema-toggle { font-size: 0.6rem; opacity: 0.4; }

	.schema-body {
		font-size: 0.7rem;
		line-height: 1.5;
		opacity: 0.65;
		padding: 0.75rem 0.875rem 1rem;
		border-top: 1px solid rgba(128, 128, 128, 0.2);
		overflow-x: auto;
		white-space: pre;
		margin: 0;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.confirm-box {
		border-radius: 0.5rem;
		padding: 1.5rem;
		width: 100%;
		max-width: 420px;
		max-height: 90vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.modal-title { font-size: 1rem; font-weight: 700; }

	.form-fields { display: flex; flex-direction: column; gap: 1rem; }

	.field { display: flex; flex-direction: column; gap: 0.35rem; }

	.field-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.field-input {
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.8rem;
		background: transparent;
		color: var(--secondary-color);
		border-radius: 0.125rem;
		outline: none;
		width: 100%;
	}

	.auth-tabs { display: flex; gap: 0.25rem; }

	.auth-tab {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.35rem 0.75rem;
		border-radius: 0.2rem;
		border: 1px solid transparent;
		background: none;
		color: var(--secondary-color);
		cursor: pointer;
		opacity: 0.4;
		transition: opacity 0.15s;
	}

	.auth-tab--active { opacity: 1; border-color: var(--secondary-color); }

	.event-checkboxes { display: flex; flex-direction: column; gap: 0.5rem; }

	.event-check-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}
</style>
