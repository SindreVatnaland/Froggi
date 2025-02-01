import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { CurrentPlayer, CurrentPlayerRank } from '../../../../frontend/src/lib/models/types/slippiData';
import { CurrentPlayerRankEntity } from "./currentPlayerRank";

@Entity()
export class CurrentPlayerEntity implements CurrentPlayer {
  @PrimaryColumn()
  connectCode: string;

  @OneToOne(() => CurrentPlayerRankEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  rank: CurrentPlayerRank | undefined;
}

