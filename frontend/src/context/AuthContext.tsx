import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import type { Admin, AuthContextType } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const stored = localStorage.getItem('bindot_admin');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('bindot_token')
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bindot_token') {
        const newToken = e.newValue;
        setToken(newToken);
        if (!newToken) {
          setAdmin(null);
        }
      }
      if (e.key === 'bindot_admin') {
        setAdmin(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    if (token && !admin) {
      authService.me().then((res) => {
        setAdmin(res.data.admin);
      }).catch(() => logout());
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token, admin]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      const { token: newToken, admin: newAdmin } = res.data;
      setToken(newToken);
      setAdmin(newAdmin);
      localStorage.setItem('bindot_token', newToken);
      localStorage.setItem('bindot_admin', JSON.stringify(newAdmin));
      toast.success(`Welcome back, ${newAdmin.name}!`);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.signup(name, email, password);
      const { token: newToken, admin: newAdmin } = res.data;
      setToken(newToken);
      setAdmin(newAdmin);
      localStorage.setItem('bindot_token', newToken);
      localStorage.setItem('bindot_admin', JSON.stringify(newAdmin));
      toast.success(`Account created! Welcome, ${newAdmin.name}!`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('bindot_token');
    localStorage.removeItem('bindot_admin');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
