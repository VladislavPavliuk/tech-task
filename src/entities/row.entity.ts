import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('rows')
export class Row {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ unique: true })
	rowNumber: number

	@Column('text')
	data: string

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date
}
