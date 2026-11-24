import type { MessageEvents } from './customEventEmitter';

// Browser-safe (the client uses it to tell a blocked command apart): which topics a client may send
// WITHOUT the host password (Settings → Authorization). Enforced by websocketAuthentication.ts.

// Media / Highlight Replay elements in OBS browser sources have no host password: HighlightReelShown only starts
// a key's shared clock once; ReplayListRequest gets a list's replay fields only (file ids + frames);
// HighlightFramesRequest reads frames of a registered .slp id (never a path).
const unauthorized: (keyof MessageEvents)[] = ["InitData", "InitElectron", "InitAuthentication", "Ping", "HighlightReelShown", "ReplayListRequest", "HighlightFramesRequest"];

/** Stage-striking actions a player's phone may send without the host password — but only with the
 *  player's link token as the last argument; setService checks the token against the player/turn. */
export const STRIKE_PLAYER_TOPICS: (keyof MessageEvents)[] = [
    "StrikePlayerConnect", "RpsChoice", "RpsWinnerOrder", "StrikeStage", "PickStage", "SelectCharacter",
    "StrikeAgreeRequest", "StrikeAgreeResponse", "StrikeSetName",
];

/** May an unauthenticated client send this? (connection basics, or a striking action carrying a token) */
export const isAllowedUnauthenticated = (topic: string, value: unknown): boolean => {
    if (unauthorized.includes(topic as keyof MessageEvents)) return true;
    if (!STRIKE_PLAYER_TOPICS.includes(topic as keyof MessageEvents)) return false;
    const args = Array.isArray(value) ? value : [];
    return typeof args.at(-1) === 'string' && (args.at(-1) as string).length >= 16;
};

