import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { Business } from '../models/Business';
import { Customer } from '../models/Customer';
import { CustomerLedger } from '../models/CustomerLedger';
import { Product } from '../models/Product';
import { StockService } from '../services/stockService';
import { InvoiceService } from '../services/invoiceService';
import { QrService } from '../services/qrService';
import { saleSchema, CustomerLedgerType, PaymentStatus, PaymentMethod } from '@vyapaarflow/shared';

export class PosController {
  /**
   * Process a new POS sale with authoritative server-side price calculation,
   * tenant-boundary validation, atomic stock deduction, and Udhaar ledger update.
   */
  static async createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const validated = saleSchema.parse(req.body);

      // Check idempotency to prevent duplicate submissions
      if (validated.idempotencyKey) {
        const existingSale = await Sale.findOne({ businessId, idempotencyKey: validated.idempotencyKey });
        if (existingSale) {
          res.status(200).json({
            success: true,
            message: 'Sale already confirmed (idempotent)',
            data: existingSale
          });
          return;
        }
      }

      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      // Authoritative Server-side Price & Tenant Ownership Verification (Defense against Price Manipulation #4 & Negative Quantity #5)
      const productIds = validated.items.map(i => i.productId);
      const dbProducts = await Product.find({
        _id: { $in: productIds },
        businessId,
        isActive: true
      });

      if (dbProducts.length !== productIds.length) {
        res.status(400).json({
          success: false,
          message: 'One or more items in the cart are invalid, inactive, or belong to another store.'
        });
        return;
      }

      const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

      // Server recalculates authoritative line items using trusted database values
      const authoritativeItems = validated.items.map(item => {
        const dbProduct = productMap.get(item.productId)!;
        const authoritativeUnitPrice = dbProduct.sellingPrice > 0 ? dbProduct.sellingPrice : dbProduct.mrp;
        const authoritativeTaxRate = dbProduct.taxRate || 0;
        const qty = item.quantity;

        if (qty <= 0 || !Number.isFinite(qty) || qty > 100000) {
          throw new Error(`Invalid quantity ${qty} for product ${dbProduct.name}`);
        }

        const itemSubtotal = Math.round(qty * authoritativeUnitPrice * 100) / 100;
        const discPercent = Math.min(100, Math.max(0, item.discountPercent || 0));
        const itemDiscount = Math.round(itemSubtotal * (discPercent / 100) * 100) / 100;
        const itemTaxable = Math.max(0, itemSubtotal - itemDiscount);
        const itemTax = Math.round(itemTaxable * (authoritativeTaxRate / 100) * 100) / 100;
        const itemTotal = itemTaxable;

        return {
          productId: dbProduct._id.toString(),
          productName: dbProduct.name,
          sku: dbProduct.sku,
          barcode: dbProduct.barcode,
          unit: dbProduct.unit,
          quantity: qty,
          unitPrice: authoritativeUnitPrice,
          mrp: dbProduct.mrp,
          discountPercent: discPercent,
          discountAmount: itemDiscount,
          taxRate: authoritativeTaxRate,
          taxAmount: itemTax,
          totalPrice: itemTotal,
          batchNumber: item.batchNumber
        };
      });

      const serverSubtotal = authoritativeItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
      const billDiscPercent = Math.min(100, Math.max(0, validated.billDiscountPercent || 0));
      const serverBillDiscountAmount = Math.round(serverSubtotal * (billDiscPercent / 100) * 100) / 100;
      const serverTaxableTotal = Math.max(0, serverSubtotal - serverBillDiscountAmount);
      const serverTotalTax = authoritativeItems.reduce((acc, i) => acc + i.taxAmount, 0);
      const serverGrandTotal = Math.round(serverTaxableTotal);
      const serverRoundOff = Math.round((serverGrandTotal - serverTaxableTotal) * 100) / 100;

      // Reconcile payment totals with authoritative figures
      const isUdhaar = validated.paymentMethod === PaymentMethod.UDHAAR;
      const finalUdhaarAmount = isUdhaar
        ? serverGrandTotal
        : Math.min(serverGrandTotal, Math.max(0, validated.udhaarAmount || 0));
      const finalAmountPaid = isUdhaar ? 0 : Math.max(0, serverGrandTotal - finalUdhaarAmount);

      // Generate invoice number sequentially based on business settings
      const prefix = business.settings.invoicePrefix || 'INV-';
      const seq = business.settings.nextInvoiceNumber || 1;
      const invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      // 1. Deduct stock with inventory validation
      await StockService.deductStockForSale(
        businessId,
        authoritativeItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        })),
        invoiceNumber,
        userId,
        business.settings.allowNegativeStock
      );

      // 2. Handle Customer Udhaar if finalUdhaarAmount > 0
      let customerDoc = null;
      if (validated.customerId) {
        customerDoc = await Customer.findOne({ _id: validated.customerId, businessId });
        if (customerDoc) {
          customerDoc.totalPurchases += serverGrandTotal;
          if (finalUdhaarAmount > 0) {
            customerDoc.currentBalance += finalUdhaarAmount;
            
            // Record immutable Udhaar credit ledger entry
            await CustomerLedger.create({
              businessId,
              customerId: customerDoc._id,
              type: CustomerLedgerType.CREDIT_GIVEN,
              amount: finalUdhaarAmount,
              balanceAfter: customerDoc.currentBalance,
              invoiceNumber,
              referenceNumber: invoiceNumber,
              notes: `Credit on Bill #${invoiceNumber}`,
              createdBy: userId
            });
          }
          await customerDoc.save();
        }
      }

      // 3. Increment next invoice number
      business.settings.nextInvoiceNumber = seq + 1;
      await business.save();

      // 4. Create Sale document with verified authoritative figures
      const sale = await Sale.create({
        ...validated,
        items: authoritativeItems,
        subtotal: serverSubtotal,
        billDiscountPercent: billDiscPercent,
        billDiscountAmount: serverBillDiscountAmount,
        totalTax: serverTotalTax,
        roundOff: serverRoundOff,
        grandTotal: serverGrandTotal,
        amountPaid: finalAmountPaid,
        udhaarAmount: finalUdhaarAmount,
        businessId,
        invoiceNumber,
        saleDate: new Date(),
        paymentStatus: finalUdhaarAmount > 0 ? (finalAmountPaid > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING) : PaymentStatus.COMPLETED,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Sale completed successfully',
        data: sale
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all sales for the business with date filtering and pagination
   */
  static async getAllSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { startDate, endDate, customerId, paymentMethod, limit = '50', page = '1' } = req.query;

      const query: any = { businessId };

      if (customerId) {
        query.customerId = customerId;
      }

      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }

      if (startDate || endDate) {
        query.saleDate = {};
        if (startDate) query.saleDate.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          query.saleDate.$lte = end;
        }
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      const [sales, total] = await Promise.all([
        Sale.find(query).sort({ saleDate: -1 }).skip(skip).limit(limitNum).lean(),
        Sale.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          sales,
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
   * Get sale details by ID or Invoice number
   */
  static async getSaleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;

      const filter: any = { businessId };
      if (mongoose.Types.ObjectId.isValid(id)) {
        filter.$or = [{ _id: id }, { invoiceNumber: id }];
      } else {
        filter.invoiceNumber = id;
      }

      const sale = await Sale.findOne(filter).lean();

      if (!sale) {
        res.status(404).json({ success: false, message: 'Sale invoice not found' });
        return;
      }

      res.json({ success: true, data: sale });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generate Thermal Receipt print text
   */
  static async getThermalReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { id } = req.params;
      const width = req.query.width === '80' ? 80 : 58;

      const filter: any = { businessId };
      if (mongoose.Types.ObjectId.isValid(id)) {
        filter.$or = [{ _id: id }, { invoiceNumber: id }];
      } else {
        filter.invoiceNumber = id;
      }

      const [sale, business] = await Promise.all([
        Sale.findOne(filter).lean(),
        Business.findById(businessId).lean()
      ]);

      if (!sale || !business) {
        res.status(404).json({ success: false, message: 'Invoice or business details not found' });
        return;
      }

      const receiptText = InvoiceService.formatThermalReceipt(sale, business, width);
      res.json({
        success: true,
        data: {
          receiptText,
          paperWidthMm: width
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generate dynamic UPI payment QR for checkout
   */
  static async getUpiQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId;
      const { amount, note, invoiceNumber } = req.query;

      const business = await Business.findById(businessId).lean();
      if (!business) {
        res.status(404).json({ success: false, message: 'Business not found' });
        return;
      }

      const upiId = business.settings?.upiId?.trim();
      if (!upiId) {
        res.status(400).json({
          success: false,
          message: 'Store UPI ID is not configured. Please update it in Settings.'
        });
        return;
      }
      const payeeName = business.settings?.upiName || business.name;
      const amtNum = parseFloat(amount as string) || 0;

      const upiUri = QrService.generateUpiUri({
        upiId,
        payeeName,
        amount: amtNum,
        transactionNote: (note as string) || `Bill ${invoiceNumber || ''}`
      });

      const qrDataUrl = await QrService.generateQrDataUrl(upiUri);

      res.json({
        success: true,
        data: {
          upiId,
          payeeName,
          amount: amtNum,
          upiUri,
          qrDataUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Process invoice return / cancellation
   */
  static async returnSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const { reason = 'Customer returned goods' } = req.body;

      const sale = await Sale.findOne({ businessId, _id: id });
      if (!sale) {
        res.status(404).json({ success: false, message: 'Sale not found' });
        return;
      }

      if (sale.isReturned) {
        res.status(400).json({ success: false, message: 'This invoice has already been returned.' });
        return;
      }

      // Revert stock back into inventory
      await StockService.revertStockForReturn(
        businessId,
        sale.items.map(i => ({ productId: i.productId.toString(), quantity: i.quantity, unitPrice: i.unitPrice })),
        sale.invoiceNumber,
        userId,
        reason
      );

      // Revert customer Udhaar if any
      if (sale.customerId && sale.udhaarAmount > 0) {
        const customer = await Customer.findOne({ _id: sale.customerId, businessId });
        if (customer) {
          customer.currentBalance = Math.max(0, customer.currentBalance - sale.udhaarAmount);
          await customer.save();

          await CustomerLedger.create({
            businessId,
            customerId: customer._id,
            type: CustomerLedgerType.ADJUSTMENT,
            amount: sale.udhaarAmount,
            balanceAfter: customer.currentBalance,
            invoiceNumber: sale.invoiceNumber,
            notes: `Credit reversed due to return: ${reason}`,
            createdBy: userId
          });
        }
      }

      sale.isReturned = true;
      sale.returnReason = reason;
      sale.paymentStatus = PaymentStatus.REFUNDED;
      await sale.save();

      res.json({
        success: true,
        message: 'Invoice returned and stock restored successfully',
        data: sale
      });
    } catch (err) {
      next(err);
    }
  }
}
