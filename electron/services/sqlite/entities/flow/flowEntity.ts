import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { FlowEdge, FlowFormat, FlowNode } from '../../../../../frontend/src/lib/models/types/flow';

/** An automation flow (When → And → Then), see models/types/flow.ts. The graph is stored as JSON. */
@Entity()
export class FlowEntity {
  @PrimaryColumn()
  id: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'text', default: 'any' })
  format: FlowFormat;

  @Column({ type: 'simple-json' })
  nodes: FlowNode[];

  @Column({ type: 'simple-json' })
  edges: FlowEdge[];

  @UpdateDateColumn()
  updatedAt: Date;
}
