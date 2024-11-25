import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity('rows')
@Unique(['rowNumber', 'columnNumber'])
export class Row {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	rowNumber: number

	@Column()
	columnNumber: number

	@Column('text')
	data: string

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date
}
