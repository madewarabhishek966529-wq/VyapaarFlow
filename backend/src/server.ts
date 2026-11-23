import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { connectDatabase } from './config/database';
import { CONFIG } from './config/constants';
import { Business } from './models/Business';
import { seedDatabase } from './scripts/seed';

const server = http.createServer(app);

// Setup Socket.IO for real-time live sales updates
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('join_business', (businessId: string) => {
    if (businessId) {
      socket.join(`business_${businessId}`);
    }
  });

  socket.on('disconnect', () => {
    // handled cleanly
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
