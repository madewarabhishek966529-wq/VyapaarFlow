import React, { useState } from 'react';
import { Modal } from './Modal';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../lib/utils';
import { CheckCircle2, Copy, Check, Clock } from 'lucide-react';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  payeeName: string;
  amount: number;
  onPaymentConfirmed: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  upiId,
  payeeName,
  amount,
  onPaymentConfirmed
}) => {
  const [copied, setCopied] = useState(false);

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('VyapaarFlow POS Bill')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dynamic UPI Payment QR" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="bg-pearl-dark w-full py-2.5 px-4 rounded-xl border border-softgrey-border">
          <p className="text-xs text-slate-500 font-medium">Paying to</p>
          <p className="font-bold text-navy text-sm">{payeeName}</p>
          <p className="text-xs text-coral font-mono font-semibold">{upiId}</p>
        </div>

        {/* Dynamic QR Code */}
        <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100 flex items-center justify-center">
          <QRCodeSVG
            value={upiUri}
            size={220}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Amount Banner */}
        <div className="w-full bg-navy text-white py-3 rounded-xl shadow">
          <span className="text-xs text-slate-300 block">Total Amount to Pay</span>
          <span className="text-2xl font-black text-coral">{formatCurrency(amount)}</span>
        </div>

        <p className="text-[11px] text-slate-500">
          Scan with GPay, PhonePe, Paytm, BHIM, or any banking UPI app.
        </p>

        {/* Confirm payment */}
        <div className="w-full space-y-2 pt-2">
          <button
            onClick={() => {
              onPaymentConfirmed();
              onClose();
            }}
            className="w-full py-2.5 bg-success hover:bg-success-dark text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 text-sm transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Customer Paid ₹{amount.toFixed(2)}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'UPI Link Copied!' : 'Copy UPI Intent Link'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
