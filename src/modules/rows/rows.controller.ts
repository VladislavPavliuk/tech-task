import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Row } from '../../entities/row.entity'
import { RowsService } from './rows.service'

@ApiTags('Rows')
@Controller('rows')
export class RowsController {
	constructor(private readonly rowsService: RowsService) {}

	@ApiOperation({ summary: 'Отримати всі рядки' })
	@ApiResponse({ status: 200, description: 'Успішно отримано рядки.', type: [Row] })
	@Get()
	async getAllRows() {
		return this.rowsService.findAll()
	}

	@ApiOperation({ summary: 'Отримати рядок за номером' })
	@ApiParam({ name: 'rowNumber', description: 'Номер рядка', type: Number })
	@ApiResponse({ status: 200, description: 'Успішно отримано рядок.', type: Row })
	@ApiResponse({ status: 404, description: 'Рядок не знайдено.' })
	@Get(':rowNumber')
	async getRow(@Param('rowNumber') rowNumber: number) {
		return this.rowsService.findOne(rowNumber)
	}

	@ApiOperation({ summary: 'Створити новий рядок' })
	@ApiBody({ description: 'Дані для створення рядка', schema: { example: { rowNumber: 2, data: 'Новий рядок' } } })
	@ApiResponse({ status: 201, description: 'Рядок створено.', type: Row })
	@Post()
	async createRow(@Body('rowNumber') rowNumber: number, @Body('data') data: string) {
		return this.rowsService.create(rowNumber, data)
	}
}
