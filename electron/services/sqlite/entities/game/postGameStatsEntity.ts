import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { ActionCountsType, ComboType, ConversionType, OverallType, StatsType, StockType } from '../../../../../frontend/src/lib/models/types/slippiTypes';

@Entity()
export class PostGameStatsEntity implements StatsType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer" })
  gameComplete: boolean;

  @Column({ type: "integer" })
  lastFrame: number;

  @Column({ type: "integer" })
  playableFrameCount: number;

  @Column({ type: "simple-json" })
  stocks: StockType[];

  @Column({ type: "simple-json" })
  conversions: ConversionType[];

  @Column({ type: "simple-json" })
  combos: ComboType[];

  @Column({ type: "simple-json" })
  actionCounts: ActionCountsType[];

  @Column({ type: "simple-json" })
  overall: OverallType[];
}

