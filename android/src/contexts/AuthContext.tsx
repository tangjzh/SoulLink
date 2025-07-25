import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI, setAuthToken, User, AuthResponse} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('auth_token');
        if (savedToken) {
          setAuthToken(savedToken);
          try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setToken(savedToken);
          } catch (error) {
            console.error('验证token失败:', error);
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_data');
            setAuthToken(null);
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authAPI.login(username, password);
      
      // 保存token和用户信息
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      setAuthToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authAPI.register(username, email, password);
      
      // 注册成功后自动登录
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      setAuthToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 清除本地存储
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      // 清除API token
      setAuthToken(null);
      
      // 重置状态
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('登出失败:', error);
    }
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}; 