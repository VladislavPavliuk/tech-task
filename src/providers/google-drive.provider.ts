import { google } from 'googleapis'

export class GoogleDriveProvider {
	private drive

	constructor() {
		const auth = new google.auth.GoogleAuth({
			keyFile: '/home/vlad/Downloads/winter-field-442607-d3-b5d8cee46017.json',
			scopes: ['https://www.googleapis.com/auth/drive'],
		})

		this.drive = google.drive({ version: 'v3', auth })
	}

	async getFilePermissions(fileId: string): Promise<string[]> {
		try {
			const response = await this.drive.permissions.list({
				fileId,
				fields: 'permissions(emailAddress)',
			})

			const permissions = response.data.permissions || []
			return permissions.map(perm => perm.emailAddress).filter(Boolean)
		} catch (error) {
			console.error('Error fetching permissions:', error)
			throw new Error('Failed to fetch file permissions')
		}
	}

	async testGetPermissions(fileId: string) {
		try {
			const emails = await this.getFilePermissions(fileId)
			return emails
		} catch (error) {
			console.error('Error while testing permissions:', error)
		}
	}
}
