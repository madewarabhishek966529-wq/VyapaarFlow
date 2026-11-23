import { Request, Response, NextFunction } from 'express';
import { Customer } from '../models/Customer';
import { CustomerLedger } from '../models/CustomerLedger';
import { Sale } from '../models/Sale';
import { customerSchema } from '@vyapaarflow/shared';

export class CustomerController {
  /**
   * Get all customers for the business
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { search, hasUdhaar, limit = '100', page = '1' } = req.query;

      const query: any = { businessId };

      if (hasUdhaar === 'true') {
        query.currentBalance = { $gt: 0 };
      }

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { name: regex },
          { mobile: regex },
          { customerCode: regex }
        ];
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 100;
      const skip = (pageNum - 1) * limitNum;

      const [customers, total] = await Promise.all([
        Customer.find(query).sort({ currentBalance: -1, updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
        Customer.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          customers,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new customer
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const validated = customerSchema.parse(req.body);

      // Check if mobile already exists for this business
      const existing = await Customer.findOne({ businessId, mobile: validated.mobile });
      if (existing) {
        res.status(409).json({ success: false, message: `Customer with mobile ${validated.mobile} already exists.` });
        return;
      }

      // Generate customer code e.g. CUST-001
      const totalCount = await Customer.countDocuments({ businessId });
      const customerCode = `CUST-${String(totalCount + 1).padStart(3, '0')}`;

      const customer = await Customer.create({
        ...validated,
        businessId,
        customerCode,
        currentBalance: 0,
        totalPurchases: 0
      });

      res.status(201).json({
        success: true,
        message: 'Customer added successfully',
        data: customer
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update customer details
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;
      const validated = customerSchema.parse(req.body);

      const customer = await Customer.findOne({ _id: id, businessId });
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      Object.assign(customer, validated);
      await customer.save();

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single customer with detailed purchase and Udhaar ledger history
   */
  static async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      const customer = await Customer.findOne({ _id: id, businessId }).lean();
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      const [ledger, sales] = await Promise.all([
        CustomerLedger.find({ businessId, customerId: id }).sort({ createdAt: -1 }).limit(100).lean(),
        Sale.find({ businessId, customerId: id }).sort({ saleDate: -1 }).limit(50).lean()
      ]);

      res.json({
        success: true,
        data: {
          customer,
          ledger,
          sales
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
