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
	Match,
	Player,
	SessionStats,
} from '../models/types/slippiData';
import type { FrameEntryType } from '@slippi/slippi-js';
import localEmitter from 'eventemitter2';
import { LogType } from 'vite';
import { Froggi } from '../models/types/froggiConfigTypes';

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
	CurrentPlayer: (player: CurrentPlayer | undefined) => void;
	CurrentPlayers: (player: Player[] | undefined) => void;
	CurrentMatch: (match: Match) => void;
	DolphinConnectionState: (state: ConnectionState | undefined) => void;
	FroggiSettings: (settings: Froggi) => void;
	GameFrame: (frame: FrameEntryType | undefined | null) => void;
	GameScore: (score: number[]) => void;
	GameSettings: (settings: GameStartTypeExtended | undefined) => void;
	GameState: (state: InGameState | undefined) => void;
	InjectOverlay: (overlayId: string) => void;
	CloseInjectedOverlay: (overlayId: string) => void;
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
	CurrentOverlayEditor: (overlay: OverlayEditor) => void;
	Obs: (obs: Obs | undefined) => void;
	ObsConnection: (connection: ObsConnection) => void;
	ObsManualConnect: (auth: ObsAuth) => void;
	Overlays: (overlays: Record<string, Overlay> | undefined) => void;
	OverlayCreate: (aspectRatio: AspectRatio) => void;
	OverlayDelete: (overlayId: string) => void;
	OverlayDownload: (overlayId: string) => void;
	OverlayDuplicate: (overlayId: string) => void;
	OverlayUpdate: (overlay: Overlay) => void;
	OverlayUpload: () => void;
	SaveLogs: () => void;
	SceneItemDuplicate: (overlayId: string, liveStatsScene: LiveStatsScene, layerIndex: number, prevItemId: string) => void;
	SceneUpdate: (overlayId: string, liveStatsScene: LiveStatsScene, scene: Scene) => void;
	SelectedItemChange: (itemId: string) => void;
	SessionStats: (session: SessionStats | undefined) => void;
	SimulateGameStart: () => void;
	SimulateGameEnd: () => void;

	AuthorizationKey: (key: string) => void;
	AuthorizationKeyUpdate: (key: string) => void;
	InitAuthentication: (socketId: string, authKey: string) => void;

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
