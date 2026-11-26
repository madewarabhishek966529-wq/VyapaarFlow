import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPendingOfflineSales, markSaleSynced } from '../lib/idb';
import { api } from '../lib/api';

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  syncOfflineBills: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshPendingCount = async () => {
    try {
      const pending = await getPendingOfflineSales();
      setPendingSyncCount(pending.length);
    } catch (e) {
      console.warn('IDB not ready yet:', e);
    }
  };

  const syncOfflineBills = async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      const pending = await getPendingOfflineSales();

      for (const item of pending) {
        try {
          await api.post('/pos/sale', item.data);
          await markSaleSynced(item.id);
        } catch (err: any) {
          console.error(`Failed to sync bill ${item.id}:`, err.message);
        }
      }

      await refreshPendingCount();
      if (pending.length > 0) {
        ['dashboard-overview', 'products', 'products-pos', 'report-sales', 'udhaar-summary'].forEach((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineBills();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingSyncCount,
        isSyncing,
        syncOfflineBills,
        refreshPendingCount
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
