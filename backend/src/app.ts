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

// Security Headers (Vulnerability #27)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  })
);

// Strict CORS Whitelist Configuration (Vulnerability #20)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-business-id']
  })
);

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

// NoSQL Injection Query & Body Sanitizer Middleware (Vulnerability #2)
const sanitizeNoSQL = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeNoSQL);
  }
  for (const key of Object.keys(data)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete data[key];
    } else {
      data[key] = sanitizeNoSQL(data[key]);
    }
  }
  return data;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body) sanitizeNoSQL(req.body);
  if (req.query) sanitizeNoSQL(req.query);
  if (req.params) sanitizeNoSQL(req.params);
  next();
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter (Vulnerability #9)
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

// Centralized error handler (Vulnerability #11)
app.use(errorHandler);

export default app;
