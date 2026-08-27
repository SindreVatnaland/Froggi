import { z } from 'zod';
import { CommandType } from '../../../../frontend/src/lib/models/types/commandTypes';
import type { Command } from '../../../../frontend/src/lib/models/types/commandTypes';
import { newId } from '../../../utils/functions';

/**
 * Mirrors the curated OBS request whitelist the frontend's CommandSelect.svelte already
 * exposes (ObsRequestOptions / ObsCustomRequestOptions in commandTypes.ts) — deliberately
 * not the full untyped obs-websocket request surface.
 */
export const commandSchema = z.discriminatedUnion('requestType', [
	z.object({ requestType: z.literal('SetCurrentProgramScene'), sceneName: z.string() }),
	z.object({ requestType: z.literal('SaveReplayBuffer') }),
	z.object({ requestType: z.literal('SetInputVolume'), inputName: z.string(), inputVolumeMul: z.number() }),
	z.object({ requestType: z.literal('ToggleSceneItem'), itemName: z.string() }),
]);

export type CommandInput = z.infer<typeof commandSchema>;

export function toCommand(input: CommandInput): Command {
	const { requestType, ...payload } = input;
	return {
		id: newId(),
		type: requestType === 'ToggleSceneItem' ? CommandType.ObsCustom : CommandType.Obs,
		requestType,
		payload: Object.keys(payload).length ? payload : undefined,
	} as Command;
}
