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
  
  // 格式化错误信息的辅助函数
  const formatErrorMessage = (message: string) => {
    // 如果错误信息包含分号，将其分行显示
    if (message.includes(';')) {
      return message.split(';').map(part => part.trim()).join('\n');
    }
    return message;
  };
  
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
      console.error('登录错误详情:', err);
      
      // 更详细的错误处理
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        switch (status) {
          case 400:
            setError('请求参数错误。请检查用户名和密码格式是否正确。');
            break;
          case 401:
            setError('用户名或密码错误。请确认您的登录信息是否正确。');
            break;
          case 403:
            setError('账户已被禁用或权限不足。请联系管理员。');
            break;
          case 404:
            setError('用户不存在。请检查用户名是否正确，或前往注册页面创建账户。');
            break;
          case 422:
            if (detail) {
              // 处理字段验证错误
              if (Array.isArray(detail)) {
                                 const fieldErrors = detail.map((error: any) => {
                   const field = error.loc?.[error.loc.length - 1] || '未知字段';
                   return `• ${field}: ${error.msg}`;
                 }).join('; ');
                 setError(`输入验证失败:\n${fieldErrors}`);
              } else {
                setError(`输入验证失败: ${detail}`);
              }
            } else {
              setError('输入数据格式错误。请检查用户名和密码格式。');
            }
            break;
          case 429:
            setError('登录尝试过于频繁。请稍后再试。');
            break;
          case 500:
            setError('服务器内部错误。请稍后重试或联系技术支持。');
            break;
          case 503:
            setError('服务暂时不可用。请稍后重试。');
            break;
          default:
            setError(detail || `登录失败 (错误码: ${status})。请稍后重试。`);
        }
      } else if (err.request) {
        // 网络错误
        setError('网络连接失败。请检查您的网络连接并重试。');
      } else {
        // 其他错误
        setError(`登录过程中发生错误: ${err.message || '未知错误'}`);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 前端验证
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setError('请输入有效的邮箱地址格式 (例: user@example.com)');
      return;
    }
    
    // 用户名格式验证
    if (registerForm.username.length < 3) {
      setError('用户名长度至少3位');
      return;
    }
    
    // 用户名只能包含字母、数字和下划线
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(registerForm.username)) {
      setError('用户名只能包含字母、数字和下划线');
      return;
    }
    
    // 密码强度检查
    if (registerForm.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    try {
      await register(registerForm.username, registerForm.email, registerForm.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('注册错误详情:', err);
      
      // 更详细的错误处理
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        switch (status) {
          case 400:
            if (detail) {
              if (detail.includes('username') || detail.includes('用户名')) {
                setError('用户名格式不正确或包含非法字符。请使用字母、数字和下划线。');
              } else if (detail.includes('email') || detail.includes('邮箱')) {
                setError('邮箱格式不正确。请输入有效的邮箱地址。');
              } else if (detail.includes('password') || detail.includes('密码')) {
                setError('密码格式不符合要求。密码需要至少6位，建议包含字母和数字。');
              } else {
                setError(`注册信息错误: ${detail}`);
              }
            } else {
              setError('注册信息格式错误。请检查所有字段是否正确填写。');
            }
            break;
          case 409:
            if (detail) {
              if (detail.includes('username') || detail.includes('用户名')) {
                setError('用户名已存在。请选择其他用户名。');
              } else if (detail.includes('email') || detail.includes('邮箱')) {
                setError('邮箱已被注册。请使用其他邮箱或前往登录页面。');
              } else {
                setError(`注册冲突: ${detail}`);
              }
            } else {
              setError('用户名或邮箱已存在。请使用其他信息注册。');
            }
            break;
          case 422:
            if (detail) {
              // 处理字段验证错误
              if (Array.isArray(detail)) {
                                 const fieldErrors = detail.map((error: any) => {
                   const field = error.loc?.[error.loc.length - 1] || '未知字段';
                   const message = error.msg || error.message || '格式错误';
                   return `• ${field}: ${message}`;
                 }).join('; ');
                 setError(`输入验证失败:\n${fieldErrors}`);
              } else {
                setError(`输入验证失败: ${detail}`);
              }
            } else {
              setError('输入数据验证失败。请检查所有字段格式是否正确。');
            }
            break;
          case 429:
            setError('注册请求过于频繁。请稍后再试。');
            break;
          case 500:
            setError('服务器内部错误。请稍后重试或联系技术支持。');
            break;
          case 503:
            setError('注册服务暂时不可用。请稍后重试。');
            break;
          default:
            setError(detail || `注册失败 (错误码: ${status})。请稍后重试。`);
        }
      } else if (err.request) {
        // 网络错误
        setError('网络连接失败。请检查您的网络连接并重试。');
      } else {
        // 其他错误
        setError(`注册过程中发生错误: ${err.message || '未知错误'}`);
      }
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
            {/* <Psychology color="primary" sx={{ fontSize: 40, mr: 2 }} /> */}
            <img src="assets/logo.svg" alt="SoulLink" style={{ width: 40, height: 40, marginRight: 5 }} />
            <Typography component="h1" variant="h4" color="primary">
              SoulLink
            </Typography>
          </Box>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            AI驱动的数字灵魂匹配系统
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                '& .MuiAlert-message': {
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }
              }}
              onClose={() => setError(null)}
            >
              {formatErrorMessage(error)}
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