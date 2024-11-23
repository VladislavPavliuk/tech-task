import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { databaseConfig } from './config/database.config'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { EmailModule } from './modules/email/email.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { RowsModule } from './modules/rows/rows.module'
import { WebhookController } from './modules/webhook/webhook.controller'
import { WebhookModule } from './modules/webhook/webhook.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: databaseConfig,
			inject: [ConfigService],
		}),
		RowsModule,
		EmailModule,
		NotificationsModule,
		AnalyticsModule,
		WebhookModule,
	],
	controllers: [WebhookController],
	providers: [],
	exports: [],
})
export class AppModule {}
