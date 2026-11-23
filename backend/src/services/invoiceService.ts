import { ISale } from '@vyapaarflow/shared';

export class InvoiceService {
  /**
   * Formats thermal receipt plain text suitable for 58mm (32 cols) and 80mm (48 cols) ESC/POS printers
   */
  static formatThermalReceipt(sale: any, business: any, paperWidthMm: 58 | 80 = 58): string {
    const width = paperWidthMm === 80 ? 48 : 32;
    const divider = '-'.repeat(width);
    const doubleDivider = '='.repeat(width);

    const center = (text: string): string => {
      if (text.length >= width) return text.substring(0, width);
      const leftPad = Math.floor((width - text.length) / 2);
      return ' '.repeat(leftPad) + text;
    };

    const leftRight = (left: string, right: string): string => {
      const space = width - left.length - right.length;
      if (space <= 0) return left + ' ' + right;
      return left + ' '.repeat(space) + right;
    };

    const lines: string[] = [];

    // Header
    lines.push(center(business.name.toUpperCase()));
    if (business.address) lines.push(center(business.address));
    if (business.city) lines.push(center(`${business.city}, ${business.state || ''}`));
    lines.push(center(`Ph: ${business.mobile || ''}`));
    if (business.gstin) lines.push(center(`GSTIN: ${business.gstin}`));
    lines.push(doubleDivider);

    // Bill Info
    lines.push(leftRight(`Invoice: #${sale.invoiceNumber}`, `Date: ${new Date(sale.saleDate).toLocaleDateString('en-IN')}`));
    if (sale.customerName) {
      lines.push(leftRight(`Cust: ${sale.customerName}`, sale.customerMobile ? `Ph: ${sale.customerMobile}` : ''));
    }
    lines.push(divider);

    // Item Headers
    if (paperWidthMm === 80) {
      lines.push(leftRight('ITEM [QTY x RATE]', 'TOTAL'));
    } else {
      lines.push(leftRight('ITEM', 'QTY  AMT'));
    }
    lines.push(divider);

    // Items
    for (const item of sale.items) {
      if (paperWidthMm === 80) {
        const itemLine = `${item.productName.substring(0, 24)}`;
        const qtyRate = `${item.quantity} ${item.unit} x ₹${item.unitPrice}`;
        lines.push(itemLine);
        lines.push(leftRight(`  ${qtyRate}`, `₹${item.totalPrice.toFixed(2)}`));
      } else {
        lines.push(item.productName.substring(0, width));
        const details = `${item.quantity}${item.unit} x ₹${item.unitPrice}`;
        lines.push(leftRight(` ${details}`, `₹${item.totalPrice.toFixed(2)}`));
      }
    }

    lines.push(divider);
    lines.push(leftRight('Subtotal:', `₹${sale.subtotal.toFixed(2)}`));
    if (sale.billDiscountAmount > 0) {
      lines.push(leftRight(`Discount (${sale.billDiscountPercent}%):`, `-₹${sale.billDiscountAmount.toFixed(2)}`));
    }
    if (sale.totalTax > 0) {
      lines.push(leftRight('GST Total:', `₹${sale.totalTax.toFixed(2)}`));
    }
    if (sale.roundOff !== 0) {
      lines.push(leftRight('Round Off:', `${sale.roundOff > 0 ? '+' : ''}₹${sale.roundOff.toFixed(2)}`));
    }
    lines.push(doubleDivider);
    lines.push(leftRight('GRAND TOTAL:', `₹${sale.grandTotal.toFixed(2)}`));
    lines.push(leftRight(`Payment Mode:`, `${sale.paymentMethod}`));
    lines.push(leftRight(`Paid Amount:`, `₹${sale.amountPaid.toFixed(2)}`));
    if (sale.udhaarAmount > 0) {
      lines.push(leftRight(`UDHAAR (CREDIT):`, `₹${sale.udhaarAmount.toFixed(2)}`));
    }
    lines.push(doubleDivider);

    // Footer
    if (business.settings?.printHeaderNote) {
      lines.push(center(business.settings.printHeaderNote));
    }
    if (business.settings?.printFooterNote) {
      lines.push(center(business.settings.printFooterNote));
    }
    lines.push(center('Powered by VyapaarFlow'));
    lines.push('\n\n'); // Feed space for tear

    return lines.join('\n');
  }
}
