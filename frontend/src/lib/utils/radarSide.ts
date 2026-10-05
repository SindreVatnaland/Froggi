export type RadarSide = 'left' | 'right';

/**
 * Ultimate-style radar corner: it appears on the side the FIRST fighter went off stage and stays
 * there while anyone is still off stage (it never jumps, and only one radar shows). Returns null when
 * everyone is back on stage. `players` = per player: off stage? and which side of the stage centre.
 */
export function nextRadarSide(
	previous: RadarSide | null,
	players: { offStage: boolean; side: RadarSide | undefined }[],
): RadarSide | null {
	const off = players.filter((p) => p.offStage);
	if (!off.length) return null;
	if (previous) return previous;
	return off.find((p) => p.side)?.side ?? null;
}
