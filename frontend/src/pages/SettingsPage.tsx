import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Settings, Check, Store } from 'lucide-react';

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
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#142D4E] dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#256D85]" />
          <span>{t('settings.title')}</span>
        </h1>
        <p className="text-xs text-content-secondary mt-1">
          Configure shop branding, UPI payment QR, thermal receipt notes, and subscription plans
        </p>
      </div>

      {/* Shop Profile & Settings Form */}
      <form onSubmit={handleSaveProfile} className="bg-surface p-6 rounded-xl border border-borderline shadow-card space-y-6 text-xs">
        <div className="flex items-center justify-between border-b border-borderline pb-3">
          <h2 className="text-sm font-bold text-[#142D4E] dark:text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-[#256D85]" />
            <span>Store Profile & Billing Configuration</span>
          </h2>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Saved successfully!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-content-secondary block mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="vf-input font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Store UPI VPA (For Dynamic QR) *</label>
            <input
              type="text"
              required
              placeholder="e.g. yourstore@okicici"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="vf-input font-mono text-[#D97706] font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">UPI Payee Display Name</label>
            <input
              type="text"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              className="vf-input"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Language Preference</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="vf-input font-semibold"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="vf-input font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Next Invoice Sequence Number</label>
            <input
              type="number"
              min="1"
              value={nextInvoiceNumber}
              onChange={(e) => setNextInvoiceNumber(e.target.value as any)}
              className="vf-input font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Thermal Receipt Header Note</label>
            <input
              type="text"
              value={headerNote}
              onChange={(e) => setHeaderNote(e.target.value)}
              className="vf-input"
              placeholder="e.g. Dhanyawad! Please visit again."
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Thermal Receipt Footer Note</label>
            <input
              type="text"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              className="vf-input"
              placeholder="e.g. Goods once sold cannot be returned."
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="vf-btn-primary"
          >
            {t('common.save')}
          </button>
        </div>
      </form>

      {/* Subscription Plans Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-[#142D4E] dark:text-white">
            SaaS Subscription Plans & Pricing
          </h2>
          <p className="text-xs text-content-secondary mt-0.5">
            Select the right plan for your business scale. No expensive external API fees required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id;

            return (
              <div
                key={p.id}
                className={`bg-surface rounded-xl p-6 border flex flex-col justify-between transition-shadow ${
                  p.recommended
                    ? 'border-[#256D85] ring-2 ring-[#256D85]/20 shadow-lg'
                    : 'border-borderline shadow-card'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-[#142D4E] dark:text-white">{p.name}</span>
                    {p.recommended && (
                      <span className="text-[10px] bg-[#256D85] text-white font-bold px-2 py-0.5 rounded">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-[#142D4E] dark:text-white">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-content-secondary ml-1">/{p.billingCycle}</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-content-secondary mb-6">
                    {p.features.map((feat: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => upgradeMutation.mutate(p.id)}
                  disabled={isCurrent || upgradeMutation.isPending}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs transition-colors ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-content-muted cursor-default'
                      : p.recommended
                      ? 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm'
                      : 'bg-[#256D85] hover:bg-[#1E576B] text-white shadow-sm'
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
