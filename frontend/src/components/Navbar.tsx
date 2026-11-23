import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  User,
  LogOut,
  Store,
  CheckCircle2,
  AlertCircle
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
    <header className="h-16 bg-navy text-white px-4 md:px-6 flex items-center justify-between shadow-md relative z-30">
      {/* Left: Brand & Business Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center font-bold text-white shadow-sm">
            VF
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline">VyapaarFlow</span>
        </div>

        {business && (
          <div className="hidden md:flex items-center gap-2 bg-navy-light px-3 py-1.5 rounded-lg border border-navy-muted">
            <Store className="w-4 h-4 text-coral" />
            <span className="text-xs font-semibold max-w-[200px] truncate">{business.name}</span>
            <span className="text-[10px] bg-coral/20 text-coral font-bold px-1.5 py-0.5 rounded">
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
                className="flex items-center gap-1.5 bg-warning text-navy font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow animate-pulse"
                title={`${pendingSyncCount} bills pending sync`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} {t('common.syncNow')}</span>
              </button>
            ) : (
              <span className="hidden sm:flex items-center gap-1 text-xs text-success bg-success/15 px-2.5 py-1 rounded-full font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>{t('common.online')}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-coral text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold shadow">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t('common.offline')}</span>
            {pendingSyncCount > 0 && <span className="bg-white/20 px-1.5 rounded text-[10px]">{pendingSyncCount}</span>}
          </div>
        )}

        {/* Language Switcher */}
        <div className="relative">
          <div className="flex items-center bg-navy-light rounded-lg p-0.5 border border-navy-muted">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                language === 'en' ? 'bg-coral text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                language === 'hi' ? 'bg-coral text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                language === 'mr' ? 'bg-coral text-white shadow-sm' : 'text-slate-300 hover:text-white'
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
            className="p-2 rounded-lg bg-navy-light hover:bg-navy-muted relative text-slate-200 hover:text-white transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-coral text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-navy rounded-xl shadow-2xl border border-softgrey-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-softgrey-border flex items-center justify-between">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-coral hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-softgrey-border">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n._id}
                      className={`p-3 text-xs hover:bg-pearl transition ${
                        !n.isRead ? 'bg-softgrey-light font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-900">{n.title}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{n.message}</div>
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
            className="flex items-center gap-2 p-1.5 rounded-lg bg-navy-light hover:bg-navy-muted transition text-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-semibold hidden md:inline">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-navy rounded-xl shadow-2xl border border-softgrey-border py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-softgrey-border">
                <div className="font-semibold text-xs text-slate-900 truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-xs text-coral hover:bg-pearl flex items-center gap-2 font-medium"
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
