import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../config/database';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { CustomerLedger } from '../models/CustomerLedger';
import { Supplier } from '../models/Supplier';
import { Sale } from '../models/Sale';
import { Expense } from '../models/Expense';
import { StockMovement } from '../models/StockMovement';
import { Notification } from '../models/Notification';
import {
  UserRole,
  BusinessCategory,
  Language,
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  CustomerLedgerType,
  StockMovementType,
  ExpenseCategory,
  NotificationType
} from '@vyapaarflow/shared';

export const seedDatabase = async () => {
  console.log('[Seed] Starting VyapaarFlow database seeding...');
  await connectDatabase();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Business.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    CustomerLedger.deleteMany({}),
    Supplier.deleteMany({}),
    Sale.deleteMany({}),
    Expense.deleteMany({}),
    StockMovement.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Super Admin
  const adminUser = await User.create({
    name: 'SaaS Platform Admin',
    email: 'admin@vyapaarflow.com',
    passwordHash,
    mobile: '9800000000',
    role: UserRole.SUPER_ADMIN,
    isSuperAdmin: true
  });
  console.log('[Seed] Created Super Admin: admin@vyapaarflow.com / password123');

  // 2. Create Demo Business Owner
  const ownerUser = await User.create({
    name: 'Ramesh Gupta',
    email: 'ramesh@kirana.com',
    passwordHash,
    mobile: '9822001122',
    role: UserRole.OWNER,
    isSuperAdmin: false
  });

  // 3. Create Business
  const business = await Business.create({
    name: 'Shree Ganesh Supermarket & Kirana',
    ownerName: 'Ramesh Gupta',
    ownerId: ownerUser._id,
    category: BusinessCategory.GROCERY,
    mobile: '9822001122',
    email: 'ramesh@kirana.com',
    address: 'Shop No. 4, Karve Road, Kothrud',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    gstin: '27AABCU9603R1ZM',
    currency: 'INR',
    language: Language.ENGLISH,
    settings: {
      invoicePrefix: 'INV-',
      nextInvoiceNumber: 108,
      enableGst: true,
      allowNegativeStock: false,
      upiId: 'rameshkirana@okicici',
      upiName: 'Shree Ganesh Kirana',
      financialYearStartMonth: 4,
      printHeaderNote: 'Dhanyawad! Please visit again.',
      printFooterNote: 'Goods once sold will not be returned without receipt.'
    },
    subscription: {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      productLimit: 1000000
    }
  });

  ownerUser.currentBusinessId = business._id as any;
  await ownerUser.save();
  console.log('[Seed] Created Business: Shree Ganesh Supermarket & Kirana');

  // 4. Create Suppliers
  const sup1 = await Supplier.create({
    businessId: business._id,
    name: 'Pune Metro FMCG Distributors',
    contactPerson: 'Kailash Agarwal',
    mobile: '9822199887',
    email: 'kailash@punemetrofmcg.com',
    address: 'Market Yard, Gate No 3, Pune',
    gstin: '27AAGCP8902Q1Z3',
    totalPurchases: 145000,
    outstandingBalance: 12500
  });

  const sup2 = await Supplier.create({
    businessId: business._id,
    name: 'Kolhapur Agro Oils & Grains Wholesale',
    contactPerson: 'Sanjay Patil',
    mobile: '9822344556',
    email: 'orders@kolhapuragro.in',
    address: 'Laxmipuri Grain Market, Kolhapur',
    gstin: '27BBCDP4501R1Z8',
    totalPurchases: 89000,
    outstandingBalance: 0
  });

  // 5. Create 15 Realistic Products with barcode, SKU, MRP, GST
  const productData = [
    { name: 'Aashirvaad Shudh Chakki Atta 10kg', sku: 'ATT-10KG', barcode: '8901030012011', category: 'Grains & Cereals', brand: 'Aashirvaad', unit: 'bag', purchasePrice: 380, sellingPrice: 420, mrp: 450, taxRate: 5, currentStock: 45, minStockLevel: 10 },
    { name: 'Fortune Sunlite Sunflower Oil 1L', sku: 'OIL-SUN-1L', barcode: '8906007280014', category: 'Oils & Ghee', brand: 'Fortune', unit: 'pkt', purchasePrice: 115, sellingPrice: 135, mrp: 145, taxRate: 5, currentStock: 60, minStockLevel: 15 },
    { name: 'Tata Salt Vacuum Evaporated 1kg', sku: 'SALT-TATA-1KG', barcode: '8901030012028', category: 'Spices & Masalas', brand: 'Tata', unit: 'pkt', purchasePrice: 22, sellingPrice: 28, mrp: 28, taxRate: 0, currentStock: 120, minStockLevel: 25 },
    { name: 'India Gate Basmati Rice Feast 5kg', sku: 'RICE-IG-5KG', barcode: '8901030012035', category: 'Grains & Cereals', brand: 'India Gate', unit: 'bag', purchasePrice: 420, sellingPrice: 499, mrp: 540, taxRate: 5, currentStock: 30, minStockLevel: 8 },
    { name: 'Maggi 2-Minute Masala Noodles 280g', sku: 'MAG-MAS-280G', barcode: '8901058852330', category: 'Snacks & Beverages', brand: 'Nestle', unit: 'pkt', purchasePrice: 48, sellingPrice: 56, mrp: 60, taxRate: 12, currentStock: 85, minStockLevel: 20 },
    { name: 'Amul Butter Pasteurized 500g', sku: 'BTR-AMUL-500G', barcode: '8901262010054', category: 'Dairy & Bakery', brand: 'Amul', unit: 'box', purchasePrice: 245, sellingPrice: 275, mrp: 285, taxRate: 12, currentStock: 25, minStockLevel: 10 },
    { name: 'Parle-G Original Glucose Biscuits 800g', sku: 'PAR-G-800G', barcode: '8901719101032', category: 'Snacks & Beverages', brand: 'Parle', unit: 'pkt', purchasePrice: 65, sellingPrice: 76, mrp: 80, taxRate: 18, currentStock: 50, minStockLevel: 15 },
    { name: 'Surf Excel Easy Wash Detergent 1kg', sku: 'DET-SURF-1KG', barcode: '8901030385924', category: 'Household & Cleaning', brand: 'Surf Excel', unit: 'pkt', purchasePrice: 120, sellingPrice: 140, mrp: 150, taxRate: 18, currentStock: 40, minStockLevel: 10 },
    { name: 'Colgate Strong Teeth Dental Paste 200g', sku: 'CLG-ST-200G', barcode: '8901314010544', category: 'Personal Care', brand: 'Colgate', unit: 'pcs', purchasePrice: 95, sellingPrice: 118, mrp: 125, taxRate: 18, currentStock: 35, minStockLevel: 10 },
    { name: 'Everest Turmeric Powder 200g', sku: 'EVR-HALDI-200G', barcode: '8901786111026', category: 'Spices & Masalas', brand: 'Everest', unit: 'pkt', purchasePrice: 52, sellingPrice: 65, mrp: 70, taxRate: 5, currentStock: 40, minStockLevel: 12 },
    { name: 'MDH Deggi Mirch Powder 100g', sku: 'MDH-MIRCH-100G', barcode: '8901282100018', category: 'Spices & Masalas', brand: 'MDH', unit: 'box', purchasePrice: 78, sellingPrice: 92, mrp: 98, taxRate: 5, currentStock: 3, minStockLevel: 10 }, // Low stock sample
    { name: 'Tata Tea Premium Desh ki Chai 1kg', sku: 'TEA-TATA-1KG', barcode: '8901030012059', category: 'Snacks & Beverages', brand: 'Tata Tea', unit: 'pkt', purchasePrice: 410, sellingPrice: 480, mrp: 510, taxRate: 5, currentStock: 28, minStockLevel: 8 },
    { name: 'Cadbury Dairy Milk Silk Chocolate 150g', sku: 'CAD-SILK-150G', barcode: '8901233024018', category: 'Snacks & Beverages', brand: 'Cadbury', unit: 'pcs', purchasePrice: 140, sellingPrice: 175, mrp: 180, taxRate: 18, currentStock: 2, minStockLevel: 10 }, // Low stock sample
    { name: 'Lizol Floral Surface Cleaner 2L', sku: 'LZL-FLR-2L', barcode: '8901396112013', category: 'Household & Cleaning', brand: 'Lizol', unit: 'box', purchasePrice: 310, sellingPrice: 365, mrp: 395, taxRate: 18, currentStock: 18, minStockLevel: 6 },
    { name: 'Haldiram Nagpur Bhujia Sev 400g', sku: 'HLD-BHUJ-400G', barcode: '8904063200142', category: 'Snacks & Beverages', brand: 'Haldiram', unit: 'pkt', purchasePrice: 95, sellingPrice: 115, mrp: 120, taxRate: 12, currentStock: 40, minStockLevel: 10 }
  ];

  const createdProducts = [];
  for (const p of productData) {
    const prod = await Product.create({
      ...p,
      businessId: business._id,
      supplierId: sup1._id,
      supplierName: sup1.name,
      isActive: true
    });
    createdProducts.push(prod);

    await StockMovement.create({
      businessId: business._id,
      productId: prod._id,
      productName: prod.name,
      type: StockMovementType.INITIAL,
      quantity: prod.currentStock,
      previousStock: 0,
      newStock: prod.currentStock,
      unitPrice: prod.purchasePrice,
      reason: 'Opening stock inventory import',
      createdBy: ownerUser._id
    });
  }
  console.log(`[Seed] Created ${createdProducts.length} Products with Stock Movements`);

  // 6. Create Demo Customers
  const c1 = await Customer.create({
    businessId: business._id,
    name: 'Amit Sharma',
    mobile: '9822012345',
    email: 'amit.sharma@gmail.com',
    address: 'B-402, Mayur Nagari, Kothrud',
    customerCode: 'CUST-001',
    totalPurchases: 8450,
    currentBalance: 1450,
    creditLimit: 10000,
    notes: 'Regular local customer, pays monthly on salary date'
  });

  const c2 = await Customer.create({
    businessId: business._id,
    name: 'Sunita Patil',
    mobile: '9822054321',
    email: 'sunita.patil@yahoo.com',
    address: 'Flat 12, Swapnashilp Apts, Kothrud',
    customerCode: 'CUST-002',
    totalPurchases: 5600,
    currentBalance: 820,
    creditLimit: 5000,
    notes: 'Buys groceries on weekly credit'
  });

  const c3 = await Customer.create({
    businessId: business._id,
    name: 'Vikram Deshmukh',
    mobile: '9822098765',
    address: 'Plot 15, Dahanukar Colony, Kothrud',
    customerCode: 'CUST-003',
    totalPurchases: 3200,
    currentBalance: 0,
    creditLimit: 5000
  });

  // 7. Create Historical Customer Ledger Entries for Udhaar
  await CustomerLedger.create({
    businessId: business._id,
    customerId: c1._id,
    type: CustomerLedgerType.CREDIT_GIVEN,
    amount: 1450,
    balanceAfter: 1450,
    invoiceNumber: 'INV-0102',
    referenceNumber: 'INV-0102',
    notes: 'Credit taken for monthly grocery purchase',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdBy: ownerUser._id
  });

  await CustomerLedger.create({
    businessId: business._id,
    customerId: c2._id,
    type: CustomerLedgerType.CREDIT_GIVEN,
    amount: 1820,
    balanceAfter: 1820,
    invoiceNumber: 'INV-0098',
    referenceNumber: 'INV-0098',
    notes: 'Weekly grocery credit',
    createdBy: ownerUser._id
  });

  await CustomerLedger.create({
    businessId: business._id,
    customerId: c2._id,
    type: CustomerLedgerType.PAYMENT_RECEIVED,
    amount: 1000,
    balanceAfter: 820,
    paymentMethod: PaymentMethod.UPI,
    referenceNumber: 'UPI/321876543210',
    notes: 'GooglePay payment received',
    createdBy: ownerUser._id
  });

  // 8. Create Realistic Past Sales
  const sale1 = await Sale.create({
    businessId: business._id,
    invoiceNumber: 'INV-0105',
    saleDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // Today 2 hours ago
    customerName: 'Walk-in Customer',
    items: [
      { productId: createdProducts[0]._id, productName: createdProducts[0].name, sku: createdProducts[0].sku, unit: 'bag', quantity: 1, unitPrice: 420, mrp: 450, discountPercent: 0, discountAmount: 0, taxRate: 5, taxAmount: 20, totalPrice: 420 },
      { productId: createdProducts[1]._id, productName: createdProducts[1].name, sku: createdProducts[1].sku, unit: 'pkt', quantity: 2, unitPrice: 135, mrp: 145, discountPercent: 0, discountAmount: 0, taxRate: 5, taxAmount: 12.85, totalPrice: 270 }
    ],
    subtotal: 690,
    billDiscountPercent: 0,
    billDiscountAmount: 0,
    totalTax: 32.85,
    roundOff: 0,
    grandTotal: 690,
    paymentMethod: PaymentMethod.UPI,
    paymentStatus: PaymentStatus.COMPLETED,
    amountPaid: 690,
    udhaarAmount: 0,
    createdBy: ownerUser._id
  });

  const sale2 = await Sale.create({
    businessId: business._id,
    invoiceNumber: 'INV-0106',
    saleDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // Today 4 hours ago
    customerId: c1._id,
    customerName: c1.name,
    customerMobile: c1.mobile,
    items: [
      { productId: createdProducts[4]._id, productName: createdProducts[4].name, sku: createdProducts[4].sku, unit: 'pkt', quantity: 4, unitPrice: 56, mrp: 60, discountPercent: 0, discountAmount: 0, taxRate: 12, taxAmount: 24, totalPrice: 224 },
      { productId: createdProducts[5]._id, productName: createdProducts[5].name, sku: createdProducts[5].sku, unit: 'box', quantity: 1, unitPrice: 275, mrp: 285, discountPercent: 0, discountAmount: 0, taxRate: 12, taxAmount: 29.46, totalPrice: 275 }
    ],
    subtotal: 499,
    billDiscountPercent: 0,
    billDiscountAmount: 0,
    totalTax: 53.46,
    roundOff: 1,
    grandTotal: 500,
    paymentMethod: PaymentMethod.CASH,
    paymentStatus: PaymentStatus.COMPLETED,
    amountPaid: 500,
    udhaarAmount: 0,
    createdBy: ownerUser._id
  });

  const sale3 = await Sale.create({
    businessId: business._id,
    invoiceNumber: 'INV-0107',
    saleDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    customerId: c2._id,
    customerName: c2.name,
    customerMobile: c2.mobile,
    items: [
      { productId: createdProducts[3]._id, productName: createdProducts[3].name, sku: createdProducts[3].sku, unit: 'bag', quantity: 1, unitPrice: 499, mrp: 540, discountPercent: 0, discountAmount: 0, taxRate: 5, taxAmount: 23.76, totalPrice: 499 },
      { productId: createdProducts[7]._id, productName: createdProducts[7].name, sku: createdProducts[7].sku, unit: 'pkt', quantity: 1, unitPrice: 140, mrp: 150, discountPercent: 0, discountAmount: 0, taxRate: 18, taxAmount: 21.36, totalPrice: 140 }
    ],
    subtotal: 639,
    billDiscountPercent: 0,
    billDiscountAmount: 0,
    totalTax: 45.12,
    roundOff: 1,
    grandTotal: 640,
    paymentMethod: PaymentMethod.UDHAAR,
    paymentStatus: PaymentStatus.PENDING,
    amountPaid: 0,
    udhaarAmount: 640,
    createdBy: ownerUser._id
  });

  // 9. Create Expenses
  await Expense.create({
    businessId: business._id,
    category: ExpenseCategory.ELECTRICITY,
    title: 'MSEDCL Commercial Power Bill Oct',
    amount: 3850,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    paymentMethod: PaymentMethod.UPI,
    recipient: 'Maharashtra State Electricity Distribution',
    referenceNumber: 'EB-2026-10-8902',
    notes: 'Paid via electricity board portal',
    createdBy: ownerUser._id
  });

  await Expense.create({
    businessId: business._id,
    category: ExpenseCategory.RENT,
    title: 'Shop Monthly Rent - Kothrud premises',
    amount: 18000,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recipient: 'Suresh Kulkarni (Landlord)',
    referenceNumber: 'NEFT/2026/89021',
    notes: 'Paid into landlord SBI account',
    createdBy: ownerUser._id
  });

  await Expense.create({
    businessId: business._id,
    category: ExpenseCategory.SALARY,
    title: 'Helper Staff Wages - Santosh',
    amount: 12000,
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    paymentMethod: PaymentMethod.CASH,
    recipient: 'Santosh Yadav',
    notes: 'Monthly salary paid in cash',
    createdBy: ownerUser._id
  });

  // 10. Create Notifications
  await Notification.create({
    businessId: business._id,
    type: NotificationType.LOW_STOCK,
    title: 'Low Stock: MDH Deggi Mirch Powder 100g',
    message: 'Current stock is 3 box (Minimum: 10 box). Restock soon.',
    referenceId: createdProducts[10]._id.toString(),
    isRead: false
  });

  await Notification.create({
    businessId: business._id,
    type: NotificationType.LOW_STOCK,
    title: 'Low Stock: Cadbury Dairy Milk Silk Chocolate 150g',
    message: 'Current stock is 2 pcs (Minimum: 10 pcs). Restock soon.',
    referenceId: createdProducts[12]._id.toString(),
    isRead: false
  });

  await Notification.create({
    businessId: business._id,
    type: NotificationType.UDHAAR_OVERDUE,
    title: 'Udhaar Reminder: Amit Sharma',
    message: 'Outstanding credit of ₹1,450 is pending for over 15 days.',
    referenceId: c1._id.toString(),
    isRead: false
  });

  console.log('[Seed] Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Shop Owner:  ramesh@kirana.com  / password123');
  console.log('Super Admin: admin@vyapaarflow.com / password123');
  console.log('----------------------------------------------------');
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await closeDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
