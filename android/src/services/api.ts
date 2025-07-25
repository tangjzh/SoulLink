import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API基础配置 - 需要替换为实际的后端地址
const BASE_URL = 'http://10.0.2.2:8000/api/v1'; // Android模拟器访问本地主机

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 请求拦截器 - 自动添加token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }
    const message = error.response?.data?.detail || error.message || '请求失败';
    throw new Error(message);
  }
);

// 类型定义 - 与frontend保持一致
export interface DigitalPersona {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  optimization_count: number;
  personality_score: number;
  created_at: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  context: string;
  category: string;
  difficulty_level: string;
}

export interface Conversation {
  id: string;
  title?: string;
  scenario: Scenario;
  created_at: string;
}

export interface Message {
  id: string;
  sender_type: 'user' | 'agent';
  content: string;
  created_at: string;
}

export interface MarketAgent {
  id: string;
  display_name: string;
  display_description: string;
  market_type: 'love' | 'friendship';
  tags: string[];
  is_active: boolean;
  last_interaction: string;
  created_at: string;
}

export interface MatchRelation {
  id: string;
  initiator_agent: MarketAgent;
  target_agent: MarketAgent;
  match_type: 'love' | 'friendship';
  love_compatibility_score: number;
  friendship_compatibility_score: number;
  total_interactions: number;
  status: string;
  last_conversation_at?: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// 认证相关API
export const authAPI = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', {username, password});
    return response.data;
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', {username, email, password});
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// 数字人格相关API
export const personaAPI = {
  async getPersonas(): Promise<DigitalPersona[]> {
    const response = await api.get('/digital-personas');
    return response.data;
  },

  async createPersona(data: {name: string; description?: string; system_prompt: string}): Promise<DigitalPersona> {
    const response = await api.post('/digital-personas', data);
    return response.data;
  },

  async getPersonaById(id: string): Promise<DigitalPersona> {
    const response = await api.get(`/digital-personas/${id}`);
    return response.data;
  },
};

// 对话相关API
export const chatAPI = {
  async getScenarios(): Promise<Scenario[]> {
    const response = await api.get('/scenarios');
    return response.data;
  },

  async createConversation(personaId: string, scenarioId: string): Promise<Conversation> {
    const response = await api.post('/conversations', {
      digital_persona_id: personaId,
      scenario_id: scenarioId,
    });
    return response.data;
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/conversations');
    return response.data;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post(`/conversations/${conversationId}/messages`, {content});
    return response.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },
};

// 情感匹配相关API
export const matchAPI = {
  async getMarketAgents(): Promise<MarketAgent[]> {
    const response = await api.get('/market-agents');
    return response.data;
  },

  async createMarketAgent(data: {
    digital_persona_id: string;
    market_type: string;
    display_name: string;
    display_description: string;
    tags: string[];
  }): Promise<MarketAgent> {
    const response = await api.post('/market-agents', data);
    return response.data;
  },

  async getMatchRelations(): Promise<MatchRelation[]> {
    const response = await api.get('/match-relations');
    return response.data;
  },

  async createMatchRelation(targetAgentId: string, matchType: string): Promise<MatchRelation> {
    const response = await api.post('/match-relations', {
      target_agent_id: targetAgentId,
      match_type: matchType,
    });
    return response.data;
  },

  async triggerConversation(matchId: string): Promise<any> {
    const response = await api.post(`/match-relations/${matchId}/trigger-conversation`);
    return response.data;
  },

  async getMatchConversations(matchId: string): Promise<any[]> {
    const response = await api.get(`/match-relations/${matchId}/conversations`);
    return response.data;
  },
};

// 设置认证token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api; 