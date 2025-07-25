import React, {useState, useEffect} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Card, Text, Chip, Button} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {chatAPI, Conversation} from '../services/api';
import {theme} from '../theme/theme';

const ConversationHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('加载对话历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({item}: {item: Conversation}) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={styles.title}>
            {item.title || '未命名对话'}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.scenarioInfo}>
          <Text variant="bodyMedium" style={styles.scenarioName}>
            场景: {item.scenario.name}
          </Text>
          <View style={styles.chips}>
            <Chip style={styles.chip} textStyle={styles.chipText}>
              {item.scenario.category}
            </Chip>
            <Chip style={styles.chip} textStyle={styles.chipText}>
              {item.scenario.difficulty_level}
            </Chip>
          </View>
        </View>
        
        <Text variant="bodySmall" style={styles.description}>
          {item.scenario.description}
        </Text>
      </Card.Content>
      
      <Card.Actions>
        <Button 
          onPress={() => navigation.navigate('ChatDetail' as never, {conversationId: item.id})}
          mode="outlined">
          继续对话
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.screenTitle}>
        对话历史
      </Text>
      
      {conversations.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            还没有对话记录
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            去创建一个数字人格，开始你的第一次对话吧！
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Personas' as never)}
            style={styles.createButton}>
            查看我的人格
          </Button>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  screenTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  list: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  date: {
    color: theme.colors.onSurfaceVariant,
    marginLeft: 8,
  },
  scenarioInfo: {
    marginBottom: 8,
  },
  scenarioName: {
    color: theme.colors.primary,
    marginBottom: 4,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.primaryContainer,
    height: 28,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
  },
  createButton: {
    paddingHorizontal: 24,
  },
});

export default ConversationHistoryScreen; 