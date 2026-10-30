import type { FlowTrigger } from '../models/types/flow';

/**
 * What every {{key}} means — shown on the editor's key chips and given to the AI assistant
 * (test/unit/flowKeys.test.ts fails when a trigger key has no description). Per trigger, because the same
 * name can mean something slightly different (e.g. `player`).
 */
const PLAYER_SIDE = 'Player 1 or 2 — whose side (doubles: Player 1 = team 1).';
const PLAYER_NAME = 'Display name, else connect code, else "Port N".';
const CURRENT = 'true when it is the player using this computer (Settings → current player).';

export const KEY_INFO: Record<FlowTrigger['type'], Record<string, string>> = {
	sceneChange: { scene: 'The scene switched to: waitingForDolphin, menu, inGame, postGame, postSet, rankChange or strikePhase.' },
	controllerCombo: { buttons: 'The buttons held, e.g. "L+R+A".' },
	gameStart: {
		stage: 'Stage name, e.g. "Battlefield".',
		mode: 'Slippi mode: local (offline), direct, teams, unranked or ranked.',
		isTeams: 'true in a doubles (teams) game.',
		bestOf: 'Best of 3 or 5 — from the set.',
		gameNumber: 'Game number in the set (1, 2, 3…).',
		newSet: 'true when this game starts a new set (different match or players, or the last set ended).',
		...Object.fromEntries(
			[1, 2, 3, 4].flatMap((n) => [
				[`players.${n}.name`, `Player in slot ${n}: ${PLAYER_NAME}`],
				[`players.${n}.character`, `Slot ${n}'s character name, e.g. "Fox".`],
				[`players.${n}.connectCode`, `Slot ${n}'s connect code (online), e.g. "MANGO#123".`],
				[`players.${n}.port`, `Slot ${n}'s controller port (1–4).`],
				[`players.${n}.team`, `Slot ${n}'s team colour in doubles (red, blue, green).`],
			]),
		),
		'rules.stocks': 'Stocks each player starts with.',
		'rules.timerMinutes': 'Game timer in minutes.',
		'rules.friendlyFire': 'true when teammates can hit each other.',
	},
	gameEnd: {
		stage: 'Stage name, e.g. "Battlefield".',
		method: 'How it ended: GAME (stocks), TIME, NO_CONTEST (quit / LRAS) …',
		score: 'The set score after this game, e.g. "1-0".',
	},
	damageTaken: {
		player: PLAYER_SIDE + ' — who took the damage.',
		playerName: 'Who took the damage: ' + PLAYER_NAME,
		isCurrentPlayer: CURRENT,
		damage: 'Percent taken in this hit, e.g. 14.2.',
		percent: 'Their percent after the hit.',
	},
	stockLost: {
		player: PLAYER_SIDE + ' — who lost the stock.',
		playerName: 'Who lost the stock: ' + PLAYER_NAME,
		isCurrentPlayer: CURRENT,
		stocksLeft: 'Stocks they have left.',
	},
	sequence: {
		kind: '"punish" (every hit until the opponent escapes) or "combo" (hits while in hitstun).',
		player: 'The attacker\'s slot (1–4; doubles: 1 + 3 = team 1, 2 + 4 = team 2).',
		playerName: 'The attacker: ' + PLAYER_NAME,
		character: 'The attacker\'s character name, e.g. "Fox".',
		isCurrentPlayer: 'true when the attacker is the player using this computer.',
		victim: 'The victim\'s slot (1–4).',
		victimName: 'The victim: ' + PLAYER_NAME,
		victimCharacter: 'The victim\'s character name, e.g. "Marth".',
		hits: 'Number of hits (moves) in the sequence.',
		damage: 'Percent dealt in the sequence.',
		startPercent: 'The victim\'s percent when it started.',
		endPercent: 'The victim\'s percent at the end (their percent at death if it killed).',
		seconds: 'Length from the first hit to the end (the kill or the last hit).',
		hitsPerSecond: 'Hits per second — how fast it was.',
		didKill: 'true when the sequence took a stock.',
		gameEnding: 'true when it took the last stock (won the game).',
		teamKills: 'KOs by the attacker\'s team in the last 5 s, this one included (2+ = a doubles multi-kill).',
		openingType: 'How it started (punishes): neutral-win, counter-attack or trade.',
		moves: 'The moves in order, e.g. "Nair, Uthrow, Uair".',
		lastMove: 'The last move, e.g. "Uair".',
		offstage: 'true when the victim was off stage at the last hit (an edgeguard).',
		victimStocksLeft: 'The victim\'s stocks after the sequence.',
		winChanceBefore: 'The attacker side\'s chance to win the game before it, in percent.',
		winChanceAfter: 'The attacker side\'s chance to win the game after it, in percent.',
		winChanceSwing: 'winChanceAfter − winChanceBefore (percent points).',
		setChanceSwing: 'How much the attacker side\'s chance to win the set changed (percent points).',
		startTime: 'When it started — wall clock, ms (Mark highlight uses it).',
		endTime: 'When it ended — wall clock, ms.',
		startFrame: 'Game frame of the first hit (60 per second; saved with highlights).',
		endFrame: 'Game frame of the end.',
	},
	rankChange: {
		playerName: 'Whose rank changed: ' + PLAYER_NAME,
		connectCode: 'Their connect code.',
		rank: 'Rank after the game, e.g. "Platinum 1".',
		rating: 'Rating after the game.',
		ratingChange: 'Rating gained (+) or lost (−).',
		rankChanged: 'true when the rank tier changed (not just the rating).',
		...Object.fromEntries(
			['before', 'after'].flatMap((side) => [
				[`${side}.rank`, `Rank ${side} the game.`],
				[`${side}.rating`, `Rating ${side} the game.`],
				[`${side}.wins`, `Ranked wins ${side} the game.`],
				[`${side}.losses`, `Ranked losses ${side} the game.`],
				[`${side}.leaderboardPlacement`, `Leaderboard place ${side} the game (empty if none).`],
			]),
		),
	},
	setStart: {
		p1Name: 'Player (team) 1\'s name as entered on the Dashboard.',
		p2Name: 'Player (team) 2\'s name.',
		bestOf: 'Best of 3 or 5.',
		ruleset: 'singles or doubles.',
	},
	dolphinConnection: { connected: 'true when Dolphin connected, false when it disconnected.' },
	strikeAction: {
		event: 'What happened: rps, order, strike, ban, pick, character, agreement — or change (anything else: a game reported, a set starting…).',
		player: 'Who acted: p1 or p2 (for "change": whose turn it is, if anyone) — the same names as {{state.strike…}}.',
		playerName: 'Who acted, by name.',
		phase: 'The striking phase now: charSelect, rps, rpsResult, striking, stageBan, stagePick, charPick, playing, setComplete…',
		stage: 'The stage struck, banned or picked (name), else empty.',
		character: 'The character picked (name), else empty.',
		rps: 'The rock-paper-scissors hand chosen, else empty.',
	},
	obsReplaySaved: {
		path: 'Full path of the saved replay file.',
		fileName: 'Its file name.',
	},
};

/** Keys every flow can have besides trigger keys. */
export const RUN_KEY_INFO: Record<string, string> = {
	error: 'Why the card before failed (only behind an Error output).',
	highlight: 'The id of the highlight Mark highlight just marked — store it in a list; Set media / Set replay list show it.',
	highlightSeconds: 'How long the marked moment is (seconds) — a Timer can wait that long while it plays.',
	highlightGame: 'Which game the moment is from (an id) — e.g. keep at most 3 per game.',
	clipPath: 'The replay-buffer file OBS saved that holds the highlight.',
	clipStart: 'Where the highlight starts in that file (seconds from its start).',
	clipEnd: 'Where the highlight ends in that file (seconds from its start).',
	clipSeconds: 'How long the clip plays (seconds).',
};

/** What a key means where it is used: from the flow's triggers, a run key, a list item field, a list count. */
export function keyInfo(key: string, triggerTypes: FlowTrigger['type'][]): string | null {
	for (const t of triggerTypes) if (KEY_INFO[t]?.[key]) return KEY_INFO[t][key];
	if (RUN_KEY_INFO[key]) return RUN_KEY_INFO[key];
	if (key.startsWith('item.')) return `Field "${key.slice(5)}" of one list item.`;
	if (key.endsWith('.count')) return `How many items list "${key.slice(0, -6)}" has.`;
	return null;
}

/** All key meanings as text, per trigger — for the AI assistant. */
export const keyInfoText = () =>
	Object.entries(KEY_INFO)
		.map(([t, keys]) => `${t}: ${Object.entries(keys).filter(([k]) => !/^(players\.[234]|before|after)\./.test(k)).map(([k, v]) => `${k} = ${v}`).join(' | ')}`)
		.join('\n');

/** One plain sentence per When card: what makes it fire. */
export const FIRES_WHEN: Record<FlowTrigger['type'], string> = {
	sceneChange: "Froggi's scene changes (or only when it changes to the scene you pick).",
	controllerCombo: 'The buttons are held together for half a second (Windows: Froggi reads controllers from Dolphin).',
	gameStart: 'A game starts.',
	gameEnd: 'A game ends.',
	damageTaken: 'A player takes damage (at least the amount you set).',
	stockLost: 'A player loses a stock (self-destructs included).',
	sequence: 'A punish or combo ends — live, during the game.',
	rankChange: 'A ranked player\'s new rank arrives after a ranked game.',
	setStart: 'A set is started on the Dashboard.',
	dolphinConnection: 'Dolphin connects or disconnects.',
	strikeAction: 'Something happens in stage striking — a player\'s choice, or any change (game reported, set start…).',
	obsReplaySaved: 'OBS saves its replay buffer to a file.',
};

/** One row of an output schema: the key, its kind, what it means, an example. */
export interface SchemaRow {
	key: string;
	type: string;
	meaning: string;
	example: unknown;
}

const typeOf = (v: unknown) => (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'true / false' : v === null || v === undefined ? 'value or empty' : 'text');

/** A When card's output: every key it hands on, with type, meaning and example (examples from `samples`). */
/** Examples that differ per trigger (the shared sample has one value per key name). */
const TRIGGER_SAMPLES: Partial<Record<FlowTrigger['type'], Record<string, unknown>>> = { strikeAction: { player: 'p1' } };

export function triggerSchema(type: FlowTrigger['type'], samples: Record<string, unknown>): SchemaRow[] {
	const own = { ...samples, ...TRIGGER_SAMPLES[type] };
	return Object.entries(KEY_INFO[type] ?? {}).map(([key, meaning]) => ({ key, meaning, example: own[key] ?? null, type: typeOf(own[key]) }));
}

/** What an action card hands to the cards after it (none for most). */
export function actionSchema(action: { type: string; key?: string }, itemFields: string[] = []): SchemaRow[] {
	if (action.type === 'markHighlight')
		return [
			{ key: 'highlight', type: 'text', meaning: RUN_KEY_INFO.highlight, example: 'h-1a2b3c4d' },
			{ key: 'highlightSeconds', type: 'number', meaning: RUN_KEY_INFO.highlightSeconds, example: 8.5 },
			{ key: 'highlightGame', type: 'text', meaning: RUN_KEY_INFO.highlightGame, example: '1791753170000' },
		];
	if (action.type === 'obsSaveReplay')
		return [
			{ key: 'clipPath', type: 'text', meaning: RUN_KEY_INFO.clipPath, example: 'C:/Videos/Replay 2026-10-30.mp4' },
			{ key: 'clipStart', type: 'number', meaning: RUN_KEY_INFO.clipStart, example: 21.5 },
			{ key: 'clipEnd', type: 'number', meaning: RUN_KEY_INFO.clipEnd, example: 30 },
			{ key: 'clipSeconds', type: 'number', meaning: RUN_KEY_INFO.clipSeconds, example: 8.5 },
		];
	if (action.type === 'calculate' && action.key) return [{ key: action.key, type: 'number', meaning: 'The formula\'s result — stays until a Clear values card clears it.', example: 42 }];
	if (action.type === 'list' && action.key) {
		const k = action.key;
		const field = itemFields.find((f) => f !== 'added') ?? 'score';
		return [
			{ key: `${k}.count`, type: 'number', meaning: 'How many items the list has.', example: 5 },
			...itemFields.map((f) => ({ key: `${k}.1.${f}`, type: f === 'added' ? 'number (ms)' : 'value', meaning: `Field "${f}" of the 1st item (2, 3… for the others).`, example: f === 'added' ? 1791753170000 : null })),
			{ key: `${k}.first.${field}`, type: 'value', meaning: 'The first item\'s field.', example: null },
			{ key: `${k}.last.${field}`, type: 'value', meaning: 'The last item\'s field.', example: null },
			{ key: `${k}[0].${field}`, type: 'value', meaning: 'By position from 0; [-1] = the last, [-2] = the one before.', example: null },
		];
	}
	return [];
}

/** {{state.strike…}} — what every field means (`<stage>` = fountainOfDreams, battlefield, finalDestination, dreamLand, yoshisStory, pokemonStadium; `<n>` = 1, 2, 3…). */
export const STRIKE_STATE_INFO: Record<string, string> = {
	'state.strike.phase': 'Where the set is: charSelect, rps, rpsResult, striking, stageBan, stagePick, charLock, charPick, playing, setComplete.',
	'state.strike.gameNumber': 'The game being played or set up (1, 2, 3…).',
	'state.strike.bestOf': 'Best of 3 or 5.',
	'state.strike.score.p1': 'Games Player (team) 1 won.',
	'state.strike.score.p2': 'Games Player (team) 2 won.',
	'state.strike.turn.player': 'Who must act now: p1, p2, or empty (both / nobody).',
	'state.strike.turn.name': 'Their name.',
	'state.strike.turn.action': 'What they must do: pickCharacter, rps, chooseStrikeOrder, strike, ban, pick, answerAgreement, play, done.',
	'state.strike.p1.name': 'Player (team) 1\'s name (p2.… is the same for Player 2).',
	'state.strike.p1.character': 'Their character name, e.g. "Falco".',
	'state.strike.p1.partnerCharacter': 'Doubles: their partner\'s character.',
	'state.strike.p1.rps': 'Their rock-paper-scissors hand.',
	'state.strike.p1.dsr': 'Stages they may not pick (they already won there), joined.',
	'state.strike.rpsWinner': 'Who won rock-paper-scissors: p1 / p2.',
	'state.strike.stage': 'The stage this game is played on (name), else empty.',
	'state.strike.history.<n>.order': 'The n-th strike / ban / pick of the set (1 = first).',
	'state.strike.history.<n>.game': 'In which game.',
	'state.strike.history.<n>.action': 'strike (game 1), ban (by the last winner) or pick.',
	'state.strike.history.<n>.stage': 'The stage (name).',
	'state.strike.history.<n>.stageKey': 'Its key in stages, e.g. dreamLand.',
	'state.strike.history.<n>.player': 'Who did it: p1 / p2 (empty: game 1\'s stage left over).',
	'state.strike.history.<n>.name': 'Their name.',
	'state.strike.stages.<stage>.name': 'Stage name.',
	'state.strike.stages.<stage>.status': 'available, locked, struck, banned, dsr (the picker already won there) or picked.',
	'state.strike.stages.<stage>.isAvailable': 'true when it can still be chosen.',
	'state.strike.stages.<stage>.isLocked': 'true when it is not usable now (e.g. a counterpick in game 1).',
	'state.strike.stages.<stage>.isStruck': 'true when struck in game 1.',
	'state.strike.stages.<stage>.isBanned': 'true when the last winner banned it for this game.',
	'state.strike.stages.<stage>.isDsr': 'true when the player picking may not choose it (they already won there).',
	'state.strike.stages.<stage>.isPicked': 'true when it is this game\'s stage.',
	'state.strike.stages.<stage>.by': 'Who struck / banned / picked it this game: p1 / p2.',
	'state.strike.stages.<stage>.byName': 'Their name.',
	'state.strike.stages.<stage>.order': 'Its place in this game\'s strikes / bans / pick (1 = first).',
};

/** The {{state.strike…}} schema rows, with examples from a sample state. */
export function strikeStateSchema(sample: Record<string, unknown>): SchemaRow[] {
	return Object.entries(STRIKE_STATE_INFO).map(([key, meaning]) => {
		const sampleKey = key.replace('<n>', '6').replace('<stage>', 'finalDestination');
		return { key, meaning, example: sample[sampleKey] ?? null, type: typeOf(sample[sampleKey]) };
	});
}

/** Rows → a nested sample object ({"a.b": 1} → { a: { b: 1 } }); `<n>` / `[0]` rows are left out. */
export function sampleObject(rows: SchemaRow[], strip = ''): Record<string, unknown> {
	const root: Record<string, unknown> = {};
	for (const r of rows) {
		if (/[<[]/.test(r.key)) continue;
		const parts = r.key.slice(strip.length).split('.');
		let node = root;
		parts.slice(0, -1).forEach((p) => (node = (node[p] ??= {}) as Record<string, unknown>));
		node[parts[parts.length - 1]] = r.example;
	}
	return root;
}
