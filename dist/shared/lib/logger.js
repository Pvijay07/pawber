"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const config_1 = require("../../config");
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const currentLevel = config_1.env.NODE_ENV === 'production' ? 'info' : 'debug';
function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}
function formatMessage(level, module, message, data) {
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
function createLogger(module) {
    return {
        debug: (message, data) => {
            if (shouldLog('debug'))
                console.debug(formatMessage('debug', module, message, data));
        },
        info: (message, data) => {
            if (shouldLog('info'))
                console.info(formatMessage('info', module, message, data));
        },
        warn: (message, data) => {
            if (shouldLog('warn'))
                console.warn(formatMessage('warn', module, message, data));
        },
        error: (message, data) => {
            if (shouldLog('error'))
                console.error(formatMessage('error', module, message, data));
        },
    };
}
//# sourceMappingURL=logger.js.map