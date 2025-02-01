import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class GameInfoTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer", nullable: true })
  gameBitfield1: number | null;

  @Column({ type: "integer", nullable: true })
  gameBitfield2: number | null;

  @Column({ type: "integer", nullable: true })
  gameBitfield3: number | null;

  @Column({ type: "integer", nullable: true })
  gameBitfield4: number | null;

  @Column({ type: "boolean", nullable: true })
  bombRainEnabled: boolean | null;

  @Column({ type: "integer", nullable: true })
  selfDestructScoreValue: number | null;

  @Column({ type: "integer", nullable: true })
  itemSpawnBitfield1: number | null;

  @Column({ type: "integer", nullable: true })
  itemSpawnBitfield2: number | null;

  @Column({ type: "integer", nullable: true })
  itemSpawnBitfield3: number | null;

  @Column({ type: "integer", nullable: true })
  itemSpawnBitfield4: number | null;

  @Column({ type: "integer", nullable: true })
  itemSpawnBitfield5: number | null;

  @Column({ type: "float", nullable: true })
  damageRatio: number | null;
}

