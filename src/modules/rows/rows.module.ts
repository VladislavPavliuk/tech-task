import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Row } from 'src/entities/row.entity'
import { AnalyticsModule } from '../analytics/analytics.module'
import { EmailModule } from '../email/email.module'
import { NotificationsGateway } from '../notifications/notifications.gateway'
import { RowsController } from './rows.controller'
import { RowsService } from './rows.service'

@Module({
	imports: [TypeOrmModule.forFeature([Row]), EmailModule, AnalyticsModule],
	controllers: [RowsController],
	providers: [RowsService, NotificationsGateway],
	exports: [RowsService],
})
export class RowsModule {}
