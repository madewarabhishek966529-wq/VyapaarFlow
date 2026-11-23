import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Settings, Sparkles, Check, Store, ShieldCheck, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { business, updateBusinessSettings } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();

  const [shopName, setShopName] = useState(business?.name || '');
  const [upiId, setUpiId] = useState(business?.settings?.upiId || '');
  const [upiName, setUpiName] = useState(business?.settings?.upiName || '');
  const [invoicePrefix, setInvoicePrefix] = useState(business?.settings?.invoicePrefix || 'INV-');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(business?.settings?.nextInvoiceNumber || 1);
  const [headerNote, setHeaderNote] = useState(business?.settings?.printHeaderNote || '');
  const [footerNote, setFooterNote] = useState(business?.settings?.printFooterNote || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch subscription plans
  const { data: subData } = useQuery({
    queryKey: ['subscription-info'],
    queryFn: () => api.get('/subscriptions/info')
  });

  const plans: any[] = subData?.data?.plans || [];
  const currentPlan = business?.subscription?.plan || 'PRO';

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => api.post('/subscriptions/checkout', { plan }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-info'] });
      alert(res.message);
      window.location.reload();
    },
    onError: (err: any) => alert(`Upgrade error: ${err.message}`)
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBusinessSettings({
        name: shopName,
        language,
        settings: {
          upiId,
          upiName,
          invoicePrefix,
          nextInvoiceNumber: parseInt(nextInvoiceNumber as any, 10) || 1,
          printHeaderNote: headerNote,
          printFooterNote: footerNote
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-navy flex items-center gap-2">
          <Settings className="w-5 h-5 text-coral" />
          <span>{t('settings.title')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure shop branding, UPI payment QR, thermal receipt notes, and subscription plans
        </p>
      </div>

      {/* Shop Profile & Settings Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-softgrey-border shadow-sm space-y-6 text-xs">
        <div className="flex items-center justify-between border-b border-softgrey-border pb-3">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <Store className="w-4 h-4 text-coral" />
            <span>Store Profile & Billing Configuration</span>
          </h2>
          {saveSuccess && (
            <span className="text-xs font-bold text-success flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Saved successfully!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Store UPI VPA (For Dynamic QR) *</label>
            <input
              type="text"
              required
              placeholder="e.g. yourstore@okicici"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono text-coral font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">UPI Payee Display Name</label>
            <input
              type="text"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Language Preference</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-semibold"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Next Invoice Sequence Number</label>
            <input
              type="number"
              min="1"
              value={nextInvoiceNumber}
              onChange={(e) => setNextInvoiceNumber(e.target.value as any)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Thermal Receipt Header Note</label>
            <input
              type="text"
              value={headerNote}
              onChange={(e) => setHeaderNote(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="e.g. Dhanyawad! Please visit again."
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Thermal Receipt Footer Note</label>
            <input
              type="text"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              className="w-full px-3 py-2 bg-pearl border border-softgrey-border rounded-xl"
              placeholder="e.g. Goods once sold cannot be returned."
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow transition"
          >
            {t('common.save')}
          </button>
        </div>
      </form>

      {/* Subscription Plans Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-black text-navy flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-coral" />
            <span>SaaS Subscription Plans & Pricing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the right plan for your business scale. No expensive external API fees required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-6 border flex flex-col justify-between transition ${
                  p.recommended
                    ? 'border-coral ring-2 ring-coral/20 shadow-xl'
                    : 'border-softgrey-border shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-navy">{p.name}</span>
                    {p.recommended && (
                      <span className="text-[10px] bg-coral text-white font-bold px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="my-4">
                    <span className="text-3xl font-black text-navy">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-slate-500 ml-1">/{p.billingCycle}</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    {p.features.map((feat: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => upgradeMutation.mutate(p.id)}
                  disabled={isCurrent || upgradeMutation.isPending}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : p.recommended
                      ? 'bg-coral hover:bg-coral-hover text-white shadow-md'
                      : 'bg-navy hover:bg-navy-light text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
