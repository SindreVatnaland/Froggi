import "reflect-metadata";
import { ElectronGamesStore } from '../../electron/services/store/storeGames';
import { StatsDisplay } from '../../electron/services/statsDisplay';
import { GameStartType, SlippiGame, SlpParser, SlpStream } from '@slippi/slippi-js';
import Store from "electron-store";
import { Api } from "../../electron/services/api";
import { ElectronSessionStore } from "../../electron/services/store/storeSession";
import { ElectronPlayersStore } from "../../electron/services/store/storePlayers";
import { ElectronCurrentPlayerStore } from "../../electron/services/store/storeCurrentPlayer";
import { CurrentPlayer, GameStartMode, GameStats, Player, RatingPrediction, SlippiLauncherSettings } from "../../frontend/src/lib/models/types/slippiData";
import { ElectronLiveStatsStore } from "../../electron/services/store/storeLiveStats";
import { ElectronSettingsStore } from "../../electron/services/store/storeSettings";
import log from 'electron-log';
import { BestOf, LiveStatsScene } from "../../frontend/src/lib/models/enum";
import { PacketCapture } from "../../electron/services/packetCapture";
import { SqliteOrm } from "../../electron/services/sqlite/initiSqlite";
import { SqliteCurrentPlayer } from "../../electron/services/sqlite/sqliteCurrentPlayer";
import { SqliteGame } from "../../electron/services/sqlite/sqliteGames";
import { indexOf } from "lodash";
import { MessageHandler } from "../../electron/services/messageHandler";
import { TypedEmitter } from "../../frontend/src/lib/utils/customEventEmitter";
import { predictNewRating } from "../../electron/utils/rankPrediction";
import { isTiedGame, getWinnerIndex } from '../../frontend/src/lib/utils/gamePredicates';


//jest.mock("../../electron/services/api")
jest.mock("../../electron/services/store/storeSession")
describe('ElectronGamesStore', () => {
    let connectCode: string;
    let electronGamesStore: ElectronGamesStore;
    let packetCapture: PacketCapture;
    let statsDisplay: StatsDisplay;
    let storeLiveStats: ElectronLiveStatsStore;
    let storeCurrentPlayer: ElectronCurrentPlayerStore;
    let storePlayers: ElectronPlayersStore;
    let storeSettings: ElectronSettingsStore;
    let storeSession: ElectronSessionStore;

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
        { file: "offline-set-1/Replay 1 [L].slp", expectedLength: 1, expectedScore: [0, 1], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "offline-set-1/Replay 2 [T].slp", expectedLength: 2, expectedScore: [0, 1], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "offline-set-1/Replay 3 [I].slp", expectedLength: 2, expectedScore: [0, 1], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostGame, setBestOf: undefined },
        { file: "offline-set-1/Replay 4 [L].slp", expectedLength: 3, expectedScore: [0, 2], expectedMode: "local", connectCode: "", expectedScene: LiveStatsScene.PostSet, setBestOf: undefined },

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

        // TODO: Write actual tests for the rating prediction

        const apiTest: Api = new Api(log)

        const player1 = await apiTest.getPlayerRankStats("HBOX#305")
        const player2 = await apiTest.getPlayerRankStats("BBB#445")

        const player1Prediction = {
            rank: {
                current: {
                    ratingMu: player1?.ratingMu,
                    ratingSigma: player1?.ratingSigma,
                }
            }
        } as Player

        const player2Prediction = {
            rank: {
                current: {
                    ratingMu: player2?.ratingMu,
                    ratingSigma: player2?.ratingSigma,
                }
            }
        } as Player

        const predictedRating: RatingPrediction = predictNewRating(player1Prediction, player2Prediction)

        console.log(predictedRating)

        console.log("Win:", predictedRating.win.ordinal.toFixed(1), `(+${(predictedRating.win.ordinal - (player1?.rating ?? 0)).toFixed(1)})`, " Loss: ", predictedRating.loss.ordinal.toFixed(1), `(${(predictedRating.loss.ordinal - (player1?.rating ?? 0)).toFixed(1)})`)

        const api: Api = new Api(log)
        const messageHandler = {
            sendMessage: () => { }
        } as unknown as MessageHandler;

        const eventEmitter = {
            on: () => { },
            emit: () => { }
        } as unknown as TypedEmitter;

        const slpParser = {
            on: () => { }
        } as unknown as SlpParser;
        const slpStream = {
            on: () => { }
        } as unknown as SlpStream;

        storeSession = new ElectronSessionStore(log, store, messageHandler, storeCurrentPlayer, storeSettings)

        sqlite = new SqliteOrm(`${__dirname}/..`, true, log)

        const sqliteCurrentPlayer = new SqliteCurrentPlayer(log, sqlite)

        storeSettings = new ElectronSettingsStore(log, "", store, eventEmitter as TypedEmitter);
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

        storeLiveStats = new ElectronLiveStatsStore(log, eventEmitter, messageHandler)
        storeLiveStats.setStatsSceneTimeout = (liveStatsScene) => { storeLiveStats.setStatsScene(liveStatsScene) }

        storePlayers = new ElectronPlayersStore(log, eventEmitter, messageHandler)

        storeCurrentPlayer = new ElectronCurrentPlayerStore(log, store, storeLiveStats, storeSession, storeSettings, messageHandler, sqliteCurrentPlayer, storePlayers)
        storeCurrentPlayer.getCurrentPlayer = async (): Promise<CurrentPlayer | undefined> => {
            return {
                connectCode: connectCode,
                rank: {}
            } as CurrentPlayer;
        };


        electronGamesStore = new ElectronGamesStore(log, eventEmitter, messageHandler, storeLiveStats, {} as SqliteGame, store);

        sqliteGame = new SqliteGame(log, electronGamesStore, messageHandler, sqlite)

        electronGamesStore["sqliteGame"] = sqliteGame

        packetCapture = new PacketCapture(log, storeSettings)
        packetCapture.startPacketCapture = () => { }
        packetCapture.stopPacketCapture = () => { }



        statsDisplay = new StatsDisplay(log, eventEmitter, slpParser, slpStream, api, electronGamesStore, storeLiveStats, storePlayers, storeCurrentPlayer, storeSettings, storeSession, messageHandler, packetCapture)
        statsDisplay["getCurrentPlayersWithRankStats"] = async (settings: GameStartType): Promise<Player[]> => (new Promise<Player[]>(resolve => {
            const players = settings.players.filter(player => player)
            resolve([{ connectCode: players.at(0)?.connectCode, rank: {}, playerIndex: players.at(0)?.playerIndex } as Player, { connectCode: players.at(1)?.connectCode, rank: {}, playerIndex: players.at(1)?.playerIndex } as Player])
        }));
    });

    beforeAll(async () => {
        store.delete("player")
        store.delete("stats")
        await sqlite.clearAllTables();
    });


    afterAll(() => {
    });

    test.each(rankedGameTest)(
        'Set Score Is As Expected for %s',
        async (gameTest) => {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            if (indexOf(rankedGameTest, gameTest) === 0) await sqlite.clearAllTables();

            connectCode = gameTest.connectCode
            const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
            const currentGameEnd = game.getGameEnd();
            const currentGameSettings = game.getSettings();
            if (!currentGameEnd || !currentGameSettings) return;
            await statsDisplay.handleGameStart(currentGameSettings)
            await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
            const gameScore = electronGamesStore.getGameScore()
            expect(gameScore).toStrictEqual(gameTest.expectedScore)
        },
        10000 // Set a timeout of 10 seconds for each test
    );

    test.each(rankedGameTest)(
        'Is New Game The Same As Recent Game for %s',
        async (gameTest) => {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            if (indexOf(rankedGameTest, gameTest) === 0) await sqlite.clearAllTables();

            connectCode = gameTest.connectCode
            const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
            const currentGameEnd = game.getGameEnd();
            const currentGameSettings = game.getSettings();
            if (!currentGameEnd || !currentGameSettings) return;
            await statsDisplay.handleGameStart(currentGameSettings)
            await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
            const recentGames = await electronGamesStore.getRecentGames()
            const recentGame = recentGames?.at(-1)
            if (currentGameSettings.matchInfo?.matchId) {
                expect(currentGameSettings.matchInfo?.matchId).toStrictEqual(recentGame?.settings?.matchInfo?.matchId);
            }
            expect(currentGameSettings.matchInfo?.gameNumber).toStrictEqual(recentGame?.settings?.matchInfo?.gameNumber);
        },
        10000 // Set a timeout of 10 seconds for each test
    );

    test.each(rankedGameTest)(
        'Is Returned Match Games Length As Expected for %s',
        async (gameTest) => {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            if (indexOf(rankedGameTest, gameTest) === 0) await sqlite.clearAllTables();

            connectCode = gameTest.connectCode
            const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
            const currentGameEnd = game.getGameEnd();
            const currentGameSettings = game.getSettings();
            if (!currentGameEnd || !currentGameSettings) return;
            await statsDisplay.handleGameStart(currentGameSettings)
            await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
            const recentGame = (await electronGamesStore.getRecentGames())?.at(0)
            const matchGames = await sqliteGame.getGamesById(recentGame?.settings?.matchInfo.matchId ?? "local")
            expect(matchGames).toHaveLength(gameTest.expectedLength);
        },
        10000 // Set a timeout of 10 seconds for each test
    );

    test.each(rankedGameTest)(
        'Is Post Game Scene As Expected for %s',
        async (gameTest) => {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            if (indexOf(rankedGameTest, gameTest) === 0) await sqlite.clearAllTables();

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
        },
        10000 // Set a timeout of 10 seconds for each test
    );

    test.each(rankedGameTest)(
        'Game Mode As Expected for %s',
        async (gameTest) => {
            statsDisplay["getGameFiles"] = async (): Promise<string[]> => await (new Promise<string[]>(resolve => {
                resolve([`${__dirname}/../sample-games/${gameTest.file}`])
            }));

            if (indexOf(rankedGameTest, gameTest) === 0) await sqlite.clearAllTables();

            connectCode = gameTest.connectCode
            const game = new SlippiGame(`${__dirname}/../sample-games/${gameTest.file}`)
            const currentGameEnd = game.getGameEnd();
            const currentGameSettings = game.getSettings();
            if (!currentGameEnd || !currentGameSettings) return;
            await statsDisplay.handleGameStart(currentGameSettings)
            await statsDisplay.handleGameEnd(currentGameEnd, game.getLatestFrame(), currentGameSettings)
            const recentGame = (await electronGamesStore.getRecentGames())?.at(0)
            expect(recentGame?.settings?.matchInfo.mode).toStrictEqual(gameTest.expectedMode)
        },
        10000
        // Set a timeout of 10 seconds for each test
    );

    describe('Score Reset Between Sets', () => {
        async function playGame(file: string) {
            statsDisplay["getGameFiles"] = async () => [`${__dirname}/../sample-games/${file}`];
            const game = new SlippiGame(`${__dirname}/../sample-games/${file}`);
            const gameEnd = game.getGameEnd();
            const settings = game.getSettings();
            if (!gameEnd || !settings) return;
            await statsDisplay.handleGameStart(settings);
            await statsDisplay.handleGameEnd(gameEnd, game.getLatestFrame(), settings);
        }

        async function playSet(files: string[]) {
            for (const file of files) await playGame(file);
        }

        test('online: score starts fresh after switching to new set (different matchId)', async () => {
            await sqlite.clearAllTables();
            connectCode = "FLCD#507";
            storeLiveStats["getBestOf"] = () => BestOf.BestOf3;

            await playSet([
                "direct-set-2/Replay 1 [W].slp",
                "direct-set-2/Replay 2 [W].slp",  // PostSet, score [0,2]
            ]);
            expect(electronGamesStore.getGameScore()).toStrictEqual([0, 2]);

            await playGame("direct-set-3/Replay 1 [W].slp");  // New matchId
            expect(electronGamesStore.getGameScore()).toStrictEqual([0, 1]);
        }, 30000);

        test('online: recentGames only contains new set games after set transition', async () => {
            await sqlite.clearAllTables();
            connectCode = "FLCD#507";
            storeLiveStats["getBestOf"] = () => BestOf.BestOf3;

            await playSet([
                "direct-set-2/Replay 1 [W].slp",
                "direct-set-2/Replay 2 [W].slp",  // PostSet
            ]);
            await playGame("direct-set-3/Replay 1 [W].slp");

            const recentGames = await electronGamesStore.getRecentGames();
            expect(recentGames).toHaveLength(1);

            const set3Game = new SlippiGame(`${__dirname}/../sample-games/direct-set-3/Replay 1 [W].slp`);
            expect(recentGames[0].settings?.matchInfo?.matchId).toStrictEqual(set3Game.getSettings()?.matchInfo?.matchId);
        }, 30000);

        test('offline: score resets after previous set ended (prevSetEnded fix)', async () => {
            await sqlite.clearAllTables();
            connectCode = "";
            storeLiveStats["getBestOf"] = () => BestOf.BestOf3;

            await playSet([
                "offline-set-1/Replay 1 [L].slp",
                "offline-set-1/Replay 2 [T].slp",
                "offline-set-1/Replay 3 [I].slp",
                "offline-set-1/Replay 4 [L].slp",  // PostSet, score [0,2]
            ]);
            expect(electronGamesStore.getGameScore()).toStrictEqual([0, 2]);

            // Play first game of a new offline "set" — same files, no matchId to distinguish
            await playGame("offline-set-1/Replay 1 [L].slp");
            expect(electronGamesStore.getGameScore()).toStrictEqual([0, 1]);
        }, 30000);

        test('offline: recentGames resets after prevSetEnded', async () => {
            await sqlite.clearAllTables();
            connectCode = "";
            storeLiveStats["getBestOf"] = () => BestOf.BestOf3;

            await playSet([
                "offline-set-1/Replay 1 [L].slp",
                "offline-set-1/Replay 2 [T].slp",
                "offline-set-1/Replay 3 [I].slp",
                "offline-set-1/Replay 4 [L].slp",  // PostSet
            ]);

            await playGame("offline-set-1/Replay 1 [L].slp");  // New set

            const recentGames = await electronGamesStore.getRecentGames();
            expect(recentGames.length).toBeLessThanOrEqual(1);
        }, 30000);

        afterAll(() => {
            storeLiveStats["getBestOf"] = ElectronLiveStatsStore.prototype.getBestOf.bind(storeLiveStats);
        });
    });
});

describe('isTiedGame', () => {
    function makeGame(overrides: {
        stocksP1?: number;
        stocksP2?: number;
        percentP1?: number;
        percentP2?: number;
        bombRain?: boolean;
        placements?: { playerIndex: number; position: number }[];
        noLastFrame?: boolean;
    } = {}): GameStats {
        const { stocksP1 = 1, stocksP2 = 1, percentP1 = 50, percentP2 = 50, bombRain = false, placements = [], noLastFrame = false } = overrides;
        return {
            gameEnd: {
                gameEndMethod: 2,
                lrasInitiatorIndex: null,
                placements,
            } as any,
            isMock: false,
            isReplay: false,
            lastFrame: noLastFrame ? null : {
                frame: 1000,
                players: {
                    0: { pre: {} as any, post: { stocksRemaining: stocksP1, percent: percentP1, playerIndex: 0 } as any },
                    1: { pre: {} as any, post: { stocksRemaining: stocksP2, percent: percentP2, playerIndex: 1 } as any },
                },
            } as any,
            postGameStats: null,
            score: [0, 0],
            settings: {
                players: [{ playerIndex: 0 }, { playerIndex: 1 }],
                gameInfoBlock: { bombRainEnabled: bombRain },
                matchInfo: { matchId: null, gameNumber: null, tiebreakerNumber: null, mode: 'local', bestOf: undefined },
                isSimulated: null,
            } as any,
            timestamp: null,
        };
    }

    test('returns false for null/undefined', () => {
        expect(isTiedGame(null)).toBe(false);
        expect(isTiedGame(undefined)).toBe(false);
    });

    test('returns true for bomb rain', () => {
        expect(isTiedGame(makeGame({ bombRain: true }))).toBe(true);
    });

    test('returns true when both players have 0 stocks (simultaneous death)', () => {
        expect(isTiedGame(makeGame({ stocksP1: 0, stocksP2: 0 }))).toBe(true);
    });

    test('returns false when only one player has 0 stocks', () => {
        expect(isTiedGame(makeGame({ stocksP1: 0, stocksP2: 1 }))).toBe(false);
    });

    test('returns true when both players have same stocks and same floored percent', () => {
        expect(isTiedGame(makeGame({ stocksP1: 2, stocksP2: 2, percentP1: 45.7, percentP2: 45.2 }))).toBe(true);
    });

    test('returns false when stocks match but percent differs after floor', () => {
        expect(isTiedGame(makeGame({ stocksP1: 2, stocksP2: 2, percentP1: 45, percentP2: 46 }))).toBe(false);
    });

    test('returns false when stocks differ', () => {
        expect(isTiedGame(makeGame({ stocksP1: 2, stocksP2: 1, percentP1: 50, percentP2: 50 }))).toBe(false);
    });

    test('returns true when placements both have position 0 (Slippi assigns tie via placements)', () => {
        const placements = [{ playerIndex: 0, position: 0 }, { playerIndex: 1, position: 0 }];
        expect(isTiedGame(makeGame({ stocksP1: 0, stocksP2: 1, placements }))).toBe(true);
    });

    test('returns true for null lastFrame (no frame data → cannot determine winner, treat as tie)', () => {
        expect(isTiedGame(makeGame({ noLastFrame: true }))).toBe(true);
    });
});

describe('getWinnerIndex', () => {
    function makeGame(overrides: {
        stocksP1?: number;
        stocksP2?: number;
        percentP1?: number;
        percentP2?: number;
        placements?: { playerIndex: number; position: number }[];
        lrasIndex?: number | null;
    } = {}): GameStats {
        const { stocksP1 = 0, stocksP2 = 1, percentP1 = 0, percentP2 = 50, placements = [{ playerIndex: 0, position: 1 }, { playerIndex: 1, position: 0 }], lrasIndex = null } = overrides;
        return {
            gameEnd: {
                gameEndMethod: 2,
                lrasInitiatorIndex: lrasIndex,
                placements,
            } as any,
            isMock: false,
            isReplay: false,
            lastFrame: {
                frame: 1000,
                players: {
                    0: { pre: {} as any, post: { stocksRemaining: stocksP1, percent: percentP1, playerIndex: 0 } as any },
                    1: { pre: {} as any, post: { stocksRemaining: stocksP2, percent: percentP2, playerIndex: 1 } as any },
                },
            } as any,
            postGameStats: { overall: [{ totalDamage: 200, killCount: 3 }, { totalDamage: 0, killCount: 0 }], stocks: [] } as any,
            score: [0, 0],
            settings: {
                players: [{ playerIndex: 0, startStocks: 4 }, { playerIndex: 1, startStocks: 4 }],
                gameInfoBlock: { bombRainEnabled: false, gameBitfield3: 143 },
                matchInfo: { matchId: 'mode.ranked-test', gameNumber: 1, tiebreakerNumber: 0, mode: 'ranked', bestOf: undefined },
                isSimulated: null,
            } as any,
            timestamp: null,
        };
    }

    test('returns undefined for tied game (both 0 stocks)', () => {
        expect(getWinnerIndex(makeGame({ stocksP1: 0, stocksP2: 0, placements: [] }))).toBeUndefined();
    });

    test('returns undefined for tied game (same stocks + percent)', () => {
        const placements = [{ playerIndex: 0, position: 1 }, { playerIndex: 1, position: 1 }];
        expect(getWinnerIndex(makeGame({ stocksP1: 2, stocksP2: 2, percentP1: 50, percentP2: 50, placements }))).toBeUndefined();
    });

    test('returns winner index from placements', () => {
        expect(getWinnerIndex(makeGame())).toBe(1);
    });

    test('returns opponent when LRAS initiated by player 0', () => {
        const placements = [{ playerIndex: 0, position: 1 }, { playerIndex: 1, position: 0 }];
        expect(getWinnerIndex(makeGame({ lrasIndex: 0, placements }))).toBe(1);
    });

    test('returns opponent when LRAS initiated by player 1', () => {
        const placements = [{ playerIndex: 0, position: 0 }, { playerIndex: 1, position: 1 }];
        expect(getWinnerIndex(makeGame({ lrasIndex: 1, stocksP1: 1, stocksP2: 0, placements }))).toBe(0);
    });

    test('returns undefined for null input', () => {
        expect(getWinnerIndex(undefined)).toBeUndefined();
    });
});