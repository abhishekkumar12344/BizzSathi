import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'PLATFORM_ADMIN' | 'USER';
}

export interface Business {
  id: string;
  name: string;
  businessType: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  taxRatePercent: number;
  taxEnabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  userRole?: 'OWNER' | 'MANAGER' | 'STAFF';
  upiId?: string;
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  businesses: Business[];
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchBusiness: (businessId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bizsathi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bizsathi_token'));
  const [business, setBusiness] = useState<Business | null>(() => {
    const saved = localStorage.getItem('bizsathi_business');
    return saved ? JSON.parse(saved) : null;
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res: any = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setBusinesses(res.data.businesses || []);
        const activeBiz = res.data.business || res.data.businesses?.[0] || null;
        setBusiness(activeBiz);

        localStorage.setItem('bizsathi_user', JSON.stringify(res.data.user));
        if (activeBiz) {
          localStorage.setItem('bizsathi_business', JSON.stringify(activeBiz));
          localStorage.setItem('bizsathi_active_business_id', activeBiz.id);
        }
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', credentials);
      if (res.success && res.data) {
        const { token: newToken, user: newUser, business: newBusiness, businesses: allBiz } = res.data;
        setToken(newToken);
        setUser(newUser);
        setBusiness(newBusiness);
        setBusinesses(allBiz || []);

        localStorage.setItem('bizsathi_token', newToken);
        localStorage.setItem('bizsathi_user', JSON.stringify(newUser));
        if (newBusiness) {
          localStorage.setItem('bizsathi_business', JSON.stringify(newBusiness));
          localStorage.setItem('bizsathi_active_business_id', newBusiness.id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/register', payload);
      if (res.success && res.data) {
        const { token: newToken, user: newUser, business: newBusiness } = res.data;
        setToken(newToken);
        setUser(newUser);
        setBusiness(newBusiness);
        setBusinesses([newBusiness]);

        localStorage.setItem('bizsathi_token', newToken);
        localStorage.setItem('bizsathi_user', JSON.stringify(newUser));
        localStorage.setItem('bizsathi_business', JSON.stringify(newBusiness));
        localStorage.setItem('bizsathi_active_business_id', newBusiness.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setBusiness(null);
    setBusinesses([]);
    localStorage.removeItem('bizsathi_token');
    localStorage.removeItem('bizsathi_user');
    localStorage.removeItem('bizsathi_business');
    localStorage.removeItem('bizsathi_active_business_id');
  };

  const switchBusiness = (businessId: string) => {
    const target = businesses.find((b) => b.id === businessId);
    if (target) {
      setBusiness(target);
      localStorage.setItem('bizsathi_business', JSON.stringify(target));
      localStorage.setItem('bizsathi_active_business_id', target.id);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        businesses,
        token,
        isLoading,
        login,
        register,
        logout,
        switchBusiness,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
