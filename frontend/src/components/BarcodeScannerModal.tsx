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
        <div className="bg-navy rounded-2xl p-6 text-center text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
          <div className="absolute inset-x-8 top-1/2 h-0.5 bg-coral shadow-[0_0_12px_#FF6B5F] animate-pulse"></div>
          <Camera className="w-10 h-10 text-coral/80 mb-2 animate-bounce" />
          <span className="text-xs font-semibold text-slate-300">Point Camera at Barcode</span>
          <span className="text-[10px] text-slate-400 mt-1">Laser scanner ready for SKU / Barcode</span>
        </div>

        {/* Manual Barcode Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type barcode or SKU..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow transition"
          >
            Scan
          </button>
        </form>

        {/* Quick Click-to-Scan Test Shortcuts */}
        {sampleProducts.length > 0 && (
          <div className="border-t border-softgrey-border pt-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
              <Zap className="w-3.5 h-3.5 text-warning" />
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
                  className="w-full text-left p-2 rounded-lg bg-pearl hover:bg-coral/10 hover:border-coral border border-softgrey-border text-xs flex justify-between items-center transition"
                >
                  <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                  <span className="font-mono text-[11px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 shrink-0 ml-2">
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
