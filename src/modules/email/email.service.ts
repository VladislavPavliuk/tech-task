import { Inject, Injectable } from '@nestjs/common'
import sgMail from '@sendgrid/mail'

@Injectable()
export class EmailService {
	private readonly apiKey: string
	private readonly fromEmail: string

	constructor(
		@Inject('SENDGRID_CONFIG')
		private readonly sendGridConfig: { apiKey: string; fromEmail: string }
	) {
		this.apiKey = sendGridConfig.apiKey
		this.fromEmail = sendGridConfig.fromEmail

		sgMail.setApiKey(this.apiKey)
	}

	async sendEmails(recipients: string[], subject: string, content: string): Promise<void> {
		const messages = recipients.map(recipient => ({
			to: recipient,
			from: this.fromEmail,
			subject,
			html: content,
		}))

		try {
			const response = await sgMail.send(messages)
		} catch (error) {
			console.error('Error sending emails:', error)
			if (error.response) {
				console.error('Error details:', error.response.body)
			}
		}
	}
}
