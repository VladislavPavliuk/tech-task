import { ConfigService } from '@nestjs/config'

export const sendGridConfig = (configService: ConfigService) => ({
	apiKey: configService.get<string>('SENDGRID_API_KEY'),
	fromEmail: configService.get<string>('FROM_EMAIL'),
})
