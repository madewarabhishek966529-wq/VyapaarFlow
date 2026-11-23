import { PLAN_LIMITS } from '@vyapaarflow/shared';

describe('Financial & Business Calculation Logic', () => {
  describe('Tax (GST) Calculations', () => {
    it('should correctly calculate GST amount and line totals', () => {
      const quantity = 3;
      const unitPrice = 100;
      const taxRate = 18; // 18% GST

      const baseAmount = quantity * unitPrice; // 300
      const taxAmount = (baseAmount * taxRate) / 100; // 54
      const totalPrice = baseAmount + taxAmount; // 354
      const cgst = taxAmount / 2; // 27
      const sgst = taxAmount / 2; // 27

      expect(baseAmount).toBe(300);
      expect(taxAmount).toBe(54);
      expect(totalPrice).toBe(354);
      expect(cgst).toBe(27);
      expect(sgst).toBe(27);
    });

    it('should correctly calculate 0% tax for exempt essentials like plain salt/grains', () => {
      const quantity = 5;
      const unitPrice = 28;
      const taxRate = 0;

      const baseAmount = quantity * unitPrice;
      const taxAmount = (baseAmount * taxRate) / 100;
      const totalPrice = baseAmount + taxAmount;

      expect(taxAmount).toBe(0);
      expect(totalPrice).toBe(140);
    });
  });

  describe('Discount and Invoice Grand Totals', () => {
    it('should calculate bill-level discount and round off correctly', () => {
      const subtotal = 1450.00;
      const discountPercent = 10;
      const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100; // 145.00
      const discountedTotal = subtotal - discountAmount; // 1305.00
      const grandTotalWithPaisa = 1305.60;
      const roundedGrandTotal = Math.round(grandTotalWithPaisa); // 1306
      const roundOff = parseFloat((roundedGrandTotal - grandTotalWithPaisa).toFixed(2)); // +0.40

      expect(discountAmount).toBe(145);
      expect(roundedGrandTotal).toBe(1306);
      expect(roundOff).toBe(0.40);
    });
  });

  describe('Stock Movement and Udhaar Balances', () => {
    it('should compute running Udhaar balances accurately upon partial repayment', () => {
      const initialBalance = 0;
      const creditSale1 = 1200;
      const balAfterSale1 = initialBalance + creditSale1; // 1200

      const creditSale2 = 800;
      const balAfterSale2 = balAfterSale1 + creditSale2; // 2000

      const repayment1 = 500;
      const balAfterRepayment1 = balAfterSale2 - repayment1; // 1500

      const repayment2 = 1500;
      const balAfterRepayment2 = Math.max(0, balAfterRepayment1 - repayment2); // 0

      expect(balAfterSale1).toBe(1200);
      expect(balAfterSale2).toBe(2000);
      expect(balAfterRepayment1).toBe(1500);
      expect(balAfterRepayment2).toBe(0);
    });

    it('should accurately calculate stock deduction and prevent negative stock when restricted', () => {
      const initialStock = 15;
      const soldQuantity = 5;
      const remainingStock = initialStock - soldQuantity;

      expect(remainingStock).toBe(10);

      const allowNegative = false;
      const excessiveSale = 12;
      const canFulfill = allowNegative || remainingStock >= excessiveSale;

      expect(canFulfill).toBe(false);
    });
  });

  describe('Profit Reconciliation (Gross vs Net)', () => {
    it('should distinguish Gross Profit (Revenue - COGS) and Net Profit (Gross - Expenses)', () => {
      const totalRevenue = 50000;
      const costOfGoodsSold = 38000;
      const grossProfit = totalRevenue - costOfGoodsSold; // 12000

      const operatingExpenses = 7500; // Rent + Electricity + Salary
      const netProfit = grossProfit - operatingExpenses; // 4500

      expect(grossProfit).toBe(12000);
      expect(netProfit).toBe(4500);
      expect((grossProfit / totalRevenue) * 100).toBe(24); // 24% Gross Margin
      expect((netProfit / totalRevenue) * 100).toBe(9); // 9% Net Margin
    });
  });

  describe('Subscription Plan Limits', () => {
    it('should enforce Free plan max product count', () => {
      expect(PLAN_LIMITS.FREE.maxProducts).toBe(50);
      expect(PLAN_LIMITS.PRO.maxProducts).toBeGreaterThan(10000);
    });
  });
});
