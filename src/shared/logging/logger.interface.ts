import { ModuleMetadata } from '@nestjs/common';

/**
 * Log level
 */
export type WinstonLogLevel = 'info' | 'error' | 'warn' | 'debug' | 'verbose';

/**
 * Log configuration, split by number of days by default
 */
export interface LoggerModuleOptions {
  /**
   * Log file output
   * By default, only logs and above (warn and error) will be output to the file. The levels are as follows:
   */
  level?: WinstonLogLevel | 'none';

  /**
   * Console output level
   */
  consoleLevel?: WinstonLogLevel | 'none';

  /**
   * If enabled, the timestamp (time difference) between the current and previous log message will be printed
   */
  timestamp?: boolean;

  /**
   * In a production environment, terminal log output is turned off by default. If necessary, it can be set to false.
   */
  disableConsoleAtProd?: boolean;

  /**
   * Maximum size of the file after which it will rotate. This can be a number of bytes, or units of kb, mb, and gb.
   * If using the units, add 'k', 'm', or 'g' as the suffix. The units need to directly follow the number.
   * default: 2m
   */
  maxFileSize?: string;

  /**
   * Maximum number of logs to keep. If not set,
   * no logs will be removed. This can be a number of files or number of days. If using days, add 'd' as the suffix.
   * default: 15d
   */
  maxFiles?: string;

  /**
   * Directory of log output in development environment, absolute path
   * In order to avoid conflicts and centralized management in the development environment, logs will be printed in the logs directory under the project directory.
   */
  dir?: string;

  /**
   * The log output by any logger's .error() call will be redirected here. Focus on locating the exception by viewing this log. The default file name is common-error.%DATE%.log
   * NOTE: This file name can contain the %DATE% placeholder
   */
  errorLogName?: string;

  /**
   * Application related logs, logs used by application developers. We use it in most cases, the default file name is web.%DATE%.log
   * NOTE: This file name can contain the %DATE% placeholder
   */
  appLogName?: string;
}

export interface LoggerModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => LoggerModuleOptions;
  inject?: any[];
}
