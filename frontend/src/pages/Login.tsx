import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Tab,
  Tabs,
  IconButton,
  InputAdornment,
  CircularProgress,
  Container,
  Paper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Login as LoginIcon,
  Psychology
} from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, register, loading } = useAuth();
  
  // 从URL参数中获取默认tab
  const defaultTab = searchParams.get('tab') ? parseInt(searchParams.get('tab')!) : 0;
  const [tabValue, setTabValue] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const from = location.state?.from?.pathname || '/home';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login(loginForm.username, loginForm.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查用户名和密码');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (registerForm.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    try {
      await register(registerForm.username, registerForm.email, registerForm.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请稍后重试');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Psychology color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography component="h1" variant="h4" color="primary">
              SoulLink
            </Typography>
          </Box>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            AI驱动的数字灵魂匹配系统
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab
                icon={<LoginIcon />}
                label="登录"
                id="auth-tab-0"
                aria-controls="auth-tabpanel-0"
              />
              <Tab
                icon={<PersonAdd />}
                label="注册"
                id="auth-tab-1"
                aria-controls="auth-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="用户名或邮箱"
                autoComplete="username"
                autoFocus
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="密码"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading || !loginForm.username || !loginForm.password}
              >
                {loading ? <CircularProgress size={24} /> : '登录'}
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="用户名"
                autoComplete="username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                helperText="用户名将用于登录"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="邮箱"
                type="email"
                autoComplete="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="密码"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                helperText="密码长度至少6位"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="确认密码"
                type={showPassword ? 'text' : 'password'}
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                error={registerForm.confirmPassword !== '' && registerForm.password !== registerForm.confirmPassword}
                helperText={
                  registerForm.confirmPassword !== '' && registerForm.password !== registerForm.confirmPassword
                    ? '两次输入的密码不一致'
                    : ''
                }
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={
                  loading ||
                  !registerForm.username ||
                  !registerForm.email ||
                  !registerForm.password ||
                  !registerForm.confirmPassword ||
                  registerForm.password !== registerForm.confirmPassword
                }
              >
                {loading ? <CircularProgress size={24} /> : '注册'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 