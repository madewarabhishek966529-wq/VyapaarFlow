import { Request, Response, NextFunction } from 'express';
import { Business } from '../models/Business';
import { SubscriptionPlan, SubscriptionStatus } from '@vyapaarflow/shared';

export class SubscriptionController {
  /**
   * Get current business subscription details and available plans
   */
  static async getSubscriptionInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const business = await Business.findById(req.businessId).lean();
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      const plans = [
        {
          id: SubscriptionPlan.FREE,
          name: 'Free Trial',
          price: 0,
          currency: 'INR',
          billingCycle: 'Forever',
          features: [
            'Up to 50 Products',
            'Fast POS & Thermal Receipt Print',
            'Customer Udhaar Ledger',
            'Daily Sales Summary',
            'Mobile & Desktop Access'
          ]
        },
        {
          id: SubscriptionPlan.PRO,
          name: 'Vyapaar Pro',
          price: 199,
          currency: 'INR',
          billingCycle: 'per month',
          recommended: true,
          features: [
            'Unlimited Products & Categories',
            'Complete Inventory & Stock Movement Ledger',
            'Unlimited Udhaar & WhatsApp Reminders',
            'Dynamic UPI QR Generator',
            'Profit & Loss + GST Reports',
            'Offline PWA Billing & Auto-Sync',
            'Up to 3 Staff Accounts'
          ]
        },
        {
          id: SubscriptionPlan.BUSINESS,
          name: 'Vyapaar Business',
          price: 499,
          currency: 'INR',
          billingCycle: 'per month',
          features: [
            'All Pro Features Included',
            'Full Supplier & Purchase Orders Management',
            'Multi-Staff Accounts (Up to 25 staff) with RBAC',
            'Advanced Tax Reports & CSV Exports',
            'Multiple Cashier Registers',
            'Priority 24/7 Phone & WhatsApp Support'
          ]
        }
      ];

      res.json({
        success: true,
        data: {
          currentSubscription: business.subscription,
          plans
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Simulate subscription checkout / upgrade (with simulated Razorpay order ID and verification)
   */
  static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { plan } = req.body;

      if (!Object.values(SubscriptionPlan).includes(plan)) {
        res.status(400).json({ success: false, message: 'Invalid subscription plan' });
        return;
      }

      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      // Upgrade subscription
      business.subscription.plan = plan;
      business.subscription.status = SubscriptionStatus.ACTIVE;
      business.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      if (plan === SubscriptionPlan.FREE) {
        business.subscription.productLimit = 50;
      } else {
        business.subscription.productLimit = 1000000;
      }

      await business.save();

      res.json({
        success: true,
        message: `Plan upgraded successfully to ${plan}!`,
        data: business.subscription
      });
    } catch (err) {
      next(err);
    }
  }
}
