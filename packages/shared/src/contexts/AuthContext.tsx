/**
 * Auth Context
 * Provides authentication state and methods to all components
 * Used by all three platforms (Campus Voice, Campus Resolve, Campus Admin)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

export interface User {
  id: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  studentNumber?: string;
  staffNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signup: (
    email: string,
    password: string,
    studentNumber: string,
    role?: string,
    portal?: 'voice' | 'resolve' | 'admin'
  ) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the application to provide authentication state
 * Place this at the root of your app or around protected routes
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore auth on app load
  useEffect(() => {
    const auth = authService.restoreAuth();
    if (auth) {
      setToken(auth.token);
      setUser(auth.user);
    }
    setIsLoading(false);
  }, []);

  const signup = async (
    email: string,
    password: string,
    studentNumber: string,
    role?: string,
    portal?: 'voice' | 'resolve' | 'admin'
  ) => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await authService.signup(
        email,
        password,
        studentNumber,
        role,
        portal
      );
      // Use accessToken from Cognito response, or token from standard auth
      const token = result.accessToken || result.token;
      authService.setToken(token);
      setToken(token);
      setUser(result.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signin called for:', email);
      setError(null);
      setIsLoading(true);
      const result = await authService.signin(email, password);
      console.log('[AuthContext] Signin successful, setting token and user:', result);
      // Use accessToken from Cognito response, or token from standard auth
      const token = result.accessToken || result.token;
      console.log('[AuthContext] Token to set:', token);
      authService.setToken(token);
      setToken(token);
      setUser(result.user);
      console.log('[AuthContext] Token and user set, returning result');
      return result;
    } catch (err) {
      console.error('[AuthContext] Signin error:', err);
      const message = err instanceof Error ? err.message : 'Signin failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.logout();
      setToken(null);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    signup,
    signin,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Use this hook in components to access authentication state
 *
 * @example
 * const { user, isAuthenticated, signin } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
