import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
  Fade,
  Grow,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  Hub,
  TrendingUp,
  History,
  PersonAdd,
  Chat,
  Explore,
  AutoAwesome,
  Rocket,
  Favorite,
  PlayArrow,
  Assessment,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickActions = [
    {
      icon: <PersonAdd sx={{ fontSize: 32 }} />,
      title: '创建数字人格',
      description: '构建你的专属AI人格档案',
      color: theme.palette.primary.main,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      onClick: () => navigate('/personas/create'),
    },
    {
      icon: <Explore sx={{ fontSize: 32 }} />,
      title: '探索链接空间',
      description: '发现可能的灵魂伴侣',
      color: theme.palette.secondary.main,
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
      onClick: () => navigate('/match-market'),
    },
    {
      icon: <Psychology sx={{ fontSize: 32 }} />,
      title: '管理人格档案',
      description: '查看和编辑已创建的人格',
      color: theme.palette.info.main,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      onClick: () => navigate('/personas'),
    },
    {
      icon: <History sx={{ fontSize: 32 }} />,
      title: '对话历史',
      description: '回顾之前的聊天记录',
      color: theme.palette.warning.main,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      onClick: () => navigate('/conversations'),
    },
  ];

  const systemStats = [
    {
      icon: <AutoAwesome sx={{ fontSize: 40, color: '#8B5CF6' }} />,
      title: 'AI模拟运行',
      status: '活跃',
      progress: 85,
      description: '虚拟约会宇宙正在运行',
      color: 'success.main',
    },
    {
      icon: <Assessment sx={{ fontSize: 40, color: '#EC4899' }} />,
      title: '匹配分析',
      status: '进行中',
      progress: 65,
      description: '正在分析兼容性数据',
      color: 'info.main',
    },
    {
      icon: <Rocket sx={{ fontSize: 40, color: '#F59E0B' }} />,
      title: '系统优化',
      status: '就绪',
      progress: 92,
      description: '准备开始新的模拟',
      color: 'warning.main',
    },
  ];

  return (
    <Box sx={{ py: 2 }}>
      {/* Hero Section */}
      <Fade in={mounted} timeout={1000}>
        <Paper 
          id="tutorial-home-dashboard"
          sx={{ 
            mb: 4,
            p: { xs: 3, md: 4 },
            background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                mr: 3,
              }}
            >
              <Box component="img" src="/assets/logo.svg" alt="SoulLink" sx={{ height: { xs: '3rem', lg: '6rem' } }} />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 700, mb: 1 }}>
                欢迎回到 SoulLink
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ opacity: 0.9 }}>
                你的数字灵魂链接之旅继续前行
              </Typography>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6, mb: 2 }}>
                在这里，AI正在无数个平行时空中为你寻找最完美的匹配。每一次虚拟互动都在让系统更了解你的内心，
                直到找到那个在所有模拟中都与你高度契合的人。
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate('/personas/create')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  开始创建
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* 快速操作区域 */}
      <Box id="tutorial-home-actions" sx={{ mb: 4 }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          快速开始
        </Typography>
        
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Grow in={mounted} timeout={1000 + index * 200}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: action.gradient,
                    }
                  }}
                  onClick={action.onClick}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Avatar
                      sx={{
                        background: action.gradient,
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        boxShadow: `0 8px 24px ${action.color}30`,
                      }}
                    >
                      {action.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, flexGrow: 1 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 系统状态区域 */}
      <Box>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          系统状态
        </Typography>
        
        <Grid container spacing={3}>
          {/* 系统状态卡片 */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  数字宇宙运行状态
                </Typography>
                
                {systemStats.map((stat, index) => (
                  <Box key={index} sx={{ mb: index < systemStats.length - 1 ? 3 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'transparent', mr: 2, width: 40, height: 40 }}>
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {stat.title}
                          </Typography>
                          <Chip 
                            label={stat.status} 
                            size="small" 
                            color={stat.progress > 80 ? 'success' : stat.progress > 60 ? 'warning' : 'info'}
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {stat.description}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={stat.progress}
                          color={stat.progress > 80 ? 'success' : stat.progress > 60 ? 'warning' : 'info'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>
                    {index < systemStats.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* 建议和提示 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  下一步建议
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mr: 2,
                      }}
                    />
                    <Typography variant="body2">
                      完善你的数字人格档案
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        mr: 2,
                      }}
                    />
                    <Typography variant="body2">
                      参与更多虚拟互动
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'info.main',
                        mr: 2,
                      }}
                    />
                    <Typography variant="body2">
                      查看AI分析的匹配建议
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<Hub />}
                  onClick={() => navigate('/match-market')}
                  fullWidth
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  查看匹配进度
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Home; 