import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class PlayerTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer" })
  playerIndex: number;

  @Column({ type: "integer" })
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

  @Column({ type: "boolean", nullable: true })
  staminaMode: boolean | null;

  @Column({ type: "boolean", nullable: true })
  silentCharacter: boolean | null;

  @Column({ type: "boolean", nullable: true })
  invisible: boolean | null;

  @Column({ type: "boolean", nullable: true })
  lowGravity: boolean | null;

  @Column({ type: "boolean", nullable: true })
  blackStockIcon: boolean | null;

  @Column({ type: "boolean", nullable: true })
  metal: boolean | null;

  @Column({ type: "boolean", nullable: true })
  startOnAngelPlatform: boolean | null;

  @Column({ type: "boolean", nullable: true })
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

  @Column({ type: "varchar" })
  displayName: string;

  @Column({ type: "varchar" })
  connectCode: string;

  @Column({ type: "varchar" })
  userId: string;
}
