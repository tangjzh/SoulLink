import React, {useState, useEffect} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Text, Button, Chip, SegmentedButtons, FAB} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {matchAPI, MarketAgent, MatchRelation} from '../services/api';
import {theme} from '../theme/theme';

const MatchMarketScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('market');
  const [marketAgents, setMarketAgents] = useState<MarketAgent[]>([]);
  const [myMatches, setMyMatches] = useState<MatchRelation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'market') {
      loadMarketAgents();
    } else {
      loadMyMatches();
    }
  }, [activeTab]);

  const loadMarketAgents = async () => {
    try {
      setLoading(true);
      const data = await matchAPI.getMarketAgents();
      setMarketAgents(data);
    } catch (error) {
      console.error('加载市场代理失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyMatches = async () => {
    try {
      setLoading(true);
      const data = await matchAPI.getMatchRelations();
      setMyMatches(data);
    } catch (error) {
      console.error('加载匹配关系失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (targetAgentId: string, matchType: string) => {
    try {
      await matchAPI.createMatchRelation(targetAgentId, matchType);
      // 重新加载数据
      if (activeTab === 'matches') {
        loadMyMatches();
      }
    } catch (error) {
      console.error('创建匹配失败:', error);
    }
  };

  const handleTriggerConversation = async (matchId: string) => {
    try {
      await matchAPI.triggerConversation(matchId);
      // 可以显示成功提示
    } catch (error) {
      console.error('触发对话失败:', error);
    }
  };

  const renderMarketAgent = (agent: MarketAgent) => (
    <Card key={agent.id} style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.agentName}>
          {agent.display_name}
        </Text>
        <Text variant="bodyMedium" style={styles.agentDescription}>
          {agent.display_description}
        </Text>
        
        <View style={styles.tagsContainer}>
          {agent.tags?.map((tag, index) => (
            <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
              {tag}
            </Chip>
          ))}
        </View>
        
        <View style={styles.metaInfo}>
          <Chip 
            style={[styles.typeChip, {backgroundColor: agent.market_type === 'love' ? theme.colors.secondary : theme.colors.primary}]}
            textStyle={styles.typeChipText}>
            {agent.market_type === 'love' ? '恋爱' : '友谊'}
          </Chip>
          <Text variant="bodySmall" style={styles.lastInteraction}>
            最后活跃: {new Date(agent.last_interaction).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
      
      <Card.Actions>
        <Button 
          mode="outlined"
          onPress={() => handleCreateMatch(agent.id, 'love')}
          style={styles.actionButton}>
          恋爱匹配
        </Button>
        <Button 
          mode="outlined"
          onPress={() => handleCreateMatch(agent.id, 'friendship')}
          style={styles.actionButton}>
          友谊匹配
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderMatchRelation = (match: MatchRelation) => (
    <Card key={match.id} style={styles.card}>
      <Card.Content>
        <View style={styles.matchHeader}>
          <Text variant="titleMedium">
            {match.target_agent.display_name}
          </Text>
          <Chip 
            style={[styles.typeChip, {backgroundColor: match.match_type === 'love' ? theme.colors.secondary : theme.colors.primary}]}
            textStyle={styles.typeChipText}>
            {match.match_type === 'love' ? '恋爱' : '友谊'}
          </Chip>
        </View>
        
        <Text variant="bodyMedium" style={styles.matchDescription}>
          {match.target_agent.display_description}
        </Text>
        
        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Text variant="bodySmall" style={styles.scoreLabel}>恋爱匹配度</Text>
            <Text variant="titleMedium" style={[styles.scoreValue, {color: theme.colors.secondary}]}>
              {match.love_compatibility_score.toFixed(1)}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text variant="bodySmall" style={styles.scoreLabel}>友谊匹配度</Text>
            <Text variant="titleMedium" style={[styles.scoreValue, {color: theme.colors.primary}]}>
              {match.friendship_compatibility_score.toFixed(1)}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text variant="bodySmall" style={styles.scoreLabel}>互动次数</Text>
            <Text variant="titleMedium" style={styles.scoreValue}>
              {match.total_interactions}
            </Text>
          </View>
        </View>
      </Card.Content>
      
      <Card.Actions>
        <Button 
          mode="contained"
          onPress={() => handleTriggerConversation(match.id)}
          style={styles.actionButton}>
          触发对话
        </Button>
        <Button 
          mode="outlined"
          onPress={() => {/* 查看对话历史 */}}
          style={styles.actionButton}>
          查看对话
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        情感匹配
      </Text>
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          {value: 'market', label: '市场浏览'},
          {value: 'matches', label: '我的匹配'},
        ]}
        style={styles.segmentedButtons}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'market' ? (
          <View>
            <Text variant="bodyLarge" style={styles.sectionDescription}>
              浏览其他用户投放的数字人格，找到心仪的匹配对象
            </Text>
            {marketAgents.map(renderMarketAgent)}
          </View>
        ) : (
          <View>
            <Text variant="bodyLarge" style={styles.sectionDescription}>
              查看你的匹配关系和兼容性评分
            </Text>
            {myMatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge">还没有匹配关系</Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  去市场浏览页面创建你的第一个匹配吧！
                </Text>
              </View>
            ) : (
              myMatches.map(renderMatchRelation)
            )}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="投放人格"
        style={styles.fab}
        onPress={() => {/* 打开创建市场代理对话框 */}}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  sectionDescription: {
    marginBottom: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  agentName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  agentDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: theme.colors.primaryContainer,
    height: 28,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    height: 28,
  },
  typeChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  lastInteraction: {
    color: theme.colors.onSurfaceVariant,
  },
  actionButton: {
    marginRight: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  scoreValue: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptySubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default MatchMarketScreen; 