import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { Expense } from '../models/Expense';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { AnalyticsService } from '../services/analyticsService';

export class ReportController {
  /**
   * Main dashboard analytics overview
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getDashboardOverview(req.businessId!);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Sales report with period grouping and aggregation
   */
  static async getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = new mongoose.Types.ObjectId(req.businessId);
      const { startDate, endDate } = req.query;

      const match: any = { businessId, isReturned: false };
      if (startDate || endDate) {
        match.saleDate = {};
        if (startDate) match.saleDate.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          match.saleDate.$lte = end;
        }
      }

      const salesAgg = await Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
            totalSales: { $sum: '$grandTotal' },
            totalTax: { $sum: '$totalTax' },
            cashSales: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$grandTotal', 0] }
            },
            upiSales: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'UPI'] }, '$grandTotal', 0] }
            },
            udhaarSales: { $sum: '$udhaarAmount' },
            invoiceCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const totals = salesAgg.reduce(
        (acc, cur) => ({
          totalSales: acc.totalSales + cur.totalSales,
          totalTax: acc.totalTax + cur.totalTax,
          cashSales: acc.cashSales + cur.cashSales,
          upiSales: acc.upiSales + cur.upiSales,
          udhaarSales: acc.udhaarSales + cur.udhaarSales,
          invoiceCount: acc.invoiceCount + cur.invoiceCount
        }),
        { totalSales: 0, totalTax: 0, cashSales: 0, upiSales: 0, udhaarSales: 0, invoiceCount: 0 }
      );

      res.json({
        success: true,
        data: {
          periodData: salesAgg,
          totals
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Profit & Loss report (Reconciles Revenue - COGS = Gross Profit - Expenses = Net Profit)
   */
  static async getProfitLossReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = new mongoose.Types.ObjectId(req.businessId);
      const { startDate, endDate } = req.query;

      const saleMatch: any = { businessId, isReturned: false };
      const expMatch: any = { businessId };

      if (startDate || endDate) {
        saleMatch.saleDate = {};
        expMatch.date = {};
        if (startDate) {
          saleMatch.saleDate.$gte = new Date(startDate as string);
          expMatch.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          saleMatch.saleDate.$lte = end;
          expMatch.date.$lte = end;
        }
      }

      // 1. Calculate sales and COGS
      const revenueAndCogs = await Sale.aggregate([
        { $match: saleMatch },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$items.totalPrice' },
            totalCogs: {
              $sum: {
                $multiply: [
                  '$items.quantity',
                  { $ifNull: ['$product.purchasePrice', { $multiply: ['$items.unitPrice', 0.8] }] }
                ]
              }
            }
          }
        }
      ]);

      const totalRevenue = revenueAndCogs[0]?.totalRevenue || 0;
      const totalCogs = revenueAndCogs[0]?.totalCogs || 0;
      const grossProfit = Math.max(0, totalRevenue - totalCogs);

      // 2. Expenses breakdown by category
      const expenseBreakdown = await Expense.aggregate([
        { $match: expMatch },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);
      const netProfit = grossProfit - totalExpenses;

      res.json({
        success: true,
        data: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalCogs: Math.round(totalCogs * 100) / 100,
          grossProfit: Math.round(grossProfit * 100) / 100,
          grossProfitMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0,
          expenseBreakdown,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          netProfitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GST Tax Summary Report (0%, 5%, 12%, 18%, 28%)
   */
  static async getTaxSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = new mongoose.Types.ObjectId(req.businessId);

      const taxAgg = await Sale.aggregate([
        { $match: { businessId, isReturned: false } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.taxRate',
            taxableAmount: {
              $sum: { $subtract: ['$items.totalPrice', '$items.taxAmount'] }
            },
            totalTax: { $sum: '$items.taxAmount' },
            totalAmount: { $sum: '$items.totalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        data: taxAgg.map(t => ({
          rate: t._id,
          taxableAmount: Math.round(t.taxableAmount * 100) / 100,
          cgst: Math.round((t.totalTax / 2) * 100) / 100,
          sgst: Math.round((t.totalTax / 2) * 100) / 100,
          totalTax: Math.round(t.totalTax * 100) / 100,
          totalAmount: Math.round(t.totalAmount * 100) / 100
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export sales data to CSV
   */
  static async exportSalesCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const sales = await Sale.find({ businessId }).sort({ saleDate: -1 }).lean();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="VyapaarFlow_Sales.csv"');

      const escapeCsv = (val: any): string => {
        const str = String(val ?? '');
        const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
        return `"${safe.replace(/"/g, '""')}"`;
      };

      let csv = 'Invoice Number,Date,Customer,Grand Total,Payment Method,Status,Paid Amount,Udhaar Amount\n';
      for (const s of sales) {
        csv += [
          escapeCsv(s.invoiceNumber),
          escapeCsv(new Date(s.saleDate).toLocaleDateString('en-IN')),
          escapeCsv(s.customerName || 'Walk-in'),
          escapeCsv(s.grandTotal),
          escapeCsv(s.paymentMethod),
          escapeCsv(s.paymentStatus),
          escapeCsv(s.amountPaid),
          escapeCsv(s.udhaarAmount)
        ].join(',') + '\n';
      }

      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
}
