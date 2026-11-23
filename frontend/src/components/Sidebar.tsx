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
  Sparkles
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
    <aside className="hidden md:flex flex-col w-64 bg-navy text-slate-300 border-r border-navy-muted min-h-[calc(100vh-4rem)]">
      {/* Quick POS Shortcut Banner */}
      <div className="p-4 border-b border-navy-muted">
        <NavLink
          to="/pos"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow-lg transition transform active:scale-95 text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('pos.title')}</span>
          <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded ml-1">F2</span>
        </NavLink>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-coral text-white shadow-md'
                    : 'text-slate-300 hover:bg-navy-light hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Subscription Plan Badge */}
      <div className="p-4 border-t border-navy-muted">
        <div className="bg-navy-light rounded-xl p-3 border border-navy-muted text-xs">
          <div className="flex items-center justify-between font-bold text-white mb-1">
            <span className="flex items-center gap-1 text-coral">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{business?.subscription?.plan || 'PRO'} PLAN</span>
            </span>
            <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Fast Billing & GST Reports Enabled</p>
        </div>
      </div>
    </aside>
  );
};
