import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { sendGridConfig } from '../../config/sendgrid.config'
import { EmailService } from './email.service'

@Module({
	imports: [ConfigModule],
	providers: [
		EmailService,
		{
			provide: 'SENDGRID_CONFIG',
			useFactory: (configService: ConfigService) => sendGridConfig(configService),
			inject: [ConfigService],
		},
	],
	exports: [EmailService],
})
export class EmailModule {}
