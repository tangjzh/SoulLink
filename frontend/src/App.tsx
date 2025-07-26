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

function App() {
  return (
    <AuthProvider>
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
              </ProtectedRoute>
            }
          />
          <Route
            path="/realtime-chat/:matchId"
            element={
              <ProtectedRoute>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <RealTimeChat />
                </Container>
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
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 