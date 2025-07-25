import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, login as apiLogin, register as apiRegister, getCurrentUser, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查localStorage中的token
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      
      if (savedToken) {
        setAuthToken(savedToken);
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          console.error('验证token失败:', error);
          localStorage.removeItem('auth_token');
          setAuthToken(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response: AuthResponse = await apiLogin({ username, password });
      
      // 保存token和用户信息
      setToken(response.access_token);
      setUser(response.user);
      
      // 设置API请求头
      setAuthToken(response.access_token);
      
      // 保存到localStorage
      localStorage.setItem('auth_token', response.access_token);
      
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response: AuthResponse = await apiRegister({ username, email, password });
      
      // 注册成功后自动登录
      setToken(response.access_token);
      setUser(response.user);
      
      // 设置API请求头
      setAuthToken(response.access_token);
      
      // 保存到localStorage
      localStorage.setItem('auth_token', response.access_token);
      
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('auth_token');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 