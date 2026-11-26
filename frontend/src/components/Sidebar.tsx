import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  BookOpen,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user, business } = useAuth();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/pos', label: t('nav.pos'), icon: ShoppingCart },
    { to: '/inventory', label: t('nav.inventory'), icon: Boxes },
    { to: '/udhaar', label: t('nav.udhaar'), icon: BookOpen },
    { to: '/customers', label: t('nav.customers'), icon: Users },
    { to: '/suppliers', label: t('nav.suppliers'), icon: Truck },
    { to: '/expenses', label: t('nav.expenses'), icon: Receipt },
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { to: '/settings', label: t('nav.settings'), icon: Settings }
  ];

  if (user?.isSuperAdmin) {
    navItems.push({ to: '/admin', label: t('nav.admin'), icon: ShieldCheck });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#142D4E] text-slate-100 min-h-[calc(100vh-4rem)] border-r border-[#1C3B65] shrink-0 select-none transition-all duration-200 z-20">
      {/* Quick Action: New Bill CTA (Amber Brand Color #D97706) */}
      <div className="p-4 border-b border-[#1E3E6B]/60">
        <NavLink
          to="/pos"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98] text-xs uppercase tracking-wider"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{t('pos.title')}</span>
          <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono font-normal">
            F2
          </span>
        </NavLink>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Store Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#256D85] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Subscription Status Card */}
      <div className="p-4 border-t border-[#1E3E6B]/60 bg-[#0E2139]/50">
        <div className="rounded-lg p-3 bg-[#142D4E]/90 border border-[#1E3E6B] text-xs">
          <div className="flex items-center justify-between font-bold text-white mb-1">
            <span className="text-slate-200 text-[11px] font-semibold tracking-wide">
              {business?.subscription?.plan || 'PRO'} PLAN
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">GST Billing & Udhaar Ledger</p>
        </div>
      </div>
    </aside>
  );
};
