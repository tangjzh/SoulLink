import React, {useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  IconButton,
  SegmentedButtons,
  Snackbar,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../contexts/AuthContext';
import {theme, appStyles} from '../theme/theme';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const {login, register, loading} = useAuth();
  
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  
  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError('请填写完整的登录信息');
      return;
    }

    try {
      setError(null);
      await login(loginForm.username, loginForm.password);
      navigation.navigate('Main' as never);
    } catch (err: any) {
      setError(err.message || '登录失败');
    }
  };

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.email || !registerForm.password) {
      setError('请填写完整的注册信息');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    try {
      setError(null);
      await register(registerForm.username, registerForm.email, registerForm.password);
      navigation.navigate('Main' as never);
    } catch (err: any) {
      setError(err.message || '注册失败');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          
          {/* Logo和标题 */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>
              SoulLink
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              AI驱动的数字灵魂匹配系统
            </Text>
          </View>

          {/* 登录/注册切换 */}
          <SegmentedButtons
            value={mode}
            onValueChange={setMode}
            buttons={[
              {value: 'login', label: '登录'},
              {value: 'register', label: '注册'},
            ]}
            style={styles.segmentedButtons}
          />

          {/* 表单卡片 */}
          <Card style={styles.card}>
            <Card.Content>
              {mode === 'login' ? (
                <View>
                  <TextInput
                    label="用户名"
                    value={loginForm.username}
                    onChangeText={(text) =>
                      setLoginForm(prev => ({...prev, username: text}))
                    }
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                  />
                  <TextInput
                    label="密码"
                    value={loginForm.password}
                    onChangeText={(text) =>
                      setLoginForm(prev => ({...prev, password: text}))
                    }
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.submitButton}
                    contentStyle={styles.buttonContent}>
                    登录
                  </Button>
                </View>
              ) : (
                <View>
                  <TextInput
                    label="用户名"
                    value={registerForm.username}
                    onChangeText={(text) =>
                      setRegisterForm(prev => ({...prev, username: text}))
                    }
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                  />
                  <TextInput
                    label="邮箱"
                    value={registerForm.email}
                    onChangeText={(text) =>
                      setRegisterForm(prev => ({...prev, email: text}))
                    }
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    label="密码"
                    value={registerForm.password}
                    onChangeText={(text) =>
                      setRegisterForm(prev => ({...prev, password: text}))
                    }
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  <TextInput
                    label="确认密码"
                    value={registerForm.confirmPassword}
                    onChangeText={(text) =>
                      setRegisterForm(prev => ({...prev, confirmPassword: text}))
                    }
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                  />
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.submitButton}
                    contentStyle={styles.buttonContent}>
                    注册
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 错误提示 */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: '关闭',
          onPress: () => setError(null),
        }}>
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default LoginScreen; 