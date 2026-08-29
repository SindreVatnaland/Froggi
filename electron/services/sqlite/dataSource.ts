import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { LayerEntity } from './entities/overlay/layerEntity';
import { OverlayEntity } from './entities/overlay/overlayEntity';
import { SceneEntity } from './entities/overlay/sceneEntity';
import { OverlayHistoryEntity } from './entities/overlay/overlayHistoryEntity';
import { PlayerTypeEntity } from './entities/player/playerEntity';
import { GameStatsEntity } from './entities/game/gameStatsEntity';
import { GameSettingsEntity } from './entities/game/gameSettingsEntity';
import { GameEndTypeEntity } from './entities/game/gameEndTypeEntity';
import { MatchInfoEntity } from './entities/game/matchInfoEntity';
import { PostGameStatsEntity } from './entities/game/postGameStatsEntity';
import { FrameEntryTypeEntity } from './entities/game/frameEntryTypeEntity';
import { FrameStartTypeEntity } from './entities/game/frameStartTypeEntity';
import { CurrentPlayerEntity } from './entities/currentPlayer/currentPlayerEntity';
import { CurrentPlayerRankEntity } from './entities/currentPlayer/currentPlayerRankEntity';
import { GameInfoTypeEntity } from './entities/game/gameInfoBlockEntity';

// Single source of truth for the entity set + DataSource config, shared by the utilityProcess
// host (dbHost.ts) and the in-process fallback (initiSqlite.ts, used under jest where Electron's
// utilityProcess isn't available).
export const ENTITIES = [
	OverlayEntity, SceneEntity, LayerEntity, OverlayHistoryEntity,
	CurrentPlayerEntity, CurrentPlayerRankEntity,
	PlayerTypeEntity,
	GameStatsEntity, GameSettingsEntity, GameEndTypeEntity, MatchInfoEntity,
	PostGameStatsEntity, FrameEntryTypeEntity, FrameStartTypeEntity, GameInfoTypeEntity,
];

export const createDataSource = (dbPath: string): DataSource =>
	new DataSource({
		type: 'better-sqlite3',
		database: dbPath,
		entities: ENTITIES,
		synchronize: true,
		logging: false,
	});
