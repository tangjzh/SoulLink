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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Send,
  ThumbUp,
  ThumbDown,
  Edit,
  Psychology,
  Person,
  Settings,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getScenarios,
  createConversation,
  getConversationMessages,
  sendMessage,
  submitFeedback,
  getConversations,
  Scenario,
  Message,
  Conversation,
} from '../services/api';

const Chat: React.FC = () => {
  const { personaId, conversationId } = useParams<{ personaId?: string; conversationId?: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 判断是否是恢复对话模式
  const isContinueMode = Boolean(conversationId && window.location.pathname.includes('/continue'));
  
  // 状态管理
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(!isContinueMode);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<Message | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [error, setError] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);

  // 加载场景
  useEffect(() => {
    if (!isContinueMode) {
      const loadScenarios = async () => {
        try {
          const scenariosData = await getScenarios();
          setScenarios(scenariosData);
        } catch (err: any) {
          setError('加载场景失败：' + err.message);
        }
      };
      loadScenarios();
    }
  }, [isContinueMode]);

  // 恢复对话模式：直接加载指定对话
  useEffect(() => {
    if (isContinueMode && conversationId) {
      const loadExistingConversation = async () => {
        try {
          setLoading(true);
          
          // 获取所有对话，找到指定的对话
          const allConversations = await getConversations();
          const conversation = allConversations.find(c => c.id === conversationId);
          
          if (!conversation) {
            setError('对话不存在或已被删除');
            navigate('/conversations');
            return;
          }
          
          // 设置对话状态
          setCurrentConversation(conversation);
          setSelectedScenario(conversation.scenario);
          
          // 加载对话消息
          const messagesData = await getConversationMessages(conversationId);
          setMessages(messagesData);
          
          setScenarioDialogOpen(false);
        } catch (err: any) {
          setError('加载对话失败：' + err.message);
          navigate('/conversations');
        } finally {
          setLoading(false);
        }
      };

      loadExistingConversation();
    }
  }, [isContinueMode, conversationId, navigate]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 选择场景并开始对话（仅新对话模式）
  const handleScenarioSelect = async (scenario: Scenario) => {
    if (!personaId) return;
    
    setLoading(true);
    try {
      const conversation = await createConversation({
        digital_persona_id: personaId,
        scenario_id: scenario.id,
        title: `在${scenario.name}中的对话`,
      });
      
      setSelectedScenario(scenario);
      setCurrentConversation(conversation);
      setScenarioDialogOpen(false);
      
      // 加载对话消息
      const messagesData = await getConversationMessages(conversation.id);
      setMessages(messagesData);
    } catch (err: any) {
      setError('创建对话失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || loading || feedbackLoading) return;

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

  // 处理反馈
  const handleFeedback = async (message: Message, feedbackType: 'like' | 'dislike') => {
    if (!currentConversation || feedbackLoading) return;

    try {
      setFeedbackLoading(true);
      setOptimizationResult(null);
      
      const result = await submitFeedback({
        conversation_id: currentConversation.id,
        message_id: message.id,
        feedback_type: feedbackType,
      });
      
      // 显示处理结果
      if (result.optimization_performed) {
        setOptimizationResult(`反馈已处理！${result.message}`);
      } else {
        setOptimizationResult(`反馈已记录！${result.message}`);
      }
      
      // 3秒后自动清除提示
      setTimeout(() => setOptimizationResult(null), 3000);
      
    } catch (err: any) {
      setError('提交反馈失败：' + err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // 打开矫正对话框
  const handleCorrectionClick = (message: Message) => {
    setFeedbackMessage(message);
    setFeedbackDialogOpen(true);
    setCorrectionText('');
  };

  // 提交矫正反馈
  const handleSubmitCorrection = async () => {
    if (!feedbackMessage || !correctionText.trim() || !currentConversation || feedbackLoading) return;

    try {
      setFeedbackLoading(true);
      setOptimizationResult(null);
      
      const result = await submitFeedback({
        conversation_id: currentConversation.id,
        message_id: feedbackMessage.id,
        feedback_type: 'correction',
        feedback_content: correctionText.trim(),
      });
      
      setFeedbackDialogOpen(false);
      setCorrectionText('');
      setFeedbackMessage(null);
      
      // 显示处理结果
      if (result.optimization_performed) {
        setOptimizationResult(`矫正反馈已处理！${result.message}`);
      } else {
        setOptimizationResult(`矫正反馈已记录！${result.message}`);
      }
      
      // 3秒后自动清除提示
      setTimeout(() => setOptimizationResult(null), 5000);
      
    } catch (err: any) {
      setError('提交矫正反馈失败：' + err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // 重新开始对话
  const handleRestart = () => {
    if (isContinueMode) {
      // 恢复模式下，返回对话记录页面
      navigate('/conversations');
    } else {
      // 新对话模式下，重新选择场景
      setMessages([]);
      setCurrentConversation(null);
      setSelectedScenario(null);
      setScenarioDialogOpen(true);
    }
  };

  // 返回上一页
  const handleGoBack = () => {
    if (isContinueMode) {
      navigate('/conversations');
    } else {
      navigate('/personas');
    }
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
            
            {/* AI消息的反馈按钮 */}
            {!isUser && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                <Tooltip title="点赞">
                  <IconButton
                    size="small"
                    onClick={() => handleFeedback(message, 'like')}
                    disabled={feedbackLoading}
                    sx={{ color: 'success.main' }}
                  >
                    {feedbackLoading ? <CircularProgress size={16} /> : <ThumbUp fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="点踩">
                  <IconButton
                    size="small"
                    onClick={() => handleFeedback(message, 'dislike')}
                    disabled={feedbackLoading}
                    sx={{ color: 'error.main' }}
                  >
                    {feedbackLoading ? <CircularProgress size={16} /> : <ThumbDown fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="添加矫正反馈">
                  <IconButton
                    size="small"
                    onClick={() => handleCorrectionClick(message)}
                    disabled={feedbackLoading}
                    sx={{ color: 'warning.main' }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Paper>
        </Box>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部信息栏 */}
      {selectedScenario && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleGoBack}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedScenario.name}
                  {isContinueMode && <Chip label="恢复对话" size="small" color="info" sx={{ ml: 1 }} />}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedScenario.description}
                </Typography>
                <Chip
                  label={selectedScenario.category}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isContinueMode ? "返回对话记录" : "重新开始"}>
                <IconButton onClick={handleRestart}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="设置">
                <IconButton>
                  <Settings />
                </IconButton>
              </Tooltip>
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

      {/* 优化结果提示 */}
      {optimizationResult && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOptimizationResult(null)}>
          {optimizationResult}
        </Alert>
      )}

      {/* 消息列表 */}
      <Paper sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {isContinueMode ? '加载对话记录中...' : '开始与你的数字人格对话吧！'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {isContinueMode ? 
                '正在恢复之前的对话内容' : 
                '在这个场景中，你可以自由地与AI对话，并通过反馈来优化它的表现'
              }
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
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={feedbackLoading ? "正在处理反馈中，请稍候..." : "输入你的消息..."}
            disabled={loading || !currentConversation || feedbackLoading}
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
            disabled={!inputMessage.trim() || loading || !currentConversation || feedbackLoading}
            sx={{ minWidth: 60 }}
          >
            {loading || feedbackLoading ? <CircularProgress size={24} /> : <Send />}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          按回车发送，Shift+回车换行。对AI的回复可以点赞、点踩或添加矫正反馈。
        </Typography>
      </Paper>

      {/* 场景选择对话框（仅新对话模式） */}
      <Dialog
        open={scenarioDialogOpen && !isContinueMode}
        onClose={() => {}}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>
          <Typography variant="h5">选择对话场景</Typography>
          <Typography variant="body2" color="text.secondary">
            选择一个场景来开始与你的数字人格对话
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {scenarios.map((scenario) => (
              <Grid item xs={12} md={6} key={scenario.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {scenario.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scenario.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={scenario.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={scenario.difficulty_level}
                        size="small"
                        color={
                          scenario.difficulty_level === 'easy'
                            ? 'success'
                            : scenario.difficulty_level === 'medium'
                            ? 'warning'
                            : 'error'
                        }
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* 矫正反馈对话框 */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加矫正反馈</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            请描述你希望AI如何改进刚才的回复：
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            placeholder="例如：回复太正式了，希望更亲切一些..."
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFeedbackDialogOpen(false)}
            disabled={feedbackLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmitCorrection}
            variant="contained"
            disabled={!correctionText.trim() || feedbackLoading}
          >
            {feedbackLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {feedbackLoading ? '处理中...' : '提交反馈'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat; 