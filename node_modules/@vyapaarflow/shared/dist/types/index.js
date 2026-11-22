"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ExpenseCategory = exports.CustomerLedgerType = exports.StockMovementType = exports.PaymentStatus = exports.PaymentMethod = exports.Language = exports.BusinessCategory = exports.SubscriptionStatus = exports.SubscriptionPlan = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["OWNER"] = "OWNER";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["CASHIER"] = "CASHIER";
    UserRole["INVENTORY_MANAGER"] = "INVENTORY_MANAGER";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "FREE";
    SubscriptionPlan["PRO"] = "PRO";
    SubscriptionPlan["BUSINESS"] = "BUSINESS";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIAL"] = "TRIAL";
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var BusinessCategory;
(function (BusinessCategory) {
    BusinessCategory["GROCERY"] = "GROCERY";
    BusinessCategory["HARDWARE"] = "HARDWARE";
    BusinessCategory["ELECTRICAL"] = "ELECTRICAL";
    BusinessCategory["ELECTRONICS"] = "ELECTRONICS";
    BusinessCategory["MEDICAL"] = "MEDICAL";
    BusinessCategory["CLOTHING"] = "CLOTHING";
    BusinessCategory["COSMETICS"] = "COSMETICS";
    BusinessCategory["WHOLESALE"] = "WHOLESALE";
    BusinessCategory["GENERAL_RETAIL"] = "GENERAL_RETAIL";
    BusinessCategory["OTHER"] = "OTHER";
})(BusinessCategory || (exports.BusinessCategory = BusinessCategory = {}));
var Language;
(function (Language) {
    Language["ENGLISH"] = "en";
    Language["HINDI"] = "hi";
    Language["MARATHI"] = "mr";
})(Language || (exports.Language = Language = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["UDHAAR"] = "UDHAAR";
    PaymentMethod["SPLIT"] = "SPLIT";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["PARTIAL"] = "PARTIAL";
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["PURCHASE"] = "PURCHASE";
    StockMovementType["SALE"] = "SALE";
    StockMovementType["SALE_RETURN"] = "SALE_RETURN";
    StockMovementType["ADJUSTMENT_ADD"] = "ADJUSTMENT_ADD";
    StockMovementType["ADJUSTMENT_SUB"] = "ADJUSTMENT_SUB";
    StockMovementType["DAMAGE"] = "DAMAGE";
    StockMovementType["INITIAL"] = "INITIAL";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
var CustomerLedgerType;
(function (CustomerLedgerType) {
    CustomerLedgerType["CREDIT_GIVEN"] = "CREDIT_GIVEN";
    CustomerLedgerType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    CustomerLedgerType["ADJUSTMENT"] = "ADJUSTMENT";
})(CustomerLedgerType || (exports.CustomerLedgerType = CustomerLedgerType = {}));
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["RENT"] = "RENT";
    ExpenseCategory["ELECTRICITY"] = "ELECTRICITY";
    ExpenseCategory["SALARY"] = "SALARY";
    ExpenseCategory["TRANSPORTATION"] = "TRANSPORTATION";
    ExpenseCategory["MAINTENANCE"] = "MAINTENANCE";
    ExpenseCategory["PACKAGING"] = "PACKAGING";
    ExpenseCategory["INTERNET"] = "INTERNET";
    ExpenseCategory["MARKETING"] = "MARKETING";
    ExpenseCategory["MISCELLANEOUS"] = "MISCELLANEOUS";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["LOW_STOCK"] = "LOW_STOCK";
    NotificationType["EXPIRY_ALERT"] = "EXPIRY_ALERT";
    NotificationType["UDHAAR_OVERDUE"] = "UDHAAR_OVERDUE";
    NotificationType["SUPPLIER_DUE"] = "SUPPLIER_DUE";
    NotificationType["DAILY_SUMMARY"] = "DAILY_SUMMARY";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map