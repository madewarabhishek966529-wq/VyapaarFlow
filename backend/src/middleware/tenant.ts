import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Business } from '../models/Business';

export const requireTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessIdHeader = req.headers['x-business-id'] as string;
    let targetBusinessId = req.user?.businessId;

    if (businessIdHeader) {
      if (!mongoose.Types.ObjectId.isValid(businessIdHeader)) {
        res.status(400).json({ success: false, message: 'Invalid business identifier in header.' });
        return;
      }

      // If client requests a specific business header different from the JWT token's businessId:
      if (businessIdHeader !== req.user?.businessId) {
        if (!req.user?.isSuperAdmin) {
          // Verify user actually owns this business
          const ownsBusiness = await Business.findOne({ _id: businessIdHeader, ownerId: req.user?.userId });
          if (!ownsBusiness) {
            res.status(403).json({ success: false, message: 'Tenant access denied: Not authorized for this business.' });
            return;
          }
        }
      }
      targetBusinessId = businessIdHeader;
    }

    if (!targetBusinessId) {
      res.status(400).json({
        success: false,
        message: 'Active business context is required. Please select or register a business.'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(targetBusinessId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid business identifier.'
      });
      return;
    }

    req.businessId = targetBusinessId;
    next();
  } catch (err) {
    next(err);
  }
};
