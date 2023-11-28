import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from "@nestjs/common";
  import { Observable, throwError } from "rxjs";
  import { tap, catchError } from "rxjs/operators";
import { Logging } from "../providers/logging/logging";
import { customLogsColor, customLogsText } from "../providers/logging/custom.logging";
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: Logging) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const now = Date.now();
      const request: Request = context.switchToHttp().getRequest();
      const url = request.url;
      let method: string;
  
      switch (request.method) {
        case "PUT":
          method = `${customLogsText.bold}${customLogsColor.orange}[${request.method}]${customLogsText.reset}`;
          break;
        case "PATCH":
          method = `${customLogsText.bold}${customLogsColor.pink}[${request.method}]${customLogsText.reset}`;
          break;
        case "POST":
          method = `${customLogsText.bold}${customLogsColor.lightGreen}[${request.method}]${customLogsText.reset}`;
          break;
        case "DELETE":
          method = `${customLogsText.bold}${customLogsColor.red}[${request.method}]${customLogsText.reset}`;
          break;
        default:
          method = `${customLogsText.bold}${customLogsColor.lightBlue}[${request.method}]${customLogsText.reset}`;
          break;
      }
  
      return next.handle().pipe(
        tap(() => {
          const elapsed = Date.now() - now;
          this.logger.info(
            `${method} => ${customLogsColor.white}${url} - ${
              customLogsColor.green
            }${elapsed < 400 ? "🚀 🚄 ✈️ " : "💩 🐌 ☠️ "} ${elapsed}ms`
          );
        }),
        catchError((error) => {
          this.logger.error(
            `${method} => ${customLogsColor.white}${url}\n👻 💀 ☠️ ${customLogsColor.red} Error: ${error.message}`
          );
          return throwError(error);
        })
      );
    }
  }
  