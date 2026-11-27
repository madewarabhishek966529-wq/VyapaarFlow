import { Request, Response, NextFunction } from 'express';
import { Supplier } from '../models/Supplier';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { supplierSchema, StockMovementType, PaymentMethod } from '@vyapaarflow/shared';

export class SupplierController {
  /**
   * Get all suppliers
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { search } = req.query;

      const query: any = { businessId };
      if (search) {
        const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safe, 'i');
        query.$or = [{ name: regex }, { mobile: regex }, { contactPerson: regex }];
      }

      const suppliers = await Supplier.find(query).sort({ updatedAt: -1 }).lean();

      res.json({
        success: true,
        data: suppliers
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new supplier
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const validated = supplierSchema.parse(req.body);

      const supplier = await Supplier.create({
        ...validated,
        businessId,
        totalPurchases: 0,
        outstandingBalance: 0
      });

      res.status(201).json({
        success: true,
        message: 'Supplier added successfully',
        data: supplier
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Record a new stock purchase entry from a supplier
   */
  static async recordPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const {
        supplierId,
        purchaseInvoiceNo,
        purchaseDate,
        items,
        amountPaid = 0,
        paymentMethod = PaymentMethod.CASH,
        notes
      } = req.body;

      const supplier = await Supplier.findOne({ _id: supplierId, businessId });
      if (!supplier) {
        res.status(404).json({ success: false, message: 'Supplier not found' });
        return;
      }

      let subtotal = 0;
      let totalTax = 0;
      const processedItems = [];

      for (const item of items) {
        const lineTotal = item.quantity * item.purchasePrice;
        const lineTax = (lineTotal * (item.taxRate || 0)) / 100;
        subtotal += lineTotal;
        totalTax += lineTax;

        processedItems.push({
          productId: item.productId,
          productName: item.productName,
          unit: item.unit || 'pcs',
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          taxRate: item.taxRate || 0,
          taxAmount: lineTax,
          totalAmount: lineTotal + lineTax,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
        });

        // Add to stock and update purchase price
        const product = await Product.findOne({ _id: item.productId, businessId });
        if (product) {
          const prev = product.currentStock;
          product.currentStock = prev + item.quantity;
          product.purchasePrice = item.purchasePrice;
          if (item.batchNumber) product.batchNumber = item.batchNumber;
          if (item.expiryDate) product.expiryDate = new Date(item.expiryDate);
          await product.save();

          await StockMovement.create({
            businessId,
            productId: product._id,
            productName: product.name,
            type: StockMovementType.PURCHASE,
            quantity: item.quantity,
            previousStock: prev,
            newStock: product.currentStock,
            unitPrice: item.purchasePrice,
            referenceId: purchaseInvoiceNo,
            reason: `Purchased from ${supplier.name} (Invoice #${purchaseInvoiceNo})`,
            createdBy: userId
          });
        }
      }

      const totalAmount = subtotal + totalTax;
      const balanceDue = Math.max(0, totalAmount - amountPaid);

      const purchase = await Purchase.create({
        businessId,
        supplierId,
        supplierName: supplier.name,
        purchaseInvoiceNo,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        items: processedItems,
        subtotal,
        totalTax,
        totalAmount,
        amountPaid,
        balanceDue,
        paymentMethod,
        notes,
        createdBy: userId
      });

      // Update supplier statistics
      supplier.totalPurchases += totalAmount;
      supplier.outstandingBalance += balanceDue;
      await supplier.save();

      res.status(201).json({
        success: true,
        message: 'Purchase recorded and stock added successfully',
        data: purchase
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single supplier with purchase history
   */
  static async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      const [supplier, purchases] = await Promise.all([
        Supplier.findOne({ _id: id, businessId }).lean(),
        Purchase.find({ businessId, supplierId: id }).sort({ purchaseDate: -1 }).limit(50).lean()
      ]);

      if (!supplier) {
        res.status(404).json({ success: false, message: 'Supplier not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          supplier,
          purchases
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
