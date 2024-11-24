import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { LoggingInterceptor } from './common/decorators/logging.decorator'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.useGlobalInterceptors(new LoggingInterceptor())

	const config = new DocumentBuilder()
		.setTitle('Row Management API')
		.setDescription('API для управління рядками з Google Sheets')
		.setVersion('1.0')
		.build()

	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api/docs', app, document)

	app.enableCors({
		origin: '*',
	})

	const PORT = process.env.PORT || 3000
	await app.listen(PORT)
}
bootstrap()
