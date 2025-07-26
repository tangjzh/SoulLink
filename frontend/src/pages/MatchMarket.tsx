import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
  LinearProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Favorite,
  People,
  Person,
  Add,
  TrendingUp,
  Chat,
  Refresh,
  FilterList,
  Sort,
  PersonAdd,
  Rocket,
  Psychology,
  AutoAwesome,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getMarketAgents,
  getMyMarketAgents,
  createMarketAgent,
  getMatchRelations,
  createMatchRelation,
  triggerConversation,
  getTaskStatus,
  getMatchConversations,
  getDigitalPersonas,
  MarketAgent,
  MatchRelation,
  DigitalPersona,
  CreateMarketAgentRequest,
  CreateMatchRelationRequest
} from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`match-tabpanel-${index}`}
      aria-labelledby={`match-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          pt: isMobile ? 2 : 3,
          px: isMobile ? 2 : 0
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MatchMarket: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [marketType, setMarketType] = useState<'love' | 'friendship'>('love');
  
  // 数据状态
  const [marketAgents, setMarketAgents] = useState<MarketAgent[]>([]);
  const [myMarketAgents, setMyMarketAgents] = useState<MarketAgent[]>([]);
  const [matchRelations, setMatchRelations] = useState<MatchRelation[]>([]);
  const [digitalPersonas, setDigitalPersonas] = useState<DigitalPersona[]>([]);
  
  // UI状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [conversationHistoryOpen, setConversationHistoryOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [runningTasks, setRunningTasks] = useState<string[]>([]);
  
  // 市场探索显示的agents
  const [displayedAgents, setDisplayedAgents] = useState<MarketAgent[]>([]);
  
  // 创建市场agent表单
  const [createForm, setCreateForm] = useState<CreateMarketAgentRequest>({
    digital_persona_id: '',
    market_type: 'love',
    display_name: '',
    display_description: '',
    tags: []
  });

  useEffect(() => {
    loadData();
  }, [tabValue, marketType]);

  // 随机选择最多3个agents显示
  const rollAgents = () => {
    if (marketAgents.length === 0) {
      setDisplayedAgents([]);
      return;
    }
    
    const shuffled = [...marketAgents].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));
    setDisplayedAgents(selected);
  };

  // 处理换一批按钮点击
  const handleRollAgents = () => {
    rollAgents();
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = [];
      
      if (tabValue === 0) {
        // 市场页面 - 需要同时获取市场agents和匹配关系
        promises.push(getMarketAgents(marketType));
        promises.push(getMatchRelations(marketType));
      } else if (tabValue === 1) {
        // 我的匹配
        promises.push(getMatchRelations(marketType));
      } else if (tabValue === 2) {
        // 投放管理 - 需要匹配关系数据来显示统计信息
        promises.push(getMyMarketAgents());
        promises.push(getDigitalPersonas());
        promises.push(getMatchRelations('love'));
        promises.push(getMatchRelations('friendship'));
      }
      
      const results = await Promise.all(promises);
      
      if (tabValue === 0) {
        const agents = results[0] as MarketAgent[];
        setMarketAgents(agents);
        setMatchRelations(results[1] as MatchRelation[]);
        
        // 初始化显示的agents
        if (agents.length > 0) {
          const shuffled = [...agents].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, Math.min(3, shuffled.length));
          setDisplayedAgents(selected);
        } else {
          setDisplayedAgents([]);
        }
      } else if (tabValue === 1) {
        setMatchRelations(results[0] as MatchRelation[]);
      } else if (tabValue === 2) {
        setMyMarketAgents(results[0] as MarketAgent[]);
        setDigitalPersonas(results[1] as DigitalPersona[]);
        
        // 合并恋爱和友谊匹配关系数据
        const loveMatches = results[2] as MatchRelation[];
        const friendshipMatches = results[3] as MatchRelation[];
        setMatchRelations([...loveMatches, ...friendshipMatches]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarketAgent = async () => {
    try {
      setLoading(true);
      await createMarketAgent(createForm);
      setCreateDialogOpen(false);
      setCreateForm({
        digital_persona_id: '',
        market_type: 'love',
        display_name: '',
        display_description: '',
        tags: []
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '投放失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMatches = async (targetAgentId: string) => {
    try {
      setLoading(true);
      await createMatchRelation({
        target_agent_id: targetAgentId,
        match_type: marketType
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '添加匹配失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerConversation = async (matchId: string) => {
    try {
      setLoading(true);
      const result = await triggerConversation(matchId);
      setError(null);
      
      // 添加到运行任务列表
      setRunningTasks(prev => [...prev, matchId]);
      
      // 显示任务创建成功信息
      alert(`对话任务已创建！场景：${result.scenario}\n正在后台处理中，请稍候...`);
      
      // 开始轮询任务状态
      pollTaskStatus(result.task_id, matchId);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || '触发对话失败');
    } finally {
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: string, matchId: string) => {
    try {
      const maxPolls = 60; // 最多轮询5分钟（每5秒一次）
      let polls = 0;
      
      const poll = async (): Promise<void> => {
        try {
          const taskStatus = await getTaskStatus(taskId);
          
          if (taskStatus.status === 'completed') {
            // 任务完成
            setRunningTasks(prev => prev.filter(id => id !== matchId));
            
            const result = taskStatus.result;
            alert(`对话完成！场景：${result.scenario_name}\n恋爱分数变化：${result.love_score_change}\n友谊分数变化：${result.friendship_score_change}`);
            loadData(); // 刷新数据
            
          } else if (taskStatus.status === 'failed') {
            // 任务失败
            setRunningTasks(prev => prev.filter(id => id !== matchId));
            
            setError(`对话生成失败：${taskStatus.error}`);
            
          } else if (taskStatus.status === 'running' && polls < maxPolls) {
            // 任务还在运行，继续轮询
            polls++;
            setTimeout(poll, 5000); // 5秒后继续轮询
            
          } else if (polls >= maxPolls) {
            // 轮询超时
            setRunningTasks(prev => prev.filter(id => id !== matchId));
            
            setError('对话生成超时，请稍后查看对话记录');
          }
          
        } catch (err: any) {
          console.error('轮询任务状态失败:', err);
          // 轮询失败也要移除任务状态
          setRunningTasks(prev => prev.filter(id => id !== matchId));
        }
      };
      
      // 开始轮询
      setTimeout(poll, 2000); // 2秒后开始第一次轮询
      
    } catch (err: any) {
      console.error('启动任务轮询失败:', err);
      setRunningTasks(prev => prev.filter(id => id !== matchId));
    }
  };

  const handleViewConversationHistory = async (matchId: string) => {
    try {
      setLoading(true);
      const history = await getMatchConversations(matchId);
      setConversationHistory(history);
      setSelectedMatchId(matchId);
      setConversationHistoryOpen(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || '获取对话历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 与代理聊天
  const handleChatWithAgent = (relation: MatchRelation) => {
    navigate(`/market-chat/${relation.target_agent.digital_persona_id}?name=${encodeURIComponent(relation.target_agent.display_name)}&description=${encodeURIComponent(relation.target_agent.display_description)}`);
  };

  // 与真人聊天
  const handleChatWithUser = (relation: MatchRelation) => {
    navigate(`/realtime-chat/${relation.id}?name=${encodeURIComponent(relation.target_agent.display_name)}&userId=${relation.target_user_id || ''}`);
  };

  const getCompatibilityScore = (relation: MatchRelation) => {
    return marketType === 'love' 
      ? relation.love_compatibility_score 
      : relation.friendship_compatibility_score;
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 50) return 'success';
    if (score >= 20) return 'warning';
    return 'error';
  };

  // 检查agent是否已经在匹配列表中
  const isAgentAlreadyMatched = (agentId: string) => {
    return matchRelations.some(relation => relation.target_agent.id === agentId);
  };

  const sortedMatchRelations = [...matchRelations].sort((a, b) => {
    return getCompatibilityScore(b) - getCompatibilityScore(a);
  });

  return (
    <Box>
      <Typography 
        variant={isMobile ? "h4" : "h3"} 
        component="h1" 
        gutterBottom 
        textAlign="center"
        sx={{ fontSize: isMobile ? '1.75rem' : '3rem' }}
      >
        💕 链接时空
      </Typography>
      
      <Typography 
        variant={isMobile ? "body1" : "h6"} 
        color="text.secondary" 
        textAlign="center" 
        sx={{ 
          mb: isMobile ? 3 : 4,
          fontSize: isMobile ? '1rem' : '1.25rem',
          px: isMobile ? 2 : 0
        }}
      >
        你的数字分身在此处遇见那个虚拟的TA
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: isMobile ? 2 : 3,
            mx: isMobile ? 2 : 0,
            borderRadius: 0,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* 市场类型切换 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mb: isMobile ? 2 : 3,
        px: isMobile ? 2 : 0
      }}>
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={marketType === 'love'}
                onChange={(e) => setMarketType(e.target.checked ? 'love' : 'friendship')}
                color="error"
                size={isMobile ? "medium" : "medium"}
                sx={{ 
                  '& .MuiSwitch-switchBase': {
                    // borderRadius: 0
                  },
                  '& .MuiSwitch-thumb': {
                    // borderRadius: 0
                  },
                  '& .MuiSwitch-track': {
                    // borderRadius: 0
                  }
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {marketType === 'love' ? 
                  <Favorite color="error" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} /> : 
                  <People color="primary" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                }
                <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                  {marketType === 'love' ? '恋爱匹配' : '友谊匹配'}
                </Typography>
              </Box>
            }
          />
        </FormControl>
      </Box>

      {/* 标签页 */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: isMobile ? 1 : 2,
        mx: isMobile ? -2 : 0
      }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          centered={!isMobile}
          variant={isMobile ? "fullWidth" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile={isMobile}
          sx={{
            '& .MuiTab-root': {
              minWidth: isMobile ? 'auto' : 160,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '8px 12px' : '12px 16px',
              // borderRadius: 0
            },
            '& .MuiTabs-indicator': {
              // borderRadius: 0
            }
          }}
        >
          <Tab
            icon={<Psychology sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
            label={isMobile ? "探索" : "市场探索"}
            id="match-tab-0"
            aria-controls="match-tabpanel-0"
            // sx={{ borderRadius: 0 }}
          />
          <Tab
            icon={<TrendingUp sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
            label={isMobile ? "匹配" : "我的匹配"}
            id="match-tab-1"
            aria-controls="match-tabpanel-1"
            // sx={{ borderRadius: 0 }}
          />
          <Tab
            icon={<Rocket sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
            label={isMobile ? "管理" : "投放管理"}
            id="match-tab-2"
            aria-controls="match-tabpanel-2"
            // sx={{ borderRadius: 0 }}
          />
        </Tabs>
      </Box>

      {/* 市场探索 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          mb: isMobile ? 2 : 3,
          gap: isMobile ? 2 : 0
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            sx={{ 
              textAlign: isMobile ? 'center' : 'left',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}
          >
            发现{marketType === 'love' ? '恋爱' : '友谊'}伙伴
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: isMobile ? 'center' : 'flex-end'
          }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesome sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
              onClick={handleRollAgents}
              disabled={loading || marketAgents.length === 0}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                // borderRadius: 0,
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            >
              换一批
            </Button>
            <IconButton 
              onClick={loadData} 
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              // sx={{ borderRadius: 0 }}
            >
              <Refresh sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
            </IconButton>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: isMobile ? 1 : 2 }} />}

        <Grid container spacing={isMobile ? 2 : 3}>
          {displayedAgents.map((agent: MarketAgent) => (
            <Grid item xs={12} sm={6} md={4} key={agent.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                // borderRadius: 0,
                '&:hover': isMobile ? {} : {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}>
                <CardContent sx={{ flexGrow: 1, p: isMobile ? 2 : 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: isMobile ? 1.5 : 2,
                    flexDirection: isMobile ? 'column' : 'row',
                    textAlign: isMobile ? 'center' : 'left',
                    gap: isMobile ? 1 : 0
                  }}>
                    <Avatar sx={{ 
                      bgcolor: marketType === 'love' ? 'error.main' : 'primary.main', 
                      mr: isMobile ? 0 : 2,
                      width: isMobile ? 48 : 40,
                      height: isMobile ? 48 : 40,
                      fontSize: isMobile ? '1.25rem' : '1rem',
                      // borderRadius: 0
                    }}>
                      {agent.display_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        component="div"
                        sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                      >
                        {agent.display_name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        {new Date(agent.last_interaction).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: isMobile ? 1.5 : 2,
                      fontSize: isMobile ? '0.875rem' : '0.875rem',
                      lineHeight: 1.4,
                      textAlign: isMobile ? 'center' : 'left'
                    }}
                  >
                    {agent.display_description}
                  </Typography>
                  
                  {agent.tags.length > 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: isMobile ? 0.5 : 0.5,
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      {agent.tags.slice(0, 3).map((tag: string, index: number) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          size={isMobile ? "small" : "small"} 
                          variant="outlined"
                          sx={{ 
                            // borderRadius: 0,
                            fontSize: isMobile ? '0.75rem' : '0.75rem',
                            height: isMobile ? 24 : 28
                          }}
                        />
                      ))}
                      {agent.tags.length > 3 && (
                        <Chip 
                          label={`+${agent.tags.length - 3}`} 
                          size={isMobile ? "small" : "small"} 
                          variant="outlined"
                          sx={{ 
                            // borderRadius: 0,
                            fontSize: isMobile ? '0.75rem' : '0.75rem',
                            height: isMobile ? 24 : 28
                          }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ 
                  // display: 'flex', 
                  // gap: isMobile ? 0.5 : 1,
                  // flexDirection: isMobile ? 'column' : 'row',
                  // p: isMobile ? 2 : 1
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<Chat sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                    onClick={() => navigate(`/market-chat/${agent.digital_persona_id}?name=${encodeURIComponent(agent.display_name)}&description=${encodeURIComponent(agent.display_description)}`)}
                    size={isMobile ? "medium" : "small"}
                    fullWidth={isMobile}
                    sx={{ 
                      // flex: isMobile ? 'none' : 1,
                      // borderRadius: 0,
                      fontSize: isMobile ? '0.875rem' : '0.75rem'
                    }}
                  >
                    开始聊天
                  </Button>
                  
                  {isAgentAlreadyMatched(agent.id) ? (
                    <Button
                      variant="outlined"
                      disabled
                      startIcon={<PersonAdd sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                      color="inherit"
                      size={isMobile ? "medium" : "small"}
                      fullWidth={isMobile}
                      sx={{ 
                        // flex: isMobile ? 'none' : 1,
                        // borderRadius: 0,
                        fontSize: isMobile ? '0.875rem' : '0.75rem'
                      }}
                    >
                      已添加
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<PersonAdd sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                      onClick={() => handleAddToMatches(agent.id)}
                      disabled={loading}
                      color={marketType === 'love' ? 'error' : 'primary'}
                      size={isMobile ? "medium" : "small"}
                      fullWidth={isMobile}
                      sx={{ 
                        flex: isMobile ? 'none' : 1,
                        // borderRadius: 0,
                        fontSize: isMobile ? '0.875rem' : '0.75rem'
                      }}
                    >
                      添加匹配
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {displayedAgents.length === 0 && !loading && (
          <Box textAlign="center" sx={{ py: isMobile ? 6 : 4, px: isMobile ? 2 : 0 }}>
            <Psychology sx={{ 
              fontSize: isMobile ? 60 : 80, 
              color: 'text.secondary', 
              mb: 2 
            }} />
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              color="text.secondary"
              sx={{ 
                mb: 1,
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              {marketAgents.length === 0 ? `暂无${marketType === 'love' ? '恋爱' : '友谊'}伙伴` : '点击"换一批"发现更多伙伴'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              {marketAgents.length === 0 ? '快去投放你的数字人格吧！' : '或者刷新页面获取最新数据'}
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* 我的匹配 */}
      <TabPanel value={tabValue} index={1}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom
          sx={{ 
            textAlign: isMobile ? 'center' : 'left',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            mb: isMobile ? 2 : 1
          }}
        >
          我的{marketType === 'love' ? '恋爱' : '友谊'}匹配
        </Typography>

        {loading && <LinearProgress sx={{ mb: isMobile ? 1 : 2 }} />}

        <Grid container spacing={isMobile ? 2 : 3}>
          {sortedMatchRelations.map((relation) => {
            const score = getCompatibilityScore(relation);
            const color = getCompatibilityColor(score);
            
            return (
              <Grid item xs={12} sm={6} key={relation.id}>
                <Card>
                  <CardContent sx={{ p: isMobile ? 2 : 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: isMobile ? 1.5 : 2,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? 1 : 0
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant={isMobile ? "subtitle1" : "h6"} 
                          component="div"
                          sx={{ 
                            fontSize: isMobile ? '1rem' : '1.25rem',
                            textAlign: isMobile ? 'center' : 'left'
                          }}
                        >
                          {relation.target_agent.display_name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: isMobile ? '0.875rem' : '0.875rem',
                            textAlign: isMobile ? 'center' : 'left',
                            lineHeight: 1.4
                          }}
                        >
                          {relation.target_agent.display_description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${score.toFixed(1)}%`}
                        color={color}
                        variant="filled"
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          alignSelf: isMobile ? 'center' : 'flex-start'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
                      <Typography 
                        variant="body2" 
                        gutterBottom
                        sx={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          textAlign: isMobile ? 'center' : 'left'
                        }}
                      >
                        匹配度进度
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.max(score + 50, 0), 100)}
                        color={color}
                        sx={{ 
                          height: isMobile ? 6 : 8, 
                          // borderRadius: 0 
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mb: isMobile ? 1.5 : 2,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? 0.5 : 0,
                      textAlign: isMobile ? 'center' : 'left'
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        互动次数: {relation.total_interactions}
                      </Typography>
                      {relation.last_conversation_at && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        >
                          最后对话: {new Date(relation.last_conversation_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                    
                    {relation.target_agent.tags.length > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: isMobile ? 0.5 : 0.5,
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        {relation.target_agent.tags.map((tag: string, index: number) => (
                          <Chip 
                            key={index} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderRadius: 0,
                              fontSize: isMobile ? '0.7rem' : '0.75rem',
                              height: isMobile ? 24 : 28
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ 
                    // display: 'flex',
                    // flexDirection: 'column', 
                    // gap: isMobile ? 0.5 : 1,
                    // p: isMobile ? 2 : 1
                  }}>
                    {/* 第一行：自动对话和查看对话 */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: isMobile ? 0.5 : 1, 
                      width: '100%',
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      {runningTasks.includes(relation.id) ? (
                        <Button
                          variant="outlined"
                          startIcon={<CircularProgress size={isMobile ? 14 : 16} />}
                          disabled
                          size={isMobile ? "medium" : "small"}
                          color="info"
                          fullWidth
                          sx={{ 
                            // borderRadius: 0,
                            fontSize: isMobile ? '0.875rem' : '0.75rem'
                          }}
                        >
                          对话生成中...
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          startIcon={<Chat sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                          onClick={() => handleTriggerConversation(relation.id)}
                          disabled={loading}
                          size={isMobile ? "medium" : "small"}
                          fullWidth
                          sx={{ 
                            // borderRadius: 0,
                            fontSize: isMobile ? '0.875rem' : '0.75rem'
                          }}
                        >
                          触发对话
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<HistoryIcon sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                        onClick={() => handleViewConversationHistory(relation.id)}
                        disabled={loading}
                        size={isMobile ? "medium" : "small"}
                        fullWidth
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '0.875rem' : '0.75rem'
                        }}
                      >
                        查看对话
                      </Button>
                    </Box>
                    
                    {/* 第二行：与代理聊天和与真人聊天 */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: isMobile ? 0.5 : 1, 
                      width: '100%',
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<Psychology sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                        onClick={() => handleChatWithAgent(relation)}
                        disabled={loading}
                        size={isMobile ? "medium" : "small"}
                        fullWidth
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '0.875rem' : '0.75rem'
                        }}
                      >
                        与代理聊天
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Person sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                        onClick={() => handleChatWithUser(relation)}
                        disabled={loading}
                        size={isMobile ? "medium" : "small"}
                        fullWidth
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '0.875rem' : '0.75rem'
                        }}
                      >
                        与真人聊天
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {sortedMatchRelations.length === 0 && !loading && (
          <Box textAlign="center" sx={{ py: isMobile ? 6 : 4, px: isMobile ? 2 : 0 }}>
            <TrendingUp sx={{ 
              fontSize: isMobile ? 60 : 80, 
              color: 'text.secondary', 
              mb: 2 
            }} />
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              color="text.secondary"
              sx={{ 
                mb: 1,
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              暂无匹配关系
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              去市场探索页面添加一些伙伴吧！
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* 投放管理 */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'center' : 'center', 
          mb: isMobile ? 3 : 4,
          gap: isMobile ? 2 : 0
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            sx={{ 
              textAlign: 'center',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}
          >
            我的时空投放
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            投放数字人格
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: isMobile ? 2 : 3 }} />}

        {myMarketAgents.filter(agent => agent.market_type === marketType).length > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Card sx={{ 
              maxWidth: isMobile ? '100%' : 600, 
              width: '100%',
              boxShadow: isMobile ? 1 : 3,
              // borderRadius: 0,
              '&:hover': isMobile ? {} : {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}>
              <CardContent sx={{ p: isMobile ? 3 : 4 }}>
                {myMarketAgents.filter(agent => agent.market_type === marketType).map((agent) => (
                  <Box key={agent.id}>
                    {/* 头部信息 */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: isMobile ? 2 : 3,
                      flexDirection: isMobile ? 'column' : 'row',
                      textAlign: isMobile ? 'center' : 'left',
                      gap: isMobile ? 2 : 0
                    }}>
                      <Avatar sx={{ 
                        bgcolor: agent.market_type === 'love' ? 'error.main' : 'primary.main', 
                        mr: isMobile ? 0 : 3,
                        width: isMobile ? 80 : 64,
                        height: isMobile ? 80 : 64,
                        fontSize: isMobile ? '2rem' : '1.5rem',
                        // borderRadius: 0
                      }}>
                        {agent.display_name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant={isMobile ? "h5" : "h4"} 
                          component="div" 
                          gutterBottom
                          sx={{ fontSize: isMobile ? '1.5rem' : '2rem' }}
                        >
                          {agent.display_name}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          alignItems: 'center',
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          flexWrap: 'wrap'
                        }}>
                          <Chip
                            label={agent.market_type === 'love' ? '恋爱市场' : '友谊市场'}
                            color={agent.market_type === 'love' ? 'error' : 'primary'}
                            variant="filled"
                            icon={agent.market_type === 'love' ? <Favorite /> : <People />}
                            sx={{ 
                              // borderRadius: 0,
                              fontSize: isMobile ? '0.875rem' : '1rem'
                            }}
                          />
                          <Chip
                            label="已投放"
                            color="success"
                            variant="outlined"
                            size={isMobile ? "medium" : "small"}
                            sx={{ 
                              // borderRadius: 0,
                              fontSize: isMobile ? '0.875rem' : '0.75rem'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: isMobile ? 2 : 3 }} />

                    {/* 详细描述 */}
                    <Box sx={{ mb: isMobile ? 2 : 3 }}>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        gutterBottom 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          fontSize: isMobile ? '1.125rem' : '1.25rem'
                        }}
                      >
                        <Psychology color="primary" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                        人格描述
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          lineHeight: 1.6,
                          p: isMobile ? 1.5 : 2,
                          bgcolor: 'grey.50',
                          // borderRadius: 0,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          textAlign: isMobile ? 'center' : 'left'
                        }}
                      >
                        {agent.display_description}
                      </Typography>
                    </Box>

                    {/* 标签云 */}
                    {agent.tags.length > 0 && (
                      <Box sx={{ mb: isMobile ? 2 : 3 }}>
                        <Typography 
                          variant={isMobile ? "subtitle1" : "h6"} 
                          gutterBottom 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            fontSize: isMobile ? '1.125rem' : '1.25rem'
                          }}
                        >
                          <AutoAwesome color="primary" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                          特征标签
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: isMobile ? 0.75 : 1,
                          p: isMobile ? 1.5 : 2,
                          bgcolor: 'grey.50',
                          // borderRadius: 0,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                          {agent.tags.map((tag: string, index: number) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              variant="filled"
                              size={isMobile ? "small" : "medium"}
                              sx={{ 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                height: isMobile ? 28 : 32,
                                // borderRadius: 0
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* 投放信息 */}
                    <Box sx={{ mb: isMobile ? 2 : 3 }}>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        gutterBottom 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          fontSize: isMobile ? '1.125rem' : '1.25rem'
                        }}
                      >
                        <Rocket color="primary" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                        投放信息
                      </Typography>
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : { xs: '1fr', sm: '1fr 1fr' },
                        gap: isMobile ? 1 : 2,
                        p: isMobile ? 1.5 : 2,
                        bgcolor: 'grey.50',
                        // borderRadius: 0,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            投放时间
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight="medium"
                            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                          >
                            {new Date(agent.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            最后活跃
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight="medium"
                            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                          >
                            {new Date(agent.last_interaction).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* 数据统计 */}
                    <Box sx={{ mb: isMobile ? 2 : 3 }}>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        gutterBottom 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          fontSize: isMobile ? '1.125rem' : '1.25rem'
                        }}
                      >
                        <TrendingUp color="primary" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                        匹配统计
                      </Typography>
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                        gap: isMobile ? 1.5 : 2,
                        p: isMobile ? 1.5 : 2,
                        bgcolor: 'grey.50',
                        // borderRadius: 0,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            color="primary.main" 
                            fontWeight="bold"
                            sx={{ fontSize: isMobile ? '1.25rem' : '2rem' }}
                          >
                            {matchRelations.filter(rel => rel.target_agent.id === agent.id).length}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            被匹配次数
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            color="success.main" 
                            fontWeight="bold"
                            sx={{ fontSize: isMobile ? '1.25rem' : '2rem' }}
                          >
                            {matchRelations
                              .filter(rel => rel.target_agent.id === agent.id && rel.total_interactions > 0)
                              .length}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            活跃匹配
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            color="info.main" 
                            fontWeight="bold"
                            sx={{ fontSize: isMobile ? '1.25rem' : '2rem' }}
                          >
                            {matchRelations
                              .filter(rel => rel.target_agent.id === agent.id)
                              .reduce((sum, rel) => sum + rel.total_interactions, 0)}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            总互动次数
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* 操作按钮 */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: isMobile ? 1 : 2, 
                      justifyContent: 'center', 
                      mt: isMobile ? 3 : 4,
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Button
                        variant="outlined"
                        startIcon={<Chat sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
                        onClick={() => navigate(`/market-chat/${agent.digital_persona_id}?name=${encodeURIComponent(agent.display_name)}&description=${encodeURIComponent(agent.display_description)}`)}
                        size={isMobile ? "large" : "large"}
                        fullWidth={isMobile}
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '1rem' : '1rem'
                        }}
                      >
                        预览聊天
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<TrendingUp sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
                        onClick={() => {
                          setTabValue(1); // 切换到"我的匹配"标签页
                        }}
                        size={isMobile ? "large" : "large"}
                        fullWidth={isMobile}
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '1rem' : '1rem'
                        }}
                      >
                        查看匹配
                      </Button>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box textAlign="center" sx={{ py: isMobile ? 8 : 6, px: isMobile ? 2 : 0 }}>
            <Box sx={{ mb: isMobile ? 3 : 4 }}>
              <Rocket sx={{ 
                fontSize: isMobile ? 60 : 80, 
                color: 'text.secondary', 
                mb: 2 
              }} />
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
              >
                暂未投放数字人格
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  mb: isMobile ? 2 : 3,
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  lineHeight: 1.6
                }}
              >
                投放你的数字人格到匹配市场，让更多人发现你！
              </Typography>
              <Button
                variant="contained"
                size={isMobile ? "large" : "large"}
                startIcon={<Add sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={loading}
                sx={{ 
                  // borderRadius: 0,
                  fontSize: isMobile ? '1rem' : '1rem',
                  px: isMobile ? 4 : 3,
                  py: isMobile ? 1.5 : 1
                }}
              >
                开始投放
              </Button>
            </Box>
          </Box>
        )}
      </TabPanel>

      {/* 创建市场Agent对话框 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle sx={{ 
          pb: isMobile ? 1 : 2,
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          投放数字人格到市场
        </DialogTitle>
        <DialogContent sx={{ px: isMobile ? 2 : 3 }}>
          <Box sx={{ pt: isMobile ? 2 : 1 }}>
            <FormControl 
              fullWidth 
              sx={{ mb: isMobile ? 2 : 2 }}
              size={isMobile ? "medium" : "medium"}
            >
              <InputLabel sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                选择数字人格
              </InputLabel>
              <Select
                value={createForm.digital_persona_id}
                label="选择数字人格"
                onChange={(e) => setCreateForm(prev => ({ ...prev, digital_persona_id: e.target.value }))}
                sx={{ 
                  // borderRadius: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                {digitalPersonas.map((persona) => (
                  <MenuItem 
                    key={persona.id} 
                    value={persona.id}
                    sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    {persona.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl 
              fullWidth 
              sx={{ mb: isMobile ? 2 : 2 }}
              size={isMobile ? "medium" : "medium"}
            >
              <InputLabel sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                市场类型
              </InputLabel>
              <Select
                value={createForm.market_type}
                label="市场类型"
                onChange={(e) => setCreateForm(prev => ({ ...prev, market_type: e.target.value as 'love' | 'friendship' }))}
                sx={{ 
                  // borderRadius: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                <MenuItem 
                  value="love"
                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                  恋爱市场
                </MenuItem>
                <MenuItem 
                  value="friendship"
                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                  友谊市场
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="显示名称"
              value={createForm.display_name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, display_name: e.target.value }))}
              sx={{ 
                mb: isMobile ? 2 : 2,
                '& .MuiInputBase-root': {
                  // borderRadius: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                },
                '& .MuiInputLabel-root': {
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              size={isMobile ? "medium" : "medium"}
            />

            <TextField
              fullWidth
              label="显示描述"
              multiline
              rows={isMobile ? 3 : 3}
              value={createForm.display_description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, display_description: e.target.value }))}
              sx={{ 
                mb: isMobile ? 2 : 2,
                '& .MuiInputBase-root': {
                  // borderRadius: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                },
                '& .MuiInputLabel-root': {
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              size={isMobile ? "medium" : "medium"}
            />

            <TextField
              fullWidth
              label="标签 (用逗号分隔)"
              value={createForm.tags?.join(', ') || ''}
              onChange={(e) => setCreateForm(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
              }))}
              helperText="例如: 浪漫, 幽默, 喜欢音乐"
              sx={{ 
                '& .MuiInputBase-root': {
                  // borderRadius: 0,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                },
                '& .MuiInputLabel-root': {
                  fontSize: isMobile ? '0.875rem' : '1rem'
                },
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }
              }}
              size={isMobile ? "medium" : "medium"}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0,
          flexDirection: isMobile ? 'column-reverse' : 'row'
        }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleCreateMarketAgent}
            variant="contained"
            disabled={loading || !createForm.digital_persona_id || !createForm.display_name}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            投放
          </Button>
        </DialogActions>
      </Dialog>

      {/* 对话历史弹窗 */}
      <Dialog
        open={conversationHistoryOpen}
        onClose={() => setConversationHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle sx={{ 
          pb: isMobile ? 1 : 2,
          px: isMobile ? 2 : 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <HistoryIcon sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
            >
              对话历史记录
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: isMobile ? 2 : 3 }}>
          {conversationHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: isMobile ? 6 : 4 }}>
              <HistoryIcon sx={{ 
                fontSize: isMobile ? 60 : 80, 
                color: 'text.secondary', 
                mb: 2 
              }} />
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                color="text.secondary"
                sx={{ 
                  mb: 1,
                  fontSize: isMobile ? '1rem' : '1.25rem'
                }}
              >
                暂无对话记录
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
              >
                触发一些对话后再来查看吧！
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: isMobile ? 1 : 1 }}>
              {conversationHistory.map((conv, index) => (
                <Card 
                  key={conv.id} 
                  sx={{ 
                    mb: isMobile ? 2 : 2, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    // borderRadius: 0
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 2 : 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: isMobile ? 1.5 : 2,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? 1 : 0
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant={isMobile ? "subtitle1" : "h6"} 
                          gutterBottom
                          sx={{ 
                            fontSize: isMobile ? '1rem' : '1.25rem',
                            textAlign: isMobile ? 'center' : 'left'
                          }}
                        >
                          {conv.scenario.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: isMobile ? '0.875rem' : '0.875rem',
                            textAlign: isMobile ? 'center' : 'left',
                            lineHeight: 1.4
                          }}
                        >
                          {conv.scenario.description}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        textAlign: isMobile ? 'center' : 'right',
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        gap: isMobile ? 1 : 0.5
                      }}>
                        <Chip 
                          label={`恋爱 ${conv.love_score_change > 0 ? '+' : ''}${conv.love_score_change.toFixed(1)}`}
                          color={conv.love_score_change >= 0 ? 'success' : 'error'}
                          size="small"
                          sx={{ 
                            mr: isMobile ? 0 : 1, 
                            mb: isMobile ? 0 : 1,
                            // borderRadius: 0,
                            fontSize: isMobile ? '0.7rem' : '0.75rem'
                          }}
                        />
                        <Chip 
                          label={`友谊 ${conv.friendship_score_change > 0 ? '+' : ''}${conv.friendship_score_change.toFixed(1)}`}
                          color={conv.friendship_score_change >= 0 ? 'success' : 'error'}
                          size="small"
                          sx={{ 
                            // borderRadius: 0,
                            fontSize: isMobile ? '0.7rem' : '0.75rem'
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isMobile ? 1.5 : 2, 
                        display: 'block',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        textAlign: isMobile ? 'center' : 'left'
                      }}
                    >
                      {new Date(conv.started_at).toLocaleString()} - {conv.actual_turns} 轮对话
                    </Typography>

                    {/* 对话内容 */}
                    <Box sx={{ 
                      maxHeight: isMobile ? 200 : 300, 
                      overflowY: 'auto', 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      // borderRadius: 0, 
                      p: isMobile ? 1.5 : 2 
                    }}>
                      {conv.messages.map((msg: any, msgIndex: number) => (
                        <Box key={msg.id} sx={{ mb: isMobile ? 1.5 : 2, '&:last-child': { mb: 0 } }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: isMobile ? 0.5 : 1,
                            flexDirection: isMobile ? 'column' : 'row',
                            textAlign: isMobile ? 'center' : 'left'
                          }}>
                            <Avatar sx={{ 
                              width: isMobile ? 28 : 24, 
                              height: isMobile ? 28 : 24, 
                              fontSize: isMobile ? '0.875rem' : '0.75rem', 
                              mr: isMobile ? 0 : 1,
                              mb: isMobile ? 0.5 : 0,
                              // borderRadius: 0
                            }}>
                              {msg.sender_agent_name.charAt(0)}
                            </Avatar>
                            <Typography 
                              variant="subtitle2" 
                              color="primary"
                              sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
                            >
                              {msg.sender_agent_name}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              ml: isMobile ? 0 : 4, 
                              mb: 1,
                              fontSize: isMobile ? '0.875rem' : '0.875rem',
                              lineHeight: 1.4,
                              textAlign: isMobile ? 'center' : 'left'
                            }}
                          >
                            {msg.content}
                          </Typography>
                          {msgIndex < conv.messages.length - 1 && <Divider sx={{ mt: 1 }} />}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          justifyContent: 'center'
        }}>
          <Button 
            onClick={() => setConversationHistoryOpen(false)}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatchMarket; 