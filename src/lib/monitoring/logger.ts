import { config } from '@/lib/config';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  error?: Error;
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  isDevelopment?: boolean;
  isFeatureEnabled?: (feature: string) => boolean;
}

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? (config.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO),
      enableConsole: config.enableConsole ?? true,
      enableRemote: config.enableRemote ?? (config.isFeatureEnabled ? config.isFeatureEnabled('errorReporting') : false),
      remoteEndpoint: config.remoteEndpoint,
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 30000, // 30 seconds
      isDevelopment: config.isDevelopment,
      isFeatureEnabled: config.isFeatureEnabled,
    };

    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  private getLogLevelName(level: LogLevel): string {
    return LogLevel[level];
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = this.getLogLevelName(entry.level);
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? ` Error: ${entry.error.message}${entry.error.stack ? `\n${entry.error.stack}` : ''}` : '';

    return `[${timestamp}] ${level}: ${entry.message}${context}${error}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private enrichEntry(entry: Partial<LogEntry>): LogEntry {
    const enriched: LogEntry = {
      level: entry.level || LogLevel.INFO,
      message: entry.message || '',
      timestamp: entry.timestamp || new Date(),
      context: entry.context,
      error: entry.error,
    };

    // Add client-side context if in browser
    if (typeof window !== 'undefined') {
      enriched.url = window.location.href;
      enriched.userAgent = navigator.userAgent;
      // Add session ID from localStorage if available
      enriched.sessionId = localStorage.getItem('sessionId') || undefined;
    }

    return enriched;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  private async logToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    await this.logToRemote(entries);
  }

  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.enrichEntry({
      level,
      message,
      context,
      error,
    });

    this.logToConsole(entry);

    if (this.config.enableRemote) {
      this.buffer.push(entry);

      if (this.buffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Performance logging
  time(label: string): void {
    if (typeof window !== 'undefined') {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (typeof window !== 'undefined') {
      console.timeEnd(label);
    }
  }

  // User action tracking
  track(event: string, properties?: Record<string, any>): void {
    this.info(`User action: ${event}`, properties);
  }

  // API call logging
  apiCall(endpoint: string, method: string, duration?: number, success?: boolean, error?: Error): void {
    this.info('API Call', {
      endpoint,
      method,
      duration,
      success,
      error: error?.message,
    });
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Create logger instance
const isDevelopment = process.env.NODE_ENV === 'development';
const isFeatureEnabled = (feature: string) => config.features[feature as keyof typeof config.features];

export const logger = new Logger({
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: isFeatureEnabled('errorReporting'),
  remoteEndpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,
  isDevelopment,
  isFeatureEnabled,
});

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);
  });
}

// Export logger instance and types
export default logger;
