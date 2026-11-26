import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  BookOpen
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface text-content-secondary border-t border-borderline flex items-center justify-around z-40 px-2 shadow-lg">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-[#256D85] font-bold' : 'text-content-secondary hover:text-content-primary'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('nav.dashboard')}</span>
      </NavLink>

      <NavLink
        to="/inventory"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-[#256D85] font-bold' : 'text-content-secondary hover:text-content-primary'
          }`
        }
      >
        <Boxes className="w-5 h-5" />
        <span>Stock</span>
      </NavLink>

      {/* Elevated Amber POS Center Action Button */}
      <NavLink
        to="/pos"
        className="flex flex-col items-center justify-center -mt-6 bg-[#D97706] hover:bg-[#B45309] text-white w-12 h-12 rounded-full shadow-md border-2 border-surface active:scale-95 transition-transform"
      >
        <ShoppingCart className="w-5 h-5" />
      </NavLink>

      <NavLink
        to="/udhaar"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-[#256D85] font-bold' : 'text-content-secondary hover:text-content-primary'
          }`
        }
      >
        <BookOpen className="w-5 h-5" />
        <span>Udhaar</span>
      </NavLink>
    </nav>
  );
};
