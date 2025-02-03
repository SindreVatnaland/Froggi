import "reflect-metadata";
import { ElectronGamesStore } from '../../electron/services/store/storeGames';
import { StatsDisplay } from '../../electron/services/statsDisplay';
import { GameStartType, SlippiGame } from '@slippi/slippi-js';
import Store from "electron-store";
import { Api } from "../../electron/services/api";
import { ElectronSessionStore } from "../../electron/services/store/storeSession";
import { ElectronPlayersStore } from "../../electron/services/store/storePlayers";
import { ElectronCurrentPlayerStore } from "../../electron/services/store/storeCurrentPlayer";
import { GameStartMode, Player, SlippiLauncherSettings } from "../../frontend/src/lib/models/types/slippiData";
import { ElectronLiveStatsStore } from "../../electron/services/store/storeLiveStats";
import { ElectronSettingsStore } from "../../electron/services/store/storeSettings";
import log from 'electron-log';
import { BestOf, LiveStatsScene } from "../../frontend/src/lib/models/enum";
import { PacketCapture } from "../../electron/services/packetCapture";
import { SqliteOrm } from "../../electron/services/sqlite/initiSqlite";
import { SqliteCurrentPlayer } from "../../electron/services/sqlite/sqliteCurrentPlayer";
import { SqliteGame } from "../../electron/services/sqlite/sqliteGames";

jest.mock("../../electron/services/api")
jest.mock("../../electron/services/store/storeSession")
describe('ElectronGamesStore', () => {
    let connectCode: string;
    let electronGamesStore: ElectronGamesStore;
    let packetCapture: PacketCapture;
    let statsDisplay: StatsDisplay;
    let storeLiveStats: ElectronLiveStatsStore;
    let storeCurrentPlayer: ElectronCurrentPlayerStore
    let storePlayers: ElectronPlayersStore
    let storeSettings: ElectronSettingsStore;

    let sqlite: SqliteOrm;
    let sqliteGame: SqliteGame;

    let store: Store;

    interface TestFile {
        connectCode: string,
        file: string,
        expectedLength: number,
        expectedScore: number[],
        expectedMode: GameStartMode,
        expectedScene: LiveStatsScene,
        setBestOf: BestOf | undefined,
    }

    const rankedGameTest: TestFile[] = [
        { file: "offline-set-1/Replay 1 [L].slp", expectedLength: 0, expectedScore: [0, 1], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "offline-set-1/Replay 2 [T].slp", expectedLength: 0, expectedScore: [0, 1], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "offline-set-1/Replay 3 [I].slp", expectedLength: 0, expectedScore: [0, 1], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "offline-set-1/Replay 4 [L].slp", expectedLength: 0, expectedScore: [0, 2], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

        { file: "ranked-set-1/Replay 1 [W].slp", expectedLength: 1, expectedScore: [1, 0], expectedMode: "ranked", connectCode: "PRML#682", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "ranked-set-1/Replay 2 [L].slp", expectedLength: 2, expectedScore: [1, 1], expectedMode: "ranked", connectCode: "PRML#682", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "ranked-set-1/Replay 3 [W].slp", expectedLength: 3, expectedScore: [2, 1], expectedMode: "ranked", connectCode: "PRML#682", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

        { file: "unranked-set-1/Replay 1 [L].slp", expectedLength: 1, expectedScore: [1, 0], expectedMode: "unranked", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: BestOf.BestOf3 },
        { file: "unranked-set-1/Replay 2 [W].slp", expectedLength: 2, expectedScore: [1, 1], expectedMode: "unranked", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "unranked-set-1/Replay 3 [L].slp", expectedLength: 3, expectedScore: [2, 1], expectedMode: "unranked", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },
        { file: "unranked-set-1/Replay 4 [W].slp", expectedLength: 4, expectedScore: [2, 2], expectedMode: "unranked", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },
        { file: "unranked-set-1/Replay 5 [W].slp", expectedLength: 5, expectedScore: [2, 3], expectedMode: "unranked", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

        { file: "direct-set-1/Replay 1 [W].slp", expectedLength: 1, expectedScore: [0, 1], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: BestOf.BestOf5 },
        { file: "direct-set-1/Replay 2 [W].slp", expectedLength: 2, expectedScore: [0, 2], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "direct-set-1/Replay 3 [L].slp", expectedLength: 3, expectedScore: [1, 2], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "direct-set-1/Replay 4 [W].slp", expectedLength: 4, expectedScore: [1, 3], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

        { file: "direct-set-2/Replay 1 [W].slp", expectedLength: 1, expectedScore: [0, 1], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: BestOf.BestOf3 },
        { file: "direct-set-2/Replay 2 [W].slp", expectedLength: 2, expectedScore: [0, 2], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

        { file: "direct-set-3/Replay 1 [W].slp", expectedLength: 1, expectedScore: [0, 1], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: BestOf.BestOf5 },
        { file: "direct-set-3/Replay 2 [W].slp", expectedLength: 2, expectedScore: [0, 2], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "direct-set-3/Replay 3 [W].slp", expectedLength: 3, expectedScore: [0, 3], expectedMode: "direct", connectCode: "FLCD#507", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

        // TODO: Add local games with different port positions
    ]

    beforeAll(async () => {
        store = new Store({ cwd: `${__dirname}/..` })
        store.delete("player")
        store.delete("stats")

        const api: Api = new Api(log)
        const messageHandler: any = {
            sendMessage: () => { }
        };

        const eventEmitter: any = {
            on: () => { },
            emit: () => { }
        };

        const slpParser: any = {
            on: () => { }
        }
        const slpStream: any = {
            on: () => { }
        }
        const storeSession: ElectronSessionStore = new ElectronSessionStore(log, store, messageHandler, storeCurrentPlayer, storeSettings)

        sqlite = new SqliteOrm(`${__dirname}/..`, true, log)

        const sqliteCurrentPlayer = new SqliteCurrentPlayer(log, sqlite)
        sqliteGame = new SqliteGame(log, sqlite)

        storeSettings = new ElectronSettingsStore(log, "", store, eventEmitter);
        storeSettings.getCurrentPlayerConnectCode = () => connectCode
        storeSettings.getSlippiLauncherSettings = (): SlippiLauncherSettings => {
            return {
                rootSlpPath: `${__dirname}/../sample-games`,
                useMonthlySubfolders: true,
                appDataPath: undefined,
                isoPath: undefined,
                spectateSlpPath: undefined,
                useNetplayBeta: false,
            }
        }

        storeLiveStats = new ElectronLiveStatsStore(log, store, eventEmitter, messageHandler)
        storeLiveStats.setStatsScene = () => { }
        storeLiveStats.setStatsSceneTimeout = () => { }

        storeCurrentPlayer = new ElectronCurrentPlayerStore(log, store, storeLiveStats, storeSession, storeSettings, messageHandler, sqliteCurrentPlayer)
        storeCurrentPlayer.getCurrentPlayer = (): any => {
            return {
                connectCode: connectCode,
                rank: {

                }
            }
        };

        storePlayers = new ElectronPlayersStore(log, store, eventEmitter, messageHandler)

        electronGamesStore = new ElectronGamesStore(log, eventEmitter, messageHandler, storeLiveStats, sqliteGame, store);

        packetCapture = new PacketCapture(log, storeSettings)
        packetCapture.startPacketCapture = () => { }
        packetCapture.stopPacketCapture = () => { }

        statsDisplay = new StatsDisplay(log, eventEmitter, false, slpParser, slpStream, api, electronGamesStore, storeLiveStats, storePlayers, storeCurrentPlayer, storeSettings, messageHandler, packetCapture)
        statsDisplay["getCurrentPlayersWithRankStats"] = async (settings: GameStartType): Promise<Player[]> => (new Promise<Player[]>(resolve => {
            const players = settings.players.filter(player => player)
            resolve([{ connectCode: players.at(0)?.connectCode, rank: {}, playerIndex: players.at(0)?.playerIndex } as Player, { connectCode: players.at(1)?.connectCode, rank: {}, playerIndex: players.at(1)?.playerIndex } as Player])
        }));
    });

    beforeEach(async () => {
        await sqlite.clearAllTables();
    });

    afterEach(async () => {
        store.delete("player")
        store.delete("stats")
        await sqlite.clearAllTables();
    })

    afterAll(() => {
    });

    test('Is New Game The Same As Recent Game', async () => {
        for (const gameTest of rankedGameTest) {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            connectCode = gameTest.connectCode
            const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
            const currentGameEnd = game.getGameEnd();
            const currentGameSettings = game.getSettings();
            if (!currentGameEnd || !currentGameSettings) return;
            await statsDisplay.handleGameStart(currentGameSettings)
            await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
            const recentGames = await electronGamesStore.getRecentGames()
            const recentGame = recentGames?.at(-1)
            if (!recentGame) return;
            expect(currentGameSettings.matchInfo?.matchId).toStrictEqual(recentGame?.settings?.matchInfo?.matchId);
            expect(currentGameSettings.matchInfo?.gameNumber).toStrictEqual(recentGame?.settings?.matchInfo?.gameNumber);
        }
    })

    test('Is Post Game Scene As Expected', async () => {
        for (const gameTest of rankedGameTest) {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            storeLiveStats.setBestOf(gameTest.setBestOf)
            const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
            const currentGameEnd = game.getGameEnd();
            const currentGameSettings = game.getSettings();
            if (!currentGameEnd || !currentGameSettings) return;
            await statsDisplay.handleGameStart(currentGameSettings)
            await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
            const liveScene = storeLiveStats.getStatsScene();
            console.log(gameTest.file, liveScene)
            expect(liveScene).toStrictEqual(gameTest.expectedScene);
        }
    })

    // test('Set Score Is As Expected', async () => {
    //     for (const gameTest of rankedGameTest) {
    //         statsDisplay["getGameFiles"] = async (): Promise<string[]> => (new Promise<string[]>(resolve => {
    //             resolve([`${__dirname}/../sample-games/${gameTest.file}`])
    //         }));

    //         connectCode = gameTest.connectCode
    //         const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
    //         const currentGameEnd = game.getGameEnd();
    //         const currentGameSettings = game.getSettings();
    //         if (!currentGameEnd || !currentGameSettings) return;
    //         await statsDisplay.handleGameStart(currentGameSettings)
    //         await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
    //         const gameScore = electronGamesStore.getGameScore()
    //         expect(gameTest.expectedScore).toStrictEqual(gameScore)
    //     }
    // })

    // test('Is Returned Match Games Length As Expected', async () => {
    //     for (const gameTest of rankedGameTest) {
    //         statsDisplay["getGameFiles"] = async (): Promise<string[]> => (new Promise<string[]>(resolve => {
    //             resolve([`${__dirname}/../sample-games/${gameTest.file}`])
    //         }));

    //         connectCode = gameTest.connectCode
    //         const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
    //         const currentGameEnd = game.getGameEnd();
    //         const currentGameSettings = game.getSettings();
    //         if (!currentGameEnd || !currentGameSettings) return;
    //         await statsDisplay.handleGameStart(currentGameSettings)
    //         await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
    //         const recentGame = (await electronGamesStore.getRecentGames())?.at(0)
    //         const matchGames = sqliteGame.getGamesById(recentGame?.settings?.matchInfo.matchId ?? "")
    //         expect(matchGames).toHaveLength(gameTest.expectedLength);
    //     }
    // })

    // test('Game Mode As Expected', async () => {
    //     for (const gameTest of rankedGameTest) {
    //         statsDisplay["getGameFiles"] = async (): Promise<string[]> => (new Promise<string[]>(resolve => {
    //             resolve([`${__dirname}/../sample-games/${gameTest.file}`])
    //         }));

    //         connectCode = gameTest.connectCode
    //         const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
    //         const currentGameEnd = game.getGameEnd();
    //         const currentGameSettings = game.getSettings();
    //         if (!currentGameEnd || !currentGameSettings) return;
    //         await statsDisplay.handleGameStart(currentGameSettings)
    //         await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
    //         const recentGame = (await electronGamesStore.getRecentGames())?.at(0)
    //         expect(gameTest.expectedMode).toStrictEqual(recentGame?.settings?.matchInfo.mode)
    //     }
    // })
});