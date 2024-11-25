import { Controller, Get, Redirect } from '@nestjs/common'

@Controller()
export class AppController {
	private readonly googleSheetsUrl =
		'https://docs.google.com/spreadsheets/d/1SBIJNAcz7Z9J7jNav3Tp0EeyeJy4IFHqj14tlWSMpVE/edit'

	@Get()
	@Redirect()
	redirectToGoogleSheets() {
		return { url: this.googleSheetsUrl }
	}
}
