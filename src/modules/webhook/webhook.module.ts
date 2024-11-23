import { Module } from '@nestjs/common'
import { AnalyticsModule } from '../analytics/analytics.module'
import { RowsModule } from '../rows/rows.module'
import { WebhookController } from './webhook.controller'

@Module({
	imports: [RowsModule, AnalyticsModule],
	controllers: [WebhookController],
})
export class WebhookModule {}
