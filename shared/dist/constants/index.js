"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATEGORIES = exports.PLAN_LIMITS = exports.UNITS = exports.GST_SLABS = exports.INDIAN_STATES = void 0;
exports.INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];
exports.GST_SLABS = [0, 5, 12, 18, 28];
exports.UNITS = [
    { code: 'pcs', label: 'Pieces (Pcs)' },
    { code: 'kg', label: 'Kilograms (Kg)' },
    { code: 'gm', label: 'Grams (Gm)' },
    { code: 'ltr', label: 'Litres (Ltr)' },
    { code: 'ml', label: 'Millilitres (Ml)' },
    { code: 'pkt', label: 'Packets (Pkt)' },
    { code: 'box', label: 'Boxes (Box)' },
    { code: 'mtr', label: 'Metres (Mtr)' },
    { code: 'doz', label: 'Dozens (Doz)' },
    { code: 'strip', label: 'Strips (Strip)' },
    { code: 'bag', label: 'Bags (Bag)' }
];
exports.PLAN_LIMITS = {
    FREE: {
        maxProducts: 50,
        maxStaff: 1,
        hasUdhaar: true,
        hasReports: 'basic',
        hasThermalPrint: true
    },
    PRO: {
        maxProducts: 1000000,
        maxStaff: 3,
        hasUdhaar: true,
        hasReports: 'advanced',
        hasThermalPrint: true
    },
    BUSINESS: {
        maxProducts: 1000000,
        maxStaff: 25,
        hasUdhaar: true,
        hasReports: 'full',
        hasThermalPrint: true
    }
};
exports.DEFAULT_CATEGORIES = [
    'Grains & Cereals',
    'Spices & Masalas',
    'Oils & Ghee',
    'Dairy & Bakery',
    'Snacks & Beverages',
    'Personal Care',
    'Household & Cleaning',
    'Hardware & Tools',
    'Electrical Goods',
    'Stationery & Office',
    'Medicines & First Aid',
    'Clothing & Fabric',
    'General'
];
//# sourceMappingURL=index.js.map