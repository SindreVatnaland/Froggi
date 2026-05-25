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
		getActionStateName, getStateCategory, isDamaged, isShielding, isOnLedge, isCaptured, isInTech,
		HURTBOX_INVULNERABLE, HURTBOX_INTANGIBLE, STATE_LANDING_FALL_SPECIAL, STATE_AIR_DODGE,
	} from '$lib/models/constants/actionStates';
	import { techniqueEvents } from '$lib/utils/store.svelte';
	import { TECHNIQUE_LABELS } from '$lib/models/constants/techniqueLabels';

	$: _p1post = gameFrame?.players?.[player?.playerIndex ?? 0]?.post;
	$: _p1stateId = _p1post?.actionStateId ?? null;
	$: _p1technique = $techniqueEvents[player?.playerIndex ?? 0]?.techniqueId ?? null;

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let player: Player | undefined;
	export let gameFrame: FrameEntryType | null | undefined;
</script>

{#if dataItem?.elementId === CustomElement.InGamePlayer1Percent}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer1PercentDecimal}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer1PercentCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer1PercentDecimalCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer1StocksRemaining}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 4
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.stocksRemaining ?? '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1CharacterIcon}
	<InGameCharacterIcon
		{dataItem}
		{style}
		preview={defaultPreview}
		{player}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1CharacterRenderLeft}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction="left"
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1CharacterRenderRight}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction="right"
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1CharacterSeriesSymbol}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1CharacterSeriesSymbolUltimate}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		series={'ultimate'}
	/>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1ComboCounter}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 3
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.currentComboCount ?? '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1ActionStateName}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Landing (Special Fall)' : getActionStateName(_p1stateId)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1ActionStateId}
	<TextElement {style} {dataItem}>{defaultPreview ? 43 : (_p1stateId ?? '')}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1InvincibilityState}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Invincible' : _p1post?.hurtboxCollisionState === HURTBOX_INVULNERABLE ? 'Invincible' : _p1post?.hurtboxCollisionState === HURTBOX_INTANGIBLE ? 'Intangible' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsAirborne}
	<TextElement {style} {dataItem}>{defaultPreview || _p1post?.isAirborne ? 'Airborne' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsShielding}
	<TextElement {style} {dataItem}>{defaultPreview || (_p1stateId != null && isShielding(_p1stateId)) ? 'Shielding' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsInHitstun}
	<TextElement {style} {dataItem}>{defaultPreview || (_p1stateId != null && isDamaged(_p1stateId)) ? 'Hitstun' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsInHitlag}
	<TextElement {style} {dataItem}>{defaultPreview || (_p1post?.hitlagRemaining ?? 0) > 0 ? 'Hitlag' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsOnLedge}
	<TextElement {style} {dataItem}>{defaultPreview || (_p1stateId != null && isOnLedge(_p1stateId)) ? 'Ledge' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsGrabbed}
	<TextElement {style} {dataItem}>{defaultPreview || (_p1stateId != null && isCaptured(_p1stateId)) ? 'Grabbed' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsInTech}
	<TextElement {style} {dataItem}>{defaultPreview || (_p1stateId != null && isInTech(_p1stateId)) ? 'Tech' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsWavedashLanding}
	<TextElement {style} {dataItem}>{defaultPreview || _p1stateId === STATE_LANDING_FALL_SPECIAL ? 'Special Land' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1IsAirdodging}
	<TextElement {style} {dataItem}>{defaultPreview || _p1stateId === STATE_AIR_DODGE ? 'Air Dodge' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1JumpsRemaining}
	<TextElement {style} {dataItem}>{defaultPreview ? 1 : (_p1post?.jumpsRemaining ?? 0)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1ShieldSize}
	<TextElement {style} {dataItem}>{defaultPreview ? 50 : Math.floor(_p1post?.shieldSize ?? 0)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1LCancel}
	<TextElement {style} {dataItem}>{defaultPreview ? '✓' : _p1post?.lCancelStatus === 1 ? '✓' : _p1post?.lCancelStatus === 2 ? '✗' : ''}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1StateCategory}
	<TextElement {style} {dataItem}>{defaultPreview ? 'Dashing' : getStateCategory(_p1stateId)}</TextElement>
{:else if dataItem?.elementId === CustomElement.InGamePlayer1Technique}
	{#key _p1technique}
		<TextElement {style} {dataItem}>{defaultPreview ? 'Wavedash' : (_p1technique ? (TECHNIQUE_LABELS[_p1technique] ?? _p1technique) : '')}</TextElement>
	{/key}
{/if}
