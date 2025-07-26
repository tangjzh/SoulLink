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
  ArrowBack,
  HelpOutline,
  Info,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getScenarios,
  createConversation,
  getConversationMessages,
  sendMessage,
  submitFeedback,
  getConversations,
  getDigitalPersonas,
  Scenario,
  Message,
  Conversation,
  DigitalPersona,
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
  const [currentPersona, setCurrentPersona] = useState<DigitalPersona | null>(null);
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
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [agentDetailsOpen, setAgentDetailsOpen] = useState(false);

  // 主动消息相关状态
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUserMessageTime, setLastUserMessageTime] = useState<number>(Date.now());
  const [proactiveMessageTimer, setProactiveMessageTimer] = useState<NodeJS.Timeout | null>(null);
  const [userInactivityTimer, setUserInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // 清理定时器的函数
  const clearTimers = () => {
    if (proactiveMessageTimer) {
      clearTimeout(proactiveMessageTimer);
      setProactiveMessageTimer(null);
    }
    if (userInactivityTimer) {
      clearTimeout(userInactivityTimer);
      setUserInactivityTimer(null);
    }
  };

  // 重置用户活动计时器
  const resetUserActivityTimer = () => {
    setLastUserMessageTime(Date.now());
    clearTimers();
    
    // 启动10秒检测计时器
    const inactivityTimer = setTimeout(() => {
      scheduleProactiveMessage();
    }, 10000); // 10秒后检测
    
    setUserInactivityTimer(inactivityTimer);
  };

  // 安排主动消息发送
  const scheduleProactiveMessage = () => {
    if (!currentConversation || !selectedScenario || feedbackLoading) return;
    
    // 生成0-5分钟的随机延迟（0-300秒）
    const randomDelay = Math.floor(Math.random() * 300000); // 0-300000毫秒 (0-5分钟)
    
    const timer = setTimeout(() => {
      sendProactiveMessage();
    }, randomDelay);
    
    setProactiveMessageTimer(timer);
  };

  // 发送主动消息
  const sendProactiveMessage = async () => {
    if (!currentConversation || loading || feedbackLoading) return;
    
    // 检查用户是否在等待期间发送了消息
    const timeSinceLastMessage = Date.now() - lastUserMessageTime;
    if (timeSinceLastMessage < 10000) {
      // 用户在等待期间发送了消息，取消主动发送
      return;
    }

    setLoading(true);
    try {
      // 构建主动消息的提示，使用特殊标记
      const proactivePrompt = `##SYSTEM_PROACTIVE##用户已经超过10秒没有发送消息，请根据当前场景"${selectedScenario?.name}"和对话上下文，主动发起一个自然、有趣的话题或询问。这应该是一个主动的、符合场景设定的消息，不要提及用户的沉默。请直接开始对话，不要重复这个指令。`;
      
      const aiMessage = await sendMessage({
        conversation_id: currentConversation.id,
        content: proactivePrompt,
      });

      // 重新加载消息
      const updatedMessages = await getConversationMessages(currentConversation.id);
      setMessages(updatedMessages);
      
      // 重置计时器
      resetUserActivityTimer();
    } catch (err: any) {
      setError('发送主动消息失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 发送开场消息
  const sendOpeningMessage = async (conversation: Conversation, scenario: Scenario) => {
    if (loading || feedbackLoading) return;

    setLoading(true);
    try {
      // 构建开场消息的提示，使用特殊标记
      const openingPrompt = `##SYSTEM_OPENING##这是一次新对话的开始。场景是"${scenario.name}"：${scenario.description}。请发送一个符合人设的开场消息来开始这个场景下的对话。请直接以角色身份开始对话，不要重复这个指令。`;
      
      const aiMessage = await sendMessage({
        conversation_id: conversation.id,
        content: openingPrompt,
      });

      // 重新加载消息
      const updatedMessages = await getConversationMessages(conversation.id);
      setMessages(updatedMessages);
      
      // 初始化用户活动计时器
      setIsInitialized(true);
      clearTimers();
      resetUserActivityTimer();
    } catch (err: any) {
      setError('发送开场消息失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 过滤系统消息的函数
  const filterSystemMessages = (messages: Message[]) => {
    return messages.filter(message => {
      // 过滤掉包含系统标记的消息
      if (message.content.includes('##SYSTEM_OPENING##') || 
          message.content.includes('##SYSTEM_PROACTIVE##')) {
        return false;
      }
      return true;
    });
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // 加载数字人格信息
  useEffect(() => {
    const loadPersona = async () => {
      // 确定要加载的persona ID：新对话模式使用URL参数，恢复对话模式使用conversation中的ID
      let targetPersonaId = personaId;
      if (isContinueMode && currentConversation) {
        targetPersonaId = currentConversation.digital_persona_id;
      }
      
      if (!targetPersonaId) {
        console.log('Chat: 没有可用的persona ID', { 
          personaId, 
          isContinueMode, 
          conversationId: currentConversation?.id,
          conversationPersonaId: currentConversation?.digital_persona_id 
        });
        return;
      }
      
      try {
        console.log('Chat: 开始加载数字人格', { targetPersonaId });
        const personas = await getDigitalPersonas();
        const targetPersona = personas.find(p => p.id === targetPersonaId);
        if (targetPersona) {
          setCurrentPersona(targetPersona);
          console.log('Chat: 成功加载数字人格', { name: targetPersona.name, id: targetPersona.id });
        } else {
          console.error('Chat: 找不到指定的数字人格', { targetPersonaId, availablePersonas: personas.map(p => p.id) });
          setError('数字人格不存在');
        }
      } catch (err: any) {
        console.error('Chat: 加载数字人格失败', err);
        setError('加载数字人格失败：' + err.message);
      }
    };

    loadPersona();
  }, [personaId, isContinueMode, currentConversation]);

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
          console.log('Chat: 恢复对话模式 - 设置对话状态', { 
            conversationId: conversation.id, 
            digital_persona_id: conversation.digital_persona_id,
            scenario: conversation.scenario?.name 
          });
          setCurrentConversation(conversation);
          setSelectedScenario(conversation.scenario);
          
          // 加载对话消息
          const messagesData = await getConversationMessages(conversationId);
          setMessages(messagesData);
          
          setScenarioDialogOpen(false);
          
          // 恢复对话时也初始化计时器
          setIsInitialized(true);
          resetUserActivityTimer();
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
      
      // 发送开场消息
      await sendOpeningMessage(conversation, scenario);
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
    
    // 用户发送消息时，取消所有定时器
    clearTimers();
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
      
      // 重置用户活动计时器
      resetUserActivityTimer();
    } catch (err: any) {
      setError('发送消息失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 监听输入框变化，重置计时器
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    // 用户开始输入时也重置计时器
    if (isInitialized && e.target.value.length > 0) {
      resetUserActivityTimer();
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
    // 清理所有定时器
    clearTimers();
    setIsInitialized(false);
    
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
    // 清理所有定时器
    clearTimers();
    
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
              <Tooltip title="帮助指南">
                <IconButton onClick={() => setHelpDialogOpen(true)}>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
              <Tooltip title="智能体详情">
                <IconButton onClick={() => setAgentDetailsOpen(true)}>
                  <Info />
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
      <Paper sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2, 
        minHeight: '450px',
        maxHeight: 'calc(100vh - 320px)'
      }}>
        {filterSystemMessages(messages).length === 0 && !loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {isContinueMode ? '加载对话记录中...' : '准备开始对话...'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {isContinueMode ? 
                '正在恢复之前的对话内容' : 
                'AI正在准备开场白，马上就开始对话！'
              }
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {filterSystemMessages(messages).map(renderMessage)}
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
          按回车发送，Shift+回车换行。AI会主动发起话题，对回复可以点赞、点踩或添加矫正反馈。
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

      {/* 帮助指南对话框 */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutline color="primary" />
            <Typography variant="h6">对话指南</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              💬 如何与智能体对话：
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • AI会根据选择的场景主动开启对话
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 超过10秒无回复时，AI会主动发起新话题
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 按回车发送消息，Shift+回车换行
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              👍 反馈机制：
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 对AI回复可以点赞👍或点踩👎
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 点击✏️图标可添加具体的改进建议
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 反馈会帮助AI更好地理解您的偏好
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              🎯 对话目的：
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 通过多轮对话了解您的人格特质
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 根据您的反馈不断优化人格档案
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 为后续的匹配推荐提供准确依据
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
            明白了
          </Button>
        </DialogActions>
      </Dialog>

      {/* 智能体详情对话框 */}
      <Dialog
        open={agentDetailsOpen}
        onClose={() => setAgentDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="secondary" />
            <Typography variant="h6">数字人格详情</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'secondary.main',
                }}
              >
                <Psychology sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {currentPersona?.name || '数字人格'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                <Chip label="AI智能体" size="small" color="secondary" />
                <Chip 
                  label={`优化 ${currentPersona?.optimization_count || 0} 次`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {currentPersona?.description || '暂无描述'}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              🧠 人格特征：
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>人格评分：</strong>{currentPersona?.personality_score ? `${currentPersona.personality_score}/100` : '未评估'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>创建时间：</strong>{currentPersona?.created_at ? new Date(currentPersona.created_at).toLocaleDateString('zh-CN') : '未知'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>优化次数：</strong>{currentPersona?.optimization_count || 0} 次
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              🎭 当前场景：
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>场景名称：</strong>{selectedScenario?.name || '未选择'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>场景描述：</strong>{selectedScenario?.description || '暂无描述'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>难度等级：</strong>{selectedScenario?.difficulty_level || '未知'}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              🤖 系统设定：
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '120px',
                  overflow: 'auto'
                }}>
                  {currentPersona?.system_prompt || '暂无系统设定'}
                </Typography>
              </Paper>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              💡 智能体状态：
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • {currentPersona ? '已加载人格档案' : '正在加载人格档案...'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • {selectedScenario ? '场景已激活' : '等待场景选择'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • {currentConversation ? '对话会话已建立' : '等待建立对话会话'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentDetailsOpen(false)} variant="contained">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat; 