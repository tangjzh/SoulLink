import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Text, Button, Avatar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../contexts/AuthContext';
import {theme, appStyles} from '../theme/theme';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user} = useAuth();

  const features = [
    {
      icon: 'psychology',
      title: '数字人格构建',
      description: '通过AI技术创建你的专属数字分身，在虚拟环境中展现真实的自我',
      action: '开始创建',
      onPress: () => navigation.navigate('PersonaCreate' as never),
      color: theme.colors.primary,
    },
    {
      icon: 'auto-awesome',
      title: '智能对话学习',
      description: '与你的数字人格对话，通过反馈不断优化，让AI更懂你',
      action: '查看人格',
      onPress: () => navigation.navigate('Personas' as never),
      color: theme.colors.secondary,
    },
    {
      icon: 'timeline',
      title: '个性化优化',
      description: '基于TextGrad技术，系统会根据你的反馈自动优化人格表现',
      action: '了解更多',
      onPress: () => {},
      color: theme.colors.primary,
    },
    {
      icon: 'favorite',
      title: '情感匹配',
      description: '将你的数字人格投放到市场，与其他用户的AI进行情感匹配',
      action: '开始匹配',
      onPress: () => navigation.navigate('Match' as never),
      color: theme.colors.secondary,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 欢迎区域 */}
        <View style={styles.welcomeSection}>
          <Text variant="headlineMedium" style={styles.welcomeTitle}>
            欢迎回来，{user?.username || '用户'}！
          </Text>
          <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
            开始你的数字灵魂探索之旅
          </Text>
        </View>

        {/* 功能卡片网格 */}
        <View style={styles.featuresContainer}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            核心功能
          </Text>
          
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <Card.Content>
                <View style={styles.featureHeader}>
                  <Avatar.Icon
                    size={48}
                    icon={feature.icon}
                    style={[styles.featureIcon, {backgroundColor: feature.color}]}
                  />
                  <Text variant="titleLarge" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                </View>
                
                <Text variant="bodyMedium" style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </Card.Content>
              
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={feature.onPress}
                  style={[styles.featureButton, {backgroundColor: feature.color}]}>
                  {feature.action}
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>

        {/* 快速统计 */}
        <View style={styles.statsSection}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            我的数据
          </Text>
          
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="displaySmall" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  数字人格
                </Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="displaySmall" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  对话记录
                </Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text variant="displaySmall" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  匹配关系
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    opacity: 0.8,
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  featureCard: {
    marginBottom: 16,
    elevation: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureTitle: {
    flex: 1,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  featureDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 8,
  },
  featureButton: {
    borderRadius: 8,
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default HomeScreen; 