import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Row } from '../../entities/row.entity'
import { GoogleDriveProvider } from '../../providers/google-drive.provider'
import { redisClient } from '../../providers/redis.provider'
import { AnalyticsService } from '../analytics/analytics.service'
import { EmailService } from '../email/email.service'
import { NotificationsGateway } from '../notifications/notifications.gateway'

@Injectable()
export class RowsService {
	private rowCount = 0
	private googleDriveProvider: GoogleDriveProvider

	constructor(
		@InjectRepository(Row)
		private readonly rowRepository: Repository<Row>,
		private readonly emailService: EmailService,
		private readonly notificationsGateway: NotificationsGateway,
		private readonly analyticsService: AnalyticsService
	) {
		this.googleDriveProvider = new GoogleDriveProvider()
	}

	async findAll(): Promise<Row[]> {
		const rows = await this.rowRepository.find()
		await this.analyticsService.logEvent('Rows Retrieved', { count: rows.length })
		return rows
	}

	async findOne(rowNumber: number): Promise<Row> {
		const cachedRow = await redisClient.get(`row:${rowNumber}`)
		if (cachedRow) {
			console.log('Отримано з кешу')
			await this.analyticsService.logEvent('Row Retrieved from Cache', { rowNumber })
			return JSON.parse(cachedRow)
		}

		const row = await this.rowRepository.findOneBy({ rowNumber })
		if (row) {
			await redisClient.set(`row:${rowNumber}`, JSON.stringify(row), 'EX', 60)
			await this.analyticsService.logEvent('Row Retrieved from Database', { rowNumber })
		}

		return row
	}

	async create(rowNumber: number, data: string): Promise<Row> {
		if (!data) {
			throw new Error('Cannot create a row with null data')
		}

		const existingRow = await this.rowRepository.findOne({ where: { rowNumber } })
		if (existingRow) {
			throw new Error(`Row with rowNumber ${rowNumber} already exists`)
		}

		const newRow = this.rowRepository.create({ rowNumber, data })
		const savedRow = await this.rowRepository.save(newRow)

		this.rowCount++

		console.log('Calling logEvent for Row Created:', savedRow)
		await this.analyticsService.logEvent('Row Created', savedRow)

		if (this.rowCount % 10 === 0) {
			await this.sendNotificationEmails()
		}

		this.notificationsGateway.sendNewRowNotification({
			id: savedRow.id,
			data: savedRow.data,
			createdAt: savedRow.createdAt,
		})

		await redisClient.del(`row:${savedRow.rowNumber}`)

		return savedRow
	}

	async update(rowNumber: number, data: string): Promise<Row> {
		const row = await this.rowRepository.findOneBy({ rowNumber })
		if (!row) {
			await this.analyticsService.logEvent('Row Update Failed', {
				rowNumber,
				reason: 'Row not found',
			})
			throw new Error(`Row with rowNumber ${rowNumber} not found`)
		}

		row.data = data
		const updatedRow = await this.rowRepository.save(row)

		await this.analyticsService.logEvent('Row Updated', updatedRow)

		await redisClient.del(`row:${rowNumber}`)

		return updatedRow
	}

	private async sendNotificationEmails() {
		const fileId = '1SBIJNAcz7Z9J7jNav3Tp0EeyeJy4IFHqj14tlWSMpVE'
		try {
			const recipients = await this.googleDriveProvider.getFilePermissions(fileId)

			if (recipients.length === 0) {
				console.warn('No recipients found for email notification')
				return
			}

			const subject = 'Нові рядки додано'
			const content = `<p>Додано ${this.rowCount} рядків у файл Google Sheets.</p>`

			await this.emailService.sendEmails(recipients, subject, content)

			console.log('Email notifications sent to:', recipients)

			await this.analyticsService.logEvent('Email Sent', {
				recipients,
				subject,
				rowCount: this.rowCount,
			})
		} catch (error) {
			console.error('Failed to send email notifications:', error.message)
		}
	}
}
