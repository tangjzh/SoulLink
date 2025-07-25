import React, {useState, useEffect} from 'react';
import {View, FlatList, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {TextInput, Button, Text, Card, IconButton} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import {chatAPI, Message} from '../services/api';
import {theme} from '../theme/theme';

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // 这里应该根据路由参数初始化对话
    // const { personaId, conversationId } = route.params || {};
    // 暂时使用占位数据
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      // 如果有conversationId，加载历史消息
      if (conversationId) {
        const data = await chatAPI.getMessages(conversationId);
        setMessages(data);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender_type: 'user',
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      if (conversationId) {
        const response = await chatAPI.sendMessage(conversationId, currentInput);
        setMessages(prev => [...prev, response]);
      } else {
        // 模拟AI回复
        setTimeout(() => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender_type: 'agent',
            content: '这是AI的回复消息。目前是演示模式。',
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMessage]);
          setLoading(false);
        }, 1000);
        return;
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({item}: {item: Message}) => (
    <View style={[
      styles.messageContainer,
      item.sender_type === 'user' ? styles.userMessage : styles.agentMessage
    ]}>
      <Card style={[
        styles.messageCard,
        item.sender_type === 'user' ? styles.userCard : styles.agentCard
      ]}>
        <Card.Content style={styles.messageContent}>
          <Text style={[
            styles.messageText,
            item.sender_type === 'user' ? styles.userText : styles.agentText
          ]}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="输入消息..."
            style={styles.textInput}
            mode="outlined"
            multiline
            maxLength={500}
            disabled={loading}
          />
          <IconButton
            icon="send"
            size={24}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
            style={styles.sendButton}
            iconColor={theme.colors.primary}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  agentMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
    elevation: 2,
  },
  userCard: {
    backgroundColor: theme.colors.primary,
  },
  agentCard: {
    backgroundColor: theme.colors.surface,
  },
  messageContent: {
    paddingVertical: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: theme.colors.onPrimary,
  },
  agentText: {
    color: theme.colors.onSurface,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 120,
  },
  sendButton: {
    margin: 0,
  },
});

export default ChatScreen; 