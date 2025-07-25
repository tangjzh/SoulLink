import {MD3LightTheme} from 'react-native-paper';

// 参考frontend的主题设计
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366F1', // 渐变蓝色 - 与frontend保持一致
    primaryContainer: '#818CF8',
    secondary: '#EC4899', // 粉色 - 与frontend保持一致
    secondaryContainer: '#F472B6',
    tertiary: '#4F46E5',
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    background: '#F8FAFC',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1E293B',
    onSurfaceVariant: '#64748B',
    outline: '#E2E8F0',
  },
  roundness: 16, // 与frontend的borderRadius保持一致
};

// 扩展样式
export const appStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: 16,
    margin: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    borderRadius: 12,
  },
  textPrimary: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  textSecondary: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  subheader: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
}; 