import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { GameStartMode, MatchInfoExtended } from "../../../../../frontend/src/lib/models/types/slippiData";

@Entity()
export class MatchInfoEntity implements MatchInfoExtended {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: true })
  matchId: string | null;

  @Column({ type: "integer", nullable: true })
  gameNumber: number | null;

  @Column({ type: "integer", nullable: true })
  tiebreakerNumber: number | null;

  @Column({ type: "varchar", nullable: true })
  mode: GameStartMode | undefined;

  @Column({ type: "integer", nullable: true })
  bestOf: number | undefined;
}

