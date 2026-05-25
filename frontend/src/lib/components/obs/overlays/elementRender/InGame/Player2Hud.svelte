<script lang="ts">
	import { CHARACTERS } from '$lib/models/constants/characterData';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { Player } from '$lib/models/types/slippiData';
	import { FrameEntryType } from '@slippi/slippi-js';
	import PlayerPercent from '../../element/PlayerPercent.svelte';
	import PlayerPercentCustom from '../../element/PlayerPercentCustom.svelte';
	import TextElement from '../../element/TextElement.svelte';
	import InGameCharacterIcon from '../../element/inGame/InGameCharacterIcon.svelte';
	import InGameCharacterRender from '../../element/inGame/InGameCharacterRender.svelte';
	import InGameCharacterSeriesSymbol from '../../element/inGame/InGameCharacterSeriesSymbol.svelte';
	import {
		getActionStateName, isDamaged, isShielding, isOnLedge, isCaptured, isInTech,
		HURTBOX_INVULNERABLE, HURTBOX_INTANGIBLE, STATE_LANDING_FALL_SPECIAL, STATE_AIR_DODGE,
	} from '$lib/models/constants/actionStates';

	$: _p2post = gameFrame?.players?.[player?.playerIndex ?? 0]?.post;
	$: _p2stateId = _p2post?.actionStateId ?? null;

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let player: Player | undefined;
	export let gameFrame: FrameEntryType | null | undefined;
</script>

{#if dataItem?.elementId === CustomElement.InGamePlayer2Percent}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2PercentDecimal}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2PercentCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2PercentDecimalCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2StocksRemaining}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 4
			: gameFrame?.players?.[player?.playerIndex ?? 1]?.post.stocksRemaining ?? '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2CharacterIcon}
	<InGameCharacterIcon
		{dataItem}
		{style}
		preview={defaultPreview}
		{player}
		defaultPreviewId={Number(CHARACTERS['falco'])}
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2CharacterRenderLeft}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
		direction="left"
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2CharacterRenderRight}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
		direction="right"
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2CharacterSeriesSymbol}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2CharacterSeriesSymbolUltimate}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
		series={'ultimate'}
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ComboCounter}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 3
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.currentComboCount ?? '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ActionStateName}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Landing (Special Fall)' : getActionStateName(_p2stateId)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ActionStateId}
	<TextElement {style} {dataItem}>{defaultPreview ? 43 : (_p2stateId ?? '')}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2InvincibilityState}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Invincible' : _p2post?.hurtboxCollisionState === HURTBOX_INVULNERABLE ? 'Invincible' : _p2post?.hurtboxCollisionState === HURTBOX_INTANGIBLE ? 'Intangible' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsAirborne}
	<TextElement {style} {dataItem}>{defaultPreview || _p2post?.isAirborne ? 'Airborne' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsShielding}
	<TextElement {style} {dataItem}>{defaultPreview || (_p2stateId != null && isShielding(_p2stateId)) ? 'Shielding' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsInHitstun}
	<TextElement {style} {dataItem}>{defaultPreview || (_p2stateId != null && isDamaged(_p2stateId)) ? 'Hitstun' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsInHitlag}
	<TextElement {style} {dataItem}>{defaultPreview || (_p2post?.hitlagRemaining ?? 0) > 0 ? 'Hitlag' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsOnLedge}
	<TextElement {style} {dataItem}>{defaultPreview || (_p2stateId != null && isOnLedge(_p2stateId)) ? 'Ledge' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsGrabbed}
	<TextElement {style} {dataItem}>{defaultPreview || (_p2stateId != null && isCaptured(_p2stateId)) ? 'Grabbed' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsInTech}
	<TextElement {style} {dataItem}>{defaultPreview || (_p2stateId != null && isInTech(_p2stateId)) ? 'Tech' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsWavedashLanding}
	<TextElement {style} {dataItem}>{defaultPreview || _p2stateId === STATE_LANDING_FALL_SPECIAL ? 'Special Land' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2IsAirdodging}
	<TextElement {style} {dataItem}>{defaultPreview || _p2stateId === STATE_AIR_DODGE ? 'Air Dodge' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2JumpsRemaining}
	<TextElement {style} {dataItem}>{defaultPreview ? 1 : (_p2post?.jumpsRemaining ?? 0)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ShieldSize}
	<TextElement {style} {dataItem}>{defaultPreview ? 50 : Math.floor(_p2post?.shieldSize ?? 0)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer2LCancel}
	<TextElement {style} {dataItem}>{defaultPreview ? '✓' : _p2post?.lCancelStatus === 1 ? '✓' : _p2post?.lCancelStatus === 2 ? '✗' : ''}</TextElement>
{/if}
