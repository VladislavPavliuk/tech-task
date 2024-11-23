import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('analytics')
export class Analytics {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	eventType: string

	@Column('text', { nullable: true })
	eventData: string

	@CreateDateColumn()
	createdAt: Date
}
