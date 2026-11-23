import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  BookOpen,
  Menu
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-navy text-slate-300 border-t border-navy-muted flex items-center justify-around z-40 px-2 shadow-2xl">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
            isActive ? 'text-coral' : 'text-slate-400 hover:text-white'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('nav.dashboard')}</span>
      </NavLink>

      <NavLink
        to="/inventory"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
            isActive ? 'text-coral' : 'text-slate-400 hover:text-white'
          }`
        }
      >
        <Boxes className="w-5 h-5" />
        <span>Stock</span>
      </NavLink>

      {/* Elevated POS Center Button */}
      <NavLink
        to="/pos"
        className="flex flex-col items-center justify-center -mt-6 bg-coral hover:bg-coral-hover text-white w-13 h-13 p-3 rounded-full shadow-2xl ring-4 ring-pearl active:scale-95 transition"
      >
        <ShoppingCart className="w-6 h-6" />
      </NavLink>

      <NavLink
        to="/udhaar"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
            isActive ? 'text-coral' : 'text-slate-400 hover:text-white'
          }`
        }
      >
        <BookOpen className="w-5 h-5" />
        <span>Udhaar</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
            isActive ? 'text-coral' : 'text-slate-400 hover:text-white'
          }`
        }
      >
        <Menu className="w-5 h-5" />
        <span>More</span>
      </NavLink>
    </nav>
  );
};
