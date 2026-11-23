import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  isSuperAdmin?: boolean;
  currentBusinessId?: string;
}

export interface Business {
  _id: string;
  name: string;
  ownerName: string;
  category: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  currency: string;
  language: string;
  settings: {
    invoicePrefix: string;
    nextInvoiceNumber: number;
    enableGst: boolean;
    allowNegativeStock: boolean;
    upiId?: string;
    upiName?: string;
    financialYearStartMonth: number;
    printHeaderNote?: string;
    printFooterNote?: string;
  };
  subscription: {
    plan: string;
    status: string;
    expiresAt?: string;
    productLimit: number;
  };
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, mobile?: string) => Promise<void>;
  onboardBusiness: (businessData: any) => Promise<void>;
  updateBusinessSettings: (settings: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vyapaarflow_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    const currentToken = localStorage.getItem('vyapaarflow_token');
    if (!currentToken) {
      setUser(null);
      setBusiness(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setBusiness(res.data.business);
        if (res.data.business?._id) {
          localStorage.setItem('vyapaarflow_business_id', res.data.business._id);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      localStorage.removeItem('vyapaarflow_token');
      localStorage.removeItem('vyapaarflow_business_id');
      setUser(null);
      setBusiness(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const handleUnauthorized = () => {
      setUser(null);
      setBusiness(null);
      setToken(null);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { user: userData, business: businessData, token: authToken } = res.data;
      localStorage.setItem('vyapaarflow_token', authToken);
      if (businessData?._id) {
        localStorage.setItem('vyapaarflow_business_id', businessData._id);
      }
      setToken(authToken);
      setUser(userData);
      setBusiness(businessData);
    }
  };

  const register = async (name: string, email: string, password: string, mobile?: string) => {
    const res = await api.post('/auth/register', { name, email, password, mobile });
    if (res.success && res.data) {
      const { user: userData, token: authToken } = res.data;
      localStorage.setItem('vyapaarflow_token', authToken);
      setToken(authToken);
      setUser(userData);
      setBusiness(null);
    }
  };

  const onboardBusiness = async (businessData: any) => {
    const res = await api.post('/business/onboard', businessData);
    if (res.success && res.data) {
      const newBusiness = res.data;
      localStorage.setItem('vyapaarflow_business_id', newBusiness._id);
      setBusiness(newBusiness);
      await refreshProfile();
    }
  };

  const updateBusinessSettings = async (settings: any) => {
    const res = await api.put('/business/settings', settings);
    if (res.success && res.data) {
      setBusiness(res.data);
    }
  };

  const logout = () => {
    localStorage.removeItem('vyapaarflow_token');
    localStorage.removeItem('vyapaarflow_business_id');
    setUser(null);
    setBusiness(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        onboardBusiness,
        updateBusinessSettings,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
