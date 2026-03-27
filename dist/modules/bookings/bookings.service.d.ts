import { ServiceResult } from '../../shared/types';
import { CreateBookingInput, CancelBookingInput, ListBookingsQuery } from './bookings.schema';
/**
 * Bookings Service — contains ALL business logic for bookings.
 * No HTTP concepts (req, res) allowed here. Pure data in → data out.
 */
export declare class BookingsService {
    /**
     * Create a new booking with full price calculation, slot locking, and coupon application.
     */
    create(userId: string, input: CreateBookingInput): Promise<ServiceResult<any>>;
    /**
     * List bookings for a user with optional status filter.
     */
    listByUser(userId: string, query: ListBookingsQuery): Promise<ServiceResult<any>>;
    /**
     * Get booking details by ID (scoped to user).
     */
    getById(userId: string, bookingId: string): Promise<ServiceResult<any>>;
    /**
     * Cancel a booking with refund processing.
     */
    cancel(userId: string, bookingId: string, input: CancelBookingInput): Promise<ServiceResult<any>>;
    /**
     * Provider/Admin: update booking status.
     */
    updateStatus(bookingId: string, status: string): Promise<ServiceResult<any>>;
    private applyCoupon;
    private lockSlot;
    private releaseSlot;
    private processRefund;
}
export declare const bookingsService: BookingsService;
//# sourceMappingURL=bookings.service.d.ts.map