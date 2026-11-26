import React, { createContext, useContext, useState, useEffect, Suspense, lazy } from 'react';

const QuickBillModal = lazy(() =>
  import('../components/QuickBillModal').then((m) => ({ default: m.QuickBillModal }))
);

interface QuickBillContextType {
  isQuickBillOpen: boolean;
  openQuickBill: () => void;
  closeQuickBill: () => void;
}

const QuickBillContext = createContext<QuickBillContextType | undefined>(undefined);

export const QuickBillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);

  const openQuickBill = () => setIsQuickBillOpen(true);
  const closeQuickBill = () => setIsQuickBillOpen(false);

  // Silently preload QuickBillModal chunk after initial render so 1-tap camera launch feels instant
  useEffect(() => {
    const timer = window.setTimeout(() => {
      import('../components/QuickBillModal').catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QuickBillContext.Provider value={{ isQuickBillOpen, openQuickBill, closeQuickBill }}>
      {children}
      {isQuickBillOpen && (
        <Suspense fallback={null}>
          <QuickBillModal isOpen={isQuickBillOpen} onClose={closeQuickBill} />
        </Suspense>
      )}
    </QuickBillContext.Provider>
  );
};

export const useQuickBill = () => {
  const context = useContext(QuickBillContext);
  if (!context) {
    throw new Error('useQuickBill must be used within a QuickBillProvider');
  }
  return context;
};
