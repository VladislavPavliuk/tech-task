import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
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

	@ApiOperation({ summary: 'Отримати рядок за номером рядка та стовпця' })
	@ApiParam({ name: 'rowNumber', description: 'Номер рядка', type: Number })
	@ApiParam({ name: 'columnNumber', description: 'Номер стовпця', type: Number })
	@ApiResponse({ status: 200, description: 'Успішно отримано рядок.', type: Row })
	@ApiResponse({ status: 404, description: 'Рядок не знайдено.' })
	@Get(':rowNumber/:columnNumber')
	async getRow(@Param('rowNumber') rowNumber: number, @Param('columnNumber') columnNumber: number) {
		return this.rowsService.findOne(rowNumber, columnNumber)
	}

	@ApiOperation({ summary: 'Створити новий рядок' })
	@ApiBody({
		description: 'Дані для створення рядка',
		schema: { example: { rowNumber: 2, columnNumber: 3, data: 'Новий рядок' } },
	})
	@ApiResponse({ status: 201, description: 'Рядок створено.', type: Row })
	@Post()
	async createRow(
		@Body('rowNumber') rowNumber: number,
		@Body('columnNumber') columnNumber: number,
		@Body('data') data: string
	) {
		return this.rowsService.create(rowNumber, columnNumber, data)
	}

	@ApiOperation({ summary: 'Видалити рядок за номером рядка та стовпця' })
	@ApiParam({ name: 'rowNumber', description: 'Номер рядка', type: Number })
	@ApiParam({ name: 'columnNumber', description: 'Номер стовпця', type: Number })
	@ApiResponse({ status: 200, description: 'Рядок успішно видалено.' })
	@ApiResponse({ status: 404, description: 'Рядок не знайдено.' })
	@Delete(':rowNumber/:columnNumber')
	async deleteRow(@Param('rowNumber') rowNumber: number, @Param('columnNumber') columnNumber: number) {
		await this.rowsService.delete(rowNumber, columnNumber)
		return { success: true, message: 'Row deleted successfully' }
	}
}
