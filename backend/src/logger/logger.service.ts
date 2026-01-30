import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";

/**
 * Global application logger. Inject anywhere; pass context (e.g. service name) for tagged logs.
 * Central place to add structured logging (e.g. Pino) or transports later.
 */
@Injectable()
export class AppLoggerService implements NestLoggerService {
  /**
   * Create a child logger with a fixed context (e.g. class name).
   * Use in services: private readonly logger = this.appLogger.child(MyService.name);
   */
  child(context: string): AppLoggerService {
    return new ChildLogger(this, context);
  }

  log(message: string, ...optionalParams: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(message, ...optionalParams);
  }

  debug?(message: string, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(message, ...optionalParams);
    }
  }

  verbose?(message: string, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[verbose] ${message}`, ...optionalParams);
    }
  }
}

/**
 * Child logger that prefixes all messages with a context tag.
 */
class ChildLogger extends AppLoggerService {
  constructor(
    private readonly parent: AppLoggerService,
    private readonly context: string
  ) {
    super();
  }

  private format(message: string, ...optionalParams: unknown[]): [string, ...unknown[]] {
    return [`[${this.context}] ${message}`, ...optionalParams];
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.parent.log(...this.format(message, ...optionalParams));
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.parent.error(...this.format(message, ...optionalParams));
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.parent.warn(...this.format(message, ...optionalParams));
  }

  debug?(message: string, ...optionalParams: unknown[]): void {
    this.parent.debug?.(...this.format(message, ...optionalParams));
  }

  verbose?(message: string, ...optionalParams: unknown[]): void {
    this.parent.verbose?.(...this.format(message, ...optionalParams));
  }

  override child(context: string): AppLoggerService {
    return new ChildLogger(this.parent, `${this.context}:${context}`);
  }
}
