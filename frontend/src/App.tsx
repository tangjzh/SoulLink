import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
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
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialManager from './components/TutorialManager';

function App() {
  return (
    <AuthProvider>
      <TutorialProvider>
        <div className="App">
          <Routes>
            {/* 根路径：始终显示Landing页面 */}
            <Route path="/" element={<Landing />} />
            
            {/* 登录页面 */}
            <Route path="/login" element={<Login />} />
            
            {/* 用户主页 */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Home />
                  </Container>
                  <TutorialManager />
                </ProtectedRoute>
              }
            />
          
          {/* 受保护的功能页面 */}
          <Route
            path="/personas"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <PersonaList />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personas/create"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <PersonaCreate />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personality-assessment/:personaId"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <PersonalityAssessment />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:personaId"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <Chat />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId/continue"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <Chat />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market-chat/:agentPersonaId"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <MarketChat />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
                          path="/realtime-chat/:otherUserId"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <RealTimeChat />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conversations"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <ConversationHistory />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match-market"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <MatchMarket />
                </Container>
                <TutorialManager />
              </ProtectedRoute>
            }
          />
        </Routes>
        </div>
      </TutorialProvider>
    </AuthProvider>
  );
}

export default App; 