import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Store,
  LogOut,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const { user, business, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, pendingSyncCount, isSyncing, syncOfflineBills } = useOffline();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch notifications
  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
    refetchInterval: 30000,
    enabled: isOnline && !!business
  });

  const notifications = notifData?.data?.notifications || [];
  const unreadCount = notifData?.data?.unreadCount || 0;

  const handleMarkAllRead = async () => {
    await api.put('/notifications/mark-all-read');
    refetchNotifs();
  };

  return (
    <header className="h-16 bg-surface text-content-primary px-4 md:px-6 flex items-center justify-between border-b border-borderline shadow-sm relative z-30 transition-colors duration-200">
      {/* Left: Brand & Business Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          {/* Official Brand Logo Mark */}
          <div className="w-9 h-9 rounded-lg bg-[#142D4E] flex items-center justify-center font-black text-white shadow-sm border border-[#256D85]/30">
            <span className="text-sm font-black tracking-tight text-white">VF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-[#142D4E] dark:text-white leading-tight">
              Vyapaar<span className="text-[#256D85]">Flow</span>
            </span>
            <span className="text-[10px] text-content-secondary font-semibold tracking-wider uppercase hidden sm:inline">
              SME Business Suite
            </span>
          </div>
        </div>

        {business && (
          <div className="hidden md:flex items-center gap-2 bg-[#F5F7FA] dark:bg-[#1C2C40] px-3 py-1.5 rounded-lg border border-borderline">
            <Store className="w-3.5 h-3.5 text-[#256D85]" />
            <span className="text-xs font-semibold max-w-[200px] truncate text-content-primary">{business.name}</span>
            <span className="text-[10px] bg-[#256D85]/10 text-[#256D85] dark:text-[#368AA5] font-bold px-2 py-0.5 rounded border border-[#256D85]/20">
              {business.category}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Offline / Online Sync Indicator */}
        {isOnline ? (
          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 ? (
              <button
                onClick={syncOfflineBills}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-700 dark:text-amber-400 font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-sm animate-pulse"
                title={`${pendingSyncCount} bills pending sync`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} {t('common.syncNow')}</span>
              </button>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3 h-3" />
                <span>{t('common.online')}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-400 text-xs px-2.5 py-1.5 rounded-lg font-semibold shadow-sm">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t('common.offline')}</span>
            {pendingSyncCount > 0 && <span className="bg-rose-200 dark:bg-rose-800 px-1.5 rounded text-[10px]">{pendingSyncCount}</span>}
          </div>
        )}

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-borderline hover:bg-slate-100 dark:hover:bg-slate-800 text-content-secondary transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Language Switcher */}
        <div className="relative">
          <div className="flex items-center bg-[#F5F7FA] dark:bg-[#142334] rounded-lg p-0.5 border border-borderline">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'en' ? 'bg-[#256D85] text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'hi' ? 'bg-[#256D85] text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'mr' ? 'bg-[#256D85] text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg border border-borderline hover:bg-slate-100 dark:hover:bg-slate-800 relative text-content-secondary hover:text-content-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D97706] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface text-content-primary rounded-xl shadow-lg border border-borderline py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-borderline flex items-center justify-between">
                <span className="font-bold text-sm text-content-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#256D85] hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-borderline">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-xs text-content-muted">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n._id}
                      className={`p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        !n.isRead ? 'bg-blue-50/50 dark:bg-slate-800/80 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-content-primary">{n.title}</div>
                          <div className="text-content-secondary text-[11px] mt-0.5">{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Logout Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-borderline hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-content-primary"
          >
            <div className="w-7 h-7 rounded-md bg-[#256D85] flex items-center justify-center font-bold text-xs text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-semibold hidden md:inline text-content-primary">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-surface text-content-primary rounded-xl shadow-lg border border-borderline py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-borderline">
                <div className="font-bold text-xs text-content-primary truncate">{user?.name}</div>
                <div className="text-[11px] text-content-secondary truncate">{user?.email}</div>
                <span className="inline-block mt-1.5 text-[10px] bg-[#256D85]/10 border border-[#256D85]/30 text-[#256D85] dark:text-[#368AA5] px-2 py-0.5 rounded font-bold">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full px-4 py-2.5 text-left text-xs text-[#DC4C4C] hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
