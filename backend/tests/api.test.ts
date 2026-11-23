import request from 'supertest';
import app from '../src/app';
import { connectDatabase, closeDatabase } from '../src/config/database';
import { BusinessCategory, PaymentMethod, UserRole } from '@vyapaarflow/shared';

describe('VyapaarFlow Full SaaS Integration & Security Test Suite', () => {
  let userToken: string;
  let userId: string;
  let businessId: string;
  let createdProductId: string;
  let customerId: string;
  let invoiceNumber: string;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('1. Authentication & Onboarding', () => {
    it('should register a new business owner account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mukesh Ambani',
          email: 'mukesh@retailmart.in',
          password: 'SecurePassword123!',
          mobile: '9822998877'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      userToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    it('should login with registered credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mukesh@retailmart.in',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should onboard a new business with Indian retail settings', async () => {
      const res = await request(app)
        .post('/api/business/onboard')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          businessName: 'Jio Retail & Kirana Mart',
          ownerName: 'Mukesh Ambani',
          mobile: '9822998877',
          email: 'mukesh@retailmart.in',
          category: BusinessCategory.GROCERY,
          address: 'Shop 101, Bandra Kurla Complex',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400051',
          gstin: '27AAAAA0000A1Z5',
          currency: 'INR',
          language: 'en',
          invoicePrefix: 'JIO-',
          startingInvoiceNumber: 1,
          upiId: 'jioretail@upi',
          upiName: 'Jio Retail Mart'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      businessId = res.body.data._id;
    });
  });

  describe('2. Product Catalogue & Inventory Management', () => {
    it('should create a new product with initial stock and barcode', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId)
        .send({
          name: 'Haldiram Aloo Bhujia 400g',
          sku: 'HLD-ALOO-400G',
          barcode: '8904063200999',
          category: 'Snacks & Beverages',
          brand: 'Haldiram',
          unit: 'pkt',
          purchasePrice: 90,
          sellingPrice: 110,
          mrp: 120,
          taxRate: 12,
          currentStock: 50,
          minStockLevel: 10
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStock).toBe(50);
      createdProductId = res.body.data._id;
    });

    it('should instant lookup product by scanned barcode', async () => {
      const res = await request(app)
        .get('/api/products/barcode/8904063200999')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Haldiram Aloo Bhujia 400g');
    });
  });

  describe('3. Customer Management & Udhaar', () => {
    it('should add a new customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId)
        .send({
          name: 'Rajesh Khandelwal',
          mobile: '9890123456',
          address: 'Bandra West, Mumbai',
          creditLimit: 5000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentBalance).toBe(0);
      customerId = res.body.data._id;
    });
  });

  describe('4. Billing (POS) & Stock Deduction', () => {
    it('should process a POS sale, deduct stock, and record partial Udhaar credit', async () => {
      const idempotencyKey = 'sale-unique-uuid-1001';

      const res = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId)
        .send({
          customerId,
          customerName: 'Rajesh Khandelwal',
          customerMobile: '9890123456',
          items: [
            {
              productId: createdProductId,
              productName: 'Haldiram Aloo Bhujia 400g',
              sku: 'HLD-ALOO-400G',
              unit: 'pkt',
              quantity: 5, // 5 packets sold
              unitPrice: 110,
              mrp: 120,
              discountPercent: 0,
              discountAmount: 0,
              taxRate: 12,
              taxAmount: 58.93,
              totalPrice: 550
            }
          ],
          subtotal: 550,
          billDiscountPercent: 0,
          billDiscountAmount: 0,
          totalTax: 58.93,
          roundOff: 0,
          grandTotal: 550,
          paymentMethod: PaymentMethod.SPLIT,
          amountPaid: 200, // ₹200 paid in Cash
          udhaarAmount: 350, // ₹350 on Udhaar
          idempotencyKey
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoiceNumber).toBe('JIO-0001');
      invoiceNumber = res.body.data.invoiceNumber;
      expect(res.body.data.udhaarAmount).toBe(350);

      // Verify idempotency (re-submitting same idempotency key returns same bill)
      const duplicateRes = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId)
        .send({
          items: [{ productId: createdProductId, productName: 'X', sku: 'X', quantity: 1, unitPrice: 10, mrp: 10, totalPrice: 10 }],
          subtotal: 10,
          grandTotal: 10,
          paymentMethod: PaymentMethod.CASH,
          amountPaid: 10,
          idempotencyKey
        });

      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.body.data.invoiceNumber).toBe('JIO-0001');
    });

    it('should verify product stock was deducted from 50 to 45', async () => {
      const res = await request(app)
        .get(`/api/products`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId);

      const product = res.body.data.products.find((p: any) => p._id === createdProductId);
      expect(product.currentStock).toBe(45);
    });

    it('should verify customer Udhaar balance increased to 350', async () => {
      const res = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId);

      expect(res.body.data.customer.currentBalance).toBe(350);
      expect(res.body.data.ledger.length).toBeGreaterThan(0);
    });

    it('should record an Udhaar repayment of ₹200 and verify balance becomes ₹150', async () => {
      const res = await request(app)
        .post('/api/udhaar/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId)
        .send({
          customerId,
          amount: 200,
          paymentMethod: PaymentMethod.UPI,
          referenceNumber: 'UPI-TEST-001'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customer.currentBalance).toBe(150);
    });

    it('should generate WhatsApp reminder link with pre-filled message and UPI link', async () => {
      const res = await request(app)
        .get(`/api/udhaar/reminder/${customerId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(res.body.data.whatsappUrl).toContain('https://api.whatsapp.com/send');
      expect(res.body.data.balance).toBe(150);
    });

    it('should generate 58mm thermal receipt text format', async () => {
      const res = await request(app)
        .get(`/api/pos/receipt/${invoiceNumber}?width=58`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(res.body.data.receiptText).toContain('JIO RETAIL');
      expect(res.body.data.receiptText).toContain('GRAND TOTAL');
    });
  });

  describe('5. Expense & Profit/Loss Reconciliation', () => {
    it('should record a shop expense', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId)
        .send({
          category: 'ELECTRICITY',
          title: 'Shop Light Bill',
          amount: 50,
          date: new Date().toISOString(),
          paymentMethod: PaymentMethod.CASH
        });

      expect(res.status).toBe(201);
    });

    it('should calculate Profit and Loss correctly', async () => {
      const res = await request(app)
        .get('/api/reports/profit-loss')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(res.body.data.totalRevenue).toBe(550);
      // Cost was 5 * 90 = 450
      expect(res.body.data.totalCogs).toBe(450);
      // Gross Profit = 550 - 450 = 100
      expect(res.body.data.grossProfit).toBe(100);
      // Net Profit = 100 - 50 = 50
      expect(res.body.data.netProfit).toBe(50);
    });
  });

  describe('6. Security & Multi-Tenant Data Isolation', () => {
    it('should prevent access to another tenant data', async () => {
      // Create a dummy fake business ID
      const fakeBusinessId = '666666666666666666666666';

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-business-id', fakeBusinessId);

      expect(res.status).toBe(200);
      // Products for fake business must be completely empty!
      expect(res.body.data.products.length).toBe(0);
    });

    it('should block unauthorized requests without token', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
    });
  });
});
