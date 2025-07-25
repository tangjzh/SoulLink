import React, {useState, useEffect} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Card, Text, Button, FAB} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {personaAPI, DigitalPersona} from '../services/api';
import {theme} from '../theme/theme';

const PersonaListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [personas, setPersonas] = useState<DigitalPersona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const data = await personaAPI.getPersonas();
      setPersonas(data);
    } catch (error) {
      console.error('加载数字人格失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPersona = ({item}: {item: DigitalPersona}) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge">{item.name}</Text>
        <Text variant="bodyMedium" style={styles.description}>
          {item.description || '暂无描述'}
        </Text>
        <Text variant="bodySmall" style={styles.score}>
          个性评分: {item.personality_score}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate('ChatDetail' as never, {personaId: item.id})}>
          开始对话
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        我的数字人格
      </Text>
      
      {personas.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge">还没有创建数字人格</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('PersonaCreate' as never)}
            style={styles.createButton}>
            创建第一个人格
          </Button>
        </View>
      ) : (
        <FlatList
          data={personas}
          renderItem={renderPersona}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('PersonaCreate' as never)}
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
  },
  list: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  description: {
    marginVertical: 8,
    color: theme.colors.onSurfaceVariant,
  },
  score: {
    color: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default PersonaListScreen; 