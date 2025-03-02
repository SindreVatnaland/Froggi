<script lang="ts">
	import {
		Command,
		CommandType,
		ObsCustomRequestOptions,
		ObsRequestOptions,
		OverlayRequestOptions,
		PayloadType,
	} from '$lib/models/types/commandTypes';
	import Select from '$lib/components/input/Select.svelte';
	import NumberInput from '$lib/components/input/NumberInput.svelte';
	import TextInput from '$lib/components/input/TextInput.svelte';
	import { LiveStatsScene } from '$lib/models/enum';

	export let command: Command;
	export let displayOverlayCommands: boolean = true;

	const handleRequestTypeChange = (e: CustomEvent<PayloadType>) => {
		command = { ...command, ...e.detail } as Command;
	};

	const handleCommandTypeChange = (e: CustomEvent<CommandType>) => {
		switch (e.detail) {
			case CommandType.Obs:
				command = {
					type: CommandType.Obs,
					requestType: 'SaveReplayBuffer',
					payload: {},
				} as Command;
				break;
			case CommandType.ObsCustom:
				command = {
					type: CommandType.ObsCustom,
					requestType: 'ToggleSceneItem',
					payload: {
						itemName: '',
					},
				} as Command;
				break;
				// case CommandType.Overlay:
				// 	command = {
				// 		type: CommandType.Overlay,
				// 		requestType: 'ChangeScene',
				// 		payload: {
				// 			liveStatsScene: LiveStatsScene.WaitingForDolphin,
				// 		},
				// 	} as Command;
				break;
		}
	};

	$: obsRequestOptions = Object.keys(ObsRequestOptions) as (keyof typeof ObsRequestOptions)[];

	$: obsCustomRequestOptions = Object.keys(
		ObsCustomRequestOptions,
	) as (keyof typeof ObsCustomRequestOptions)[];

	$: overlayRequestOptions = Object.keys(
		OverlayRequestOptions,
	) as (keyof typeof OverlayRequestOptions)[];

	$: payloadOptions = Object.keys(command?.payload ?? {}) as (keyof PayloadType)[];
</script>

<Select bind:selected={command.type} on:change={handleCommandTypeChange} label="Command type:">
	{#each displayOverlayCommands ? Object.keys(CommandType) : Object.keys(CommandType).filter((command) => command !== CommandType.Overlay) as scene}
		<option value={scene} selected={scene === CommandType.Obs}>
			{scene}
		</option>
	{/each}
</Select>
<Select on:change={handleRequestTypeChange} label="Execute:">
	{#if command.type === CommandType.Obs}
		{#each obsRequestOptions as option}
			<option
				value={{
					requestType: option,
					payload: ObsRequestOptions[option],
				}}
				selected={command.requestType === option}
			>
				{option}
			</option>
		{/each}
	{:else if command.type === CommandType.ObsCustom}
		{#each obsCustomRequestOptions as option}
			<option
				value={ObsCustomRequestOptions[option]}
				selected={command.requestType === option}
			>
				{option}
			</option>
		{/each}
	{:else if command.type === CommandType.Overlay}
		{#each overlayRequestOptions as option}
			<option
				value={{
					requestType: option,
					payload: OverlayRequestOptions[option],
				}}
				selected={command.requestType === option}
			>
				{option}
			</option>
		{/each}
	{/if}
</Select>
{#if command.payload}
	{#each payloadOptions as option}
		{#if option === 'liveStatsScene'}
			<Select bind:selected={command.payload[option]} label={option}>
				{#each Object.values(LiveStatsScene) as scene}
					<option value={scene} selected={scene === command.payload[option]}>
						{scene}
					</option>
				{/each}
			</Select>
		{:else if typeof command.payload?.[option] === 'string'}
			<TextInput bind:value={command.payload[option]} label={option} />
		{:else if typeof command.payload?.[option] === 'number' && option === 'inputVolumeMul'}
			<NumberInput bind:value={command.payload[option]} label={option} max={1} step={0.01} />
		{:else if typeof command.payload?.[option] === 'number'}
			<NumberInput bind:value={command.payload[option]} label={option} />
		{/if}
	{/each}
{/if}
