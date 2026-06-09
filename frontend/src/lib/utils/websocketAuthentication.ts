import { MessageEvents, TypedEmitter } from "./customEventEmitter";
import { Worker } from 'worker_threads';

const unauthorized: (keyof MessageEvents)[] = ["InitData", "InitElectron", "InitAuthentication", "Ping"];

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
    if (isAuthorized || unauthorized.includes(topic)) {
        emitter.emit(topic, ...value as any);
    }
    // Unauthorized commands are dropped silently — no popup on connect. The client's
    // Authorize=false state + Settings → Authorization explain why; active command
    // feedback is handled client-side.
}