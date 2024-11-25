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
			const { action, data } = body

			if (action === 'add') {
				const { rowNumber, columnNumber, newValue } = data
				if (!rowNumber || !columnNumber || !newValue) {
					throw new Error('Missing required fields in webhook data')
				}
				const newRow = await this.rowsService.create(rowNumber, columnNumber, newValue)
				console.log('Row added:', newRow)
				await this.analyticsService.logEvent('Webhook Row Added', newRow)
			} else if (action === 'update') {
				const { rowNumber, columnNumber, newValue } = data
				if (!rowNumber || !columnNumber || !newValue) {
					throw new Error('Missing required fields in webhook data')
				}
				const updatedRow = await this.rowsService.update(rowNumber, columnNumber, newValue)
				console.log('Row updated:', updatedRow)
				await this.analyticsService.logEvent('Webhook Row Updated', updatedRow)
			} else if (action === 'delete') {
				const { rowNumber, columnNumber } = data
				if (!rowNumber || !columnNumber) {
					throw new Error('Missing required fields for delete action')
				}
				await this.rowsService.delete(rowNumber, columnNumber)
				console.log(`Row deleted: rowNumber=${rowNumber}, columnNumber=${columnNumber}`)
				await this.analyticsService.logEvent('Webhook Row Deleted', { rowNumber, columnNumber })
			} else {
				console.error('Unsupported action:', action)
				await this.analyticsService.logEvent('Webhook Unsupported Action', { action, data })
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
