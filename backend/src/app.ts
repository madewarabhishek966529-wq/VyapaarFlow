import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import zlib from 'zlib';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Import Routes
import authRoutes from './routes/authRoutes';
import businessRoutes from './routes/businessRoutes';
import productRoutes from './routes/productRoutes';
import posRoutes from './routes/posRoutes';
import customerRoutes from './routes/customerRoutes';
import udhaarRoutes from './routes/udhaarRoutes';
import supplierRoutes from './routes/supplierRoutes';
import expenseRoutes from './routes/expenseRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';

const app: Application = express();

// Security & Parsing Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));

// Native high-performance response compression middleware (>1KB payloads)
app.use((req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = (req.headers['accept-encoding'] as string) || '';
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body: any): Response {
    if (body && typeof body === 'string' && body.length > 1024) {
      try {
        const compressed = zlib.gzipSync(Buffer.from(body, 'utf-8'));
        res.setHeader('Content-Encoding', 'gzip');
        res.removeHeader('Content-Length');
        return originalSend.call(this, compressed);
      } catch (err) {
        return originalSend.call(this, body);
      }
    }
    return originalSend.call(this, body);
  };

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiRateLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VyapaarFlow Backend API',
    uptime: process.uptime()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/udhaar', udhaarRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
