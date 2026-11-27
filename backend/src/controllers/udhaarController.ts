import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer';
import { CustomerLedger } from '../models/CustomerLedger';
import { Business } from '../models/Business';
import { udhaarPaymentSchema, CustomerLedgerType } from '@vyapaarflow/shared';

export class UdhaarController {
  /**
   * Record Udhaar repayment from customer (partial or full)
   */
  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const validated = udhaarPaymentSchema.parse(req.body);

      const customer = await Customer.findOne({ _id: validated.customerId, businessId });
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      if (customer.currentBalance <= 0) {
        res.status(400).json({ success: false, message: 'Customer does not have any pending Udhaar balance.' });
        return;
      }

      const previousBalance = customer.currentBalance;
      const newBalance = Math.max(0, previousBalance - validated.amount);
      customer.currentBalance = newBalance;
      await customer.save();

      // Record immutable ledger entry
      const ledgerEntry = await CustomerLedger.create({
        businessId,
        customerId: customer._id,
        type: CustomerLedgerType.PAYMENT_RECEIVED,
        amount: validated.amount,
        balanceAfter: newBalance,
        paymentMethod: validated.paymentMethod,
        referenceNumber: validated.referenceNumber,
        notes: validated.notes || 'Udhaar payment received',
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: `₹${validated.amount} payment recorded for ${customer.name}. New outstanding balance: ₹${newBalance}`,
        data: {
          customer,
          ledgerEntry
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Udhaar overview summary (Total credit given, collected, outstanding balance, overdue)
   */
  static async getUdhaarSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId!;
      const bId = new mongoose.Types.ObjectId(businessId);

      const summaryAgg = await CustomerLedger.aggregate([
        { $match: { businessId: bId } },
        {
          $group: {
            _id: null,
            totalCreditGiven: {
              $sum: {
                $cond: [{ $eq: ['$type', CustomerLedgerType.CREDIT_GIVEN] }, '$amount', 0]
              }
            },
            totalCollected: {
              $sum: {
                $cond: [{ $eq: ['$type', CustomerLedgerType.PAYMENT_RECEIVED] }, '$amount', 0]
              }
            }
          }
        }
      ]);

      const customerAgg = await Customer.aggregate([
        { $match: { businessId: bId } },
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$currentBalance' },
            customersWithCredit: {
              $sum: { $cond: [{ $gt: ['$currentBalance', 0] }, 1, 0] }
            }
          }
        }
      ]);

      const totalCreditGiven = summaryAgg[0]?.totalCreditGiven || 0;
      const totalCollected = summaryAgg[0]?.totalCollected || 0;
      const totalOutstanding = customerAgg[0]?.totalOutstanding || 0;
      const debtorsCount = customerAgg[0]?.customersWithCredit || 0;

      // Top Udhaar customers
      const topDebtors = await Customer.find({ businessId, currentBalance: { $gt: 0 } })
        .sort({ currentBalance: -1 })
        .limit(10)
        .lean();

      res.json({
        success: true,
        data: {
          totalCreditGiven,
          totalCollected,
          totalOutstanding,
          debtorsCount,
          topDebtors
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generate WhatsApp payment reminder message link with UPI payment link
   */
  static async generateReminderLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { customerId } = req.params;

      const [customer, business] = await Promise.all([
        Customer.findOne({ _id: customerId, businessId }).lean(),
        Business.findById(businessId).lean()
      ]);

      if (!customer || !business) {
        res.status(404).json({ success: false, message: 'Customer or business not found' });
        return;
      }

      if (customer.currentBalance <= 0) {
        res.status(400).json({ success: false, message: 'Customer has zero outstanding balance' });
        return;
      }

      const upiId = business.settings?.upiId;
      const upiLink = upiId
        ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(business.name)}&am=${customer.currentBalance.toFixed(2)}&cu=INR`
        : '';

      const message = `Namaste ${customer.name} ji,\n\nYour outstanding balance at *${business.name}* is *₹${customer.currentBalance.toFixed(2)}*.\n\nPlease pay at your earliest convenience.${
        upiLink ? `\n\nPay via UPI: ${upiLink}` : ''
      }\n\nThank you for choosing ${business.name}!\nPh: ${business.mobile}`;

      const whatsappMobile = customer.mobile.startsWith('91') ? customer.mobile : `91${customer.mobile}`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappMobile}&text=${encodeURIComponent(message)}`;

      res.json({
        success: true,
        data: {
          customerName: customer.name,
          mobile: customer.mobile,
          balance: customer.currentBalance,
          message,
          whatsappUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
