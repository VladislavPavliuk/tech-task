import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const databaseConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
	const databaseUrl = configService.get<string>('DATABASE_URL')

	return {
		type: 'postgres',
		url: databaseUrl,
		entities: [__dirname + '/../**/*.entity{.ts,.js}'],
		synchronize: true,
	}
}
