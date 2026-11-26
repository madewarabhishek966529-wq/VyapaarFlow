import React from 'react';
import { Modal } from './Modal';
import { formatCurrency, formatDate } from '../lib/utils';
import { Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface A4InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  business: any;
}

export const A4InvoiceModal: React.FC<A4InvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
  business
}) => {
  if (!sale || !business) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const invoiceEl = document.getElementById('a4-invoice-content');
    if (!invoiceEl) return;

    try {
      const canvas = await html2canvas(invoiceEl, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${sale.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tax Invoice #${sale.invoiceNumber}`} maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* A4 Invoice Container */}
        <div
          id="a4-invoice-content"
          className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-slate-900 font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-[#142D4E]">{business.name}</h1>
              <p className="text-xs text-slate-500 mt-1">{business.address}</p>
              <p className="text-xs text-slate-500">{business.city}, {business.state} - {business.pincode}</p>
              <p className="text-xs text-slate-700 font-semibold mt-1">Ph: {business.mobile} | Email: {business.email}</p>
              {business.gstin && (
                <p className="text-xs font-bold text-[#256D85] mt-1">GSTIN: {business.gstin}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-block bg-[#142D4E] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                TAX INVOICE
              </span>
              <p className="text-sm font-bold text-slate-900 mt-2">Invoice #: {sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(sale.saleDate)}</p>
              <p className="text-xs text-slate-500">Payment: {sale.paymentMethod}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between text-xs">
            <div>
              <span className="font-bold text-slate-700">Billed To (Customer):</span>
              <p className="font-semibold text-[#142D4E] text-sm mt-0.5">{sale.customerName || 'Walk-in Customer'}</p>
              {sale.customerMobile && <p className="text-slate-500">Mobile: {sale.customerMobile}</p>}
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-700">Status:</span>
              <p className={`font-bold mt-0.5 ${sale.paymentStatus === 'COMPLETED' ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                {sale.paymentStatus}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs text-left border-collapse my-4">
            <thead>
              <tr className="bg-[#142D4E] text-white">
                <th className="p-2.5 rounded-l">#</th>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5 text-center">Unit</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-center">Qty</th>
                <th className="p-2.5 text-right">GST %</th>
                <th className="p-2.5 rounded-r text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sale.items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-2.5 text-center text-slate-500">{item.unit}</td>
                  <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                  <td className="p-2.5 text-right text-slate-500">{item.taxRate}%</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-between items-start border-t border-slate-200 pt-4">
            <div className="w-1/2 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>{business.settings?.printHeaderNote || 'Thank you for shopping with us!'}</p>
              <p>{business.settings?.printFooterNote || 'Goods once sold cannot be returned without bill.'}</p>
            </div>
            <div className="w-1/2 text-xs space-y-1.5 text-right">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.billDiscountAmount > 0 && (
                <div className="flex justify-between text-[#D97706]">
                  <span>Discount ({sale.billDiscountPercent}%):</span>
                  <span>-{formatCurrency(sale.billDiscountAmount)}</span>
                </div>
              )}
              {sale.totalTax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax Breakdown:</span>
                  <span>{formatCurrency(sale.totalTax)}</span>
                </div>
              )}
              {sale.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round Off:</span>
                  <span>{sale.roundOff > 0 ? '+' : ''}{sale.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-[#142D4E]">
                <span>Grand Total:</span>
                <span className="text-[#D97706] text-base">{formatCurrency(sale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-bold text-[#16A34A]">{formatCurrency(sale.amountPaid)}</span>
              </div>
              {sale.udhaarAmount > 0 && (
                <div className="flex justify-between text-[#D97706] font-bold">
                  <span>Udhaar (Credit Due):</span>
                  <span>{formatCurrency(sale.udhaarAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="mt-12 pt-4 border-t border-dashed border-slate-300 flex justify-between items-end text-xs text-slate-500">
            <span>Customer Signature</span>
            <div className="text-right">
              <p className="font-bold text-[#142D4E]">For {business.name}</p>
              <div className="h-10"></div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-[#256D85] text-white font-semibold rounded-xl text-xs flex items-center gap-2 hover:bg-sky-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download A4 PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#D97706] text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-amber-600 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
