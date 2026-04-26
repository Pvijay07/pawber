import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { supabaseAdmin } from './supabase';
import { createLogger } from './logger';

const log = createLogger('SocketService');
let ioInstance: SocketServer | null = null;

export function initializeSocket(httpServer: HttpServer) {
    const io = new SocketServer(httpServer, {
        cors: {
            origin: '*', // In production, restrict this to your app domains
            methods: ['GET', 'POST']
        }
    });

    ioInstance = io;

    // ... (rest of middleware and connection handler)
    io.use(async (socket: Socket, next) => {
        try {
            const auth = socket.handshake.auth;
            const headers = socket.handshake.headers;
            
            let token = auth?.token || headers?.authorization;
            
            if (token && token.startsWith('Bearer ')) {
                token = token.split(' ')[1];
            }
            
            if (!token) {
                log.warn('Socket connection attempt without token', { socketId: socket.id });
                return next(new Error('Authentication error: No token provided'));
            }

            log.debug('Verifying socket token', { tokenSnippet: token.substring(0, 10) + '...' });
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (error || !user) {
                log.error('Socket token verification failed', { 
                    error: error?.message || 'No user found',
                    tokenSnippet: token.substring(0, 15) + '...'
                });
                return next(new Error('Authentication error: Invalid token'));
            }

            // Attach user info to socket
            (socket as any).user = user;
            next();
        } catch (err: any) {
            log.error('Socket auth exception', { error: err.message });
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const user = (socket as any).user;
        log.info('New socket connection', { userId: user.id, socketId: socket.id });

        socket.on('join_booking', (bookingId: string) => {
            const room = `booking_${bookingId}`;
            socket.join(room);
            log.info('User joined booking room', { userId: user.id, bookingId, room });
            socket.emit('joined_room', { room });
        });

        socket.on('leave_booking', (bookingId: string) => {
            const room = `booking_${bookingId}`;
            socket.leave(room);
            log.info('User left booking room', { userId: user.id, bookingId, room });
        });

        socket.on('location_update', (data: { bookingId: string, latitude: number, longitude: number, accuracy?: number }) => {
            const { bookingId, latitude, longitude } = data;
            const room = `booking_${bookingId}`;
            log.debug('Location update received', { userId: user.id, bookingId, latitude, longitude });
            socket.to(room).emit('location_update', {
                userId: user.id,
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('send_message', (data: { bookingId: string, content: string, type?: string }) => {
            const { bookingId, content, type = 'text' } = data;
            const room = `booking_${bookingId}`;
            socket.to(room).emit('new_message', {
                senderId: user.id,
                content,
                type,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', (reason) => {
            log.info('Socket disconnected', { userId: user.id, socketId: socket.id, reason });
        });
    });

    return io;
}

export function getIO(): SocketServer {
    if (!ioInstance) {
        throw new Error('Socket.io not initialized. Use initializeSocket(httpServer) first.');
    }
    return ioInstance;
}
