import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Add,
  Chat,
  Psychology,
  TrendingUp,
  History,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getDigitalPersonas, getOptimizationHistory, DigitalPersona } from '../services/api';

const PersonaList: React.FC = () => {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<DigitalPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 详情弹窗状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<DigitalPersona | null>(null);
  
  // 优化历史弹窗状态
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const loadPersonas = async () => {
      try {
        const personasData = await getDigitalPersonas();
        setPersonas(personasData);
      } catch (err: any) {
        setError('加载数字人格列表失败：' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPersonas();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPersonalityScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  // 查看详情
  const handleViewDetails = (persona: DigitalPersona) => {
    setSelectedPersona(persona);
    setDetailDialogOpen(true);
  };

  // 查看优化历史
  const handleViewHistory = async (persona: DigitalPersona) => {
    setSelectedPersona(persona);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    
    try {
      const history = await getOptimizationHistory(persona.id);
      setOptimizationHistory(history);
    } catch (err: any) {
      setError('加载优化历史失败：' + err.message);
      setOptimizationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 关闭弹窗
  const handleCloseDialogs = () => {
    setDetailDialogOpen(false);
    setHistoryDialogOpen(false);
    setSelectedPersona(null);
    setOptimizationHistory([]);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          加载中...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            我的数字人格
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理你的数字分身，查看优化进度
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/personas/create')}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          创建新人格
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {personas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Psychology sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            还没有数字人格
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            创建你的第一个数字人格，开始探索AI驱动的个性化对话体验
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/personas/create')}
            size="large"
          >
            立即创建
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {personas.map((persona) => (
            <Grid item xs={12} md={6} lg={4} key={persona.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Psychology sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" component="h3">
                      {persona.name}
                    </Typography>
                  </Box>

                  {persona.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {persona.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        人格匹配度
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(persona.personality_score * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={persona.personality_score * 100}
                      color={getPersonalityScoreColor(persona.personality_score)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`优化${persona.optimization_count}次`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<TrendingUp />}
                    />
                    <Chip
                      label={formatDate(persona.created_at)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    System Prompt 预览：
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      p: 1,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {persona.system_prompt}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    startIcon={<Chat />}
                    onClick={() => navigate(`/chat/${persona.id}`)}
                    fullWidth
                    sx={{ mr: 1 }}
                  >
                    开始对话
                  </Button>
                  
                  <Tooltip title="查看优化历史">
                    <IconButton
                      onClick={() => handleViewHistory(persona)}
                    >
                      <History />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="查看详情">
                    <IconButton
                      onClick={() => handleViewDetails(persona)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 统计信息 */}
      {personas.length > 0 && (
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            📊 统计概览
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main">
                  {personas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  数字人格
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary.main">
                  {personas.reduce((sum, p) => sum + p.optimization_count, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总优化次数
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {Math.round(
                    (personas.reduce((sum, p) => sum + p.personality_score, 0) / personas.length) * 100
                  )}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均匹配度
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {personas.filter(p => p.personality_score >= 0.8).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  高匹配度人格
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 详情弹窗 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialogs}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            <Typography variant="h6">
              数字人格详情 - {selectedPersona?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPersona && (
            <Box sx={{ pt: 1 }}>
              {/* 基本信息 */}
              <Typography variant="h6" gutterBottom>
                📋 基本信息
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      人格名称
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPersona.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      创建时间
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedPersona.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      优化次数
                    </Typography>
                    <Typography variant="body1">
                      {selectedPersona.optimization_count} 次
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      人格匹配度
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {Math.round(selectedPersona.personality_score * 100)}%
                    </Typography>
                  </Grid>
                  {selectedPersona.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        描述
                      </Typography>
                      <Typography variant="body1">
                        {selectedPersona.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* System Prompt */}
              <Typography variant="h6" gutterBottom>
                🤖 System Prompt
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}
                >
                  {selectedPersona.system_prompt}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>关闭</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseDialogs();
              if (selectedPersona) {
                navigate(`/chat/${selectedPersona.id}`);
              }
            }}
          >
            开始对话
          </Button>
        </DialogActions>
      </Dialog>

      {/* 优化历史弹窗 */}
      <Dialog
        open={historyDialogOpen}
        onClose={handleCloseDialogs}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="secondary" />
            <Typography variant="h6">
              优化历史 - {selectedPersona?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                加载优化历史中...
              </Typography>
            </Box>
          ) : optimizationHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUp sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                暂无优化记录
              </Typography>
              <Typography variant="body2" color="text.secondary">
                当用户提供反馈后，系统会自动优化这个数字人格的特征
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                共进行了 {optimizationHistory.length} 次优化，显示最近的记录：
              </Typography>
              
              <List>
                {optimizationHistory.map((record, index) => (
                  <React.Fragment key={record.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                          优化 #{optimizationHistory.length - index}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`提升 ${(record.improvement_score * 100).toFixed(1)}%`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(record.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>优化原因：</strong>{record.optimization_reason}
                      </Typography>
                      
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          🔴 优化前：
                        </Typography>
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: 100,
                              overflow: 'auto',
                              color: 'text.primary',
                            }}
                          >
                            {record.old_prompt}
                          </Typography>
                        </Paper>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          🟢 优化后：
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: 100,
                              overflow: 'auto',
                              color: 'text.primary',
                            }}
                          >
                            {record.new_prompt}
                          </Typography>
                        </Paper>
                      </Box>
                    </ListItem>
                    {index < optimizationHistory.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>关闭</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseDialogs();
              if (selectedPersona) {
                navigate(`/chat/${selectedPersona.id}`);
              }
            }}
          >
            开始对话
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonaList; 