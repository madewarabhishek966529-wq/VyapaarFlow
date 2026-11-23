import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { NotificationType } from '@vyapaarflow/shared';

export class NotificationController {
  /**
   * Get all notifications for business
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;

      // Auto check low stock and create notifications if not existing
      const lowStockProducts = await Product.find({
        businessId,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] }
      }).limit(5).lean();

      for (const p of lowStockProducts) {
        const existing = await Notification.findOne({
          businessId,
          type: NotificationType.LOW_STOCK,
          referenceId: p._id.toString(),
          isRead: false
        });
        if (!existing) {
          await Notification.create({
            businessId,
            type: NotificationType.LOW_STOCK,
            title: `Low Stock: ${p.name}`,
            message: `Current stock is ${p.currentStock} ${p.unit} (Minimum: ${p.minStockLevel} ${p.unit}). Consider restocking.`,
            referenceId: p._id.toString(),
            isRead: false
          });
        }
      }

      const notifications = await Notification.find({ businessId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      const unreadCount = await Notification.countDocuments({ businessId, isRead: false });

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark notification as read
   */
  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      await Notification.findOneAndUpdate({ _id: id, businessId }, { isRead: true });

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      await Notification.updateMany({ businessId, isRead: false }, { isRead: true });
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}
