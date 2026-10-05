import { MessageEvents, TypedEmitter } from "./customEventEmitter";
import { Worker } from 'worker_threads';

const unauthorized: (keyof MessageEvents)[] = ["InitData", "InitElectron", "InitAuthentication", "Ping"];

/** Stage-striking actions a player's phone may send without the host password — but only with the
 *  player's link token as the last argument; setService checks the token against the player/turn. */
export const STRIKE_PLAYER_TOPICS: (keyof MessageEvents)[] = [
    "StrikePlayerConnect", "RpsChoice", "RpsWinnerOrder", "StrikeStage", "PickStage", "SelectCharacter",
    "StrikeAgreeRequest", "StrikeAgreeResponse",
];

/** May an unauthenticated client send this? (connection basics, or a striking action carrying a token) */
export const isAllowedUnauthenticated = (topic: string, value: unknown): boolean => {
    if (unauthorized.includes(topic as keyof MessageEvents)) return true;
    if (!STRIKE_PLAYER_TOPICS.includes(topic as keyof MessageEvents)) return false;
    const args = Array.isArray(value) ? value : [];
    return typeof args.at(-1) === 'string' && (args.at(-1) as string).length >= 16;
};

export let sendAuthenticatedMessage = <K extends keyof MessageEvents>(
    _socketId: string,
    incomingKey: string = "",
    authorizationKey: string = "",
    incomingMatchId: string = "",
    currentMatchId: string | null = null,
    gameMode: string = "local",
    emitter: TypedEmitter,
    _webSocketWorker: Worker,
    topic: K,
    value: Parameters<MessageEvents[K]>,
) => {
    const matchIdValid = Boolean(incomingMatchId && currentMatchId && incomingMatchId === currentMatchId && gameMode === 'ranked');
    // A password MUST be set on the host for remote commands to be allowed — an
    // empty host key no longer means "open" (that was unsafe for public sharing).
    const hasHostKey = Boolean(authorizationKey);
    const keyValid = hasHostKey && incomingKey === authorizationKey;
    const isAuthorized = matchIdValid || keyValid;
    if (isAuthorized || isAllowedUnauthenticated(topic, value)) {
        emitter.emit(topic, ...value as any);
    }
    // Unauthorized commands are dropped silently — no popup on connect. The client's
    // Authorize=false state + Settings → Authorization explain why; active command
    // feedback is handled client-side.
}