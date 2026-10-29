import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { GameEndMethod } from '@slippi/slippi-js';
import type { GameEndType, PlacementType } from '../../../../../frontend/src/lib/models/types/slippiTypes';

@Entity()
export class GameEndTypeEntity implements GameEndType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer", nullable: true })
  gameEndMethod: GameEndMethod | null;

  @Column({ type: "int", nullable: true })
  lrasInitiatorIndex: number | null;

  @Column({ type: "simple-json", nullable: true })
  placements: PlacementType[];
}

