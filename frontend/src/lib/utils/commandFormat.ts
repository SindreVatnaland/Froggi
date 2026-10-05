import type { CommandFormat } from '../models/types/commandTypes';

/**
 * Global / Singles / Doubles commands for one trigger: commands for the current format (doubles =
 * Slippi teams game) override the Global ones; without any, the Global ones run.
 */
export function pickForFormat<T extends { format?: CommandFormat }>(items: T[], isTeams: boolean): T[] {
	const current: CommandFormat = isTeams ? 'doubles' : 'singles';
	const specific = items.filter((i) => i.format === current);
	return specific.length ? specific : items.filter((i) => !i.format || i.format === 'any');
}
