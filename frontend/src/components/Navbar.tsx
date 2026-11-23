import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Store,
  LogOut,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const { user, business, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, pendingSyncCount, isSyncing, syncOfflineBills } = useOffline();
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
    <header className="h-16 bg-slate-950/70 backdrop-blur-2xl text-white px-4 md:px-6 flex items-center justify-between border-b border-white/10 shadow-glass relative z-30">
      {/* Left: Brand & Business Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-aurora-purple via-aurora-indigo to-coral flex items-center justify-center font-black text-white shadow-glow-purple border border-white/20">
            VF
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight hidden sm:inline bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              VyapaarFlow
            </span>
            <span className="text-[9px] text-aurora-purple font-bold tracking-widest uppercase hidden sm:inline -mt-1">
              Bharat Retail OS
            </span>
          </div>
        </div>

        {business && (
          <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <Store className="w-3.5 h-3.5 text-coral" />
            <span className="text-xs font-semibold max-w-[200px] truncate text-slate-200">{business.name}</span>
            <span className="text-[10px] bg-coral/20 text-coral font-bold px-2 py-0.5 rounded-full border border-coral/30">
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
                className="flex items-center gap-1.5 bg-warning/20 border border-warning/40 text-warning font-semibold text-xs px-2.5 py-1.5 rounded-xl shadow animate-pulse"
                title={`${pendingSyncCount} bills pending sync`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} {t('common.syncNow')}</span>
              </button>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium shadow-glow-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <Wifi className="w-3 h-3" />
                <span>{t('common.online')}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-coral/20 border border-coral/40 text-coral text-xs px-2.5 py-1.5 rounded-xl font-semibold shadow">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t('common.offline')}</span>
            {pendingSyncCount > 0 && <span className="bg-white/20 px-1.5 rounded text-[10px]">{pendingSyncCount}</span>}
          </div>
        )}

        {/* Language Switcher */}
        <div className="relative">
          <div className="flex items-center bg-white/5 backdrop-blur-md rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                language === 'en' ? 'bg-gradient-to-r from-aurora-purple to-aurora-indigo text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                language === 'hi' ? 'bg-gradient-to-r from-aurora-purple to-aurora-indigo text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                language === 'mr' ? 'bg-gradient-to-r from-aurora-purple to-aurora-indigo text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
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
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 relative text-slate-300 hover:text-white transition active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-coral text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-glow-coral">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl text-slate-100 rounded-2xl shadow-glass border border-white/15 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-aurora-purple" />
                  <span>Notifications</span>
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-coral hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n._id}
                      className={`p-3.5 text-xs hover:bg-white/5 transition ${
                        !n.isRead ? 'bg-white/[0.04] font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-200">{n.title}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{n.message}</div>
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
            className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-200 active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-aurora-purple to-aurora-indigo flex items-center justify-center font-bold text-xs text-white shadow-glow-purple">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-semibold hidden md:inline text-slate-200">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-2xl text-slate-100 rounded-2xl shadow-glass border border-white/15 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-white/10">
                <div className="font-bold text-xs text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <span className="inline-block mt-1.5 text-[10px] bg-aurora-purple/20 border border-aurora-purple/30 text-aurora-purple px-2 py-0.5 rounded-full font-bold">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full px-4 py-2.5 text-left text-xs text-coral hover:bg-white/5 flex items-center gap-2 font-semibold transition"
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
