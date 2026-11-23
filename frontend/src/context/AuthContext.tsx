import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, TokenResponse } from '../types/auth';
import { loginApi, getMeApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'policypilot_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user info:', err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        try {
          const currentUser = await getMeApi();
          setUser(currentUser);
        } catch (error) {
          console.warn('Initial session validation failed:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [logout]);

  const login = async (email: string, password: string): Promise<User> => {
    const data: TokenResponse = await loginApi(email, password);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);

    // Fetch profile immediately to know role
    const currentUser = await getMeApi();
    setUser(currentUser);
    return currentUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
