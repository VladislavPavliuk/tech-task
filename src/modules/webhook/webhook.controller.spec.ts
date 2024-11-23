import { Test, TestingModule } from '@nestjs/testing'
import { redisClient } from '../../providers/redis.provider'
import { AnalyticsService } from '../analytics/analytics.service'
import { RowsService } from '../rows/rows.service'
import { WebhookController } from './webhook.controller'

describe('WebhookController', () => {
	let controller: WebhookController
	let rowsService: RowsService
	let analyticsService: AnalyticsService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WebhookController],
			providers: [
				{
					provide: RowsService,
					useValue: {
						create: jest.fn(),
						update: jest.fn(),
					},
				},
				{
					provide: AnalyticsService,
					useValue: {
						logEvent: jest.fn(),
					},
				},
			],
		}).compile()

		controller = module.get<WebhookController>(WebhookController)
		rowsService = module.get<RowsService>(RowsService)
		analyticsService = module.get<AnalyticsService>(AnalyticsService)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	describe('handleWebhook', () => {
		it('should handle "add" action and log an event', async () => {
			const body = { action: 'add', data: 'Test row' }
			const newRow = { id: 1, data: 'Test row', createdAt: new Date() }

			jest.spyOn(rowsService, 'create').mockResolvedValue(newRow)
			jest.spyOn(analyticsService, 'logEvent')

			const result = await controller.handleWebhook(body)

			expect(rowsService.create).toHaveBeenCalledWith('Test row')
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Webhook Row Added', newRow)
			expect(result).toEqual({ success: true })
		})

		it('should handle "update" action and log an event', async () => {
			const body = { action: 'update', id: 1, data: 'Updated row' }
			const updatedRow = { id: 1, data: 'Updated row', createdAt: new Date() }

			jest.spyOn(rowsService, 'update').mockResolvedValue(updatedRow)
			jest.spyOn(analyticsService, 'logEvent')

			const result = await controller.handleWebhook(body)

			expect(rowsService.update).toHaveBeenCalledWith(1, 'Updated row')
			expect(analyticsService.logEvent).toHaveBeenCalledWith('Webhook Row Updated', updatedRow)
			expect(result).toEqual({ success: true })
		})

		it('should return an error for unsupported actions', async () => {
			const body = { action: 'delete' }

			const result = await controller.handleWebhook(body)

			expect(result).toEqual({ success: false, error: 'Unsupported action' })
		})
	})

	afterAll(async () => {
		jest.clearAllMocks()
	})
	afterAll(async () => {
		await redisClient.quit()
	})
})
