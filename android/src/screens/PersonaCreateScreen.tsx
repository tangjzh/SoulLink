import React, {useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {TextInput, Button, Text, Snackbar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {personaAPI} from '../services/api';
import {theme} from '../theme/theme';

const PersonaCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    systemPrompt: '',
  });

  const handleCreate = async () => {
    if (!form.name || !form.systemPrompt) {
      setError('请填写名称和系统提示词');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await personaAPI.createPersona({
        name: form.name,
        description: form.description,
        system_prompt: form.systemPrompt,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text variant="headlineMedium" style={styles.title}>
          创建数字人格
        </Text>
        
        <Text variant="bodyLarge" style={styles.description}>
          构建你的AI分身，让它更好地代表真实的你
        </Text>

        <TextInput
          label="人格名称 *"
          value={form.name}
          onChangeText={(text) => setForm(prev => ({...prev, name: text}))}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="人格描述"
          value={form.description}
          onChangeText={(text) => setForm(prev => ({...prev, description: text}))}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
        />

        <TextInput
          label="系统提示词 *"
          value={form.systemPrompt}
          onChangeText={(text) => setForm(prev => ({...prev, systemPrompt: text}))}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={6}
          placeholder="描述这个AI应该如何行为、性格特点、说话风格等..."
        />

        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          style={styles.createButton}
          contentStyle={styles.buttonContent}>
          创建人格
        </Button>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}>
        {error}
      </Snackbar>

      <Snackbar
        visible={success}
        onDismiss={() => setSuccess(false)}
        duration={1500}>
        人格创建成功！
      </Snackbar>
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
    padding: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default PersonaCreateScreen; 