const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret, corsOrigin, STATUS } = require('./index');
const Device = require('../models/deviceModel');
const logger = require('./logger');

let io = null;

function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(raw, jwtSecret);

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      logger.warn('Socket.IO auth failed', { error: err.message });
      next(new Error('Authentication failed'));
    }
  });

  // Connection Handler
  io.on('connection', async (socket) => {
    logger.info('Socket.IO client connected', { userId: socket.userId, socketId: socket.id });

    try {
      await joinUserDeviceRooms(socket);
    } catch (err) {
      logger.error('Failed to join device rooms', { error: err.message });
    }

    // Allow client to refresh rooms after device CRUD
    socket.on('refresh-rooms', async () => {
      for (const room of socket.rooms) {
        if (room.startsWith('device:') && room !== socket.id) {
          socket.leave(room);
        }
      }
      try {
        await joinUserDeviceRooms(socket);
      } catch (err) {
        logger.error('Failed to refresh device rooms', { error: err.message });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug('Socket.IO client disconnected', { userId: socket.userId, reason });
    });
  });

  return io;
}

async function joinUserDeviceRooms(socket) {
  const query = socket.userRole === 'admin'
    ? { status: STATUS.ACTIVE }
    : { user_id: socket.userId, status: STATUS.ACTIVE };

  const devices = await Device.find(query).select('device_id').lean();

  for (const device of devices) {
    socket.join(`device:${device.device_id}`);
  }

  logger.debug('Joined device rooms', { userId: socket.userId, deviceCount: devices.length });
}

function getIO() {
  return io;
}

function emitToDevice(deviceId, event, payload) {
  if (!io) return;
  io.to(`device:${deviceId}`).emit(event, payload);
}

module.exports = { initSocketIO, getIO, emitToDevice };
