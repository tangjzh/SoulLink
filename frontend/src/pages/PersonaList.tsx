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
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        mb: 4,
        gap: isMobile ? 2 : 0
      }}>
        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          <Typography variant={isMobile ? "h4" : "h3"} component="h1" gutterBottom>
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
          size={isMobile ? "medium" : "large"}
          fullWidth={isMobile}
          sx={{ 
            // borderRadius: 0,
            minWidth: isMobile ? 'auto' : '180px',
            height: isMobile ? '48px' : 'auto'
          }}
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
        <Box sx={{ textAlign: 'center', py: isMobile ? 4 : 8, px: isMobile ? 2 : 0 }}>
          <Psychology sx={{ 
            fontSize: isMobile ? 60 : 80, 
            color: 'text.secondary', 
            mb: 2 
          }} />
          <Typography variant={isMobile ? "h6" : "h5"} gutterBottom color="text.secondary">
            还没有数字人格
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 4,
              fontSize: isMobile ? '0.875rem' : '1rem',
              px: isMobile ? 1 : 0
            }}
          >
            创建你的第一个数字人格，开始探索AI驱动的个性化对话体验
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/personas/create')}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
            sx={{
              // borderRadius: 0,
              maxWidth: isMobile ? '280px' : 'auto',
              height: isMobile ? '48px' : 'auto'
            }}
          >
            立即创建
          </Button>
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 3}>
          {personas.map((persona) => (
            <Grid item xs={12} sm={6} lg={4} key={persona.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  // borderRadius: 0,
                  '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-4px)',
                    boxShadow: isMobile ? 2 : 6,
                  },
                }}
              >
                <CardContent sx={{ 
                  flexGrow: 1,
                  p: isMobile ? 2 : 3,
                  '&:last-child': {
                    pb: isMobile ? 2 : 3
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1.5 : 2 }}>
                    <Psychology sx={{ 
                      color: 'primary.main', 
                      mr: 1,
                      fontSize: isMobile ? '1.25rem' : '1.5rem'
                    }} />
                    <Typography variant={isMobile ? "subtitle1" : "h6"} component="h3">
                      {persona.name}
                    </Typography>
                  </Box>

                  {persona.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isMobile ? 1.5 : 2,
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        lineHeight: 1.4
                      }}
                    >
                      {persona.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        人格匹配度
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        {Math.round(persona.personality_score * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={persona.personality_score * 100}
                      color={getPersonalityScoreColor(persona.personality_score)}
                      sx={{ 
                        height: isMobile ? 4 : 6, 
                        // borderRadius: 0
                      }}
                    />
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: isMobile ? 0.5 : 1, 
                    mb: isMobile ? 1.5 : 2,
                    flexWrap: 'wrap'
                  }}>
                    <Chip
                      label={`优化${persona.optimization_count}次`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<TrendingUp sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }} />}
                      sx={{
                        height: isMobile ? '24px' : '32px',
                        fontSize: isMobile ? '0.7rem' : '0.8125rem',
                        // borderRadius: 0,
                        '& .MuiChip-label': {
                          px: isMobile ? 1 : 1.5
                        }
                      }}
                    />
                    <Chip
                      label={formatDate(persona.created_at)}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: isMobile ? '24px' : '32px',
                        fontSize: isMobile ? '0.7rem' : '0.8125rem',
                        // borderRadius: 0,
                        '& .MuiChip-label': {
                          px: isMobile ? 1 : 1.5
                        }
                      }}
                    />
                  </Box>

                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                  >
                    System Prompt 预览：
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      p: isMobile ? 0.75 : 1,
                      bgcolor: 'grey.50',
                      // borderRadius: 0,
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: isMobile ? 2 : 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {persona.system_prompt}
                  </Typography>
                </CardContent>

                <CardActions sx={{ 
                  p: isMobile ? 1.5 : 2, 
                  pt: 0,
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 1 : 0
                }}>
                  <Button
                    variant="contained"
                    startIcon={<Chat sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                    onClick={() => navigate(`/chat/${persona.id}`)}
                    fullWidth
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      mr: isMobile ? 0 : 1,
                      // borderRadius: 0,
                      height: isMobile ? '40px' : '48px',
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }}
                  >
                    开始对话
                  </Button>
                  
                  <Box sx={{ 
                    display: 'flex',
                    gap: 1,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'center' : 'flex-start'
                  }}>
                    <Tooltip title="查看优化历史">
                      <IconButton
                        onClick={() => handleViewHistory(persona)}
                        size={isMobile ? "medium" : "large"}
                        // sx={{ borderRadius: 0 }}
                      >
                        <History sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="查看详情">
                      <IconButton
                        onClick={() => handleViewDetails(persona)}
                        size={isMobile ? "medium" : "large"}
                        // sx={{ borderRadius: 0 }}
                      >
                        <Visibility sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 统计信息 */}
      {personas.length > 0 && (
        <Box sx={{ 
          mt: isMobile ? 4 : 6, 
          p: isMobile ? 2 : 3, 
          bgcolor: 'grey.50', 
          // borderRadius: 0
        }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom
            sx={{ 
              textAlign: isMobile ? 'center' : 'left',
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          >
            📊 统计概览
          </Typography>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant={isMobile ? "h5" : "h4"} color="primary.main">
                  {personas.length}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  数字人格
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant={isMobile ? "h5" : "h4"} color="secondary.main">
                  {personas.reduce((sum, p) => sum + p.optimization_count, 0)}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  总优化次数
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
                  {Math.round(
                    (personas.reduce((sum, p) => sum + p.personality_score, 0) / personas.length) * 100
                  )}%
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  平均匹配度
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant={isMobile ? "h5" : "h4"} color="warning.main">
                  {personas.filter(p => p.personality_score >= 0.8).length}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
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
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle sx={{ pb: isMobile ? 1 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology 
              color="primary" 
              sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
            />
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              数字人格详情 - {selectedPersona?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: isMobile ? 2 : 3 }}>
          {selectedPersona && (
            <Box sx={{ pt: isMobile ? 0.5 : 1 }}>
              {/* 基本信息 */}
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom
                sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                📋 基本信息
              </Typography>
              <Paper sx={{ 
                p: isMobile ? 1.5 : 2, 
                mb: isMobile ? 2 : 3, 
                bgcolor: 'grey.50',
                // borderRadius: 0
              }}>
                <Grid container spacing={isMobile ? 1.5 : 2}>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      人格名称
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      {selectedPersona.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      创建时间
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      {formatDate(selectedPersona.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      优化次数
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      {selectedPersona.optimization_count} 次
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      人格匹配度
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      {Math.round(selectedPersona.personality_score * 100)}%
                    </Typography>
                  </Grid>
                  {selectedPersona.description && (
                    <Grid item xs={12}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        描述
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                      >
                        {selectedPersona.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* System Prompt */}
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom
                sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                🤖 System Prompt
              </Typography>
              <Paper sx={{ 
                p: isMobile ? 1.5 : 2, 
                bgcolor: 'grey.50',
                // borderRadius: 0
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: isMobile ? 1.4 : 1.6,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                  }}
                >
                  {selectedPersona.system_prompt}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button 
            onClick={handleCloseDialogs}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 2 : 1
            }}
          >
            关闭
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseDialogs();
              if (selectedPersona) {
                navigate(`/chat/${selectedPersona.id}`);
              }
            }}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 1 : 2
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
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle sx={{ pb: isMobile ? 1 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp 
              color="secondary" 
              sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
            />
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              优化历史 - {selectedPersona?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: isMobile ? 2 : 3 }}>
          {historyLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={isMobile ? 40 : 60} />
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 2,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                加载优化历史中...
              </Typography>
            </Box>
          ) : optimizationHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUp sx={{ 
                fontSize: isMobile ? 48 : 64, 
                color: 'text.secondary', 
                mb: 2 
              }} />
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                color="text.secondary"
              >
                暂无优化记录
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
              >
                当用户提供反馈后，系统会自动优化这个数字人格的特征
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: isMobile ? 0.5 : 1 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: isMobile ? 2 : 3,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
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
                        // borderRadius: 0,
                        mb: 1,
                        p: isMobile ? 1.5 : 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          color="primary"
                          sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                        >
                          优化 #{optimizationHistory.length - index}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1,
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-end' : 'center'
                        }}>
                          <Chip
                            label={`提升 ${(record.improvement_score * 100).toFixed(1)}%`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{
                              height: isMobile ? '24px' : '32px',
                              fontSize: isMobile ? '0.7rem' : '0.8125rem',
                              // borderRadius: 0,
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                          >
                            {formatDate(record.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 2,
                          fontSize: isMobile ? '0.875rem' : '1rem'
                        }}
                      >
                        <strong>优化原因：</strong>{record.optimization_reason}
                      </Typography>
                      
                      <Box sx={{ width: '100%' }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                        >
                          🔴 优化前：
                        </Typography>
                        <Paper sx={{ 
                          p: isMobile ? 1.5 : 2, 
                          mb: 2, 
                          bgcolor: 'grey.50', 
                          border: '1px solid', 
                          borderColor: 'grey.200',
                          // borderRadius: 0
                        }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: isMobile ? '0.7rem' : '0.75rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: isMobile ? 80 : 100,
                              overflow: 'auto',
                              color: 'text.primary',
                              lineHeight: 1.3,
                            }}
                          >
                            {record.old_prompt}
                          </Typography>
                        </Paper>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                        >
                          🟢 优化后：
                        </Typography>
                        <Paper sx={{ 
                          p: isMobile ? 1.5 : 2, 
                          bgcolor: 'grey.50', 
                          border: '1px solid', 
                          borderColor: 'grey.200',
                          // borderRadius: 0
                        }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: isMobile ? '0.7rem' : '0.75rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: isMobile ? 80 : 100,
                              overflow: 'auto',
                              color: 'text.primary',
                              lineHeight: 1.3,
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
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button 
            onClick={handleCloseDialogs}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 2 : 1
            }}
          >
            关闭
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseDialogs();
              if (selectedPersona) {
                navigate(`/chat/${selectedPersona.id}`);
              }
            }}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 1 : 2
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