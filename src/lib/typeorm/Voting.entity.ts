import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'voting' })
export class Voting extends BaseEntity {
	@PrimaryColumn('varchar', { length: 19, nullable: false, name: 'message_id', unique: true })
	public messageID!: string;

	@Column('varchar', { length: 19, nullable: false, name: 'user_id', unique: false })
	public userID!: string;

	@Column('json', { name: 'votes', nullable: false, default: {} })
	public votes!: {
		[key: string]: string;
	};
}
