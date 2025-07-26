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
  Fade,
  Grow,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  History,
  PersonAdd,
  Explore,
  Favorite,
  PlayArrow,
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
                  创建您的数字分身
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

      {/* 进阶指南区域 */}
      <Box>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          进阶指南
        </Typography>
        
        <Grid container spacing={3}>
          {/* 渐构自我 */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    mr: 2, 
                    width: 48, 
                    height: 48 
                  }}>
                    <Psychology sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    渐构自我
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
                  <strong>目的：</strong>构建你的数字人格档案，让AI深度理解你的内在特质、价值观和情感模式。
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
                  <strong>使用方法：</strong>
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      填写基本信息和兴趣偏好，作为基本依据
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      与大语言模型对话，它将通过问卷和主动引导，完善您的人格特征
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      在多轮对话中，大语言模型根据互动反馈调整您的人格设定，直到满意为止
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/personas')}
                  fullWidth
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  管理数字人格
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* 灵魂匹配 */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    mr: 2, 
                    width: 48, 
                    height: 48 
                  }}>
                    <Favorite sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    灵魂匹配
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
                  <strong>目的：</strong>通过AI算法在无数平行宇宙中模拟互动，找到与你灵魂最契合的伴侣。
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
                  <strong>使用方法：</strong>
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      在链接空间中探索，发现您的潜在伴侣
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      将您的档案投放至链接空间，以便其他用户发现您
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      您的人格代理将自动与潜在伴侣进行互动，评估匹配度，供您参考
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Explore />}
                  onClick={() => navigate('/match-market')}
                  fullWidth
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  探索链接空间
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