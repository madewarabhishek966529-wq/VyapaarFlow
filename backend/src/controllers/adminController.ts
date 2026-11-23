import { Request, Response, NextFunction } from 'express';
import { Business } from '../models/Business';
import { User } from '../models/User';
import { Sale } from '../models/Sale';
import { SubscriptionPlan, SubscriptionStatus } from '@vyapaarflow/shared';

export class AdminController {
  /**
   * Super Admin dashboard metrics
   */
  static async getPlatformStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalBusinesses, totalUsers, totalSalesAgg, businessesByPlan] = await Promise.all([
        Business.countDocuments(),
        User.countDocuments(),
        Sale.aggregate([
          { $match: { isReturned: false } },
          { $group: { _id: null, totalPlatformSales: { $sum: '$grandTotal' }, totalTransactions: { $sum: 1 } } }
        ]),
        Business.aggregate([
          { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
        ])
      ]);

      const recentBusinesses = await Business.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      res.json({
        success: true,
        data: {
          totalBusinesses,
          totalUsers,
          totalPlatformSales: totalSalesAgg[0]?.totalPlatformSales || 0,
          totalTransactions: totalSalesAgg[0]?.totalTransactions || 0,
          businessesByPlan,
          recentBusinesses
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all registered businesses with filter
   */
  static async getAllBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, plan } = req.query;
      const query: any = {};

      if (plan) query['subscription.plan'] = plan;
      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [{ name: regex }, { ownerName: regex }, { mobile: regex }, { city: regex }];
      }

      const businesses = await Business.find(query).sort({ createdAt: -1 }).lean();

      res.json({
        success: true,
        data: businesses
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update a business subscription plan
   */
  static async updateBusinessSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { plan, status, expiresAt } = req.body;

      const business = await Business.findById(id);
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      if (plan) business.subscription.plan = plan;
      if (status) business.subscription.status = status;
      if (expiresAt) business.subscription.expiresAt = new Date(expiresAt);

      await business.save();

      res.json({
        success: true,
        message: 'Business subscription updated',
        data: business
      });
    } catch (err) {
      next(err);
    }
  }
}
