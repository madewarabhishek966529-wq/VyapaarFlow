import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app';
import { connectDatabase } from './config/database';
import { CONFIG } from './config/constants';
import { Business } from './models/Business';
import { seedDatabase } from './scripts/seed';
import { AuthUser } from './middleware/auth';

const server = http.createServer(app);

// Setup Socket.IO for real-time live sales updates with strict CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO authentication middleware (Vulnerability #26 prevention)
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization?.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.split(' ')[1]
      : socket.handshake.headers?.authorization);

  if (!token) {
    return next(new Error('Authentication required for real-time connection.'));
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser;
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Invalid or expired socket authentication token.'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_business', (businessId: string) => {
    const user = socket.data.user as AuthUser | undefined;
    // Authorize room access: only allow joining own business room or if superadmin
    if (user && (user.isSuperAdmin || user.businessId === businessId)) {
      socket.join(`business_${businessId}`);
    } else {
      socket.emit('error', { message: 'Unauthorized business room access.' });
    }
  });

  socket.on('disconnect', () => {
    // cleanly disconnected
  });
});

const startServer = async () => {
  try {
    await connectDatabase();

    // Check if database is empty -> auto seed demo store
    const count = await Business.countDocuments();
    if (count === 0) {
      console.log('[Server] Database is empty. Auto-seeding Shree Ganesh Kirana demo store...');
      await seedDatabase();
    }
    
    server.listen(CONFIG.PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 VyapaarFlow Backend is operational!`);
      console.log(`📡 URL: http://localhost:${CONFIG.PORT}`);
      console.log(`📋 Health: http://localhost:${CONFIG.PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (err: any) {
    console.error('Fatal: Failed to start server:', err.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { server };
