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
		it('should create a new row and log an event', async () => {
			const rowData = 'Test data'
			const savedRow = { id: 1, data: rowData, createdAt: new Date() } as Row

			rowRepository.create.mockReturnValue(savedRow)
			rowRepository.save.mockResolvedValue(savedRow)
			jest.spyOn(analyticsService, 'logEvent')

			const result = await service.create(rowData)

			expect(rowRepository.create).toHaveBeenCalledWith({ data: rowData })
			expect(rowRepository.save).toHaveBeenCalledWith(savedRow)
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Row Created', savedRow)
			expect(result).toEqual(savedRow)
		})
	})

	describe('findOne', () => {
		it('should return a row if found', async () => {
			const rowId = 1
			const row = { id: rowId, data: 'Test row', createdAt: new Date() } as Row

			rowRepository.findOneBy.mockResolvedValue(row)

			const result = await service.findOne(rowId)

			expect(rowRepository.findOneBy).toHaveBeenCalledWith({ id: rowId })
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
