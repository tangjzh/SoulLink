import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: `/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败';
    throw new Error(message);
  }
);

// 类型定义
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
  digital_persona_id: string;
  created_at: string;
}

export interface ConversationWithStats {
  id: string;
  title?: string;
  scenario: Scenario;
  digital_persona_id: string;
  created_at: string;
  message_count: number;
  last_message?: string;
  duration: string;
}

export interface PaginatedConversationsResponse {
  conversations: ConversationWithStats[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface Message {
  id: string;
  sender_type: 'user' | 'agent';
  content: string;
  created_at: string;
  message_index: number;
}

export interface CreateDigitalPersonaRequest {
  name: string;
  description?: string;
  basic_info: Record<string, any>;
}

export interface CreateConversationRequest {
  digital_persona_id: string;
  scenario_id: string;
  title?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
}

export interface SubmitFeedbackRequest {
  conversation_id: string;
  message_id: string;
  feedback_type: 'like' | 'dislike' | 'correction';
  feedback_content?: string;
}

export interface SubmitFeedbackResponse {
  message: string;
  optimization_performed: boolean;
  optimization_details?: {
    optimization_reason: string;
    improvement_score: number;
    optimization_count: number;
  };
}

// API 函数

// 用户相关
export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await api.post('/users', userData);
  return response.data;
};

// 场景相关
export const getScenarios = async (): Promise<Scenario[]> => {
  const response = await api.get('/scenarios');
  return response.data;
};

// 数字人格相关
export const createDigitalPersona = async (data: CreateDigitalPersonaRequest): Promise<DigitalPersona> => {
  const response = await api.post('/digital-personas', data);
  return response.data;
};

export const getDigitalPersonas = async (): Promise<DigitalPersona[]> => {
  const response = await api.get('/digital-personas');
  return response.data;
};

export const getOptimizationHistory = async (personaId: string) => {
  const response = await api.get(`/digital-personas/${personaId}/optimization-history`);
  return response.data;
};

// 对话相关
export const createConversation = async (data: CreateConversationRequest): Promise<Conversation> => {
  const response = await api.post('/conversations', data);
  return response.data;
};

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get('/conversations');
  return response.data;
};

export const getConversationsPaginated = async (params: {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  sort_by?: string;
}): Promise<PaginatedConversationsResponse> => {
  const { page = 1, size = 10, search, category, sort_by = 'date_desc' } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort_by,
  });
  
  if (search) {
    queryParams.append('search', search);
  }
  if (category && category !== 'all') {
    queryParams.append('category', category);
  }
  
  const response = await api.get(`/conversations/paginated?${queryParams.toString()}`);
  return response.data;
};

export const createMarketConversation = async (data: {
  target_persona_id: string;
  title?: string;
}): Promise<Conversation> => {
  const response = await api.post('/market-conversations', data);
  return response.data;
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await api.get(`/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  const response = await api.post('/messages', data);
  return response.data;
};

// 反馈相关
export const submitFeedback = async (data: SubmitFeedbackRequest): Promise<SubmitFeedbackResponse> => {
  const response = await api.post('/feedback', data);
  return response.data;
};

// 情感匹配相关接口
export interface MarketAgent {
  id: string;
  user_id: string;
  digital_persona_id: string;
  market_type: string;
  display_name: string;
  display_description: string;
  tags: string[];
  last_interaction: string;
  created_at: string;
}

export interface MatchRelation {
  id: string;
  target_agent: {
    id: string;
    digital_persona_id: string;
    display_name: string;
    display_description: string;
    tags: string[];
  };
  target_user_id?: string;
  match_type: string;
  love_compatibility_score: number;
  friendship_compatibility_score: number;
  total_interactions: number;
  last_conversation_at?: string;
  created_at: string;
  has_realtime_messages?: boolean;
}

export interface CreateMarketAgentRequest {
  digital_persona_id: string;
  market_type: string;
  display_name: string;
  display_description: string;
  tags?: string[];
}

export interface CreateMatchRelationRequest {
  target_agent_id: string;
  match_type: string;
}

// 情感匹配相关API函数

// 投放数字人格到市场
export const createMarketAgent = async (data: CreateMarketAgentRequest): Promise<MarketAgent> => {
  const response = await api.post('/market-agents', data);
  return response.data;
};

// 获取市场中的数字人格列表
export const getMarketAgents = async (marketType?: string): Promise<MarketAgent[]> => {
  const params = marketType ? { market_type: marketType } : {};
  const response = await api.get('/market-agents', { params });
  return response.data;
};

// 获取我投放的数字人格列表
export const getMyMarketAgents = async (): Promise<MarketAgent[]> => {
  const response = await api.get('/market-agents/my');
  return response.data;
};

// 创建匹配关系
export const createMatchRelation = async (data: CreateMatchRelationRequest): Promise<MatchRelation> => {
  const response = await api.post('/match-relations', data);
  return response.data;
};

// 获取我的匹配关系列表
export const getMatchRelations = async (matchType?: string): Promise<MatchRelation[]> => {
  const params = matchType ? { match_type: matchType } : {};
  const response = await api.get('/match-relations', { params });
  return response.data;
};

// 获取关注你的用户列表（别人匹配了你但你没有匹配他们）
export const getFollowers = async (matchType?: string): Promise<MatchRelation[]> => {
  const params = matchType ? { match_type: matchType } : {};
  const response = await api.get('/followers', { params });
  return response.data;
};

// 取消匹配关系
export const cancelMatchRelation = async (matchId: string): Promise<{ message: string; match_id: string }> => {
  const response = await api.delete(`/match-relations/${matchId}`);
  return response.data;
};

// 手动触发对话
export const triggerConversation = async (matchId: string) => {
  const response = await api.post(`/match-relations/${matchId}/trigger-conversation`);
  return response.data;
};

export const getTaskStatus = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/status`);
  return response.data;
};

// 人格测评相关接口
export interface PersonalityQuestion {
  question_id: string;
  scenario: string;
  question: string;
  options: string[];
  current_round: number;
  total_estimated_rounds: number;
  completed?: boolean;
}

export interface PersonalityAnswer {
  question_id: string;
  selected_option: string;
  option_index: number;
}

export const getPersonalityQuestion = async (
  personaId: string, 
  previousAnswers: PersonalityAnswer[],
  scenario: any
): Promise<PersonalityQuestion> => {
  const response = await api.post(`/digital-personas/${personaId}/personality-question`, {
    previous_answers: previousAnswers,
    scenario: scenario
  });
  return response.data;
};

export const submitPersonalityAnswer = async (
  personaId: string,
  answer: PersonalityAnswer
) => {
  const response = await api.post(`/digital-personas/${personaId}/personality-answer`, answer);
  return response.data;
};

// 获取匹配关系的对话历史
export const getMatchConversations = async (matchId: string) => {
  const response = await api.get(`/match-relations/${matchId}/conversations`);
  return response.data;
};

// 认证相关接口
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
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

// 认证相关API函数

// 用户注册
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

// 用户登录
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// 设置认证token到请求头
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// 实时聊天相关接口
export interface RealTimeMessage {
  id: string;
  sender_user_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  sequence_number: number;
  created_at: string;
  is_deleted: boolean;
}

export const getRealTimeMessages = async (
  matchId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<RealTimeMessage[]> => {
  const response = await api.get(`/match-relations/${matchId}/realtime-messages?limit=${limit}&offset=${offset}`);
  return response.data;
};

// 新的基于ChatSession的聊天API接口

export interface ChatSession {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  message_count: number;
  last_message_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_user_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  sequence_number: number;
  is_read: boolean;
  created_at: string;
}

export interface SendChatMessageRequest {
  other_user_id: string;
  content: string;
  message_type?: string;
}

// 获取用户的所有聊天会话
export const getChatSessions = async (): Promise<ChatSession[]> => {
  const response = await api.get('/chat-sessions');
  return response.data;
};

// 创建或获取与指定用户的聊天会话
export const createOrGetChatSession = async (otherUserId: string): Promise<ChatSession> => {
  const response = await api.post('/chat-sessions', null, {
    params: { other_user_id: otherUserId }
  });
  return response.data;
};

// 获取聊天会话的消息列表
export const getChatMessages = async (
  sessionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat-sessions/${sessionId}/messages`, {
    params: { limit, offset }
  });
  return response.data;
};

// 发送聊天消息
export const sendChatMessage = async (
  sessionId: string,
  data: SendChatMessageRequest
): Promise<ChatMessage> => {
  const response = await api.post(`/chat-sessions/${sessionId}/messages`, data);
  return response.data;
};

// 标记消息为已读
export const markMessagesAsRead = async (
  sessionId: string,
  upToSequence?: number
): Promise<{ message: string }> => {
  const response = await api.put(`/chat-sessions/${sessionId}/messages/mark-read`, null, {
    params: upToSequence ? { up_to_sequence: upToSequence } : {}
  });
  return response.data;
};

export default api; 