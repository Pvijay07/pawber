/**
 * Creates a scoped logger for a specific module.
 *
 * Usage:
 *   const log = createLogger('BookingsService');
 *   log.info('Booking created', { bookingId: '123' });
 */
export declare function createLogger(module: string): {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
};
//# sourceMappingURL=logger.d.ts.map