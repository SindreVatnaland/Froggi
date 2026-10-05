<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { assetPacks, electronEmitter, isElectron, urls } from '$lib/utils/store.svelte';
	import { BUILTIN_ASSET_PACKS, resolvePackImage, type AssetPack } from '$lib/models/types/assetPack';
	import { MELEE_CHARACTER_SKINS, skinColor } from '$lib/models/constants/meleeCharacterSkins';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	// Character asset packs: one image per Melee character per skin, used by the "Player N / Current
	// Player Character" overlay elements. Built-in packs are read-only (duplicate to customise).
	$: packs = [...BUILTIN_ASSET_PACKS, ...$assetPacks];
	$: selectedId = $page.url.searchParams.get('pack');
	$: selected = packs.find((p) => p.id === selectedId);
	$: resourceBase = ($isElectron ? $urls?.localResource : $urls?.externalResource) ?? '';

	const TOTAL_SLOTS = MELEE_CHARACTER_SKINS.reduce((n, c) => n + c.skins.length, 0);
	const filled = (pack: AssetPack) =>
		pack.builtIn ? TOTAL_SLOTS : Object.values(pack.slots ?? {}).reduce((n, skins) => n + Object.keys(skins).length, 0);

	// Slot files keep their name when replaced — bust the cache whenever the pack list changes.
	let version = 0;
	$: $assetPacks, (version = Date.now());
	const slotSrc = (pack: AssetPack, characterId: number, skinId: number) => {
		const src = resolvePackImage(packs, pack.id, characterId, skinId, resourceBase);
		return pack.builtIn ? src : `${src}?v=${version}`;
	};
	const hasSlot = (pack: AssetPack, characterId: number, skinId: number) => pack.builtIn || !!pack.slots?.[characterId]?.[skinId];
	// The original costume (built-in art of this exact skin) — shown on hover over an empty slot.
	const originalSrc = (pack: AssetPack, characterId: number, skinId: number) =>
		resolvePackImage([], pack.builtIn ? pack.id : pack.fallback, characterId, skinId);

	let newTitle = '';
	const createPack = () => {
		$electronEmitter.emit('AssetPackCreate', newTitle.trim() || 'My character pack');
		newTitle = '';
	};

	let editingTitle = '';
	$: if (selected && !selected.builtIn) editingTitle = selected.title;
	const saveTitle = () => {
		if (selected && editingTitle.trim() && editingTitle.trim() !== selected.title) $electronEmitter.emit('AssetPackUpdate', selected.id, editingTitle.trim());
	};

	let confirmDeleteOpen = false;
	const deletePack = () => {
		if (!selected) return;
		const id = selected.id;
		goto('/obs/overlay/assets');
		$electronEmitter.emit('AssetPackDelete', id);
	};
</script>

<main class="flex justify-center background-primary-color text-secondary-color pb-16">
	<div class="w-full max-w-3xl">
		{#if !selected}
			<div class="flex items-center gap-3 mb-5">
				<a class="btn text-sm h-8 px-3 border-secondary rounded flex items-center" href="/obs/overlay">← Overlays</a>
				<h1 class="text-xl font-semibold">Asset packs</h1>
				{#if $isElectron}
					<button class="btn text-sm h-8 px-4 border-secondary rounded ml-auto" on:click={() => $electronEmitter.emit('AssetPackImport')}>
						Import .froggi
					</button>
				{/if}
			</div>
			<p class="text-xs opacity-50 mb-4">
				Character images for the "Character" overlay element — one image per character and skin. Missing skins fall back
				to the character's skin 0, then to the pack's built-in fallback.
			</p>

			{#if $isElectron}
				<div class="settings-row border-secondary mb-5">
					<input class="title-input border-secondary" placeholder="New pack title (e.g. Custom character icons)" bind:value={newTitle} />
					<button class="btn text-sm h-8 px-4 border-secondary rounded" on:click={createPack}>+ New pack</button>
				</div>
			{/if}

			<div class="card-grid">
				{#each packs as pack (pack.id)}
					<a class="pack-card border-secondary" href={`/obs/overlay/assets?pack=${pack.id}`}>
						<div class="pack-thumbs">
							{#each [2, 20, 9, 15, 0] as charId}
								<img src={slotSrc(pack, charId, 0)} alt="" />
							{/each}
						</div>
						<p class="pack-title">{pack.title}</p>
						<p class="pack-meta">{pack.builtIn ? 'Built-in' : `${filled(pack)} / ${TOTAL_SLOTS} skins`}</p>
					</a>
				{/each}
			</div>
		{:else}
			<div class="flex items-center gap-2 mb-4 flex-wrap">
				<a class="btn text-sm h-8 px-3 border-secondary rounded flex items-center" href="/obs/overlay/assets">← Packs</a>
				{#if selected.builtIn || !$isElectron}
					<h1 class="text-xl font-semibold">{selected.title}</h1>
				{:else}
					<input class="title-input title-input--big border-secondary" bind:value={editingTitle} on:blur={saveTitle} on:keydown={(e) => e.key === 'Enter' && saveTitle()} />
				{/if}
				{#if $isElectron}
					<div class="flex gap-2 ml-auto">
						<button class="btn text-sm h-8 px-3 border-secondary rounded" on:click={() => selected && $electronEmitter.emit('AssetPackDuplicate', selected.id)}>Duplicate</button>
						{#if !selected.builtIn}
							<button class="btn text-sm h-8 px-3 border-secondary rounded" on:click={() => selected && $electronEmitter.emit('AssetPackImportFolder', selected.id)}>Import folder</button>
							<button class="btn text-sm h-8 px-3 border-secondary rounded" on:click={() => selected && $electronEmitter.emit('AssetPackExport', selected.id)}>Export .froggi</button>
							<button class="btn text-sm h-8 px-3 border-secondary rounded" on:click={() => (confirmDeleteOpen = true)}>Delete</button>
						{/if}
					</div>
				{/if}
			</div>

			{#if selected.builtIn}
				<p class="text-xs opacity-50 mb-4">Built-in packs are read-only — Duplicate it to start your own pack from these images.</p>
			{:else}
				<div class="settings-row border-secondary mb-4">
					<div class="settings-group">
						<span class="settings-label">Missing characters use</span>
						<div class="pill-group">
							{#each BUILTIN_ASSET_PACKS as fb}
								<button
									class="pill"
									class:pill--active={selected.fallback === fb.id}
									on:click={() => selected && $electronEmitter.emit('AssetPackUpdate', selected.id, undefined, fb.id)}
								>
									{fb.title.replace('Default ', '')}
								</button>
							{/each}
						</div>
					</div>
					<span class="text-xs opacity-50">{filled(selected)} / {TOTAL_SLOTS} skins · click a slot to upload · "Import folder" reads &lt;characterId&gt;/&lt;skinId&gt;.png</span>
					<span class="text-xs opacity-50 w-full">Faded = not in this pack yet: it shows what overlays use instead — this character's skin 0 from this pack, or the built-in art if skin 0 is empty too. Hover an empty slot to see the costume it stands for; the dot is the costume colour.</span>
				</div>
			{/if}

			<div class="char-list">
				{#each MELEE_CHARACTER_SKINS as character (character.id)}
					<div class="char-row border-secondary">
						<div class="char-name">
							<span>{character.name}</span>
							<span class="char-id">id {character.id}</span>
						</div>
						<div class="slots">
							{#each character.skins as skinName, skinId}
								{@const present = hasSlot(selected, character.id, skinId)}
								<div class="slot" class:slot--empty={!present} class:slot--required={!present && skinId === 0}>
									<button
										class="slot-img"
										disabled={selected.builtIn || !$isElectron}
										title={selected.builtIn ? `${skinName} (skin ${skinId})` : `Upload ${character.name} — ${skinName} (skin ${skinId})`}
										on:click={() => selected && $electronEmitter.emit('AssetPackSetSlot', selected.id, character.id, skinId)}
									>
										<img class="slot-current" src={slotSrc(selected, character.id, skinId)} alt={skinName} />
										{#if !present}
											<img class="slot-original" src={originalSrc(selected, character.id, skinId)} alt="" />
										{/if}
										<span
											class="skin-dot"
											class:skin-dot--default={!skinColor(character.id, skinId)}
											style:background={skinColor(character.id, skinId)}
										/>
									</button>
									<span class="slot-label">{skinId} · {skinName}{skinId === 0 ? ' *' : ''}</span>
									{#if !selected.builtIn && selected.slots?.[character.id]?.[skinId] && $isElectron}
										<button class="slot-remove" title="Remove" on:click={() => selected && $electronEmitter.emit('AssetPackRemoveSlot', selected.id, character.id, skinId)}>×</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</main>

<ConfirmModal bind:open={confirmDeleteOpen} on:confirm={deletePack}>
	Delete this asset pack and its images? Overlays using it fall back to the default stock icons.
</ConfirmModal>

<style>
	.settings-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.1rem;
		border-radius: 0.375rem;
	}
	.settings-group {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.settings-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		opacity: 0.45;
	}
	.pill-group {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.pill {
		font-size: 0.78rem;
		padding: 0.2rem 0.7rem;
		border: 1px solid var(--secondary-color);
		border-radius: 1rem;
		opacity: 0.4;
		background: transparent;
		color: var(--secondary-color);
	}
	.pill--active,
	.pill:hover {
		opacity: 1;
		background: color-mix(in srgb, var(--secondary-color) 12%, transparent);
	}
	.title-input {
		flex: 1;
		min-width: 200px;
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.85rem;
		background: transparent;
		color: var(--secondary-color);
		border-radius: 0.25rem;
	}
	.title-input--big {
		font-size: 1.1rem;
		font-weight: 600;
		max-width: 22rem;
	}
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}
	.pack-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		transition: transform 0.15s;
	}
	.pack-card:hover {
		transform: scale(1.02);
	}
	.pack-thumbs {
		display: flex;
		gap: 0.25rem;
		height: 2.5rem;
	}
	.pack-thumbs img {
		height: 100%;
		width: 20%;
		object-fit: contain;
	}
	.pack-title {
		font-size: 0.85rem;
		font-weight: 600;
	}
	.pack-meta {
		font-size: 0.7rem;
		opacity: 0.45;
	}
	.char-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.char-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
	}
	.char-name {
		width: 9rem;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.char-id {
		font-size: 0.7rem;
		font-weight: 400;
		opacity: 0.4;
	}
	.slots {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.slot {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		width: 4.5rem;
	}
	.slot-img {
		position: relative;
		width: 4rem;
		height: 4rem;
		border-radius: 0.25rem;
		background: rgba(0, 0, 0, 0.12);
		border: 1px solid transparent;
	}
	.slot-img:not(:disabled):hover {
		border-color: var(--secondary-color);
	}
	.slot-img img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.slot--empty .slot-img .slot-current {
		opacity: 0.25;
		filter: grayscale(1);
	}
	.slot-original {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.12s;
	}
	.slot-img:hover .slot-original {
		opacity: 1;
	}
	.slot--empty .slot-img:hover .slot-current {
		opacity: 0 !important;
	}
	.skin-dot {
		position: absolute;
		right: 0.2rem;
		bottom: 0.2rem;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.55);
	}
	.skin-dot--default {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--secondary-color), 0 0 0 1.5px rgba(0, 0, 0, 0.55);
	}
	.slot--required .slot-img {
		border: 1px dashed var(--secondary-color);
	}
	.slot-label {
		font-size: 0.62rem;
		opacity: 0.55;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.slot-remove {
		position: absolute;
		top: -0.3rem;
		right: 0.1rem;
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 50%;
		font-size: 0.75rem;
		line-height: 1;
		background: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
