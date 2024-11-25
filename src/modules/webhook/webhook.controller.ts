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
				if (!body.data.newValue) {
					console.error('Missing newValue in add action')
					await this.analyticsService.logEvent('Webhook Add Failed', {
						reason: 'Missing newValue',
						data: body,
					})
					return { success: false, error: 'Missing newValue in add action' }
				}

				const newRow = await this.rowsService.create(body.data.rowNumber, body.data.newValue)
				console.log('Row added:', newRow)

				await this.analyticsService.logEvent('Webhook Row Added', newRow)
			} else if (body.action === 'update') {
				if (!body.data.rowNumber || !body.data.newValue) {
					console.error('Missing rowNumber or newValue for update action')
					await this.analyticsService.logEvent('Webhook Update Failed', {
						reason: 'Missing rowNumber or newValue',
						data: body,
					})
					return { success: false, error: 'Missing rowNumber or newValue' }
				}

				const updatedRow = await this.rowsService.update(body.data.rowNumber, body.data.newValue)
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
