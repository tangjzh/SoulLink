import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {AuthProvider} from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PersonaListScreen from './screens/PersonaListScreen';
import PersonaCreateScreen from './screens/PersonaCreateScreen';
import ChatScreen from './screens/ChatScreen';
import ConversationHistoryScreen from './screens/ConversationHistoryScreen';
import MatchMarketScreen from './screens/MatchMarketScreen';
import {theme} from './theme/theme';
import ProtectedRoute from './components/ProtectedRoute';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 主要的Tab导航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Personas') {
            iconName = 'psychology';
          } else if (route.name === 'Chat') {
            iconName = 'chat';
          } else if (route.name === 'Match') {
            iconName = 'favorite';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{tabBarLabel: '首页'}}
      />
      <Tab.Screen 
        name="Personas" 
        component={PersonaListScreen}
        options={{tabBarLabel: '人格'}}
      />
      <Tab.Screen 
        name="Chat" 
        component={ConversationHistoryScreen}
        options={{tabBarLabel: '对话'}}
      />
      <Tab.Screen 
        name="Match" 
        component={MatchMarketScreen}
        options={{tabBarLabel: '匹配'}}
      />
    </Tab.Navigator>
  );
}

function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main">
                  {(props) => (
                    <ProtectedRoute>
                      <MainTabs />
                    </ProtectedRoute>
                  )}
                </Stack.Screen>
                <Stack.Screen 
                  name="PersonaCreate" 
                  component={PersonaCreateScreen}
                  options={{
                    headerShown: true,
                    title: '创建数字人格',
                    headerStyle: {backgroundColor: theme.colors.primary},
                    headerTintColor: '#fff',
                  }}
                />
                <Stack.Screen 
                  name="ChatDetail" 
                  component={ChatScreen}
                  options={{
                    headerShown: true,
                    title: '对话',
                    headerStyle: {backgroundColor: theme.colors.primary},
                    headerTintColor: '#fff',
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App; 