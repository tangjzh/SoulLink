import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress,
  Fade,
  Grow,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  PlayArrow,
  Explore,
  TrendingUp,
  DataUsage,
  Hub,
  Science,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: '数字人格构建',
      description: '通过AI技术创建你的专属数字分身，在虚拟环境中展现真实的自我',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: '开始创建',
      onClick: () => navigate('/personas/create'),
    },
    {
      icon: <Hub sx={{ fontSize: 40 }} />,
      title: '虚拟约会宇宙',
      description: 'AI创建无数种可能的互动场景，在平行时空中探索最适合的匹配',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      action: '探索匹配',
      onClick: () => navigate('/match-market'),
    },
    {
      icon: <Science sx={{ fontSize: 40 }} />,
      title: '智能学习引擎',
      description: '系统不断学习你的偏好、性格、价值观，让每次互动都更精准',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      action: '开始学习',
      onClick: () => navigate('/personas'),
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: '现实延展',
      description: '将虚拟空间中的高匹配度转化为现实世界的真实连接',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      action: '查看进展',
      onClick: () => navigate('/match-market'),
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 增强版动态背景特效 - 移动端优化 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isMobile ? `
          radial-gradient(circle at 30% 70%, rgba(139, 92, 246, 0.25) 0%, transparent 70%),
          radial-gradient(circle at 70% 30%, rgba(236, 72, 153, 0.2) 0%, transparent 70%),
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)
        ` : `
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 60%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 60%),
          radial-gradient(circle at 60% 70%, rgba(168, 85, 247, 0.25) 0%, transparent 50%)
        `,
        animation: isMobile ? 'backgroundPulseMobile 8s ease-in-out infinite alternate' : 'backgroundPulse 6s ease-in-out infinite alternate',
        '@keyframes backgroundPulse': {
          '0%': { 
            opacity: 0.6,
            transform: 'scale(1) rotate(0deg)'
          },
          '50%': {
            opacity: 0.9,
            transform: 'scale(1.05) rotate(1deg)'
          },
          '100%': { 
            opacity: 0.8,
            transform: 'scale(1.02) rotate(-1deg)'
          }
        },
        '@keyframes backgroundPulseMobile': {
          '0%': { 
            opacity: 0.4,
            transform: 'scale(1)'
          },
          '100%': { 
            opacity: 0.6,
            transform: 'scale(1.02)'
          }
        }
      }} />

      {/* 浮动几何图形 - 移动端优化 */}
      {[...Array(isMobile ? 4 : 8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: isMobile ? 40 + i * 8 : 80 + i * 10,
            height: isMobile ? 40 + i * 8 : 80 + i * 10,
            border: `1px solid rgba(139, 92, 246, ${isMobile ? 0.15 : 0.2})`,
            borderRadius: i % 2 === 0 ? '50%' : '20%',
            top: `${15 + (i * 18) % 70}%`,
            left: `${10 + (i * 20) % 80}%`,
            background: i % 3 === 0 
              ? `linear-gradient(45deg, rgba(139, 92, 246, ${isMobile ? 0.08 : 0.1}), rgba(236, 72, 153, ${isMobile ? 0.08 : 0.1}))`
              : `linear-gradient(135deg, rgba(59, 130, 246, ${isMobile ? 0.08 : 0.1}), rgba(168, 85, 247, ${isMobile ? 0.08 : 0.1}))`,
            animation: `float${i} ${isMobile ? 12 + i * 2 : 8 + i * 2}s ease-in-out infinite alternate`,
            [`@keyframes float${i}`]: isMobile ? {
              '0%': { 
                transform: `translateY(0px) rotate(0deg)`,
                opacity: 0.2
              },
              '100%': { 
                transform: `translateY(${-15 + i * 2}px) rotate(${180 + i * 30}deg)`,
                opacity: 0.4
              }
            } : {
              '0%': { 
                transform: `translateY(0px) translateX(0px) rotate(0deg)`,
                opacity: 0.3
              },
              '50%': {
                transform: `translateY(${-30 - i * 5}px) translateX(${20 - i * 3}px) rotate(${180 + i * 45}deg)`,
                opacity: 0.6
              },
              '100%': { 
                transform: `translateY(${-20 + i * 3}px) translateX(${-15 + i * 2}px) rotate(${360 + i * 45}deg)`,
                opacity: 0.4
              }
            }
          }}
        />
      ))}

      {/* 光线扫射效果 - 移动端优化 */}
      {!isMobile && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.1) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 40%, rgba(236, 72, 153, 0.08) 60%, transparent 80%)
          `,
          animation: 'lightSweep 12s linear infinite',
          '@keyframes lightSweep': {
            '0%': { 
              transform: 'translateX(-100%) translateY(-100%) rotate(0deg)',
              opacity: 0
            },
            '10%': {
              opacity: 0.5
            },
            '50%': {
              transform: 'translateX(0%) translateY(0%) rotate(180deg)',
              opacity: 0.8
            },
            '90%': {
              opacity: 0.3
            },
            '100%': { 
              transform: 'translateX(100%) translateY(100%) rotate(360deg)',
              opacity: 0
            }
          }
        }} />
      )}

      {/* 移动端简化光效 */}
      {isMobile && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(90deg, transparent 20%, rgba(139, 92, 246, 0.05) 50%, transparent 80%)
          `,
          animation: 'lightSweepMobile 15s linear infinite',
          '@keyframes lightSweepMobile': {
            '0%': { 
              transform: 'translateX(-100%)',
              opacity: 0
            },
            '20%': {
              opacity: 0.3
            },
            '80%': {
              opacity: 0.3
            },
            '100%': { 
              transform: 'translateX(100%)',
              opacity: 0
            }
          }
        }} />
      )}

      {/* 粒子流效果 - 移动端优化 */}
      {[...Array(isMobile ? 8 : 20)].map((_, i) => (
        <Box
          key={`particle-${i}`}
          sx={{
            position: 'absolute',
            width: isMobile ? 2 + (i % 2) : 3 + (i % 3),
            height: isMobile ? 2 + (i % 2) : 3 + (i % 3),
            background: i % 4 === 0 
              ? 'radial-gradient(circle, #8b5cf6, transparent)'
              : i % 4 === 1
              ? 'radial-gradient(circle, #ec4899, transparent)'
              : i % 4 === 2
              ? 'radial-gradient(circle, #3b82f6, transparent)'
              : 'radial-gradient(circle, #a855f7, transparent)',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `particleFloat${i} ${isMobile ? 20 + i * 2 : 15 + i * 3}s linear infinite`,
            [`@keyframes particleFloat${i}`]: isMobile ? {
              '0%': {
                transform: `translateY(100vh) scale(0)`,
                opacity: 0
              },
              '10%': {
                opacity: 0.6,
                transform: `translateY(90vh) scale(1)`
              },
              '90%': {
                opacity: 0.4,
                transform: `translateY(-10vh) scale(1)`
              },
              '100%': {
                transform: `translateY(-20vh) scale(0)`,
                opacity: 0
              }
            } : {
              '0%': {
                transform: `translateY(100vh) translateX(0px) scale(0)`,
                opacity: 0
              },
              '10%': {
                opacity: 1,
                transform: `translateY(90vh) translateX(${Math.sin(i) * 50}px) scale(1)`
              },
              '90%': {
                opacity: 0.8,
                transform: `translateY(-10vh) translateX(${Math.sin(i * 2) * 100}px) scale(1.2)`
              },
              '100%': {
                transform: `translateY(-20vh) translateX(${Math.sin(i * 3) * 120}px) scale(0)`,
                opacity: 0
              }
            }
          }}
        />
      ))}

      {/* 网格线条效果 - 移动端优化 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(139, 92, 246, ${isMobile ? 0.02 : 0.03}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(139, 92, 246, ${isMobile ? 0.02 : 0.03}) 1px, transparent 1px)
        `,
        backgroundSize: isMobile ? '150px 150px' : '100px 100px',
        animation: isMobile ? 'gridMoveSlow 30s linear infinite' : 'gridMove 20s linear infinite',
        '@keyframes gridMove': {
          '0%': {
            transform: 'translate(0, 0)'
          },
          '100%': {
            transform: 'translate(100px, 100px)'
          }
        },
        '@keyframes gridMoveSlow': {
          '0%': {
            transform: 'translate(0, 0)'
          },
          '100%': {
            transform: 'translate(150px, 150px)'
          }
        }
      }} />

      {/* Hero Section */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: { xs: 2, md: 4 },
        py: 8
      }}>
        <Fade in={mounted} timeout={1000}>
          <Box>
            <Typography 
              variant="h1" 
        sx={{
                fontSize: { xs: '3rem', md: '4rem', lg: '5rem' },
                fontWeight: 900,
                background: 'linear-gradient(45deg, #fff 30%, #8b5cf6 60%, #ec4899 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                textShadow: '0 0 30px rgba(139, 92, 246, 0.5)'
        }}
      >
              SoulLink
        </Typography>
          </Box>
        </Fade>

        <Fade in={mounted} timeout={1500}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 3,
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 300,
              letterSpacing: '0.02em'
            }}
          >
            让AI Agent帮你,
            找到那个TA
        </Typography>
        </Fade>

        <Fade in={mounted} timeout={2000}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
              maxWidth: '800px',
              fontSize: { xs: '1rem', md: '1.25rem' },
              lineHeight: 1.6,
              fontWeight: 300
            }}
          >
            灵感来自《黑镜》"Hang the DJ"——在虚拟约会宇宙中跑了上千次模拟，
            让AI在平行数字世界中为你找到命中注定的那个人
        </Typography>
        </Fade>

        <Grow in={mounted} timeout={2500}>
          <Box sx={{ mb: 6 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/personas/create')}
              startIcon={<PlayArrow />}
          sx={{
                background: 'linear-gradient(45deg, #8b5cf6 30%, #ec4899 90%)',
                px: 4,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
            '&:hover': {
                  background: 'linear-gradient(45deg, #7c3aed 30%, #db2777 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
            },
                transition: 'all 0.3s ease-in-out'
          }}
        >
              启动虚拟约会宇宙
        </Button>
          </Box>
        </Grow>


      </Box>

      {/* 概念解释区域 */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 2,
        py: 12,
        px: { xs: 2, md: 6 },
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
                sx={{
              textAlign: 'center',
              color: 'white',
              mb: 6,
              fontWeight: 300,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            虚拟感情，真实延展
          </Typography>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h5" sx={{ color: '#8b5cf6', mb: 3, fontWeight: 600 }}>
                  AI 创造的无限可能
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, lineHeight: 1.8 }}>
                  就像《Hang the DJ》中的系统一样，我们创建了一个虚拟约会宇宙。
                  AI 会为你生成成千上万种互动场景，模拟你与不同人的长期关系发展。
              </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, lineHeight: 1.8 }}>
                  通过不断学习你的偏好、性格特质和价值观，系统在每一次虚拟互动中都变得更加精准，
                  直到找出那个在所有模拟中都与你高度契合的人。
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
                  最终，让虚拟空间中经过验证的高匹配度，延展到现实世界的真实连接。
              </Typography>
            </Box>
          </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                position: 'relative',
                height: 400,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                borderRadius: 3,
                border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <DataUsage sx={{ fontSize: 80, color: '#8b5cf6', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    模拟进行中...
                  </Typography>
                  <LinearProgress 
                    variant="indeterminate" 
                    sx={{ 
                      width: 200,
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(45deg, #8b5cf6, #ec4899)'
                      }
                    }} 
                  />
                </Box>
                
                {/* 浮动的连接线效果 */}
                {[...Array(5)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      width: 2,
                      height: 60,
                      background: 'linear-gradient(to bottom, transparent, #8b5cf6, transparent)',
                      top: `${20 + i * 15}%`,
                      left: `${10 + i * 20}%`,
                      animation: `float${i} 3s ease-in-out infinite`,
                      [`@keyframes float${i}`]: {
                        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: 0.3 },
                        '50%': { transform: 'translateY(-20px) rotate(5deg)', opacity: 1 }
                      }
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 核心功能展示 */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 2,
        py: 12,
        px: { xs: 2, md: 6 }
      }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
                sx={{
              textAlign: 'center',
              color: 'white',
              mb: 8,
              fontWeight: 300,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            核心功能体验
                </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Grow in={mounted} timeout={1000 + index * 200}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      background: feature.color,
                      color: 'white',
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255,255,255,0.1)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out',
                      },
                      '&:hover::before': {
                        opacity: 1,
                      }
                    }}
                    onClick={feature.onClick}
                  >
                    <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          background: 'rgba(255,255,255,0.2)',
                          mr: 2,
                          backdropFilter: 'blur(10px)'
                        }}>
                          {feature.icon}
              </Box>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {feature.title}
              </Typography>
            </Box>
                      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, opacity: 0.9 }}>
                        {feature.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          feature.onClick();
                        }}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.5)',
                          '&:hover': {
                            borderColor: 'white',
                            background: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        {feature.action}
                      </Button>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* CTA Section */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 2,
        py: 12,
        px: { xs: 2, md: 6 },
        background: 'rgba(139, 92, 246, 0.1)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <Box sx={{ maxWidth: '800px', mx: 'auto', textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'white',
              mb: 3,
              fontWeight: 300,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            开始你的数字灵魂之旅
        </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              mb: 6,
              lineHeight: 1.6,
              fontWeight: 300
            }}
          >
            让AI在无数次模拟中为你找到那个命中注定的人，
            将虚拟世界的完美匹配带入现实生活。
        </Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/personas/create')}
              startIcon={<Psychology />}
              sx={{
                background: 'linear-gradient(45deg, #8b5cf6 30%, #ec4899 90%)',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7c3aed 30%, #db2777 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              创建数字人格
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/match-market')}
              startIcon={<Explore />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease-in-out'
              }}
        >
              探索平行时空
        </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home; 