import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { customLogsText, customLogsColor } from './custom.logging';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request: Request = context.switchToHttp().getRequest();
    const url = request.url;
    let method: string = request.method.toLocaleUpperCase();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        this.loggerService.log(
          `[${method}] => - ${url} - ${
            elapsed < 400 ? '🚀 🚄 ✈️ ' : '💩 🐌 ☠️ '
          } ${elapsed}ms`,
        );
      }),
      catchError((error) => {
        this.loggerService.error(
          `[${method}] => ${url} - 👻 💀 ☠️ Error: ${error.message}`,
        );
        return throwError(error);
      }),
    );
  }
}
