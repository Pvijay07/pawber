import { env } from '../../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel: LogLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, module: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;
    return data
        ? `${prefix} ${message} ${JSON.stringify(data)}`
        : `${prefix} ${message}`;
}

/**
 * Creates a scoped logger for a specific module.
 * 
 * Usage:
 *   const log = createLogger('BookingsService');
 *   log.info('Booking created', { bookingId: '123' });
 */
export function createLogger(module: string) {
    return {
        debug: (message: string, data?: any) => {
            if (shouldLog('debug')) console.debug(formatMessage('debug', module, message, data));
        },
        info: (message: string, data?: any) => {
            if (shouldLog('info')) console.info(formatMessage('info', module, message, data));
        },
        warn: (message: string, data?: any) => {
            if (shouldLog('warn')) console.warn(formatMessage('warn', module, message, data));
        },
        error: (message: string, data?: any) => {
            if (shouldLog('error')) console.error(formatMessage('error', module, message, data));
        },
    };
}
