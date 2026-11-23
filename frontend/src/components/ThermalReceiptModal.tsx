import React, { useState } from 'react';
import { Modal } from './Modal';
import { Printer, Download, Share2 } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptText: string;
  invoiceNumber: string;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptText,
  invoiceNumber
}) => {
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('58');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([receiptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${invoiceNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Receipt #${invoiceNumber}`} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Paper Size selector */}
        <div className="flex items-center justify-between text-xs bg-pearl p-2 rounded-xl border border-softgrey-border">
          <span className="font-semibold text-slate-600">Printer Format:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPaperWidth('58')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                paperWidth === '58' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-softgrey'
              }`}
            >
              58mm Thermal
            </button>
            <button
              onClick={() => setPaperWidth('80')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                paperWidth === '80' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-softgrey'
              }`}
            >
              80mm Thermal
            </button>
          </div>
        </div>

        {/* Realistic ESC/POS Thermal Receipt Preview */}
        <div className="bg-pearl-light border-2 border-dashed border-slate-300 p-4 rounded-xl shadow-inner overflow-x-auto">
          <pre
            id="printable-receipt"
            className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre"
          >
            {receiptText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 text-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Receipt</span>
          </button>
          <button
            onClick={handleDownloadTxt}
            className="px-4 py-2.5 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl text-sm transition"
            title="Download text format"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
