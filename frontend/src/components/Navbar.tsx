import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Psychology,
  Person,
  Chat as ChatIcon,
  Home as HomeIcon,
  History,
  Favorite,
  AccountCircle,
  Logout,
} from '@mui/icons-material';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/');
  };

  return (
    <AppBar position="static" elevation={0} sx={{ 
      background: 'linear-gradient(45deg, #6366F1 30%, #EC4899 90%)',
      borderRadius: 0
    }}>
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="logo"
          onClick={() => navigate('/home')}
          sx={{ mr: { xs: 1, sm: 2 }, borderRadius: 0 }}
        >
          <Psychology fontSize={isMobile ? "medium" : "large"} />
        </IconButton>
        
        <Typography
          variant={isMobile ? "h6" : "h5"}
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontWeight: 700,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            background: 'linear-gradient(45deg, #FFFFFF 30%, #F8FAFC 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SoulLink
        </Typography>

        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
          {isMobile ? (
            // 移动端显示图标按钮
            <>
              <Tooltip title="首页" slotProps={{ tooltip: { sx: { borderRadius: 0 } } }}>
                <IconButton
                  color="inherit"
                  component={Link}
                  to="/home"
                  sx={{ 
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <HomeIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="数字人格" slotProps={{ tooltip: { sx: { borderRadius: 0 } } }}>
                <IconButton
                  color="inherit"
                  component={Link}
                  to="/personas"
                  sx={{ 
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <Person />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="对话记录" slotProps={{ tooltip: { sx: { borderRadius: 0 } } }}>
                <IconButton
                  color="inherit"
                  component={Link}
                  to="/conversations"
                  sx={{ 
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <History />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="链接时空" slotProps={{ tooltip: { sx: { borderRadius: 0 } } }}>
                <IconButton
                  color="inherit"
                  component={Link}
                  to="/match-market"
                  sx={{ 
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <Favorite />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            // 桌面端显示文字按钮
            <>
              <Button
                color="inherit"
                startIcon={<HomeIcon />}
                component={Link}
                to="/home"
                sx={{ 
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                首页
              </Button>
              
              <Button
                color="inherit"
                startIcon={<Person />}
                component={Link}
                to="/personas"
                sx={{ 
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                数字人格
              </Button>
              
              <Button
                color="inherit"
                startIcon={<History />}
                component={Link}
                to="/conversations"
                sx={{ 
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                对话记录
              </Button>
              
              <Button
                color="inherit"
                startIcon={<Favorite />}
                component={Link}
                to="/match-market"
                sx={{ 
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                链接时空
              </Button>
            </>
          )}
        </Box>

        {/* 用户菜单 */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 1, sm: 2 } }}>
          <IconButton
            size={isMobile ? "medium" : "large"}
            aria-label="用户菜单"
            aria-controls="user-menu"
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
            color="inherit"
            sx={{ borderRadius: 0 }}
          >
            <Avatar sx={{ 
              width: isMobile ? 28 : 32, 
              height: isMobile ? 28 : 32, 
              bgcolor: 'secondary.main',
              fontSize: isMobile ? '0.875rem' : '1rem',
              borderRadius: 0
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{
              '& .MuiPaper-root': {
                minWidth: isMobile ? 200 : 220,
                mt: 1,
                borderRadius: 0,
              }
            }}
          >
            <MenuItem disabled>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant={isMobile ? "body2" : "subtitle2"}>{user?.username}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              <Typography variant={isMobile ? "body2" : "body1"}>退出登录</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 