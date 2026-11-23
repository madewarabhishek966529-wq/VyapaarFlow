import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  // Support tenant from token, or X-Business-Id header (for multi-shop owners)
  const businessIdHeader = req.headers['x-business-id'] as string;
  const businessId = businessIdHeader || req.user?.businessId;

  if (!businessId) {
    res.status(400).json({
      success: false,
      message: 'Active business context is required. Please select or register a business.'
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid business identifier.'
    });
    return;
  }

  req.businessId = businessId;
  next();
};
