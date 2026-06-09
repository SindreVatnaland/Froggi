/** Minigames that can be launched from a shared lobby. */
export type MinigameType = 'bingo' | 'ironman';

export interface LobbyPlayer {
	/** Stable per-session id assigned by the host. */
	id: string;
	name: string;
	connectCode?: string;
	isHost: boolean;
	/** True for the player on this machine. */
	isLocal: boolean;
	/** Whether this player currently has Dolphin connected (readiness indicator). */
	dolphinConnected: boolean;
}

export interface LobbyState {
	/** A lobby is open (hosting or joined). */
	active: boolean;
	/** This machine is the host. */
	isHost: boolean;
	players: LobbyPlayer[];
	/** Current cap (2 today; raised when minigames support more). */
	maxPlayers: number;
	/** Game the host has selected, or null while still choosing. */
	selectedGame: MinigameType | null;
	/** Host has posted a public invite to Discord (anyone with the link can join). */
	isPublic: boolean;
}

/**
 * Envelope for everything sent over the unified `/peer` socket.
 * `scope: 'lobby'` is handled by LobbyService; `'bingo'`/`'ironman'` are tunneled
 * through to the corresponding minigame service.
 */
export interface LobbyPeerMessage {
	scope: 'lobby' | MinigameType;
	type: string;
	version?: string;
	payload?: unknown;
}
