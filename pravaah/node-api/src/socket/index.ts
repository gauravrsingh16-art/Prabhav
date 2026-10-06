import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer, allowedOrigins: string[]): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ [Socket.IO] Client connected: ${socket.id}`);

    // Join room per event if requested
    socket.on('join:event', (eventId: string) => {
      socket.join(eventId);
      socket.join(`event:${eventId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined event room: ${eventId}`);
    });

    // Handle incoming client GPS telemetry
    socket.on('user:location', (data: any) => {
      // Broadcast to operators
      socket.broadcast.emit('user:location', data);
    });

    // Handle client SOS directly over socket
    socket.on('emergency:sos', (data: any) => {
      io.emit('emergency:sos', data);
    });

    // Handle client stuck directly over socket
    socket.on('emergency:stuck', (data: any) => {
      io.emit('emergency:stuck', data);
    });

    // Handle gate status change from operator
    socket.on('gate:update', (data: any) => {
      io.emit('gate:update', data);
      if (data && data.eventId) {
        io.to(data.eventId).emit('gate:update', data);
        io.to(`event:${data.eventId}`).emit('gate:update', data);
      }
    });

    // Handle gate analysis updated
    socket.on('gate:analysis-updated', (data: any) => {
      io.emit('gate:analysis-updated', data);
      if (data && data.eventId) {
        io.to(data.eventId).emit('gate:analysis-updated', data);
        io.to(`event:${data.eventId}`).emit('gate:analysis-updated', data);
      }
    });

    // Handle zone status change
    socket.on('zone:update', (data: any) => {
      io.emit('zone:update', data);
    });

    // Handle alert from operator
    socket.on('alert:new', (data: any) => {
      io.emit('alert:new', data);
    });

    // Handle crowd update
    socket.on('crowd:update', (data: any) => {
      io.emit('crowd:update', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}
