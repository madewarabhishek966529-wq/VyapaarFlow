import { Request, Response, NextFunction } from 'express';
import { Business } from '../models/Business';
import { User } from '../models/User';
import { onboardingSchema, SubscriptionPlan, SubscriptionStatus } from '@vyapaarflow/shared';

export class BusinessController {
  /**
   * Complete business onboarding wizard
   */
  static async createOrOnboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = onboardingSchema.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const business = await Business.create({
        name: validated.businessName,
        ownerName: validated.ownerName,
        ownerId: userId,
        category: validated.category,
        mobile: validated.mobile,
        email: validated.email.toLowerCase(),
        address: validated.address,
        city: validated.city,
        state: validated.state,
        pincode: validated.pincode,
        gstin: validated.gstin?.toUpperCase() || undefined,
        currency: validated.currency || 'INR',
        language: validated.language,
        settings: {
          invoicePrefix: validated.invoicePrefix || 'INV-',
          nextInvoiceNumber: validated.startingInvoiceNumber || 1,
          enableGst: !!validated.gstin,
          allowNegativeStock: false,
          upiId: validated.upiId || undefined,
          upiName: validated.upiName || validated.businessName,
          financialYearStartMonth: 4,
          printHeaderNote: 'Thank you for your visit!',
          printFooterNote: 'Goods once sold cannot be returned without bill.'
        },
        subscription: {
          plan: SubscriptionPlan.PRO,
          status: SubscriptionStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 yr free trial for testing
          productLimit: 1000000
        }
      });

      // Update user currentBusinessId
      await User.findByIdAndUpdate(userId, { currentBusinessId: business._id });

      res.status(201).json({
        success: true,
        message: 'Business onboarded successfully',
        data: business
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get active business details
   */
  static async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const business = await Business.findById(req.businessId);
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      res.json({
        success: true,
        data: business
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update business profile & settings
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const business = await Business.findById(req.businessId);
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      const { name, ownerName, mobile, email, address, city, state, pincode, gstin, language, settings } = req.body;

      if (name) business.name = name;
      if (ownerName) business.ownerName = ownerName;
      if (mobile) business.mobile = mobile;
      if (email) business.email = email;
      if (address) business.address = address;
      if (city) business.city = city;
      if (state) business.state = state;
      if (pincode) business.pincode = pincode;
      if (gstin !== undefined) business.gstin = gstin ? gstin.toUpperCase() : undefined;
      if (language) business.language = language;

      if (settings) {
        business.settings = {
          ...business.settings,
          ...settings
        };
      }

      await business.save();

      res.json({
        success: true,
        message: 'Business settings updated successfully',
        data: business
      });
    } catch (err) {
      next(err);
    }
  }
}
