import { NotificationType } from "../models/enum";
import { MessageEvents, TypedEmitter } from "./customEventEmitter";
import { Worker } from 'worker_threads';

const unauthorized: (keyof MessageEvents)[] = ["InitData", "InitElectron", "InitAuthentication", "Ping"];

export let sendAuthenticatedMessage = <K extends keyof MessageEvents>(
    socketId: string,
    incomingKey: string = "",
    authorizationKey: string = "",
    incomingMatchId: string = "",
    currentMatchId: string | null = null,
    gameMode: string = "local",
    emitter: TypedEmitter,
    webSocketWorker: Worker,
    topic: K,
    value: Parameters<MessageEvents[K]>,
) => {
    const matchIdValid = Boolean(incomingMatchId && currentMatchId && incomingMatchId === currentMatchId && gameMode === 'ranked');
    const keyValid = !authorizationKey || incomingKey === authorizationKey;
    const isAuthorized = matchIdValid || keyValid;
    if (isAuthorized) {
        emitter.emit(topic, ...value as any);
    } else if (unauthorized.includes(topic)) {
        emitter.emit(topic, ...value as any);
    } else {
        sendSocketMessage(webSocketWorker, socketId, "Notification", "Unauthorized - Update key in settings", NotificationType.Danger);
    }
}

const sendSocketMessage = <J extends keyof MessageEvents>(worker: Worker, socketId: string, topic: J, ...payload: Parameters<MessageEvents[J]>) => {
    worker?.postMessage(
        JSON.stringify({
            [topic]: payload,
            socketId: socketId,
        }),
    );
}