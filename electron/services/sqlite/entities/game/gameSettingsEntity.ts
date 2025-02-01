import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { GameMode, ItemSpawnType, Language, TimerType } from "@slippi/slippi-js";
import { GameStartTypeExtended } from "../../../../../frontend/src/lib/models/types/slippiData";
import { PlayerTypeEntity } from "../player/playerEntity";
import { MatchInfoEntity } from "./matchInfoEntity";
import { GameInfoTypeEntity } from "./gameInfoBlockEntity";

@Entity()
export class GameSettingsEntity implements GameStartTypeExtended {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: true })
  slpVersion: string | null;

  @Column({ type: "simple-json", nullable: true })
  timerType: TimerType | null;

  @Column({ type: "integer", nullable: true })
  inGameMode: number | null;

  @Column({ type: "integer", nullable: true })
  friendlyFireEnabled: boolean | null;

  @Column({ type: "integer", nullable: true })
  isTeams: boolean | null;

  @Column({ type: "integer", nullable: true })
  stageId: number | null;

  @Column({ type: "integer", nullable: true })
  startingTimerSeconds: number | null;

  @Column({ type: "integer", nullable: true })
  itemSpawnBehavior: ItemSpawnType | null;

  @Column({ type: "integer", nullable: true })
  enabledItems: number | null;

  @OneToMany(() => PlayerTypeEntity, (player) => player, {
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  players: PlayerTypeEntity[];

  @Column({ type: "integer", nullable: true })
  scene: number | null;

  @Column({ type: "integer", nullable: true })
  gameMode: GameMode | null;

  @Column({ type: "simple-json", nullable: true })
  language: Language | null;

  @OneToOne(() => GameInfoTypeEntity, {
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn()
  gameInfoBlock: GameInfoTypeEntity | null;

  @Column({ type: "integer", nullable: true })
  randomSeed: number | null;

  @Column({ type: "integer", nullable: true })
  isPAL: boolean | null;

  @Column({ type: "integer", nullable: true })
  isFrozenPS: boolean | null;

  @OneToOne(() => MatchInfoEntity)
  @JoinColumn()
  matchInfo: MatchInfoEntity;

  @Column({ type: "integer", nullable: true })
  isSimulated: boolean | null;
}

