import React, { useState } from 'react';
import { Modal } from './Modal';
import { Camera, Barcode, Zap } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedCode: string) => void;
  sampleProducts?: any[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  sampleProducts = []
}) => {
  const [manualCode, setManualCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Barcode Scanner" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Scanner Simulation Box */}
        <div className="bg-[#142D4E] rounded-2xl p-6 text-center text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
          <div className="absolute inset-x-8 top-1/2 h-0.5 bg-[#D97706] shadow-[0_0_12px_#D97706] animate-pulse"></div>
          <Camera className="w-10 h-10 text-[#256D85] mb-2 animate-bounce" />
          <span className="text-xs font-semibold text-slate-200">Point Camera at Barcode</span>
          <span className="text-[10px] text-slate-400 mt-1">Laser scanner ready for SKU / Barcode</span>
        </div>

        {/* Manual Barcode Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type barcode or SKU..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs vf-input rounded-xl"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#D97706] hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            Scan
          </button>
        </form>

        {/* Quick Click-to-Scan Test Shortcuts */}
        {sampleProducts.length > 0 && (
          <div className="border-t border-borderline pt-3">
            <span className="text-xs font-bold text-content-primary flex items-center gap-1 mb-2">
              <Zap className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Click to Instant-Scan Sample Barcodes:</span>
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {sampleProducts.slice(0, 6).map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    onScan(p.barcode || p.sku);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded-lg bg-app hover:bg-[#256D85]/10 hover:border-[#256D85]/40 border border-borderline text-xs flex justify-between items-center transition"
                >
                  <span className="font-semibold text-content-primary truncate">{p.name}</span>
                  <span className="font-mono text-[11px] bg-borderline/60 px-1.5 py-0.5 rounded text-content-secondary shrink-0 ml-2">
                    {p.barcode || p.sku}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
