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
  Sparkles,
  Zap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user, business } = useAuth();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/pos', label: t('nav.pos'), icon: ShoppingCart, highlight: true },
    { to: '/inventory', label: t('nav.inventory'), icon: Boxes },
    { to: '/udhaar', label: t('nav.udhaar'), icon: BookOpen },
    { to: '/customers', label: t('nav.customers'), icon: Users },
    { to: '/suppliers', label: t('nav.suppliers'), icon: Truck },
    { to: '/expenses', label: t('nav.expenses'), icon: Receipt },
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { to: '/settings', label: t('nav.settings'), icon: Settings }
  ];

  if (user?.isSuperAdmin) {
    navItems.push({ to: '/admin', label: t('nav.admin'), icon: ShieldCheck, highlight: false });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950/60 backdrop-blur-2xl text-slate-300 border-r border-white/10 min-h-[calc(100vh-4rem)] relative z-20">
      {/* Quick POS Shortcut Glow Action */}
      <div className="p-4 border-b border-white/10">
        <NavLink
          to="/pos"
          className="group relative flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-coral via-rose-500 to-aurora-purple text-white font-bold rounded-2xl shadow-glow-coral transition-all transform hover:-translate-y-0.5 active:scale-95 text-xs overflow-hidden"
        >
          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{t('pos.title')}</span>
          <span className="text-[10px] bg-black/30 border border-white/20 px-1.5 py-0.5 rounded-md ml-1 font-mono">
            F2
          </span>
        </NavLink>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Store Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-aurora-purple/25 via-aurora-indigo/15 to-transparent text-white border-l-2 border-aurora-purple shadow-inner-light'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-aurora-purple' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-aurora-purple shadow-glow-purple" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Subscription Plan Bento Card */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-glass text-xs relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-aurora-purple/20 blur-xl group-hover:bg-aurora-purple/30 transition" />
          <div className="flex items-center justify-between font-bold text-white mb-1.5">
            <span className="flex items-center gap-1.5 text-aurora-purple">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="tracking-wide text-[11px]">{business?.subscription?.plan || 'PRO'} PLAN</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">GST Billing & WhatsApp Udhaar Ledger</p>
        </div>
      </div>
    </aside>
  );
};
