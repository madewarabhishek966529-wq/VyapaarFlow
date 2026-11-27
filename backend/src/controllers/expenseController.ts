import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Expense } from '../models/Expense';
import { expenseSchema } from '@vyapaarflow/shared';

export class ExpenseController {
  /**
   * Get all expenses with category and date filtering
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { category, startDate, endDate, limit = '100', page = '1' } = req.query;

      const query: any = { businessId };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 100;
      const skip = (pageNum - 1) * limitNum;

      const aggMatch = {
        ...query,
        businessId: new mongoose.Types.ObjectId(businessId!)
      };

      const [expenses, total, summary] = await Promise.all([
        Expense.find(query).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
        Expense.countDocuments(query),
        Expense.aggregate([
          { $match: aggMatch },
          { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          expenses,
          total,
          totalAmount: summary[0]?.totalAmount || 0,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Record a new business expense
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const validated = expenseSchema.parse(req.body);

      const expense = await Expense.create({
        ...validated,
        businessId,
        date: new Date(validated.date),
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: expense
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an expense
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      const expense = await Expense.findOneAndDelete({ _id: id, businessId });
      if (!expense) {
        res.status(404).json({ success: false, message: 'Expense not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
