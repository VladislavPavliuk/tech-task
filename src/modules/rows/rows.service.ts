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
	private readonly googleSheetsFileId = process.env.GOOGLE_SHEETS_FILE_ID // ID таблиці тепер береться з .env

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

	async findOne(rowNumber: number, columnNumber: number): Promise<Row> {
		const cacheKey = `row:${rowNumber}:${columnNumber}`
		const cachedRow = await redisClient.get(cacheKey)
		if (cachedRow) {
			console.log('Retrieved from cache')
			await this.analyticsService.logEvent('Row Retrieved from Cache', { rowNumber, columnNumber })
			return JSON.parse(cachedRow)
		}

		const row = await this.rowRepository.findOne({ where: { rowNumber, columnNumber } })
		if (row) {
			await redisClient.set(cacheKey, JSON.stringify(row), 'EX', 60)
			await this.analyticsService.logEvent('Row Retrieved from Database', { rowNumber, columnNumber })
		}

		return row
	}

	async create(rowNumber: number, columnNumber: number, data: string): Promise<Row> {
		if (!data) {
			throw new Error('Cannot create a row with null data')
		}

		const existingRow = await this.rowRepository.findOne({ where: { rowNumber, columnNumber } })
		if (existingRow) {
			throw new Error(`Row with rowNumber ${rowNumber} and columnNumber ${columnNumber} already exists`)
		}

		const newRow = this.rowRepository.create({ rowNumber, columnNumber, data })
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

		await redisClient.del(`row:${savedRow.rowNumber}:${savedRow.columnNumber}`)

		return savedRow
	}

	async update(rowNumber: number, columnNumber: number, data: string): Promise<Row> {
		const row = await this.rowRepository.findOne({ where: { rowNumber, columnNumber } })
		if (!row) {
			await this.analyticsService.logEvent('Row Update Failed', {
				rowNumber,
				columnNumber,
				reason: 'Row not found',
			})
			throw new Error(`Row with rowNumber ${rowNumber} and columnNumber ${columnNumber} not found`)
		}

		row.data = data
		const updatedRow = await this.rowRepository.save(row)

		await this.analyticsService.logEvent('Row Updated', updatedRow)

		await redisClient.del(`row:${rowNumber}:${columnNumber}`)

		return updatedRow
	}

	private async sendNotificationEmails() {
		try {
			const recipients = await this.googleDriveProvider.getFilePermissions(this.googleSheetsFileId)

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
