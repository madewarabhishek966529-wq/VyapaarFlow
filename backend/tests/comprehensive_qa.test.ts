import request from 'supertest';
import app from '../src/app';
import { connectDatabase, closeDatabase } from '../src/config/database';
import { User } from '../src/models/User';
import { Business } from '../src/models/Business';
import {
  BusinessCategory,
  ExpenseCategory,
  PaymentMethod,
  StockMovementType,
  SubscriptionPlan
} from '@vyapaarflow/shared';

describe('VyapaarFlow Senior QA Full-Coverage Regression & Edge-Case Suite', () => {
  let superAdminToken: string;
  let adminBusinessId: string;

  let shopToken: string;
  let shopBusinessId: string;

  let productId1: string;
  let productId2: string;
  let supplierId: string;
  let customerId: string;
  let saleIdToReturn: string;
  let expenseId1: string;

  beforeAll(async () => {
    await connectDatabase();
    // Ensure fresh DB state for deterministic first-user SuperAdmin check
    await Promise.all([User.deleteMany({}), Business.deleteMany({})]);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('1. Auth, RBAC, Duplicate Guards & Onboarding', () => {
    it('registers first user as SUPER_ADMIN and second user as OWNER', async () => {
      const firstRes = await request(app).post('/api/auth/register').send({
        name: 'Platform Owner',
        email: 'superowner@vyapaartest.in',
        password: 'StrongPassword123!',
        mobile: '9811111111'
      });
      expect(firstRes.status).toBe(201);
      expect(firstRes.body.data.user.isSuperAdmin).toBe(true);
      superAdminToken = firstRes.body.data.token;

      const secondRes = await request(app).post('/api/auth/register').send({
        name: 'Shop Owner',
        email: 'shopowner@vyapaartest.in',
        password: 'StrongPassword123!',
        mobile: '9822222222'
      });
      expect(secondRes.status).toBe(201);
      expect(secondRes.body.data.user.isSuperAdmin).toBe(false);
      shopToken = secondRes.body.data.token;
    });

    it('rejects duplicate email registration with 409 and invalid login with 401', async () => {
      const dupRes = await request(app).post('/api/auth/register').send({
        name: 'Dup',
        email: 'shopowner@vyapaartest.in',
        password: 'StrongPassword123!'
      });
      expect(dupRes.status).toBe(409);

      const badLogin = await request(app).post('/api/auth/login').send({
        email: 'shopowner@vyapaartest.in',
        password: 'WrongPassword!'
      });
      expect(badLogin.status).toBe(401);
    });

    it('onboards both businesses cleanly and enforces admin RBAC', async () => {
      const bizAdminRes = await request(app)
        .post('/api/business/onboard')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          businessName: 'Platform Admin Store',
          ownerName: 'Platform Owner',
          mobile: '9811111111',
          email: 'superowner@vyapaartest.in',
          category: BusinessCategory.GENERAL_RETAIL,
          address: 'Main Market Road',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          currency: 'INR',
          language: 'en'
        });
      expect(bizAdminRes.status).toBe(201);
      adminBusinessId = bizAdminRes.body.data._id;

      const bizShopRes = await request(app)
        .post('/api/business/onboard')
        .set('Authorization', `Bearer ${shopToken}`)
        .send({
          businessName: 'Kaveri Supermart',
          ownerName: 'Shop Owner',
          mobile: '9822222222',
          email: 'shopowner@vyapaartest.in',
          category: BusinessCategory.GROCERY,
          address: '45 Station Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          gstin: '27AABCU9603R1ZM',
          currency: 'INR',
          language: 'en',
          invoicePrefix: 'KAV-',
          startingInvoiceNumber: 1
        });
      expect(bizShopRes.status).toBe(201);
      shopBusinessId = bizShopRes.body.data._id;

      // Refresh token after onboarding sets currentBusinessId cleanly
      const loginShop = await request(app).post('/api/auth/login').send({
        email: 'shopowner@vyapaartest.in',
        password: 'StrongPassword123!'
      });
      shopToken = loginShop.body.data.token;

      // Non-superadmin denied access to /admin/stats
      const forbiddenRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${shopToken}`);
      expect(forbiddenRes.status).toBe(403);

      // Superadmin allowed access & can update business plan
      const adminStats = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(adminStats.status).toBe(200);
      expect(adminStats.body.data.totalBusinesses).toBeGreaterThanOrEqual(2);

      const updatePlan = await request(app)
        .put(`/api/admin/business/${shopBusinessId}/subscription`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ plan: SubscriptionPlan.BUSINESS });
      expect(updatePlan.status).toBe(200);
      expect(updatePlan.body.data.subscription.plan).toBe(SubscriptionPlan.BUSINESS);
    });
  });

  describe('2. Products Edge Cases, Stock Adjustments, Soft Delete & Regex Search Safety', () => {
    it('creates products cleanly even when optional supplierId/barcode/expiryDate are empty strings', async () => {
      const p1Res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          name: 'Indrayani Rice (5kg)+[Premium]',
          sku: 'RICE-5KG-01',
          barcode: '8901234567890',
          category: 'Grains & Cereals',
          unit: 'bag',
          purchasePrice: 320,
          sellingPrice: 400,
          mrp: 450,
          taxRate: 5,
          currentStock: 20,
          minStockLevel: 5,
          supplierId: '',
          expiryDate: ''
        });
      expect(p1Res.status).toBe(201);
      productId1 = p1Res.body.data._id;

      const p2Res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          name: 'Amul Butter 100g',
          sku: 'AMUL-BUT-100',
          barcode: '',
          category: 'Dairy & Bakery',
          unit: 'pcs',
          purchasePrice: 45,
          sellingPrice: 56,
          mrp: 58,
          taxRate: 12,
          currentStock: 4, // Below minStockLevel 10 -> triggers low stock notification
          minStockLevel: 10,
          supplierId: ''
        });
      expect(p2Res.status).toBe(201);
      productId2 = p2Res.body.data._id;
    });

    it('handles regex special characters in product search without 500 error', async () => {
      const searchRes = await request(app)
        .get(`/api/products?search=${encodeURIComponent('(5kg)+[Premium')}`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.products.length).toBe(1);
    });

    it('enforces tenant boundary on barcode lookup and returns 404 on unknown barcode', async () => {
      const ownRes = await request(app)
        .get('/api/products/barcode/8901234567890')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(ownRes.status).toBe(200);
      expect(ownRes.body.data.name).toContain('Indrayani Rice');

      const otherTenantRes = await request(app)
        .get('/api/products/barcode/8901234567890')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-business-id', adminBusinessId);
      expect(otherTenantRes.status).toBe(404);

      const unknownRes = await request(app)
        .get('/api/products/barcode/9999999999999')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(unknownRes.status).toBe(404);
    });

    it('records stock adjustments and tracks StockMovement audit trail', async () => {
      const adjRes = await request(app)
        .post('/api/products/adjust-stock')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          productId: productId1,
          type: StockMovementType.DAMAGE,
          quantity: 2,
          reason: 'Torn bag in storage'
        });
      expect(adjRes.status).toBe(200);
      expect(adjRes.body.data.newStock).toBe(18);

      const movRes = await request(app)
        .get(`/api/products/movements/${productId1}`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(movRes.status).toBe(200);
      expect(movRes.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Suppliers & Purchase Stock-In Integration', () => {
    it('creates supplier, records purchase with expiry/batch, and updates product stock & payable balance', async () => {
      const supRes = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          name: 'Deccan Agro Wholesale',
          contactPerson: 'Vikram Joshi',
          mobile: '9833333333',
          address: 'Gultekdi Market Yard'
        });
      expect(supRes.status).toBe(201);
      supplierId = supRes.body.data._id;

      const purRes = await request(app)
        .post('/api/suppliers/purchase')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          supplierId,
          purchaseInvoiceNo: 'SUP-INV-101',
          items: [
            {
              productId: productId1,
              productName: 'Indrayani Rice (5kg)+[Premium]',
              unit: 'bag',
              quantity: 10,
              purchasePrice: 310,
              taxRate: 5,
              batchNumber: 'BATCH-NOV26',
              expiryDate: '2027-12-31'
            }
          ],
          amountPaid: 1000,
          paymentMethod: PaymentMethod.BANK_TRANSFER
        });
      expect(purRes.status).toBe(201);
      // 10 * 310 = 3100 + 5% (155) = 3255 total, 1000 paid -> 2255 due
      expect(purRes.body.data.totalAmount).toBe(3255);
      expect(purRes.body.data.balanceDue).toBe(2255);

      const detailsRes = await request(app)
        .get(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.data.supplier.outstandingBalance).toBe(2255);

      // Stock increased from 18 -> 28
      const prodLookup = await request(app)
        .get('/api/products/barcode/8901234567890')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(prodLookup.body.data.currentStock).toBe(28);
      expect(prodLookup.body.data.batchNumber).toBe('BATCH-NOV26');
    });
  });

  describe('4. POS Guards (Stock Limit 400, Unconfigured UPI 400), Sale Return & Udhaar Summary', () => {
    it('returns 400 for UPI QR before store UPI ID is configured, then succeeds after settings save', async () => {
      const noUpiRes = await request(app)
        .get('/api/pos/upi-qr?amount=500')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(noUpiRes.status).toBe(400);

      const updateRes = await request(app)
        .put('/api/business/settings')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          settings: {
            upiId: 'kaverimart@okicici',
            upiName: 'Kaveri Supermart',
            invoicePrefix: 'KAV-',
            nextInvoiceNumber: 1,
            enableGst: true,
            allowNegativeStock: false,
            financialYearStartMonth: 4
          }
        });
      expect(updateRes.status).toBe(200);

      const okUpiRes = await request(app)
        .get('/api/pos/upi-qr?amount=500')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(okUpiRes.status).toBe(200);
      expect(okUpiRes.body.data.upiId).toBe('kaverimart@okicici');
      expect(okUpiRes.body.data.qrDataUrl).toContain('data:image/png;base64');
    });

    it('rejects POS sale exceeding available stock with HTTP 400 (not 500)', async () => {
      const overSellRes = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          items: [
            {
              productId: productId1,
              productName: 'Indrayani Rice (5kg)+[Premium]',
              sku: 'RICE-5KG-01',
              unit: 'bag',
              quantity: 500, // Only 28 in stock!
              unitPrice: 400,
              mrp: 450,
              discountPercent: 0,
              discountAmount: 0,
              taxRate: 5,
              taxAmount: 0,
              totalPrice: 200000
            }
          ],
          subtotal: 200000,
          grandTotal: 200000,
          paymentMethod: PaymentMethod.CASH,
          amountPaid: 200000
        });
      expect(overSellRes.status).toBe(400);
      expect(overSellRes.body.message).toMatch(/Insufficient stock/i);
    });

    it('processes Udhaar sale, verifies non-zero Udhaar Summary aggregation, and reverses stock & credit on return', async () => {
      const custRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          name: '=SUM(1+1) "VIP" Buyer',
          mobile: '9844444444'
        });
      expect(custRes.status).toBe(201);
      customerId = custRes.body.data._id;

      // Sale #1: 2 bags on Udhaar = ₹800
      const sale1Res = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          customerId,
          customerName: '=SUM(1+1) "VIP" Buyer',
          customerMobile: '9844444444',
          items: [
            {
              productId: productId1,
              productName: 'Indrayani Rice (5kg)+[Premium]',
              sku: 'RICE-5KG-01',
              unit: 'bag',
              quantity: 2,
              unitPrice: 400,
              mrp: 450,
              discountPercent: 0,
              discountAmount: 0,
              taxRate: 5,
              taxAmount: 40,
              totalPrice: 800
            }
          ],
          subtotal: 800,
          grandTotal: 800,
          paymentMethod: PaymentMethod.UDHAAR,
          amountPaid: 0,
          udhaarAmount: 800
        });
      expect(sale1Res.status).toBe(201);
      saleIdToReturn = sale1Res.body.data._id;

      // Partial Udhaar repayment of ₹300 -> ₹500 remains
      const payRes = await request(app)
        .post('/api/udhaar/payment')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          customerId,
          amount: 300,
          paymentMethod: PaymentMethod.UPI
        });
      expect(payRes.status).toBe(201);

      // Verify Udhaar Summary endpoint (previously broken by string vs ObjectId aggregate match!)
      const udhaarSum = await request(app)
        .get('/api/udhaar/summary')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(udhaarSum.status).toBe(200);
      expect(udhaarSum.body.data.totalCreditGiven).toBe(800);
      expect(udhaarSum.body.data.totalCollected).toBe(300);
      expect(udhaarSum.body.data.totalOutstanding).toBe(500);
      expect(udhaarSum.body.data.debtorsCount).toBe(1);

      // Return Sale #1 -> reverts stock 26 -> 28 and credit 500 -> 0
      const retRes = await request(app)
        .post(`/api/pos/sale/${saleIdToReturn}/return`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({ reason: 'Customer cancelled order' });
      expect(retRes.status).toBe(200);
      expect(retRes.body.data.isReturned).toBe(true);

      // Duplicate return rejected with 400
      const dupRet = await request(app)
        .post(`/api/pos/sale/${saleIdToReturn}/return`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({ reason: 'Retry' });
      expect(dupRet.status).toBe(400);

      // Verify stock back to 28 and customer balance 0
      const prodCheck = await request(app)
        .get('/api/products/barcode/8901234567890')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(prodCheck.body.data.currentStock).toBe(28);

      const custCheck = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(custCheck.body.data.customer.currentBalance).toBe(0);
    });

    it('processes Cash sale and populates Dashboard, GST Tax Summary, and Safe CSV Export', async () => {
      const cashSale = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          customerName: '=SUM(1+1) "VIP" Buyer',
          items: [
            {
              productId: productId1,
              productName: 'Indrayani Rice (5kg)+[Premium]',
              sku: 'RICE-5KG-01',
              unit: 'bag',
              quantity: 3,
              unitPrice: 400,
              mrp: 450,
              discountPercent: 0,
              discountAmount: 0,
              taxRate: 5,
              taxAmount: 60,
              totalPrice: 1200
            }
          ],
          subtotal: 1200,
          grandTotal: 1200,
          paymentMethod: PaymentMethod.CASH,
          amountPaid: 1200
        });
      expect(cashSale.status).toBe(201);

      const dashRes = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(dashRes.status).toBe(200);
      expect(dashRes.body.data.todaySales).toBe(1200);
      expect(dashRes.body.data.todayBillsCount).toBe(1);
      expect(dashRes.body.data.yesterdaySales).toBe(0);
      expect(dashRes.body.data.salesGrowthPercent).toBeNull();
      expect(dashRes.body.data.lowStockCount).toBe(1);

      const taxRes = await request(app)
        .get('/api/reports/tax-summary')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(taxRes.status).toBe(200);
      expect(taxRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(taxRes.body.data[0].rate).toBe(5);

      const csvRes = await request(app)
        .get('/api/reports/export-sales-csv')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(csvRes.status).toBe(200);
      // CSV injection neutralized (`'` prefix) & quotes properly doubled (`""`)
      expect(csvRes.text).toContain(`"'=SUM(1+1) ""VIP"" Buyer"`);
    });
  });

  describe('5. Expenses Aggregation Fix, Notifications & Subscriptions', () => {
    it('calculates real Expense totalAmount via ObjectId aggregate match and deletes cleanly', async () => {
      const e1 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          category: ExpenseCategory.RENT,
          title: 'Shop Monthly Rent',
          amount: 5000,
          date: new Date().toISOString(),
          paymentMethod: PaymentMethod.BANK_TRANSFER
        });
      expect(e1.status).toBe(201);
      expenseId1 = e1.body.data._id;

      const e2 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          category: ExpenseCategory.ELECTRICITY,
          title: 'Electricity Bill',
          amount: 1200,
          date: new Date().toISOString(),
          paymentMethod: PaymentMethod.UPI
        });
      expect(e2.status).toBe(201);

      // Previously ExpenseController.getAll returned totalAmount: 0 because aggregate $match didn't cast businessId!
      const listRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.total).toBe(2);
      expect(listRes.body.data.totalAmount).toBe(6200);

      const delRes = await request(app)
        .delete(`/api/expenses/${expenseId1}`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(delRes.status).toBe(200);

      const afterDel = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(afterDel.body.data.totalAmount).toBe(1200);
    });

    it('generates low-stock notifications automatically and marks all read', async () => {
      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(notifRes.status).toBe(200);
      expect(notifRes.body.data.unreadCount).toBeGreaterThanOrEqual(1);
      expect(notifRes.body.data.notifications[0].title).toContain('Amul Butter');

      const readRes = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(readRes.status).toBe(200);

      const afterRead = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(afterRead.body.data.unreadCount).toBe(0);
    });

    it('soft-archives product and prevents selling archived items', async () => {
      const delProd = await request(app)
        .delete(`/api/products/${productId2}`)
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId);
      expect(delProd.status).toBe(200);

      const sellArchived = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${shopToken}`)
        .set('x-business-id', shopBusinessId)
        .send({
          items: [
            {
              productId: productId2,
              productName: 'Amul Butter 100g',
              sku: 'AMUL-BUT-100',
              unit: 'pcs',
              quantity: 1,
              unitPrice: 56,
              mrp: 58,
              totalPrice: 56
            }
          ],
          subtotal: 56,
          grandTotal: 56,
          paymentMethod: PaymentMethod.CASH,
          amountPaid: 56
        });
      expect(sellArchived.status).toBe(400);
    });
  });
});
