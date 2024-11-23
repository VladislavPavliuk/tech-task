import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Analytics } from '../../entities/analytics.entity'

@Injectable()
export class AnalyticsService {
	constructor(
		@InjectRepository(Analytics)
		private readonly analyticsRepository: Repository<Analytics>
	) {}

	async logEvent(eventType: string, eventData: any): Promise<void> {
		const analyticsRecord = this.analyticsRepository.create({
			eventType,
			eventData: JSON.stringify(eventData),
		})

		try {
			await this.analyticsRepository.save(analyticsRecord)
		} catch (error) {
			console.error('Error saving analytics record:', error.message)
		}
	}

	async getAllEvents(): Promise<Analytics[]> {
		return this.analyticsRepository.find({
			order: { createdAt: 'DESC' },
		})
	}
}
