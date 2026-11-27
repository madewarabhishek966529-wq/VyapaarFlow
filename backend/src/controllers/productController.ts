import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { StockService } from '../services/stockService';
import { productSchema, stockAdjustmentSchema, StockMovementType } from '@vyapaarflow/shared';

export class ProductController {
  /**
   * Get all products for the active business with search, filter, and pagination
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { search, category, lowStock, limit = '100', page = '1' } = req.query;

      const query: any = { businessId, isActive: true };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (search) {
        const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safe, 'i');
        query.$or = [
          { name: regex },
          { sku: regex },
          { barcode: regex },
          { brand: regex }
        ];
      }

      if (lowStock === 'true') {
        query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 100;
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await Promise.all([
        Product.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
        Product.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          products,
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
   * Get product by barcode or SKU for instant POS scanning
   */
  static async lookupBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { code } = req.params;

      const product = await Product.findOne({
        businessId,
        isActive: true,
        $or: [{ barcode: code }, { sku: code }]
      }).lean();

      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found for scanned code.' });
        return;
      }

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new product
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const validated = productSchema.parse(req.body);

      // Verify unique SKU within this business
      const existingSku = await Product.findOne({ businessId, sku: validated.sku, isActive: true });
      if (existingSku) {
        res.status(409).json({ success: false, message: `A product with SKU "${validated.sku}" already exists.` });
        return;
      }

      const newProduct = await Product.create({
        ...validated,
        barcode: validated.barcode || undefined,
        supplierId: validated.supplierId || undefined,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined,
        businessId
      });

      // Record initial stock movement if starting stock > 0
      if (validated.currentStock > 0) {
        await StockMovement.create({
          businessId,
          productId: newProduct._id,
          productName: newProduct.name,
          type: StockMovementType.INITIAL,
          quantity: validated.currentStock,
          previousStock: 0,
          newStock: validated.currentStock,
          unitPrice: validated.purchasePrice,
          reason: 'Initial stock on product creation',
          createdBy: req.user?.userId
        });
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: newProduct
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing product
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;
      const validated = productSchema.parse(req.body);

      const product = await Product.findOne({ _id: id, businessId });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      // Check SKU uniqueness if changed
      if (validated.sku !== product.sku) {
        const existing = await Product.findOne({ businessId, sku: validated.sku, _id: { $ne: id }, isActive: true });
        if (existing) {
          res.status(409).json({ success: false, message: `SKU "${validated.sku}" is already in use by another product.` });
          return;
        }
      }

      // If stock was directly updated in edit form, record adjustment
      if (validated.currentStock !== product.currentStock) {
        const diff = validated.currentStock - product.currentStock;
        await StockMovement.create({
          businessId,
          productId: product._id,
          productName: validated.name,
          type: diff > 0 ? StockMovementType.ADJUSTMENT_ADD : StockMovementType.ADJUSTMENT_SUB,
          quantity: Math.abs(diff),
          previousStock: product.currentStock,
          newStock: validated.currentStock,
          reason: 'Manual adjustment via product edit',
          createdBy: req.user?.userId
        });
      }

      Object.assign(product, {
        ...validated,
        barcode: validated.barcode || undefined,
        supplierId: validated.supplierId || undefined,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined
      });
      await product.save();

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete / Archive a product
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      const product = await Product.findOne({ _id: id, businessId });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      // Soft delete to protect historical transaction integrity
      product.isActive = false;
      await product.save();

      res.json({
        success: true,
        message: 'Product archived successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Adjust stock manually
   */
  static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const validated = stockAdjustmentSchema.parse(req.body);

      const result = await StockService.adjustStock(
        businessId!,
        validated.productId,
        validated.type,
        validated.quantity,
        validated.reason,
        req.user!.userId
      );

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get stock movement audit trail for a product
   */
  static async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { productId } = req.params;

      const query: any = { businessId };
      if (productId) {
        query.productId = productId;
      }

      const movements = await StockMovement.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      res.json({
        success: true,
        data: movements
      });
    } catch (err) {
      next(err);
    }
  }
}
