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
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  Psychology,
  Person,
  Favorite,
  People,
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  createMarketConversation,
  getConversationMessages,
  sendMessage,
  Message,
  Conversation,
  DigitalPersona,
} from '../services/api';

const MarketChat: React.FC = () => {
  const { agentPersonaId } = useParams<{ agentPersonaId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 从URL参数获取agent信息
  const agentName = searchParams.get('name') || '数字人格';
  const agentDescription = searchParams.get('description') || '来自情感匹配市场的数字人格';
  
  // 状态管理
  const [agentPersona, setAgentPersona] = useState<DigitalPersona | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(true);

  // 加载agent信息并初始化对话
  useEffect(() => {
    const initializeChat = async () => {
      if (!agentPersonaId) return;
      
      try {
        setInitializing(true);
        
        // 使用市场聊天API创建对话
        const conversation = await createMarketConversation({
          target_persona_id: agentPersonaId,
          title: `与${agentName}的市场聊天`,
        });
        
        setCurrentConversation(conversation);
        
        // 加载对话消息
        const messagesData = await getConversationMessages(conversation.id);
        setMessages(messagesData);
        
        // 设置agent persona信息（使用URL参数中的信息）
        setAgentPersona({
          id: agentPersonaId,
          name: agentName,
          description: agentDescription,
          system_prompt: '',
          optimization_count: 0,
          personality_score: 0,
          created_at: new Date().toISOString()
        });
        
      } catch (err: any) {
        setError('初始化聊天失败：' + err.message);
      } finally {
        setInitializing(false);
      }
    };

    initializeChat();
  }, [agentPersonaId]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || loading) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    try {
      // 发送用户消息并获取AI回复
      const aiMessage = await sendMessage({
        conversation_id: currentConversation.id,
        content: userMessageText,
      });

      // 重新加载所有消息以确保顺序正确
      const updatedMessages = await getConversationMessages(currentConversation.id);
      setMessages(updatedMessages);
    } catch (err: any) {
      setError('发送消息失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 返回市场页面
  const handleGoBack = () => {
    navigate('/match-market');
  };

  // 渲染消息
  const renderMessage = (message: Message) => {
    const isUser = message.sender_type === 'user';
    
    return (
      <ListItem key={message.id} sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', width: '100%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
          <Avatar sx={{ bgcolor: isUser ? 'primary.main' : 'secondary.main', mr: isUser ? 0 : 1, ml: isUser ? 1 : 0 }}>
            {isUser ? <Person /> : <Psychology />}
          </Avatar>
          
          <Paper
            sx={{
              p: 2,
              maxWidth: '70%',
              bgcolor: isUser ? 'primary.light' : 'grey.100',
              color: isUser ? 'primary.contrastText' : 'text.primary',
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
          </Paper>
        </Box>
      </ListItem>
    );
  };

  if (initializing) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          正在连接到 {agentName}...
        </Typography>
      </Box>
    );
  }

  if (error && !agentPersona) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleGoBack}>
          返回市场
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部信息栏 */}
      {agentPersona && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleGoBack}>
                <ArrowBack />
              </IconButton>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Psychology />
              </Avatar>
              <Box>
                <Typography variant="h6" gutterBottom>
                  与 {agentPersona.name} 聊天
                  <Chip label="市场聊天" size="small" color="info" sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {agentDescription}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

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
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              开始与 {agentName} 对话吧！
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              这是一个市场聊天，你可以自由地与这个数字人格交流
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {messages.map(renderMessage)}
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
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入你的消息..."
            disabled={loading || !currentConversation}
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
            disabled={!inputMessage.trim() || loading || !currentConversation}
            sx={{ minWidth: 60 }}
          >
            {loading ? <CircularProgress size={24} /> : <Send />}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          按回车发送，Shift+回车换行。这是一个市场聊天，你可以自由交流。
        </Typography>
      </Paper>

      {/* 介绍卡片 */}
      {agentPersona && messages.length === 0 && (
        <Card sx={{ mt: 2, bgcolor: 'primary.light' }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.contrastText', mb: 2 }}>
              💬 关于这次聊天
            </Typography>
            <Typography variant="body1" sx={{ color: 'primary.contrastText', lineHeight: 1.8 }}>
              • 这是与情感匹配市场中的数字人格的自由聊天体验<br/>
              • 对话过程不会影响匹配分数或建立正式关系<br/>
              • 你可以通过这次对话深入了解这个数字人格的性格特点<br/>
              • 聊天过程中可以自由提问，了解对方的兴趣爱好和价值观<br/>
              • 如果聊得不错，可以返回市场页面正式添加为匹配对象<br/>
              • 这种试聊机制帮助你做出更好的匹配决策
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.contrastText', mt: 2, opacity: 0.9 }}>
              💡 小提示：可以尝试问一些开放性问题，比如兴趣爱好、人生观点等
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MarketChat; 