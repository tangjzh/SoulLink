import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Fade,
  Popper,
  ClickAwayListener,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  ArrowForward,
  ArrowBack,
  School,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import { useTutorial } from '../contexts/TutorialContext';

interface TutorialCardProps {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  isFirst: boolean;
  isLast: boolean;
  stepNumber: number;
  totalSteps: number;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  target,
  title,
  content,
  position,
  isFirst,
  isLast,
  stepNumber,
  totalSteps
}) => {
  const { nextStep, prevStep, skipTutorial } = useTutorial();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // 最多重试20次（2秒）
    let currentTargetElement: HTMLElement | null = null;

    const findAndSetupElement = () => {
      const targetElement = document.querySelector(target) as HTMLElement;
      
      if (targetElement) {
        currentTargetElement = targetElement;
        setAnchorEl(targetElement);
        setOpen(true);
        
        // 滚动到目标元素
        setTimeout(() => {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }, 100);
        
        // 高亮目标元素
        targetElement.style.position = 'relative';
        targetElement.style.zIndex = '1001';
        targetElement.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.3)';
        targetElement.style.borderRadius = '8px';
        targetElement.style.transition = 'all 0.3s ease';
        
        console.log('Tutorial: Target element found and highlighted:', target);
      } else {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Tutorial: Target element not found, retrying (${retryCount}/${maxRetries}):`, target);
          setTimeout(findAndSetupElement, 100);
        } else {
          console.warn('Tutorial: Target element not found after retries:', target);
        }
      }
    };

    // 开始查找元素
    findAndSetupElement();

    return () => {
      if (currentTargetElement) {
        currentTargetElement.style.position = '';
        currentTargetElement.style.zIndex = '';
        currentTargetElement.style.boxShadow = '';
        currentTargetElement.style.borderRadius = '';
        currentTargetElement.style.transition = '';
      }
    };
  }, [target]);

  const handleNext = () => {
    setOpen(false);
    setTimeout(() => {
      nextStep();
    }, 200);
  };

  const handlePrev = () => {
    setOpen(false);
    setTimeout(() => {
      prevStep();
    }, 200);
  };

  const handleSkip = () => {
    setOpen(false);
    setTimeout(() => {
      skipTutorial();
    }, 200);
  };

  const getPlacement = () => {
    switch (position) {
      case 'top': return 'top';
      case 'bottom': return 'bottom';
      case 'left': return 'left';
      case 'right': return 'right';
      default: return 'bottom';
    }
  };

  if (!anchorEl) return null;

  return (
    <>
      {/* 遮罩层 */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      />
      
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={getPlacement()}
        transition
        sx={{ zIndex: 1002 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 12],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 16,
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Card
              ref={cardRef}
              sx={{
                maxWidth: isMobile ? 280 : 350,
                minWidth: isMobile ? 250 : 320,
                boxShadow: 3,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                overflow: 'visible',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  backgroundColor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: '2px',
                  transform: 'rotate(45deg)',
                  ...(position === 'top' && {
                    bottom: -8,
                    left: '50%',
                    marginLeft: -6,
                    borderTop: 'none',
                    borderLeft: 'none',
                  }),
                  ...(position === 'bottom' && {
                    top: -8,
                    left: '50%',
                    marginLeft: -6,
                    borderBottom: 'none',
                    borderRight: 'none',
                  }),
                  ...(position === 'left' && {
                    right: -8,
                    top: '50%',
                    marginTop: -6,
                    borderTop: 'none',
                    borderRight: 'none',
                  }),
                  ...(position === 'right' && {
                    left: -8,
                    top: '50%',
                    marginTop: -6,
                    borderBottom: 'none',
                    borderLeft: 'none',
                  }),
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* 头部 */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School color="primary" sx={{ fontSize: '1.25rem' }} />
                    <Typography variant="caption" color="primary" fontWeight="bold">
                      教程 {stepNumber}/{totalSteps}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={handleSkip}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>

                {/* 标题和内容 */}
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    lineHeight: 1.3
                  }}
                >
                  {title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 3,
                    lineHeight: 1.5,
                    fontSize: isMobile ? '0.875rem' : '0.875rem'
                  }}
                >
                  {content}
                </Typography>

                {/* 按钮区域 */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isFirst && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<NavigateBefore />}
                        onClick={handlePrev}
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        上一步
                      </Button>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleSkip}
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
                    >
                      跳过教程
                    </Button>
                    
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={isLast ? <School /> : <NavigateNext />}
                      onClick={handleNext}
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      {isLast ? '完成' : '下一步'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default TutorialCard; 