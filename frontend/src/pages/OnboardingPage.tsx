import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { INDIAN_STATES, BusinessCategory, Language } from '@vyapaarflow/shared';
import confetti from 'canvas-confetti';
import { Store, MapPin, Receipt, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, onboardBusiness } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: user?.name || '',
    category: BusinessCategory.GROCERY,
    mobile: user?.mobile || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    gstin: '',
    currency: 'INR',
    language: Language.ENGLISH,
    invoicePrefix: 'INV-',
    startingInvoiceNumber: 1,
    upiId: '',
    upiName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onboardBusiness({
        ...formData,
        upiName: formData.upiName || formData.businessName
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      navigate('/dashboard');
    } catch (err: any) {
      alert(`Onboarding error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pearl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Step Indicator */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-navy tracking-tight">Setup Your Vyapaar Store</h1>
          <p className="text-xs text-slate-500">Complete your profile to customize bills, GST, and UPI QR</p>

          <div className="flex items-center justify-center gap-3 pt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === s
                      ? 'bg-coral text-white shadow-md'
                      : step > s
                      ? 'bg-success text-white'
                      : 'bg-white border border-slate-300 text-slate-400'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-success' : 'bg-slate-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-softgrey-border shadow-xl">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }} className="space-y-5 text-xs">
            {/* STEP 1: Basic Store Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <Store className="w-4 h-4 text-coral" />
                  <span>Step 1: Store & Owner Details</span>
                </h2>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl font-semibold"
                    placeholder="e.g. Shree Ganesh Supermarket"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
                    >
                      {Object.values(BusinessCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shop Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
                      placeholder="9822001122"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shop Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Address & GSTIN */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-coral" />
                  <span>Step 2: Location & Taxation Details</span>
                </h2>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Full Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
                    placeholder="Shop No. 4, Karve Road, Kothrud"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
                      placeholder="e.g. Pune"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-medium"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">6-Digit PIN Code *</label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
                      placeholder="411038"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono uppercase"
                    placeholder="e.g. 27AABCU9603R1ZM"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Billing & UPI QR */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-coral" />
                  <span>Step 3: Billing Series & UPI Payment QR</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bill Prefix</label>
                    <input
                      type="text"
                      required
                      value={formData.invoicePrefix}
                      onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Starting Bill Number</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.startingInvoiceNumber}
                      onChange={(e) => setFormData({ ...formData, startingInvoiceNumber: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop UPI ID (For Dynamic QR Codes)</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono text-coral font-bold"
                    placeholder="e.g. shopname@okicici or 9822001122@upi"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Customer can scan QR at checkout to pay directly to your bank account.
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-between pt-4 border-t border-softgrey-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 bg-softgrey hover:bg-softgrey-border text-navy font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : <div></div>}

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2"
              >
                <span>{step === 3 ? (isLoading ? 'Creating Store...' : 'Launch Vyapaar Store') : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
