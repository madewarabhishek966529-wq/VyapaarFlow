import React, { useState } from 'react';
import { Modal } from './Modal';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Copy, Check, AlertCircle } from 'lucide-react';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber?: string;
  onPaymentConfirmed: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  upiId,
  payeeName,
  amount,
  invoiceNumber,
  onPaymentConfirmed
}) => {
  const { business, updateBusinessSettings } = useAuth();
  const [copied, setCopied] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);

  const effectiveUpiId = upiId?.trim() || business?.settings?.upiId?.trim() || '';
  const effectivePayee = payeeName?.trim() || business?.name || 'Merchant';

  const upiUri = effectiveUpiId
    ? `upi://pay?pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent(
        effectivePayee
      )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
        invoiceNumber ? `VyapaarFlow ${invoiceNumber}` : 'VyapaarFlow POS Bill'
      )}`
    : '';

  const handleCopyLink = () => {
    if (!upiUri) return;
    navigator.clipboard.writeText(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newUpiId.trim();
    if (!cleaned || !cleaned.includes('@')) {
      setUpiError('Please enter a valid UPI ID (e.g. yourstore@okicici or mobile@upi).');
      return;
    }
    setSavingUpi(true);
    setUpiError(null);
    try {
      await updateBusinessSettings({
        settings: {
          ...business?.settings,
          upiId: cleaned,
          upiName: business?.settings?.upiName || business?.name
        }
      });
      setNewUpiId('');
    } catch (err: any) {
      setUpiError(err.message || 'Failed to save UPI ID');
    } finally {
      setSavingUpi(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dynamic UPI Payment QR" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        {!effectiveUpiId ? (
          <form
            onSubmit={handleSaveUpi}
            className="w-full space-y-3 bg-app p-4 rounded-xl border border-borderline text-left"
          >
            <div className="flex items-start gap-2 text-xs text-[#D97706] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Configure your store UPI ID to generate real customer payment QR codes.</span>
            </div>
            {upiError && (
              <p className="text-[11px] text-[#DC4C4C] font-semibold">{upiError}</p>
            )}
            <input
              type="text"
              required
              placeholder="e.g. yourstore@okicici"
              value={newUpiId}
              onChange={(e) => setNewUpiId(e.target.value)}
              className="vf-input text-xs font-mono"
            />
            <button
              type="submit"
              disabled={savingUpi}
              className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl text-xs transition"
            >
              {savingUpi ? 'Saving UPI ID...' : 'Save UPI ID & Show QR'}
            </button>
          </form>
        ) : (
          <>
            <div className="bg-app w-full py-2.5 px-4 rounded-xl border border-borderline">
              <p className="text-xs text-content-secondary font-medium">Paying to</p>
              <p className="font-bold text-[#142D4E] dark:text-white text-sm">{effectivePayee}</p>
              <p className="text-xs text-[#D97706] font-mono font-semibold">{effectiveUpiId}</p>
            </div>

            {/* Dynamic QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-borderline flex items-center justify-center">
              <QRCodeSVG
                value={upiUri}
                size={220}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Amount Banner */}
            <div className="w-full bg-[#142D4E] text-white py-3 rounded-xl shadow-sm">
              <span className="text-xs text-slate-300 block">Total Amount to Pay</span>
              <span className="text-2xl font-black text-[#D97706]">{formatCurrency(amount)}</span>
            </div>

            <p className="text-[11px] text-content-secondary">
              Scan with GPay, PhonePe, Paytm, BHIM, or any banking UPI app.
            </p>

            {/* Confirm payment */}
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => {
                  onPaymentConfirmed();
                  onClose();
                }}
                className="w-full py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Customer Paid {formatCurrency(amount)}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2 vf-btn-outline rounded-xl text-xs flex items-center justify-center gap-1.5 transition text-content-secondary font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'UPI Link Copied!' : 'Copy UPI Intent Link'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
