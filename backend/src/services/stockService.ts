import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { StockMovementType } from '@vyapaarflow/shared';

export interface IStockDeductionItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export class StockService {
  /**
   * Deduct stock for sold items with negative stock check
   */
  static async deductStockForSale(
    businessId: string,
    items: IStockDeductionItem[],
    invoiceNumber: string,
    userId: string,
    allowNegativeStock: boolean = false
  ): Promise<void> {
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, businessId });
      if (!product) {
        throw new Error(`Product not found with ID: ${item.productId}`);
      }

      if (!allowNegativeStock && product.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock} ${product.unit}, Requested: ${item.quantity} ${product.unit}`
        );
      }

      const previousStock = product.currentStock;
      const newStock = previousStock - item.quantity;

      // Update product currentStock
      product.currentStock = newStock;
      await product.save();

      // Record immutable stock movement ledger entry
      await StockMovement.create({
        businessId,
        productId: product._id,
        productName: product.name,
        type: StockMovementType.SALE,
        quantity: item.quantity,
        previousStock,
        newStock,
        unitPrice: item.unitPrice,
        referenceId: invoiceNumber,
        reason: `Sold on Invoice #${invoiceNumber}`,
        createdBy: userId
      });
    }
  }

  /**
   * Revert stock deduction when sale is returned/cancelled
   */
  static async revertStockForReturn(
    businessId: string,
    items: IStockDeductionItem[],
    invoiceNumber: string,
    userId: string,
    reason: string
  ): Promise<void> {
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, businessId });
      if (product) {
        const previousStock = product.currentStock;
        const newStock = previousStock + item.quantity;
        product.currentStock = newStock;
        await product.save();

        await StockMovement.create({
          businessId,
          productId: product._id,
          productName: product.name,
          type: StockMovementType.SALE_RETURN,
          quantity: item.quantity,
          previousStock,
          newStock,
          unitPrice: item.unitPrice,
          referenceId: invoiceNumber,
          reason: `Returned from Invoice #${invoiceNumber}: ${reason}`,
          createdBy: userId
        });
      }
    }
  }

  /**
   * Adjust stock manually (Audit, Damaged, Count correction)
   */
  static async adjustStock(
    businessId: string,
    productId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    userId: string
  ): Promise<{ previousStock: number; newStock: number }> {
    const product = await Product.findOne({ _id: productId, businessId });
    if (!product) {
      throw new Error('Product not found');
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    if (type === StockMovementType.ADJUSTMENT_ADD || type === StockMovementType.PURCHASE) {
      newStock = previousStock + quantity;
    } else if (type === StockMovementType.ADJUSTMENT_SUB || type === StockMovementType.DAMAGE) {
      newStock = previousStock - quantity;
      if (newStock < 0) {
        newStock = 0;
      }
    }

    product.currentStock = newStock;
    await product.save();

    await StockMovement.create({
      businessId,
      productId: product._id,
      productName: product.name,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      createdBy: userId
    });

    return { previousStock, newStock };
  }
}
