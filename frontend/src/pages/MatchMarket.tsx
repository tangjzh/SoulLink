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
  FormControlLabel
} from '@mui/material';
import {
  Favorite,
  People,
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
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`match-tabpanel-${index}`}
      aria-labelledby={`match-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MatchMarket: React.FC = () => {
  const navigate = useNavigate();
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
  const [sortBy, setSortBy] = useState<'recent' | 'score'>('recent');
  const [conversationHistoryOpen, setConversationHistoryOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [runningTasks, setRunningTasks] = useState<string[]>([]);
  
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
        // 投放管理
        promises.push(getMyMarketAgents());
        promises.push(getDigitalPersonas());
      }
      
      const results = await Promise.all(promises);
      
      if (tabValue === 0) {
        setMarketAgents(results[0] as MarketAgent[]);
        setMatchRelations(results[1] as MatchRelation[]);
      } else if (tabValue === 1) {
        setMatchRelations(results[0] as MatchRelation[]);
      } else if (tabValue === 2) {
        setMyMarketAgents(results[0] as MarketAgent[]);
        setDigitalPersonas(results[1] as DigitalPersona[]);
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

  const sortedMarketAgents = [...marketAgents].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime();
    }
    return 0; // 其他排序逻辑可以后续添加
  });

  const sortedMatchRelations = [...matchRelations].sort((a, b) => {
    return getCompatibilityScore(b) - getCompatibilityScore(a);
  });

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        💕 情感匹配市场
      </Typography>
      
      <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        让你的数字人格寻找心灵伙伴
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 市场类型切换 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={marketType === 'love'}
                onChange={(e) => setMarketType(e.target.checked ? 'love' : 'friendship')}
                color="error"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {marketType === 'love' ? <Favorite color="error" /> : <People color="primary" />}
                {marketType === 'love' ? '恋爱匹配' : '友谊匹配'}
              </Box>
            }
          />
        </FormControl>
      </Box>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          centered
        >
          <Tab
            icon={<Psychology />}
            label="市场探索"
            id="match-tab-0"
            aria-controls="match-tabpanel-0"
          />
          <Tab
            icon={<TrendingUp />}
            label="我的匹配"
            id="match-tab-1"
            aria-controls="match-tabpanel-1"
          />
          <Tab
            icon={<Rocket />}
            label="投放管理"
            id="match-tab-2"
            aria-controls="match-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* 市场探索 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            发现{marketType === 'love' ? '恋爱' : '友谊'}伙伴
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>排序方式</InputLabel>
              <Select
                value={sortBy}
                label="排序方式"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="recent">最近活跃</MenuItem>
                <MenuItem value="score">匹配度</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={loadData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {sortedMarketAgents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} key={agent.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: marketType === 'love' ? 'error.main' : 'primary.main', mr: 2 }}>
                      {agent.display_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {agent.display_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(agent.last_interaction).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {agent.display_description}
                  </Typography>
                  
                  {agent.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {agent.tags.slice(0, 3).map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                      {agent.tags.length > 3 && (
                        <Chip label={`+${agent.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  )}
                </CardContent>
                
                <CardActions>
                  {isAgentAlreadyMatched(agent.id) ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled
                      startIcon={<PersonAdd />}
                      color="inherit"
                    >
                      已添加到匹配
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={() => handleAddToMatches(agent.id)}
                      disabled={loading}
                      color={marketType === 'love' ? 'error' : 'primary'}
                    >
                      添加到匹配
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {sortedMarketAgents.length === 0 && !loading && (
          <Box textAlign="center" sx={{ py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              暂无{marketType === 'love' ? '恋爱' : '友谊'}伙伴
            </Typography>
            <Typography variant="body2" color="text.secondary">
              快去投放你的数字人格吧！
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* 我的匹配 */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" gutterBottom>
          我的{marketType === 'love' ? '恋爱' : '友谊'}匹配
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {sortedMatchRelations.map((relation) => {
            const score = getCompatibilityScore(relation);
            const color = getCompatibilityColor(score);
            
            return (
              <Grid item xs={12} sm={6} key={relation.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {relation.target_agent.display_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {relation.target_agent.display_description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${score.toFixed(1)}%`}
                        color={color}
                        variant="filled"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        匹配度进度
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.max(score + 50, 0), 100)}
                        color={color}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        互动次数: {relation.total_interactions}
                      </Typography>
                      {relation.last_conversation_at && (
                        <Typography variant="body2" color="text.secondary">
                          最后对话: {new Date(relation.last_conversation_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                    
                    {relation.target_agent.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {relation.target_agent.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ display: 'flex', gap: 1 }}>
                    {runningTasks.includes(relation.id) ? (
                      <Button
                        variant="outlined"
                        startIcon={<CircularProgress size={16} />}
                        disabled
                        size="small"
                        color="info"
                      >
                        对话生成中...
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<Chat />}
                        onClick={() => handleTriggerConversation(relation.id)}
                        disabled={loading}
                        size="small"
                      >
                        触发对话
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleViewConversationHistory(relation.id)}
                      disabled={loading}
                      size="small"
                    >
                      查看对话
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {sortedMatchRelations.length === 0 && !loading && (
          <Box textAlign="center" sx={{ py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              暂无匹配关系
            </Typography>
            <Typography variant="body2" color="text.secondary">
              去市场探索页面添加一些伙伴吧！
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* 投放管理 */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            我的市场投放
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
          >
            投放数字人格
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {myMarketAgents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} key={agent.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: agent.market_type === 'love' ? 'error.main' : 'primary.main', mr: 2 }}>
                      {agent.display_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {agent.display_name}
                      </Typography>
                      <Chip
                        label={agent.market_type === 'love' ? '恋爱市场' : '友谊市场'}
                        size="small"
                        color={agent.market_type === 'love' ? 'error' : 'primary'}
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {agent.display_description}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    投放时间: {new Date(agent.created_at).toLocaleDateString()}
                  </Typography>
                  
                  {agent.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {agent.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {myMarketAgents.length === 0 && !loading && (
          <Box textAlign="center" sx={{ py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              暂未投放数字人格
            </Typography>
            <Typography variant="body2" color="text.secondary">
              点击"投放数字人格"按钮开始你的匹配之旅！
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* 创建市场Agent对话框 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>投放数字人格到市场</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>选择数字人格</InputLabel>
              <Select
                value={createForm.digital_persona_id}
                label="选择数字人格"
                onChange={(e) => setCreateForm(prev => ({ ...prev, digital_persona_id: e.target.value }))}
              >
                {digitalPersonas.map((persona) => (
                  <MenuItem key={persona.id} value={persona.id}>
                    {persona.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>市场类型</InputLabel>
              <Select
                value={createForm.market_type}
                label="市场类型"
                onChange={(e) => setCreateForm(prev => ({ ...prev, market_type: e.target.value as 'love' | 'friendship' }))}
              >
                <MenuItem value="love">恋爱市场</MenuItem>
                <MenuItem value="friendship">友谊市场</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="显示名称"
              value={createForm.display_name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, display_name: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="显示描述"
              multiline
              rows={3}
              value={createForm.display_description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, display_description: e.target.value }))}
              sx={{ mb: 2 }}
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleCreateMarketAgent}
            variant="contained"
            disabled={loading || !createForm.digital_persona_id || !createForm.display_name}
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
        scroll="paper"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            对话历史记录
          </Box>
        </DialogTitle>
        <DialogContent>
          {conversationHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                暂无对话记录
              </Typography>
              <Typography variant="body2" color="text.secondary">
                触发一些对话后再来查看吧！
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              {conversationHistory.map((conv, index) => (
                <Card key={conv.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {conv.scenario.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {conv.scenario.description}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={`恋爱 ${conv.love_score_change > 0 ? '+' : ''}${conv.love_score_change.toFixed(1)}`}
                          color={conv.love_score_change >= 0 ? 'success' : 'error'}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip 
                          label={`友谊 ${conv.friendship_score_change > 0 ? '+' : ''}${conv.friendship_score_change.toFixed(1)}`}
                          color={conv.friendship_score_change >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      {new Date(conv.started_at).toLocaleString()} - {conv.actual_turns} 轮对话
                    </Typography>

                    {/* 对话内容 */}
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                      {conv.messages.map((msg: any, msgIndex: number) => (
                        <Box key={msg.id} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', mr: 1 }}>
                              {msg.sender_agent_name.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2" color="primary">
                              {msg.sender_agent_name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ ml: 4, mb: 1 }}>
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
        <DialogActions>
          <Button onClick={() => setConversationHistoryOpen(false)}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatchMarket; 