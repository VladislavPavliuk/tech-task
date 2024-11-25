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
						findOne: jest.fn(),
						find: jest.fn(),
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
		it('should create a new row with rowNumber and columnNumber and log an event', async () => {
			const rowNumber = 2
			const columnNumber = 3
			const rowData = 'Test data'
			const savedRow = {
				id: 1,
				rowNumber,
				columnNumber,
				data: rowData,
				createdAt: new Date(),
			} as Row

			rowRepository.create.mockReturnValue(savedRow)
			rowRepository.save.mockResolvedValue(savedRow)
			jest.spyOn(analyticsService, 'logEvent')

			const result = await service.create(rowNumber, columnNumber, rowData)

			expect(rowRepository.create).toHaveBeenCalledWith({ rowNumber, columnNumber, data: rowData })
			expect(rowRepository.save).toHaveBeenCalledWith(savedRow)
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Row Created', savedRow)
			expect(result).toEqual(savedRow)
		})

		it('should throw an error if row with rowNumber and columnNumber already exists', async () => {
			const rowNumber = 2
			const columnNumber = 3
			const rowData = 'Test data'

			rowRepository.findOne.mockResolvedValue({} as Row)

			await expect(service.create(rowNumber, columnNumber, rowData)).rejects.toThrow(
				`Row with rowNumber ${rowNumber} and columnNumber ${columnNumber} already exists`
			)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber, columnNumber } })
		})
	})

	describe('findOne', () => {
		it('should return a row if found by rowNumber and columnNumber', async () => {
			const rowNumber = 2
			const columnNumber = 3
			const row = {
				id: 1,
				rowNumber,
				columnNumber,
				data: 'Test row',
				createdAt: new Date(),
			} as Row

			rowRepository.findOne.mockResolvedValue(row)

			const result = await service.findOne(rowNumber, columnNumber)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber, columnNumber } })
			expect(result).toEqual(row)
		})

		it('should return null if no row is found', async () => {
			rowRepository.findOne.mockResolvedValue(null)

			const result = await service.findOne(999, 999)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber: 999, columnNumber: 999 } })
			expect(result).toBeNull()
		})
	})

	describe('update', () => {
		it('should update a row with rowNumber and columnNumber and log an event', async () => {
			const rowNumber = 2
			const columnNumber = 3
			const updatedData = 'Updated data'
			const existingRow = {
				id: 1,
				rowNumber,
				columnNumber,
				data: 'Old data',
				createdAt: new Date(),
			} as Row

			const updatedRow = { ...existingRow, data: updatedData }

			rowRepository.findOne.mockResolvedValue(existingRow)
			rowRepository.save.mockResolvedValue(updatedRow)
			jest.spyOn(analyticsService, 'logEvent')

			const result = await service.update(rowNumber, columnNumber, updatedData)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber, columnNumber } })
			expect(rowRepository.save).toHaveBeenCalledWith(updatedRow)
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Row Updated', updatedRow)
			expect(result).toEqual(updatedRow)
		})

		it('should throw an error if row with rowNumber and columnNumber is not found', async () => {
			const rowNumber = 2
			const columnNumber = 3
			const updatedData = 'Updated data'

			rowRepository.findOne.mockResolvedValue(null)

			await expect(service.update(rowNumber, columnNumber, updatedData)).rejects.toThrow(
				`Row with rowNumber ${rowNumber} and columnNumber ${columnNumber} not found`
			)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber, columnNumber } })
		})
	})

	describe('delete', () => {
		it('should delete a row with rowNumber and columnNumber and log an event', async () => {
			const rowNumber = 2
			const columnNumber = 3
			const row = {
				id: 1,
				rowNumber,
				columnNumber,
				data: 'Test row',
				createdAt: new Date(),
			} as Row

			rowRepository.findOne.mockResolvedValue(row)
			jest.spyOn(analyticsService, 'logEvent')

			await service.delete(rowNumber, columnNumber)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber, columnNumber } })
			expect(rowRepository.remove).toHaveBeenCalledWith(row)
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Row Deleted', { rowNumber, columnNumber })
			expect(redisClient.del).toHaveBeenCalledWith(`row:${rowNumber}:${columnNumber}`)
		})

		it('should throw an error if row with rowNumber and columnNumber is not found', async () => {
			const rowNumber = 2
			const columnNumber = 3

			rowRepository.findOne.mockResolvedValue(null)

			await expect(service.delete(rowNumber, columnNumber)).rejects.toThrow(
				`Row with rowNumber ${rowNumber} and columnNumber ${columnNumber} not found`
			)

			expect(rowRepository.findOne).toHaveBeenCalledWith({ where: { rowNumber, columnNumber } })
		})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	afterAll(async () => {
		await redisClient.quit()
	})
})
