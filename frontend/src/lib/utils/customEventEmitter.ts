import {
	Obs,
	ObsAuth,
	ObsConnection,
} from '../models/types/obsTypes';
import {
	CommandType,
	Controller,
	ControllerCommand,
	SceneSwitchCommands,
	Command,
	RequestType,
	PayloadType,
} from '../models/types/commandTypes';
import type {
	AutoUpdaterStatus,
	BestOf,
	ConnectionState,
	InGameState,
	LiveStatsScene,
	NotificationType,
} from '../models/enum';
import type { PlayerController } from '../models/types/controller';
import type { AspectRatio, Overlay, OverlayEditor, Scene, Url } from '../models/types/overlay';
import type {
	CurrentPlayer,
	GameStartTypeExtended,
	GameStats,
	MatchStats,
	Player,
	SessionStats,
} from '../models/types/slippiData';
import type { RpsChoice, StrikeState } from '../models/types/stageStriking';
import type { FrameEntryType } from '@slippi/slippi-js';
import localEmitter from 'eventemitter2';
import { LogType } from 'vite';
import { Froggi } from '../models/types/froggiConfigTypes';
import type { WebhookProfile, RankChangeDiff } from '../models/types/webhook';
import type { TechniqueDetectedPayload, ActionStateHistoryPayload } from '../models/types/actionState';
import type { BingoSettings, BingoStatePayload, BingoChallengeUpdatePayload, BingoLobbyPayload, BingoSession, BingoSoloWinPayload, BingoLeaderboard, BingoVoteStates, BingoVoteActionType, BingoTileReplacedPayload, BingoTilesRollingPayload } from '../models/types/bingo';
import type { IronManSettings, IronManSession, IronManStatePayload, IronManLobbyPayload, IronManGameResultPayload, IronManLeaderboard } from '../models/types/ironman';
import type { LobbyState, MinigameType, LobbyPlayer } from '../models/types/lobby';

export interface MessageEvents {
	Authorize: (isAuthorized: boolean) => void;
	AutoUpdaterProgress: (progress: string | undefined) => void;
	AutoUpdaterStatus: (status: AutoUpdaterStatus) => void;
	AutoUpdaterVersion: (version: string | undefined) => void;
	AutoUpdaterCheckForUpdate: () => void;
	AutoUpdaterDownloadUpdate: () => void;
	AutoUpdaterDownloadUrl: (url: string) => void;
	AutoUpdaterInstall: () => void;
	BestOfUpdate: (bestOf: BestOf) => void;
	BetaOptIn: (optIn: boolean) => void;
	SetCloseAction: (action: 'minimize' | 'quit' | null) => void;
	SetCrashReportsEnabled: (enabled: boolean) => void;
	SetMcpReadEnabled: (enabled: boolean) => void;
	SetMcpWriteEnabled: (enabled: boolean) => void;
	SetMcpTailscaleEnabled: (enabled: boolean) => void;
	/** tailnet-only HTTPS URL for the MCP when Tailscale exposure is on; undefined when hidden/off */
	McpTailscaleUrl: (url: string | undefined) => void;
	SetAutoInjectEnabled: (enabled: boolean) => void;
	/** The persisted set of overlays toggled for injection (auto-injected on Dolphin connect). */
	AutoInjectOverlays: (overlayIds: string[]) => void;
	CurrentPlayer: (player: CurrentPlayer | undefined) => void;
	CurrentPlayers: (player: Player[] | undefined) => void;
	CurrentMatch: (matchStats: MatchStats) => void;
	CurrentOverlayEditor: (overlay: OverlayEditor) => void;
	DolphinConnectionState: (state: ConnectionState | undefined) => void;
	FroggiSettings: (settings: Froggi) => void;
	GameFrame: (frame: FrameEntryType | undefined | null) => void;
	GameScore: (score: number[]) => void;
	GameSettings: (settings: GameStartTypeExtended | undefined) => void;
	GameState: (state: InGameState | undefined) => void;
	InjectOverlay: (overlayId: string) => void;
	InjectedOverlays: (overlayId: string[]) => void;
	CloseInjectedOverlay: (overlayId: string) => void;
	CloseAllInjectedOverlays: (overlayId: string) => void;
	InitElectron: () => void;
	InitData: (socketId: string, authorizeKey: string | undefined) => void;
	ImportCustomFile: (overlayId: string, directory: string, fileName: string, acceptedExtensions: string[]) => void;
	ImportCustomFileComplete: (fileName: string) => void;
	Log: (message: string, severity: LogType) => void;
	MemoryControllerInput: (controllerInputs: PlayerController) => void;
	Notification: (message: string, type: NotificationType, timeout?: number) => void;
	OpenUrl: (url: string) => void;
	PlayersUpdate: (players: Player[]) => void; // Here
	PostGameStats: (stats: GameStats | undefined) => void;
	RecentGames: (games: GameStats[]) => void;
	RecentGamesDelete: (gameIndex: number) => void; // Here
	RecentGamesReset: () => void; // Here
	RecentGamesMock: (game: GameStats, index: number) => void; // Here
	RecentRankedSets: (games: GameStats[]) => void;
	RemoveDuplicateItems: () => void;
	RemoveDuplicateItemsByOverlayId: (overlayId: string) => void;
	LiveStatsSceneChange: (scene: LiveStatsScene) => void;
	LayerDelete: (overlayId: string, statsScene: LiveStatsScene, sceneId: number, LayerDelete: number) => void;
	LayerDuplicate: (overlayId: string, liveStatsScene: LiveStatsScene, layerIndex: number) => void;
	LayerNew: (overlayId: string, statsScene: LiveStatsScene, sceneId: number, layerIndex: number) => void;
	LayerMove: (overlayId: string, statsScene: LiveStatsScene, sceneId: number, layerIndex: number, relativeSwap: number) => void;
	Url: (url: Url) => void;
	LogsSave: () => void;
	LogsCopy: () => void;
	Obs: (obs: Obs | undefined) => void;
	ObsConnection: (connection: ObsConnection) => void;
	ObsManualConnect: (auth: ObsAuth) => void;
	ObsWebsocketEnable: () => void;
	ObsProcessRefresh: () => void;
	ObsProcessStatus: (status: { running: boolean; websocketEnabled?: boolean; port?: string; password?: string }) => void;
	ObsCreateBrowserSource: (url: string, inputName: string, aspectRatio: AspectRatio) => void;
	Overlays: (overlays: Record<string, Overlay> | undefined) => void;
	OverlayCreate: (aspectRatio: AspectRatio) => void;
	OverlayDelete: (overlayId: string) => void;
	OverlayDownload: (overlayId: string) => void;
	OverlayDuplicate: (overlayId: string) => void;
	OverlayUpdate: (overlay: Overlay) => void;
	OverlayUpload: () => void;
	SceneItemDuplicate: (overlayId: string, liveStatsScene: LiveStatsScene, layerIndex: number, prevItemId: string) => void;
	SceneUpdate: (overlayId: string, liveStatsScene: LiveStatsScene, scene: Scene) => void;
	SelectedItemChange: (itemId: string) => void;
	SessionStats: (session: SessionStats | undefined) => void;
	SimulateGameStart: () => void;
	SimulateGameEnd: () => void;

	AuthorizationKey: (key: string) => void;
	AuthorizationKeyUpdate: (key: string) => void;
	InitAuthentication: (socketId: string, authKey: string, matchId?: string) => void;
	RecentGamesReorder: (fromIndex: number, toIndex: number) => void;

	CleanupCustomResources: () => void;
	CleanupCustomResourcesByOverlayId: (overlayId: string) => void;
	ControllerCommand: (command: Controller) => void;
	ControllerCommandAdd: (command: ControllerCommand) => void;
	ControllerCommandDelete: (commandId: string) => void;
	ControllerCommandStateToggle: () => void;
	SceneSwitchCommands: (options: SceneSwitchCommands) => void;
	SceneSwitchCommandAdd: (scene: LiveStatsScene, options: Command) => void;
	SceneSwitchCommandDelete: (scene: LiveStatsScene, commandId: string) => void;
	SceneSwitchCommandStateToggle: () => void;
	DeleteCommand: (commandId: string) => void;
	ExecuteCommand: (
		type: CommandType,
		requestType: RequestType,
		requestData?: PayloadType,
	) => void;

	TestAnimationTrigger: () => void;
	TestCustomAnimationTrigger: () => void;
	TestVisibilityTrigger: () => void;


	Ping: () => void;

	RemoteAccessStatus: (url: string | undefined, provider: 'tailscale' | 'ngrok' | undefined) => void;
	RemoteAccessRefresh: () => void;
	TailscaleFunnel: (enable: boolean) => void;
	TailscaleLogin: () => void;
	TailscaleStatus: (status: { installed: boolean; authenticated: boolean; funnelActive: boolean }) => void;
	NgrokStatus: (status: { installed: boolean; authenticated: boolean; running: boolean; url?: string; installMethod?: string }) => void;
	NgrokStart: () => void;
	NgrokStop: () => void;
	NgrokRestart: () => void;
	NgrokSetAuthtoken: (token: string) => void;
	NgrokInstall: () => void;

	StrikeState: (state: StrikeState | undefined) => void;
	StrikeStateUpdate: (state: StrikeState | undefined) => void;
	StrikePlayerConnect: (player: 1 | 2) => void;
	StartSet: (p1Name: string, p2Name: string, bestOf: 3 | 5) => void;
	RpsChoice: (player: 1 | 2, choice: RpsChoice) => void;
	RpsWinnerOrder: (firstStriker: 1 | 2) => void;
	StrikeStage: (stageId: number) => void;
	PickStage: (stageId: number) => void;
	SelectCharacter: (player: 1 | 2, charId: number) => void;
	ReportWinner: (player: 1 | 2) => void;
	UndoLastGame: () => void;
	MarkWarmup: () => void;
	ResetSet: () => void;

	EnableReplayBuffer: () => void;

	OBSPreview: (imageData: string) => void;
	OBSPreviewToggle: (enabled: boolean) => void;

	WebhookProfiles: (profiles: WebhookProfile[]) => void;
	SetWebhookProfile: (profile: WebhookProfile) => void;
	DeleteWebhookProfile: (id: string) => void;
	WebhooksEnabled: (enabled: boolean) => void;
	SetWebhooksEnabled: (enabled: boolean) => void;
	TestWebhookProfile: (profileId: string) => void;
	RankChange: (diff: RankChangeDiff) => void;

	TechniqueDetected: (data: TechniqueDetectedPayload) => void;
	ActionStateHistory: (data: ActionStateHistoryPayload) => void;

	BingoStartLobby: () => void;
	BingoEndToLobby: () => void;
	BingoUpdateLobbySettings: (settings: BingoSettings) => void;
	StartBingo: (session: BingoSession) => void;
	BingoRestart: (session: BingoSession) => void;
	StopBingo: () => void;
	BingoLobbyState: (data: BingoLobbyPayload | null) => void;
	BingoState: (data: BingoStatePayload) => void;
	/**
	 * Slimmed live game state of another player, streamed over the peer connection
	 * so you can watch their game. Kept structural (no viewer-type import) so the
	 * Electron build doesn't pull in frontend-only deps.
	 */
	OpponentGameState: (
		data: {
			settings: { stageId?: number | null; isTeams?: boolean | null; startingTimerSeconds?: number | null; players: unknown[] } | null;
			frame: { frame?: number | null; players: Record<number, unknown>; items?: unknown[]; stageEvents?: unknown[] } | null;
			score: number[];
		} | null,
	) => void;
	BingoChallengeUpdates: (data: BingoChallengeUpdatePayload) => void;
	BingoRevert: (message: string) => void;
	BingoPeerConnect: (hostUrl: string) => void;
	BingoDevSimulate: (instanceId: string, player: 'local' | 'opponent') => void;
	BingoSoloWin: (data: BingoSoloWinPayload) => void;
	GetBingoLeaderboard: () => void;
	BingoLeaderboard: (data: BingoLeaderboard) => void;
	BingoVoteState: (state: BingoVoteStates | null) => void;
	BingoVoteActionExecuted: (data: { action: BingoVoteActionType; channel: string }) => void;
	BingoDevStartVote: () => void;
	BingoDevResolveVote: (action: BingoVoteActionType) => void;
	BingoDevSimulateOpponent: () => void;
	BingoTileReplaced: (data: BingoTileReplacedPayload) => void;
	BingoTilesRolling: (data: BingoTilesRollingPayload) => void;
	BingoTilesSwapped: (data: { indexA: number; indexB: number }) => void;
	BingoTilesShuffled: (data: { newOrder: number[] }) => void;
	GetTwitchUsername: () => void;
	TwitchUsername: (username: string) => void;
	SaveTwitchUsername: (username: string) => void;
	TwitchChatMessage: (data: { username: string; text: string; channel: string }) => void;

	StartIronMan: (session: IronManSession) => void;
	IronManStartLobby: (settings: IronManSettings) => void;
	IronManUpdateLobbySettings: (settings: IronManSettings) => void;
	StopIronMan: () => void;
	IronManState: (data: IronManStatePayload) => void;
	IronManLobbyState: (data: IronManLobbyPayload | null) => void;
	IronManGameResult: (data: IronManGameResultPayload) => void;
	IronManPeerConnect: (hostUrl: string) => void;
	IronManGuestRoster: (slots: IronManSession['localRoster']['slots']) => void;
	GetIronManLeaderboard: () => void;
	IronManLeaderboard: (data: IronManLeaderboard) => void;
	IronManChallengeWin: (data: { timeSeconds: number; rosterSize: number }) => void;
	/** Fires when a new game starts — carries the char the local player queued with */
	IronManCurrentChar: (data: { localCharId: number | null; oppCharId: number | null }) => void;

	// ── Unified lobby (game-agnostic host/join, then pick a minigame) ──────────
	StartLobby: () => void;
	PeerConnect: (hostUrl: string) => void;
	SelectMinigame: (game: MinigameType | null) => void;
	KickPlayer: (playerId: string) => void;
	LeaveLobby: () => void;
	/** Host launches the currently selected minigame for everyone in the lobby. */
	StartMinigame: () => void;
	/** Host toggles public hosting: when true, an invite is posted to the Discord channel (anyone can join). */
	SetLobbyPublic: (isPublic: boolean) => void;
	LobbyState: (state: LobbyState | null) => void;
	/** Internal (Electron-only): lobby hands a started game off to its minigame service. */
	LobbyStartMinigame: (data: { game: MinigameType; players: LobbyPlayer[] }) => void;
	/** Electron → renderer: a froggi://join/<code> deep link or Discord "Join" was activated.
	 *  The renderer routes it through the normal connect-code join (detects bingo/ironman). */
	JoinWithCode: (code: string) => void;
	/** Internal (Electron-only): a minigame-scoped peer message routed to its service. */
	LobbyPeerMessage: (msg: { scope: MinigameType; type: string; payload?: unknown; fromPlayerId: string | null }) => void;

	/** User-submitted feature request / bug report → developer Discord channel. */
	SubmitFeedback: (data: { type: 'feature' | 'bug'; message: string; includeLogs: boolean }) => void;
	/** Uncaught frontend error / unhandled rejection (desktop renderer or external device). */
	FrontendError: (data: { message: string; stack?: string; source?: string; kind: 'error' | 'unhandledrejection'; device: 'desktop' | 'browser' }) => void;
}

export class TypedEmitter extends localEmitter {
	// @ts-ignore
	private _untypedOn = this.on;
	// @ts-ignore
	private _untypedEmit = this.emit;
	public on = <K extends keyof MessageEvents>(event: K, listener: MessageEvents[K]): this =>
		this._untypedOn(event, listener);

	public emit = <K extends keyof MessageEvents>(
		event: K,
		...args: Parameters<MessageEvents[K]>
	): boolean => this._untypedEmit(event, ...args);
}
