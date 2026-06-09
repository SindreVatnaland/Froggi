#!/usr/bin/env node
/**
 * Extracts a window of a .slp replay into a compact JSON the viewer can play
 * without a browser-side parser.
 *
 *   node scripts/extract-demo-replay.js <input.slp> [startFrame] [count] [outPath]
 *
 * Only the fields GameStateRender reads are kept, floats rounded, so the asset
 * stays small (a ~1800-frame clip is a couple hundred KB). Output defaults to
 * frontend/static/demo/sample-game.json (served at /demo/sample-game.json).
 */
const fs = require('fs');
const path = require('path');
const { SlippiGame } = require('@slippi/slippi-js');

const input = process.argv[2];
const startFrame = process.argv[3] !== undefined ? Number(process.argv[3]) : 900;
const count = process.argv[4] !== undefined ? Number(process.argv[4]) : 1800;
const outPath =
	process.argv[5] ||
	path.join(__dirname, '..', 'frontend', 'static', 'demo', 'sample-game.json');

if (!input) {
	console.error('Usage: node scripts/extract-demo-replay.js <input.slp> [startFrame] [count] [outPath]');
	process.exit(1);
}

const r = (n) => (n == null ? n : Math.round(n * 1000) / 1000);

const game = new SlippiGame(input);
const settings = game.getSettings();
const frames = game.getFrames();

const minSettings = {
	stageId: settings.stageId,
	isTeams: settings.isTeams ?? false,
	players: settings.players.filter(Boolean).map((p) => ({
		playerIndex: p.playerIndex,
		characterId: p.characterId,
		teamId: p.teamId ?? null,
	})),
};

const minPost = (post) => ({
	playerIndex: post.playerIndex,
	internalCharacterId: post.internalCharacterId,
	actionStateId: post.actionStateId,
	actionStateCounter: r(post.actionStateCounter),
	positionX: r(post.positionX),
	positionY: r(post.positionY),
	facingDirection: post.facingDirection,
	shieldSize: r(post.shieldSize),
	lCancelStatus: post.lCancelStatus,
	hurtboxCollisionState: post.hurtboxCollisionState,
});
const minPre = (pre) => ({ joystickX: r(pre.joystickX), joystickY: r(pre.joystickY), trigger: r(pre.trigger) });
const minItem = (it) => ({
	typeId: it.typeId,
	state: it.state,
	facingDirection: it.facingDirection,
	velocityX: r(it.velocityX),
	velocityY: r(it.velocityY),
	positionX: r(it.positionX),
	positionY: r(it.positionY),
	missileType: it.missileType,
	turnipFace: it.turnipFace,
	chargePower: it.chargePower,
	owner: it.owner,
	spawnId: it.spawnId,
});

const out = [];
for (let f = startFrame; f < startFrame + count; f++) {
	const frame = frames[f];
	if (!frame) continue;
	const players = {};
	for (const [idx, p] of Object.entries(frame.players)) {
		if (!p || !p.post) continue;
		players[idx] = { post: minPost(p.post), pre: p.pre ? minPre(p.pre) : undefined };
	}
	const stageEvents = (frame.stageEvents ?? [])
		.filter((e) => e && e.platform != null && e.height != null)
		.map((e) => ({ platform: e.platform, height: r(e.height) }));
	out.push({ frame: frame.frame, players, items: (frame.items ?? []).map(minItem), stageEvents });
}

const payload = {
	source: path.basename(input),
	settings: minSettings,
	startFrame: out[0]?.frame ?? startFrame,
	frames: out,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload));
const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`Wrote ${out.length} frames (stage ${minSettings.stageId}) → ${outPath} (${kb} KB)`);
