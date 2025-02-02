import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { GameEndType, GameEndMethod, PlacementType } from "@slippi/slippi-js";

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

