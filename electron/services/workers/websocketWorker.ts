import WebSocket, { WebSocketServer } from 'ws';
import { WEBSOCKET_PORT } from '../../../frontend/src/lib/models/const';
import type { MessageEvents } from '../../../frontend/src/lib/utils/customEventEmitter';
import { parentPort } from 'worker_threads';
import { newId } from '../../utils/functions';
import { NotificationType } from '../../../frontend/src/lib/models/enum';

const webSocketServer = new WebSocketServer({ port: WEBSOCKET_PORT, perMessageDeflate: true });
const connections: Connection[] = [];

// Local clients (OBS browser sources, same-network devices) get their own,
// roomier limit than remote viewers — too many still degrades the host.
const MAX_LOCAL_CLIENTS = 10;

interface Connection {
    socket: WebSocket,
    id: string,
}

webSocketServer.on('connection', (socket: WebSocket) => {
    if (connections.length >= MAX_LOCAL_CLIENTS) {
        console.log('Local WS rejected — connection limit reached');
        try {
            socket.send(JSON.stringify({ Notification: [`Froggi is at its local connection limit (${MAX_LOCAL_CLIENTS}).`, NotificationType.Warning] }));
        } catch { /* ignore */ }
        socket.close(1013, 'Connection limit');
        return;
    }
    console.log('New WebSocket Connection');
    const connection: Connection = { socket: socket, id: newId() };
    (socket as WebSocket & { isAlive?: boolean }).isAlive = true;
    socket.on('pong', () => { (socket as WebSocket & { isAlive?: boolean }).isAlive = true; });
    connections.push(connection);
    initSocket(socket);
    initData(connection.id);
    console.log("Websocket connections:", connections.length);

});

// Heartbeat: a device that drops without a clean close frame (sleep, network change)
// would otherwise leak a slot and fill the local cap. Ping each; terminate dead ones
// (terminate fires 'close' → the connection is spliced out).
setInterval(() => {
    for (const conn of [...connections]) {
        const s = conn.socket as WebSocket & { isAlive?: boolean };
        if (s.isAlive === false) { conn.socket.terminate(); continue; }
        s.isAlive = false;
        try { conn.socket.ping(); } catch { /* ignore */ }
    }
}, 30000);

const initSocket = (socket: WebSocket) => {
    socket.addEventListener("message", (message: WebSocket.MessageEvent) => {
        const parse = JSON.parse(message.data as string);
        parse["socketId"] = connections?.find(conn => conn.socket === message.target)?.id ?? "";
        parentPort?.postMessage([JSON.stringify(parse)]);
        initAuthentication(connections?.find(conn => conn.socket === message.target)?.id ?? "", parse["AuthorizationKey"] ?? "", parse["MatchId"] ?? "");
    });

    socket.addEventListener('close', () => {
        const connection: Connection | undefined = connections.find(conn => conn.socket === socket);
        if (!connection) return;
        const index = connections.indexOf(connection)
        if (index > -1) {
            connections.splice(index, 1);
            console.log('Connection removed');
            console.log("Websocket connections:", connections.length);
        }
        console.log('WebSocket closed:', connections.length);
    });
}

parentPort?.on("message", <J extends keyof MessageEvents>(message: string) => {
    const parse = JSON.parse(message);
    const socketId = parse["socketId"];
    delete parse["socketId"];
    for (const [topic, payload] of Object.entries(parse) as [topic: J, payload: Parameters<MessageEvents[J]>]) {
        if (!socketId) {
            const message = JSON.stringify({
                [`${topic}`]: payload,
            });
            connections.forEach((conn: any) => {
                conn.socket.send(
                    message,
                );
            });
        } else {
            connections.find(conn => conn.id === socketId)?.socket.send(message);
        }
    }
})

const initData = (socketId: string) => {
    parentPort?.postMessage(JSON.stringify({
        ["InitData"]: socketId,
    }));
}

const initAuthentication = (socketId: string, authKey: string, matchId: string) => {
    parentPort?.postMessage(JSON.stringify({
        ["InitAuthentication"]: [socketId, authKey, matchId],
    }));
}