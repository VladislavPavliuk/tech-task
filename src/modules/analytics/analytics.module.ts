import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Analytics } from '../../entities/analytics.entity'
import { AnalyticsService } from './analytics.service'
import { AnalyticsController } from './analytics.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Analytics])],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
	controllers: [AnalyticsController],
})
export class AnalyticsModule {}
