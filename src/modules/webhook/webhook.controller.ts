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
			const { rowNumber, columnNumber, newValue } = data

			if (!rowNumber || !columnNumber || !newValue) {
				console.error('Missing required fields in webhook data')
				await this.analyticsService.logEvent('Webhook Failed', {
					reason: 'Missing required fields',
					data: body,
				})
				return { success: false, error: 'Missing required fields in webhook data' }
			}

			if (action === 'add') {
				const newRow = await this.rowsService.create(rowNumber, columnNumber, newValue)
				console.log('Row added:', newRow)
				await this.analyticsService.logEvent('Webhook Row Added', newRow)
			} else if (action === 'update') {
				const updatedRow = await this.rowsService.update(rowNumber, columnNumber, newValue)
				console.log('Row updated:', updatedRow)
				await this.analyticsService.logEvent('Webhook Row Updated', updatedRow)
			} else if (body.action === 'delete') {
				const { rowNumber, columnNumber } = body.data
				if (!rowNumber || !columnNumber) {
					console.error('Missing rowNumber or columnNumber for delete action')
					await this.analyticsService.logEvent('Webhook Delete Failed', {
						reason: 'Missing rowNumber or columnNumber',
						data: body,
					})
					return { success: false, error: 'Missing rowNumber or columnNumber' }
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
