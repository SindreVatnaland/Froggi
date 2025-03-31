import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { CurrentPlayerRank, RankedNetplayProfile, RatingPrediction } from '../../../../../frontend/src/lib/models/types/slippiData';
import { CurrentPlayerEntity } from "./currentPlayerEntity";

@Entity()
export class CurrentPlayerRankEntity implements CurrentPlayerRank {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "simple-json", nullable: true })
  new: RankedNetplayProfile | undefined;

  @Column({ type: "simple-json", nullable: true })
  current: RankedNetplayProfile | undefined;

  @OneToOne(() => CurrentPlayerEntity, (player) => player.rank)
  player: CurrentPlayerEntity;


  @Column({ type: "simple-json", nullable: true })
  predictedRating: RatingPrediction | undefined;
}

