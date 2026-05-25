<script lang="ts">
	import { CHARACTERS } from '$lib/models/constants/characterData';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import PlayerPercent from '$lib/components/obs/overlays/element/PlayerPercent.svelte';
	import InGameCharacterIcon from '$lib/components/obs/overlays/element/inGame/InGameCharacterIcon.svelte';
	import InGameCharacterRender from '$lib/components/obs/overlays/element/inGame/InGameCharacterRender.svelte';
	import InGameCharacterSeriesSymbol from '$lib/components/obs/overlays/element/inGame/InGameCharacterSeriesSymbol.svelte';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import {
		getActionStateName, getStateCategory, isDamaged, isShielding, isOnLedge, isCaptured, isInTech,
		HURTBOX_INVULNERABLE, HURTBOX_INTANGIBLE, STATE_LANDING_FALL_SPECIAL, STATE_AIR_DODGE,
	} from '$lib/models/constants/actionStates';
	import { techniqueEvents } from '$lib/utils/store.svelte';
	import { TECHNIQUE_LABELS } from '$lib/models/constants/techniqueLabels';

	$: _cppost = gameFrame?.players?.[player?.playerIndex ?? 0]?.post;
	$: _cpstateId = _cppost?.actionStateId ?? null;
	$: _cptechnique = $techniqueEvents[player?.playerIndex ?? 0]?.techniqueId ?? null;
	import PlayerPercentCustom from '../../element/PlayerPercentCustom.svelte';
	import { Player } from '$lib/models/types/slippiData';
	import { FrameEntryType } from '@slippi/slippi-js';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let player: Player;
	export let gameFrame: FrameEntryType | null | undefined;
</script>

{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercent}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercentDecimal}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercentCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercentDecimalCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerStocksRemaining}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 4
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.stocksRemaining ?? '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterIcon}
	<InGameCharacterIcon
		{dataItem}
		{style}
		preview={defaultPreview}
		{player}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterRenderLeft}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction={'left'}
	/>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterRenderRight}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction={'right'}
	/>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterSeriesSymbol}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterSeriesSymbolUltimate}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		series={'ultimate'}
	/>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerComboCounter}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '3'
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.currentComboCount ?? '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerActionStateName}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Landing (Special Fall)' : getActionStateName(_cpstateId)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerActionStateId}
	<TextElement {style} {dataItem}>{defaultPreview ? 43 : (_cpstateId ?? '')}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerInvincibilityState}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Invincible' : _cppost?.hurtboxCollisionState === HURTBOX_INVULNERABLE ? 'Invincible' : _cppost?.hurtboxCollisionState === HURTBOX_INTANGIBLE ? 'Intangible' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsAirborne}
	<TextElement {style} {dataItem}>{defaultPreview || _cppost?.isAirborne ? 'Airborne' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsShielding}
	<TextElement {style} {dataItem}>{defaultPreview || (_cpstateId != null && isShielding(_cpstateId)) ? 'Shielding' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsInHitstun}
	<TextElement {style} {dataItem}>{defaultPreview || (_cpstateId != null && isDamaged(_cpstateId)) ? 'Hitstun' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsInHitlag}
	<TextElement {style} {dataItem}>{defaultPreview || (_cppost?.hitlagRemaining ?? 0) > 0 ? 'Hitlag' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsOnLedge}
	<TextElement {style} {dataItem}>{defaultPreview || (_cpstateId != null && isOnLedge(_cpstateId)) ? 'Ledge' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsGrabbed}
	<TextElement {style} {dataItem}>{defaultPreview || (_cpstateId != null && isCaptured(_cpstateId)) ? 'Grabbed' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsInTech}
	<TextElement {style} {dataItem}>{defaultPreview || (_cpstateId != null && isInTech(_cpstateId)) ? 'Tech' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsWavedashLanding}
	<TextElement {style} {dataItem}>{defaultPreview || _cpstateId === STATE_LANDING_FALL_SPECIAL ? 'Special Land' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerIsAirdodging}
	<TextElement {style} {dataItem}>{defaultPreview || _cpstateId === STATE_AIR_DODGE ? 'Air Dodge' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerJumpsRemaining}
	<TextElement {style} {dataItem}>{defaultPreview ? 1 : (_cppost?.jumpsRemaining ?? 0)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerShieldSize}
	<TextElement {style} {dataItem}>{defaultPreview ? 50 : Math.floor(_cppost?.shieldSize ?? 0)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerLCancel}
	<TextElement {style} {dataItem}>{defaultPreview ? '✓' : _cppost?.lCancelStatus === 1 ? '✓' : _cppost?.lCancelStatus === 2 ? '✗' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerStateCategory}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Dashing' : getStateCategory(_cpstateId)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGameCurrentPlayerTechnique}
	{#key _cptechnique}
		<TextElement {style} {dataItem}>{defaultPreview ? 'Wavedash' : (_cptechnique ? (TECHNIQUE_LABELS[_cptechnique] ?? _cptechnique) : '')}</TextElement>
	{/key}
{/if}
