import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PersonaCreate from './pages/PersonaCreate';
import PersonalityAssessment from './pages/PersonalityAssessment';
import Chat from './pages/Chat';
import MarketChat from './pages/MarketChat';
import RealTimeChat from './pages/RealTimeChat';
import PersonaList from './pages/PersonaList';
import ConversationHistory from './pages/ConversationHistory';
import MatchMarket from './pages/MatchMarket';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          
          {/* 受保护的路由 */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                  <Routes>
                  {/* 首页使用全屏布局 */}
                    <Route path="/" element={<Home />} />
                  
                  {/* 其他页面使用Container布局 */}
                  <Route path="/personas" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <PersonaList />
                    </Container>
                  } />
                  <Route path="/personas/create" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <PersonaCreate />
                    </Container>
                  } />
                  <Route path="/personality-assessment/:personaId" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <PersonalityAssessment />
                    </Container>
                  } />
                  <Route path="/chat/:personaId" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <Chat />
                    </Container>
                  } />
                  <Route path="/chat/:conversationId/continue" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <Chat />
                    </Container>
                  } />
                  <Route path="/market-chat/:agentPersonaId" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <MarketChat />
                    </Container>
                  } />
                  <Route path="/realtime-chat/:matchId" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <RealTimeChat />
                    </Container>
                  } />
                  <Route path="/conversations" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <ConversationHistory />
                    </Container>
                  } />
                  <Route path="/match-market" element={
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <MatchMarket />
                    </Container>
                  } />
                  </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 