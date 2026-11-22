export declare enum UserRole {
    OWNER = "OWNER",
    MANAGER = "MANAGER",
    CASHIER = "CASHIER",
    INVENTORY_MANAGER = "INVENTORY_MANAGER",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum SubscriptionPlan {
    FREE = "FREE",
    PRO = "PRO",
    BUSINESS = "BUSINESS"
}
export declare enum SubscriptionStatus {
    TRIAL = "TRIAL",
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}
export declare enum BusinessCategory {
    GROCERY = "GROCERY",
    HARDWARE = "HARDWARE",
    ELECTRICAL = "ELECTRICAL",
    ELECTRONICS = "ELECTRONICS",
    MEDICAL = "MEDICAL",
    CLOTHING = "CLOTHING",
    COSMETICS = "COSMETICS",
    WHOLESALE = "WHOLESALE",
    GENERAL_RETAIL = "GENERAL_RETAIL",
    OTHER = "OTHER"
}
export declare enum Language {
    ENGLISH = "en",
    HINDI = "hi",
    MARATHI = "mr"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    UPI = "UPI",
    CARD = "CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    UDHAAR = "UDHAAR",
    SPLIT = "SPLIT"
}
export declare enum PaymentStatus {
    COMPLETED = "COMPLETED",
    PARTIAL = "PARTIAL",
    PENDING = "PENDING",
    REFUNDED = "REFUNDED"
}
export declare enum StockMovementType {
    PURCHASE = "PURCHASE",
    SALE = "SALE",
    SALE_RETURN = "SALE_RETURN",
    ADJUSTMENT_ADD = "ADJUSTMENT_ADD",
    ADJUSTMENT_SUB = "ADJUSTMENT_SUB",
    DAMAGE = "DAMAGE",
    INITIAL = "INITIAL"
}
export declare enum CustomerLedgerType {
    CREDIT_GIVEN = "CREDIT_GIVEN",// Customer took items on udhaar (debit to customer)
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",// Customer paid back money (credit to customer)
    ADJUSTMENT = "ADJUSTMENT"
}
export declare enum ExpenseCategory {
    RENT = "RENT",
    ELECTRICITY = "ELECTRICITY",
    SALARY = "SALARY",
    TRANSPORTATION = "TRANSPORTATION",
    MAINTENANCE = "MAINTENANCE",
    PACKAGING = "PACKAGING",
    INTERNET = "INTERNET",
    MARKETING = "MARKETING",
    MISCELLANEOUS = "MISCELLANEOUS"
}
export declare enum NotificationType {
    LOW_STOCK = "LOW_STOCK",
    EXPIRY_ALERT = "EXPIRY_ALERT",
    UDHAAR_OVERDUE = "UDHAAR_OVERDUE",
    SUPPLIER_DUE = "SUPPLIER_DUE",
    DAILY_SUMMARY = "DAILY_SUMMARY",
    SYSTEM = "SYSTEM"
}
export interface IUser {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    role: UserRole;
    currentBusinessId?: string;
    isSuperAdmin?: boolean;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export interface IBusinessSettings {
    invoicePrefix: string;
    nextInvoiceNumber: number;
    enableGst: boolean;
    allowNegativeStock: boolean;
    upiId?: string;
    upiName?: string;
    financialYearStartMonth: number;
    printHeaderNote?: string;
    printFooterNote?: string;
}
export interface IBusiness {
    _id: string;
    name: string;
    ownerName: string;
    category: BusinessCategory;
    mobile: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    currency: string;
    language: Language;
    logoUrl?: string;
    settings: IBusinessSettings;
    subscription: {
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
        trialEndsAt?: string;
        expiresAt?: string;
        productLimit: number;
    };
    createdAt: string;
    updatedAt: string;
}
export interface IProduct {
    _id: string;
    businessId: string;
    name: string;
    sku: string;
    barcode?: string;
    category: string;
    brand?: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    taxRate: number;
    currentStock: number;
    minStockLevel: number;
    supplierId?: string;
    supplierName?: string;
    description?: string;
    batchNumber?: string;
    expiryDate?: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface IStockMovement {
    _id: string;
    businessId: string;
    productId: string;
    productName: string;
    type: StockMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    unitPrice?: number;
    referenceId?: string;
    reason?: string;
    createdBy: string;
    createdAt: string;
}
export interface ICustomer {
    _id: string;
    businessId: string;
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    customerCode: string;
    totalPurchases: number;
    currentBalance: number;
    creditLimit?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ICustomerLedgerEntry {
    _id: string;
    businessId: string;
    customerId: string;
    type: CustomerLedgerType;
    amount: number;
    balanceAfter: number;
    saleId?: string;
    invoiceNumber?: string;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
    dueDate?: string;
    createdBy: string;
    createdAt: string;
}
export interface ISupplier {
    _id: string;
    businessId: string;
    name: string;
    contactPerson?: string;
    mobile: string;
    email?: string;
    address?: string;
    gstin?: string;
    totalPurchases: number;
    outstandingBalance: number;
    createdAt: string;
    updatedAt: string;
}
export interface IPurchaseItem {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
    purchasePrice: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    batchNumber?: string;
    expiryDate?: string;
}
export interface IPurchase {
    _id: string;
    businessId: string;
    supplierId: string;
    supplierName: string;
    purchaseInvoiceNo: string;
    purchaseDate: string;
    items: IPurchaseItem[];
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ISaleItem {
    productId: string;
    productName: string;
    sku: string;
    barcode?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    mrp: number;
    discountPercent: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    totalPrice: number;
    batchNumber?: string;
}
export interface ISplitPayment {
    method: PaymentMethod;
    amount: number;
    reference?: string;
}
export interface ISale {
    _id: string;
    businessId: string;
    invoiceNumber: string;
    saleDate: string;
    customerId?: string;
    customerName?: string;
    customerMobile?: string;
    items: ISaleItem[];
    subtotal: number;
    billDiscountPercent: number;
    billDiscountAmount: number;
    totalTax: number;
    roundOff: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    udhaarAmount: number;
    splitPayments?: ISplitPayment[];
    notes?: string;
    isReturned?: boolean;
    returnReason?: string;
    idempotencyKey?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface IExpense {
    _id: string;
    businessId: string;
    category: ExpenseCategory;
    title: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    recipient?: string;
    referenceNumber?: string;
    receiptUrl?: string;
    notes?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface INotification {
    _id: string;
    businessId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceId?: string;
    isRead: boolean;
    createdAt: string;
}
export interface IAuditLog {
    _id: string;
    businessId: string;
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    createdAt: string;
}
//# sourceMappingURL=index.d.ts.map