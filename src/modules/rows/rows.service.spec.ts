import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Row } from '../../entities/row.entity'
import { redisClient } from '../../providers/redis.provider'
import { AnalyticsService } from '../analytics/analytics.service'
import { EmailService } from '../email/email.service'
import { NotificationsGateway } from '../notifications/notifications.gateway'
import { RowsService } from './rows.service'

describe('RowsService', () => {
	let service: RowsService
	let rowRepository: jest.Mocked<Repository<Row>>
	let emailService: EmailService
	let notificationsGateway: NotificationsGateway
	let analyticsService: AnalyticsService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RowsService,
				{
					provide: getRepositoryToken(Row),
					useValue: {
						create: jest.fn(),
						save: jest.fn(),
						findOneBy: jest.fn(),
					},
				},
				{
					provide: EmailService,
					useValue: { sendEmails: jest.fn() },
				},
				{
					provide: NotificationsGateway,
					useValue: { sendNewRowNotification: jest.fn() },
				},
				{
					provide: AnalyticsService,
					useValue: { logEvent: jest.fn() },
				},
			],
		}).compile()

		service = module.get<RowsService>(RowsService)
		rowRepository = module.get(getRepositoryToken(Row))
		emailService = module.get<EmailService>(EmailService)
		notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway)
		analyticsService = module.get<AnalyticsService>(AnalyticsService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('create', () => {
		it('should create a new row with rowNumber and log an event', async () => {
			const rowNumber = 2
			const rowData = 'Test data'
			const savedRow = { id: 1, rowNumber, data: rowData, createdAt: new Date() } as Row

			rowRepository.create.mockReturnValue(savedRow)
			rowRepository.save.mockResolvedValue(savedRow)
			jest.spyOn(analyticsService, 'logEvent')

			const result = await service.create(rowNumber, rowData)

			expect(rowRepository.create).toHaveBeenCalledWith({ rowNumber, data: rowData })
			expect(rowRepository.save).toHaveBeenCalledWith(savedRow)
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Row Created', savedRow)
			expect(result).toEqual(savedRow)
		})
	})

	describe('findOne', () => {
		it('should return a row if found by rowNumber', async () => {
			const rowNumber = 2
			const row = { id: 1, rowNumber, data: 'Test row', createdAt: new Date() } as Row

			rowRepository.findOneBy.mockResolvedValue(row)

			const result = await service.findOne(rowNumber)

			expect(rowRepository.findOneBy).toHaveBeenCalledWith({ rowNumber })
			expect(result).toEqual(row)
		})

		it('should return null if no row is found', async () => {
			rowRepository.findOneBy.mockResolvedValue(null)

			const result = await service.findOne(999)

			expect(result).toBeNull()
		})
	})

	afterAll(async () => {
		jest.clearAllMocks()
	})

	afterAll(async () => {
		await redisClient.quit()
	})
})
