import { Body, Controller, Post } from '@nestjs/common'
import { AnalyticsService } from '../analytics/analytics.service'
import { RowsService } from '../rows/rows.service'

@Controller('webhook')
export class WebhookController {
	constructor(
		private readonly rowsService: RowsService,
		private readonly analyticsService: AnalyticsService
	) {}

	@Post()
	async handleWebhook(@Body() body: any) {
		console.log('Webhook received:', body)

		try {
			if (body.action === 'add') {
				const newRow = await this.rowsService.create(body.data)
				console.log('Row added:', newRow)

				await this.analyticsService.logEvent('Webhook Row Added', newRow)
			} else if (body.action === 'update') {
				if (!body.id) {
					console.error('Missing row ID for update action')
					await this.analyticsService.logEvent('Webhook Update Failed', {
						reason: 'Missing row ID',
						data: body,
					})
					return { success: false, error: 'Missing row ID' }
				}

				const updatedRow = await this.rowsService.update(body.id, body.data)
				console.log('Row updated:', updatedRow)

				await this.analyticsService.logEvent('Webhook Row Updated', updatedRow)
			} else {
				console.error('Unsupported action:', body.action)

				await this.analyticsService.logEvent('Webhook Unsupported Action', {
					action: body.action,
					data: body,
				})
				return { success: false, error: 'Unsupported action' }
			}

			return { success: true }
		} catch (error) {
			console.error('Error handling webhook:', error.message)

			await this.analyticsService.logEvent('Webhook Error', {
				message: error.message,
				data: body,
			})

			return { success: false, error: error.message }
		}
	}
}