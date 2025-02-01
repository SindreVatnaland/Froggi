import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { CurrentPlayer, CurrentPlayerRank } from '../../../../../frontend/src/lib/models/types/slippiData';
import { CurrentPlayerRankEntity } from "./currentPlayerRankEntity";

@Entity()
export class CurrentPlayerEntity implements CurrentPlayer {
  @PrimaryColumn()
  connectCode: string;

  @Column({ type: "integer", default: 0 })
  playerIndex: number;

  @Column({ type: "integer", default: 1 })
  port: number;

  @Column({ type: "integer", nullable: true })
  characterId: number | null;

  @Column({ type: "integer", nullable: true })
  type: number | null;

  @Column({ type: "integer", nullable: true })
  startStocks: number | null;

  @Column({ type: "integer", nullable: true })
  characterColor: number | null;

  @Column({ type: "integer", nullable: true })
  teamShade: number | null;

  @Column({ type: "integer", nullable: true })
  handicap: number | null;

  @Column({ type: "integer", nullable: true })
  teamId: number | null;

  @Column({ type: "integer", nullable: true })
  staminaMode: boolean | null;

  @Column({ type: "integer", nullable: true })
  silentCharacter: boolean | null;

  @Column({ type: "integer", nullable: true })
  invisible: boolean | null;

  @Column({ type: "integer", nullable: true })
  lowGravity: boolean | null;

  @Column({ type: "integer", nullable: true })
  blackStockIcon: boolean | null;

  @Column({ type: "integer", nullable: true })
  metal: boolean | null;

  @Column({ type: "integer", nullable: true })
  startOnAngelPlatform: boolean | null;

  @Column({ type: "integer", nullable: true })
  rumbleEnabled: boolean | null;

  @Column({ type: "integer", nullable: true })
  cpuLevel: number | null;

  @Column({ type: "float", nullable: true })
  offenseRatio: number | null;

  @Column({ type: "float", nullable: true })
  defenseRatio: number | null;

  @Column({ type: "float", nullable: true })
  modelScale: number | null;

  @Column({ type: "varchar", nullable: true })
  controllerFix: string | null;

  @Column({ type: "varchar", nullable: true })
  nametag: string | null;

  @Column({ type: "varchar", default: "" })
  displayName: string;

  @Column({ type: "varchar", default: "" })
  userId: string;

  @OneToOne(() => CurrentPlayerRankEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  rank: CurrentPlayerRank | undefined;
}

