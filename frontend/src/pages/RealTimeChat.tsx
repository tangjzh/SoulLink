import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  Person,
  Videocam,
  Call,
  MoreVert,
  Circle,
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRealTimeMessages, RealTimeMessage } from '../services/api';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'system';
}

const RealTimeChat: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // 从URL参数获取聊天信息
  const chatPartnerName = searchParams.get('name') || '匹配用户';
  const partnerId = searchParams.get('userId') || '';
  
  // 状态管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState('');
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // 获取当前用户信息
  const { user } = useAuth();
  const currentUserId = user?.id || '';
  const currentUserName = user?.username || '我';

  // 加载历史消息
  const loadHistoryMessages = async () => {
    if (!matchId) return;
    
    try {
      const historyMessages = await getRealTimeMessages(matchId, 50, 0);
      const chatMessages: ChatMessage[] = historyMessages.map((msg: RealTimeMessage) => ({
        id: msg.id,
        senderId: msg.sender_user_id,
        senderName: msg.sender_name,
        content: msg.content,
        timestamp: msg.created_at,
        type: msg.message_type as 'text' | 'system',
      }));
      
      setMessages(chatMessages);
      console.log(`加载了 ${chatMessages.length} 条历史消息`);
    } catch (err: any) {
      console.error('加载历史消息失败:', err);
      setError('加载历史消息失败：' + err.message);
    }
  };

  // 处理WebSocket消息
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'message':
        const newMessage: ChatMessage = {
          id: data.id || Date.now().toString(),
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          type: 'text',
        };
        // 检查消息是否已存在，避免重复添加
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, newMessage];
        });
        break;
        
      case 'user_status':
        setIsPartnerOnline(data.isOnline);
        break;
        
      case 'typing':
        setIsTyping(data.isTyping && data.userId !== currentUserId);
        break;
        
      case 'system':
        const systemMessage: ChatMessage = {
          id: data.id || Date.now().toString(),
          senderId: 'system',
          senderName: '系统',
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          type: 'system',
        };
        // 检查系统消息是否已存在，避免重复添加
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === systemMessage.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, systemMessage];
        });
        break;
        
      default:
        console.log('未知的WebSocket消息类型:', data.type);
    }
  };

  // 初始化WebSocket连接
  useEffect(() => {
    if (!matchId || !currentUserId) return;

    // 防止重复连接（React StrictMode会导致useEffect被调用两次）
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    const connectWebSocket = () => {
      try {
        // 清空之前的消息，准备加载历史消息
        setMessages([]);
        setConnectionStatus('connecting');
        
        // 这里的WebSocket URL需要根据实际后端配置调整
        const wsUrl = `ws://localhost:8000/ws/chat/${matchId}?userId=${currentUserId}`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = async () => {
          console.log('WebSocket连接已建立');
          setConnectionStatus('connected');
          setError('');
          
          // 连接成功后立即加载历史消息
          await loadHistoryMessages();
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (err) {
            console.error('解析WebSocket消息失败:', err);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket连接已关闭');
          setConnectionStatus('disconnected');
          // 只有在非主动关闭的情况下才尝试重连
          if (wsRef.current === ws) {
            setTimeout(connectWebSocket, 3000);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          setError('连接失败，正在尝试重连...');
        };
        
        wsRef.current = ws;
      } catch (err) {
        console.error('创建WebSocket连接失败:', err);
        setError('无法建立连接');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [matchId, currentUserId]);

  // 发送消息
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || connectionStatus !== 'connected') return;

    const messageData = {
      type: 'message',
      content: inputMessage.trim(),
      senderId: currentUserId,
      senderName: currentUserName,
      matchId: matchId,
      timestamp: new Date().toISOString(),
    };

    try {
      wsRef.current.send(JSON.stringify(messageData));
      setInputMessage('');
    } catch (err) {
      console.error('发送消息失败:', err);
      setError('发送消息失败');
    }
  };

  // 发送正在输入状态
  const handleTyping = (isTyping: boolean) => {
    if (!wsRef.current || connectionStatus !== 'connected') return;

    const typingData = {
      type: 'typing',
      isTyping: isTyping,
      userId: currentUserId,
      matchId: matchId,
    };

    try {
      wsRef.current.send(JSON.stringify(typingData));
    } catch (err) {
      console.error('发送输入状态失败:', err);
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    handleTyping(true);
    
    // 500ms后停止输入状态
    setTimeout(() => handleTyping(false), 500);
  };

  // 返回匹配市场
  const handleGoBack = () => {
    navigate('/match-market');
  };

  // 渲染消息
  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = message.senderId === currentUserId;
    const isSystemMessage = message.type === 'system';
    
    if (isSystemMessage) {
      return (
        <ListItem key={message.id} sx={{ justifyContent: 'center' }}>
          <Chip 
            label={message.content} 
            size="small" 
            variant="outlined" 
            color="default"
            sx={{ fontSize: '0.75rem' }}
          />
        </ListItem>
      );
    }
    
    return (
      <ListItem key={message.id} sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', width: '100%', flexDirection: isCurrentUser ? 'row-reverse' : 'row' }}>
          <Avatar sx={{ 
            bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main', 
            mr: isCurrentUser ? 0 : 1, 
            ml: isCurrentUser ? 1 : 0 
          }}>
            <Person />
          </Avatar>
          
          <Paper
            sx={{
              p: 2,
              maxWidth: '70%',
              bgcolor: isCurrentUser ? 'primary.light' : 'grey.100',
              color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 0.5, 
                opacity: 0.7,
                fontSize: '0.7rem'
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
          </Paper>
        </Box>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部信息栏 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleGoBack}>
              <ArrowBack />
            </IconButton>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {chatPartnerName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Circle 
                    sx={{ 
                      fontSize: 8, 
                      color: isPartnerOnline ? 'success.main' : 'grey.400' 
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    {isPartnerOnline ? '在线' : '离线'}
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="真人聊天" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="primary">
              <Call />
            </IconButton>
            <IconButton color="primary">
              <Videocam />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
        
        {/* 连接状态指示器 */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Circle 
            sx={{ 
              fontSize: 8, 
              color: connectionStatus === 'connected' ? 'success.main' : 
                     connectionStatus === 'connecting' ? 'warning.main' : 'error.main'
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            {connectionStatus === 'connected' ? '已连接' : 
             connectionStatus === 'connecting' ? '连接中...' : '连接断开'}
          </Typography>
        </Box>
      </Paper>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 消息列表 */}
      <Paper sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2, 
        minHeight: '450px',
        maxHeight: 'calc(100vh - 320px)'
      }}>
        {connectionStatus !== 'connected' ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              正在建立连接...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请稍候，正在连接到聊天服务器
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              开始与 {chatPartnerName} 聊天吧！
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              这是一个实时聊天，你们可以即时交流
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {messages.map(renderMessage)}
            {isTyping && (
              <ListItem sx={{ opacity: 0.7 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <Person sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {chatPartnerName} 正在输入...
                  </Typography>
                </Box>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Paper>

      {/* 输入区域 */}
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={
              connectionStatus !== 'connected' 
                ? "等待连接..." 
                : "输入你的消息..."
            }
            disabled={connectionStatus !== 'connected'}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
            sx={{ minWidth: 60 }}
          >
            {loading ? <CircularProgress size={24} /> : <Send />}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          按回车发送，Shift+回车换行。这是与真人的实时聊天。
        </Typography>
      </Paper>

      {/* 介绍卡片 */}
      {messages.length === 0 && connectionStatus === 'connected' && (
        <Card sx={{ mt: 2, bgcolor: 'info.light' }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'info.contrastText', mb: 2 }}>
              💬 关于实时聊天
            </Typography>
            <Typography variant="body1" sx={{ color: 'info.contrastText', lineHeight: 1.8 }}>
              • 这是与匹配用户的真人实时聊天功能<br/>
              • 消息会即时发送和接收，支持在线状态显示<br/>
              • 可以看到对方是否在线以及正在输入的状态<br/>
              • 聊天记录会保存，下次可以继续查看历史消息<br/>
              • 请保持友善和尊重的交流态度
            </Typography>
            <Typography variant="body2" sx={{ color: 'info.contrastText', mt: 2, opacity: 0.9 }}>
              💡 小提示：可以通过右上角的按钮发起语音或视频通话
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RealTimeChat; 