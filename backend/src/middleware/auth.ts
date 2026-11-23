import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/constants';
import { UserRole } from '@vyapaarflow/shared';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  businessId?: string;
  isSuperAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      businessId?: string;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as AuthUser;
    req.user = decoded;
    if (decoded.businessId) {
      req.businessId = decoded.businessId;
    }
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }
};

export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.user.isSuperAdmin || roles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions for this action.' });
    return;
  };
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.isSuperAdmin) {
    res.status(403).json({ success: false, message: 'Super admin access required.' });
    return;
  }
  next();
};
