import { z } from 'zod';
import { BusinessCategory, Language, PaymentMethod, ExpenseCategory, StockMovementType } from '../types';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    mobile: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    mobile?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    mobile?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const onboardingSchema: z.ZodObject<{
    businessName: z.ZodString;
    ownerName: z.ZodString;
    mobile: z.ZodString;
    email: z.ZodString;
    category: z.ZodNativeEnum<typeof BusinessCategory>;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    gstin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    currency: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodNativeEnum<typeof Language>>;
    invoicePrefix: z.ZodDefault<z.ZodString>;
    startingInvoiceNumber: z.ZodDefault<z.ZodNumber>;
    upiId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    upiName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    mobile: string;
    businessName: string;
    ownerName: string;
    category: BusinessCategory;
    address: string;
    city: string;
    state: string;
    pincode: string;
    currency: string;
    language: Language;
    invoicePrefix: string;
    startingInvoiceNumber: number;
    gstin?: string | undefined;
    upiId?: string | undefined;
    upiName?: string | undefined;
}, {
    email: string;
    mobile: string;
    businessName: string;
    ownerName: string;
    category: BusinessCategory;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string | undefined;
    currency?: string | undefined;
    language?: Language | undefined;
    invoicePrefix?: string | undefined;
    startingInvoiceNumber?: number | undefined;
    upiId?: string | undefined;
    upiName?: string | undefined;
}>;
export declare const productSchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodString;
    barcode: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    category: z.ZodString;
    brand: z.ZodOptional<z.ZodString>;
    unit: z.ZodDefault<z.ZodString>;
    purchasePrice: z.ZodNumber;
    sellingPrice: z.ZodNumber;
    mrp: z.ZodNumber;
    taxRate: z.ZodDefault<z.ZodNumber>;
    currentStock: z.ZodDefault<z.ZodNumber>;
    minStockLevel: z.ZodDefault<z.ZodNumber>;
    supplierId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    supplierName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    batchNumber: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    sku: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    taxRate: number;
    currentStock: number;
    minStockLevel: number;
    barcode?: string | undefined;
    brand?: string | undefined;
    supplierId?: string | undefined;
    supplierName?: string | undefined;
    description?: string | undefined;
    batchNumber?: string | undefined;
    expiryDate?: string | undefined;
}, {
    name: string;
    category: string;
    sku: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    barcode?: string | undefined;
    brand?: string | undefined;
    unit?: string | undefined;
    taxRate?: number | undefined;
    currentStock?: number | undefined;
    minStockLevel?: number | undefined;
    supplierId?: string | undefined;
    supplierName?: string | undefined;
    description?: string | undefined;
    batchNumber?: string | undefined;
    expiryDate?: string | undefined;
}>;
export declare const customerSchema: z.ZodObject<{
    name: z.ZodString;
    mobile: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodOptional<z.ZodString>;
    creditLimit: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    mobile: string;
    email?: string | undefined;
    address?: string | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
}, {
    name: string;
    mobile: string;
    email?: string | undefined;
    address?: string | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
}>;
export declare const supplierSchema: z.ZodObject<{
    name: z.ZodString;
    contactPerson: z.ZodOptional<z.ZodString>;
    mobile: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodOptional<z.ZodString>;
    gstin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    mobile: string;
    email?: string | undefined;
    address?: string | undefined;
    gstin?: string | undefined;
    contactPerson?: string | undefined;
}, {
    name: string;
    mobile: string;
    email?: string | undefined;
    address?: string | undefined;
    gstin?: string | undefined;
    contactPerson?: string | undefined;
}>;
export declare const saleItemSchema: z.ZodObject<{
    productId: z.ZodString;
    productName: z.ZodString;
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    unit: z.ZodDefault<z.ZodString>;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    mrp: z.ZodNumber;
    discountPercent: z.ZodDefault<z.ZodNumber>;
    discountAmount: z.ZodDefault<z.ZodNumber>;
    taxRate: z.ZodDefault<z.ZodNumber>;
    taxAmount: z.ZodDefault<z.ZodNumber>;
    totalPrice: z.ZodNumber;
    batchNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sku: string;
    unit: string;
    mrp: number;
    taxRate: number;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxAmount: number;
    totalPrice: number;
    barcode?: string | undefined;
    batchNumber?: string | undefined;
}, {
    sku: string;
    mrp: number;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    barcode?: string | undefined;
    unit?: string | undefined;
    taxRate?: number | undefined;
    batchNumber?: string | undefined;
    discountPercent?: number | undefined;
    discountAmount?: number | undefined;
    taxAmount?: number | undefined;
}>;
export declare const saleSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    customerName: z.ZodOptional<z.ZodString>;
    customerMobile: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        productName: z.ZodString;
        sku: z.ZodString;
        barcode: z.ZodOptional<z.ZodString>;
        unit: z.ZodDefault<z.ZodString>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        mrp: z.ZodNumber;
        discountPercent: z.ZodDefault<z.ZodNumber>;
        discountAmount: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
        taxAmount: z.ZodDefault<z.ZodNumber>;
        totalPrice: z.ZodNumber;
        batchNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        sku: string;
        unit: string;
        mrp: number;
        taxRate: number;
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
        discountAmount: number;
        taxAmount: number;
        totalPrice: number;
        barcode?: string | undefined;
        batchNumber?: string | undefined;
    }, {
        sku: string;
        mrp: number;
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        barcode?: string | undefined;
        unit?: string | undefined;
        taxRate?: number | undefined;
        batchNumber?: string | undefined;
        discountPercent?: number | undefined;
        discountAmount?: number | undefined;
        taxAmount?: number | undefined;
    }>, "many">;
    subtotal: z.ZodNumber;
    billDiscountPercent: z.ZodDefault<z.ZodNumber>;
    billDiscountAmount: z.ZodDefault<z.ZodNumber>;
    totalTax: z.ZodDefault<z.ZodNumber>;
    roundOff: z.ZodDefault<z.ZodNumber>;
    grandTotal: z.ZodNumber;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    amountPaid: z.ZodNumber;
    udhaarAmount: z.ZodDefault<z.ZodNumber>;
    splitPayments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        method: z.ZodNativeEnum<typeof PaymentMethod>;
        amount: z.ZodNumber;
        reference: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        method: PaymentMethod;
        amount: number;
        reference?: string | undefined;
    }, {
        method: PaymentMethod;
        amount: number;
        reference?: string | undefined;
    }>, "many">>;
    notes: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        sku: string;
        unit: string;
        mrp: number;
        taxRate: number;
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
        discountAmount: number;
        taxAmount: number;
        totalPrice: number;
        barcode?: string | undefined;
        batchNumber?: string | undefined;
    }[];
    subtotal: number;
    billDiscountPercent: number;
    billDiscountAmount: number;
    totalTax: number;
    roundOff: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    udhaarAmount: number;
    notes?: string | undefined;
    customerId?: string | undefined;
    customerName?: string | undefined;
    customerMobile?: string | undefined;
    splitPayments?: {
        method: PaymentMethod;
        amount: number;
        reference?: string | undefined;
    }[] | undefined;
    idempotencyKey?: string | undefined;
}, {
    items: {
        sku: string;
        mrp: number;
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        barcode?: string | undefined;
        unit?: string | undefined;
        taxRate?: number | undefined;
        batchNumber?: string | undefined;
        discountPercent?: number | undefined;
        discountAmount?: number | undefined;
        taxAmount?: number | undefined;
    }[];
    subtotal: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string | undefined;
    customerId?: string | undefined;
    customerName?: string | undefined;
    customerMobile?: string | undefined;
    billDiscountPercent?: number | undefined;
    billDiscountAmount?: number | undefined;
    totalTax?: number | undefined;
    roundOff?: number | undefined;
    udhaarAmount?: number | undefined;
    splitPayments?: {
        method: PaymentMethod;
        amount: number;
        reference?: string | undefined;
    }[] | undefined;
    idempotencyKey?: string | undefined;
}>;
export declare const udhaarPaymentSchema: z.ZodObject<{
    customerId: z.ZodString;
    amount: z.ZodNumber;
    paymentMethod: z.ZodDefault<z.ZodNativeEnum<typeof PaymentMethod>>;
    referenceNumber: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
}, {
    customerId: string;
    amount: number;
    notes?: string | undefined;
    paymentMethod?: PaymentMethod | undefined;
    referenceNumber?: string | undefined;
}>;
export declare const expenseSchema: z.ZodObject<{
    category: z.ZodNativeEnum<typeof ExpenseCategory>;
    title: z.ZodString;
    amount: z.ZodNumber;
    date: z.ZodString;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    recipient: z.ZodOptional<z.ZodString>;
    referenceNumber: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: ExpenseCategory;
    date: string;
    paymentMethod: PaymentMethod;
    amount: number;
    title: string;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    recipient?: string | undefined;
}, {
    category: ExpenseCategory;
    date: string;
    paymentMethod: PaymentMethod;
    amount: number;
    title: string;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    recipient?: string | undefined;
}>;
export declare const stockAdjustmentSchema: z.ZodObject<{
    productId: z.ZodString;
    type: z.ZodNativeEnum<typeof StockMovementType>;
    quantity: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: StockMovementType;
    productId: string;
    quantity: number;
    reason: string;
}, {
    type: StockMovementType;
    productId: string;
    quantity: number;
    reason: string;
}>;
//# sourceMappingURL=index.d.ts.map