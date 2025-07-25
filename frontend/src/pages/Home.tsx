import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  AutoAwesome,
  Timeline,
  Favorite,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <Psychology sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      title: '数字人格构建',
      description: '通过AI技术创建你的专属数字分身，在虚拟环境中展现真实的自我',
      action: '开始创建',
      onClick: () => navigate('/personas/create'),
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 48, color: theme.palette.secondary.main }} />,
      title: '智能对话学习',
      description: '与你的数字人格对话，通过反馈不断优化，让AI更懂你',
      action: '查看人格',
      onClick: () => navigate('/personas'),
    },
    {
      icon: <Timeline sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      title: '个性化优化',
      description: '基于TextGrad技术，系统会根据你的反馈自动优化人格表现',
      action: '了解更多',
      onClick: () => {},
    },
    {
      icon: <Favorite sx={{ fontSize: 48, color: theme.palette.secondary.main }} />,
      title: '情感匹配',
      description: '未来将支持与其他用户的数字人格进行兼容性测试',
      action: '敬请期待',
      onClick: () => {},
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
          color: 'white',
          p: 6,
          mb: 6,
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          🌐 SoulLink
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom sx={{ opacity: 0.9 }}>
          一款由 AI 撮合的数字灵魂匹配系统
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
          让你在虚拟空间中找到真正契合的灵魂。通过先进的AI技术，构建你的数字人格，在各种场景中进行深度互动，不断优化和完善你的虚拟形象。
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/personas/create')}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
            },
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
          }}
        >
          开始你的数字灵魂之旅
        </Button>
      </Paper>

      {/* Features Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" gutterBottom textAlign="center" sx={{ mb: 4 }}>
          核心功能
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    size="medium" 
                    variant="outlined"
                    onClick={feature.onClick}
                    sx={{ borderRadius: 2 }}
                  >
                    {feature.action}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* How it Works */}
      <Paper sx={{ p: 4, mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom textAlign="center">
          工作原理
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Typography variant="h4" color="white" fontWeight="bold">
                  1
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                创建数字人格
              </Typography>
              <Typography variant="body2" color="text.secondary">
                提供基本信息，AI将生成初始的人格系统提示词
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: theme.palette.secondary.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Typography variant="h4" color="white" fontWeight="bold">
                  2
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                场景对话训练
              </Typography>
              <Typography variant="body2" color="text.secondary">
                在各种预设场景中与数字人格对话，观察其表现
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Typography variant="h4" color="white" fontWeight="bold">
                  3
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                反馈优化
              </Typography>
              <Typography variant="body2" color="text.secondary">
                通过点赞/点踩和文字反馈，AI自动优化人格特征
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* CTA Section */}
      <Box textAlign="center" sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          准备好开始了吗？
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          创建你的第一个数字人格，体验AI驱动的个性化对话
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/personas/create')}
          sx={{ px: 4, py: 1.5 }}
        >
          立即开始
        </Button>
      </Box>
    </Container>
  );
};

export default Home; 