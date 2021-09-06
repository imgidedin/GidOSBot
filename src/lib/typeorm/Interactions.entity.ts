import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { EInteractionTypes } from '../../events/interactions';

@Entity({ name: 'interactions' })
export class Interactions extends BaseEntity {
	@PrimaryColumn('varchar', { length: 19, nullable: false, name: 'message_id', unique: true })
	public messageID!: string;

	@Column('varchar', { length: 19, nullable: false, name: 'type', unique: false })
	public type!: EInteractionTypes;

	@Column('json', { name: 'function_data', nullable: false, default: {} })
	public functionData!: any;
}
