import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { connectDatabase, closeDatabase } from '../src/config/database';
import { CONFIG } from '../src/config/constants';
import { BusinessCategory, PaymentMethod } from '@vyapaarflow/shared';

describe('VyapaarFlow Automated Security Regression Tests (Guided by security.pdf)', () => {
  let tenant1Token: string;
  let tenant1BusinessId: string;
  let tenant1ProductId: string;

  let tenant2Token: string;
  let tenant2BusinessId: string;
  let tenant2ProductId: string;

  beforeAll(async () => {
    await connectDatabase();

    // 1. Setup Tenant 1 (Kirana Store)
    const t1UserRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ramesh Patel',
        email: `ramesh_${Date.now()}@kiranamart.in`,
        password: 'SecurePassword123!',
        mobile: '9876543210'
      });
    tenant1Token = t1UserRes.body.data.token;

    const t1BizRes = await request(app)
      .post('/api/business/onboard')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .send({
        businessName: 'Patel Kirana Superstore',
        ownerName: 'Ramesh Patel',
        mobile: '9876543210',
        email: `patel_${Date.now()}@kiranamart.in`,
        category: BusinessCategory.GROCERY,
        address: 'MG Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        currency: 'INR',
        language: 'en',
        invoicePrefix: 'PATEL-'
      });
    tenant1BusinessId = t1BizRes.body.data._id;

    // Create product in Tenant 1 (Selling price = 250)
    const t1ProdRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .set('x-business-id', tenant1BusinessId)
      .send({
        name: 'Basmati Rice 5kg',
        sku: `RICE-${Date.now()}`,
        category: 'Grocery & Staples',
        unit: 'packet',
        purchasePrice: 180,
        sellingPrice: 250,
        mrp: 300,
        taxRate: 5,
        currentStock: 100,
        minStockLevel: 10
      });
    tenant1ProductId = t1ProdRes.body.data._id;

    // 2. Setup Tenant 2 (Electrical Store)
    const t2UserRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Suresh Sharma',
        email: `suresh_${Date.now()}@sharmaelectricals.in`,
        password: 'SecurePassword123!',
        mobile: '9123456789'
      });
    tenant2Token = t2UserRes.body.data.token;

    const t2BizRes = await request(app)
      .post('/api/business/onboard')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .send({
        businessName: 'Sharma Electricals & Hardware',
        ownerName: 'Suresh Sharma',
        mobile: '9123456789',
        email: `suresh_${Date.now()}@sharmaelectricals.in`,
        category: BusinessCategory.ELECTRICAL,
        address: 'Station Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        currency: 'INR',
        language: 'en',
        invoicePrefix: 'SEH-'
      });
    tenant2BusinessId = t2BizRes.body.data._id;

    // Create product in Tenant 2
    const t2ProdRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .set('x-business-id', tenant2BusinessId)
      .send({
        name: 'LED Tube Light 20W',
        sku: `TUBE-${Date.now()}`,
        category: 'Electricals',
        unit: 'pcs',
        purchasePrice: 150,
        sellingPrice: 220,
        mrp: 299,
        taxRate: 18,
        currentStock: 50,
        minStockLevel: 5
      });
    tenant2ProductId = t2ProdRes.body.data._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Vulnerability #4: Price Manipulation Defense in POS Checkout', () => {
    it('must recalculate line totals authoritatively on the server and ignore tampered unitPrice / grandTotal', async () => {
      // Attacker attempts to buy product (sellingPrice=250) for ₹1.00
      const tamperedSale = {
        items: [
          {
            productId: tenant1ProductId,
            productName: 'Basmati Rice 5kg',
            sku: 'IGNORED',
            unit: 'packet',
            quantity: 2,
            unitPrice: 1.00, // Tampered price! Real price is 250
            mrp: 300,
            discountPercent: 0,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            totalPrice: 2.00 // Tampered line total
          }
        ],
        subtotal: 2.00,
        billDiscountPercent: 0,
        billDiscountAmount: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: 2.00, // Tampered grand total
        paymentMethod: PaymentMethod.CASH,
        amountPaid: 2.00
      };

      const res = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('x-business-id', tenant1BusinessId)
        .send(tamperedSale);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Authoritative calculation: 2 * 250 = 500 subtotal, grand total = 500
      const createdSale = res.body.data;
      expect(createdSale.subtotal).toBe(500);
      expect(createdSale.grandTotal).toBe(500);
      expect(createdSale.items[0].unitPrice).toBe(250);
      expect(createdSale.items[0].totalPrice).toBe(500);
    });
  });

  describe('Vulnerability #5: Negative and Zero Quantity Defense', () => {
    it('should reject a sale containing negative item quantity with 400 Bad Request', async () => {
      const maliciousNegativeQtySale = {
        items: [
          {
            productId: tenant1ProductId,
            productName: 'Basmati Rice 5kg',
            sku: 'RICE',
            unit: 'packet',
            quantity: -5, // Malicious negative quantity
            unitPrice: 250,
            mrp: 300,
            discountPercent: 0,
            discountAmount: 0,
            taxRate: 5,
            taxAmount: 0,
            totalPrice: -1250
          }
        ],
        subtotal: -1250,
        billDiscountPercent: 0,
        billDiscountAmount: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: -1250,
        paymentMethod: PaymentMethod.CASH,
        amountPaid: 0
      };

      const res = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('x-business-id', tenant1BusinessId)
        .send(maliciousNegativeQtySale);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject a sale containing zero item quantity', async () => {
      const zeroQtySale = {
        items: [
          {
            productId: tenant1ProductId,
            productName: 'Basmati Rice 5kg',
            sku: 'RICE',
            unit: 'packet',
            quantity: 0,
            unitPrice: 250,
            mrp: 300,
            discountPercent: 0,
            discountAmount: 0,
            taxRate: 5,
            taxAmount: 0,
            totalPrice: 0
          }
        ],
        subtotal: 0,
        billDiscountPercent: 0,
        billDiscountAmount: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: 0,
        paymentMethod: PaymentMethod.CASH,
        amountPaid: 0
      };

      const res = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('x-business-id', tenant1BusinessId)
        .send(zeroQtySale);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Vulnerability #1: Broken Object Level Authorization (IDOR & Tenant Isolation)', () => {
    it('should prevent Tenant 1 from creating a sale using Tenant 2 product', async () => {
      const crossTenantSale = {
        items: [
          {
            productId: tenant2ProductId, // BELONGS TO TENANT 2
            productName: 'Cross-Tenant Product Injection',
            sku: 'TUBE',
            unit: 'pcs',
            quantity: 1,
            unitPrice: 220,
            mrp: 299,
            discountPercent: 0,
            discountAmount: 0,
            taxRate: 18,
            taxAmount: 0,
            totalPrice: 220
          }
        ],
        subtotal: 220,
        billDiscountPercent: 0,
        billDiscountAmount: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: 220,
        paymentMethod: PaymentMethod.CASH,
        amountPaid: 220
      };

      const res = await request(app)
        .post('/api/pos/sale')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .set('x-business-id', tenant1BusinessId)
        .send(crossTenantSale);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/belong to another store|unauthorized/i);
    });

    it('should reject unauthorized x-business-id header spoofing', async () => {
      // Non-superadmin tenant (Tenant 2) attempts to access Tenant 1 business context via header
      const res = await request(app)
        .get('/api/business/current')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .set('x-business-id', tenant1BusinessId);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Tenant access denied/i);
    });
  });

  describe('Vulnerability #15: JWT Algorithm Confusion & Token Tampering', () => {
    it('should reject unsigned or "none" algorithm tokens', async () => {
      // Craft a forged token with algorithm "none"
      const forgedToken = jwt.sign(
        { userId: 'fakeUserId', email: 'hacker@evil.com', role: 'OWNER' },
        CONFIG.JWT_SECRET,
        { algorithm: 'none' } as any
      );

      const res = await request(app)
        .get('/api/business/current')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject tokens signed with an invalid secret key', async () => {
      const forgedToken = jwt.sign(
        { userId: 'fakeUserId', email: 'hacker@evil.com', role: 'OWNER' },
        'WRONG_SECRET_KEY_12345',
        { algorithm: 'HS256' }
      );

      const res = await request(app)
        .get('/api/business/current')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Vulnerability #2: NoSQL Injection Query Sanitization', () => {
    it('should strip $ne operators and reject NoSQL authentication bypass', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null }
        });

      // Zod or sanitizer will reject the non-string payload or invalid credentials
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Vulnerability #27 & #20: Security Headers (Helmet) & Health', () => {
    it('should return required security headers on API endpoints', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });
  });
});
