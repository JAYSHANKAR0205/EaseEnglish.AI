import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginWithGoogle: (credential?: string, token?: string) => Promise<void>;
  loginWithDevTest: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ease_english_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Check auth session on startup
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('ease_english_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authService.getMe();
        if (data && data.user) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('ease_english_token');
        }
      } catch (err) {
        console.warn('Session verification failed, user unauthenticated.');
        setUser(null);
        setToken(null);
        localStorage.removeItem('ease_english_token');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const loginWithGoogle = useCallback(async (credential?: string, accessToken?: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithGoogle(credential, accessToken);
      setUser(res.user);
      setToken(res.token);
      setLoginModalOpen(false);
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithDevTest = useCallback(async (name: string, email: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithDevTest(name, email);
      setUser(res.user);
      setToken(res.token);
      setLoginModalOpen(false);
    } catch (err: any) {
      console.error('Dev test login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ease_english_token');
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        loginModalOpen,
        setLoginModalOpen,
        loginWithGoogle,
        loginWithDevTest,
        logout,
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
