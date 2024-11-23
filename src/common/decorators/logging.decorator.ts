import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const httpContext = context.switchToHttp()
		const request = httpContext.getRequest()
		const { method, url } = request
		const startTime = Date.now()

		console.log(`[Request] Method: ${method}, URL: ${url}`)

		return next.handle().pipe(
			tap(response => {
				const elapsedTime = Date.now() - startTime
				console.log(`[Response] Method: ${method}, URL: ${url}, Time: ${elapsedTime}ms`)
				console.log(`Response Data:`, response)
			})
		)
	}
}
