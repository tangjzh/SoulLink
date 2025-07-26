import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  IconButton,
  useTheme,
  useMediaQuery,
  Slide
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  School,
  Close,
  PlayArrow,
  VisibilityOff,
  TipsAndUpdates
} from '@mui/icons-material';
import { useTutorial } from '../contexts/TutorialContext';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TutorialStartDialog: React.FC = () => {
  const { showTutorial, startTutorial, skipTutorial, setNeverShowAgain } = useTutorial();
  const [neverShow, setNeverShow] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleStart = () => {
    if (neverShow) {
      setNeverShowAgain();
    }
    startTutorial();
  };

  const handleSkip = () => {
    if (neverShow) {
      setNeverShowAgain();
    }
    skipTutorial();
  };

  const handleClose = () => {
    skipTutorial();
  };

  return (
    <Dialog
      open={showTutorial}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Transition}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
          mx: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        pr: 6,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TipsAndUpdates color="primary" sx={{ fontSize: '1.5rem' }} />
          <Typography variant="h5" component="div" fontWeight="bold">
            欢迎来到SoulLink！
          </Typography>
        </Box>
        
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary'
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #6366F1 30%, #EC4899 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: 3
            }}
          >
            <School sx={{ fontSize: '3rem', color: 'white' }} />
          </Box>

          <Typography variant="h6" gutterBottom fontWeight="600">
            您想要快速了解SoulLink的功能吗？
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 3, lineHeight: 1.6 }}
          >
            我们为您准备了一个简短的交互式教程，将引导您了解：
          </Typography>

          <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  mr: 2 
                }} 
              />
              <Typography variant="body2">
                如何创建和管理您的数字人格
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  mr: 2 
                }} 
              />
              <Typography variant="body2">
                如何在链接空间中发现有趣的伙伴
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  mr: 2 
                }} 
              />
              <Typography variant="body2">
                如何查看和管理对话历史
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  mr: 2 
                }} 
              />
              <Typography variant="body2">
                平台的各种实用功能
              </Typography>
            </Box>
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            整个教程只需要2-3分钟，您可以随时跳过。
          </Typography>
        </Box>

        <Box sx={{ 
          bgcolor: 'grey.50', 
          borderRadius: 2, 
          p: 2, 
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={neverShow}
                onChange={(e) => setNeverShow(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                以后不再显示此教程
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        gap: 1,
        flexDirection: isMobile ? 'column-reverse' : 'row'
      }}>
        <Button
          onClick={handleSkip}
          variant="outlined"
          startIcon={<VisibilityOff />}
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            py: 1.5,
            fontSize: '0.9rem'
          }}
        >
          跳过教程
        </Button>
        
        <Button
          onClick={handleStart}
          variant="contained"
          startIcon={<PlayArrow />}
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            py: 1.5,
            fontSize: '0.9rem',
            background: 'linear-gradient(45deg, #6366F1 30%, #EC4899 90%)',
          }}
        >
          开始教程
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TutorialStartDialog; 