import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PersonaCreate from './pages/PersonaCreate';
import PersonalityAssessment from './pages/PersonalityAssessment';
import Chat from './pages/Chat';
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
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/personas" element={<PersonaList />} />
                    <Route path="/personas/create" element={<PersonaCreate />} />
                    <Route path="/personality-assessment/:personaId" element={<PersonalityAssessment />} />
                    <Route path="/chat/:personaId" element={<Chat />} />
                    <Route path="/chat/:conversationId/continue" element={<Chat />} />
                    <Route path="/conversations" element={<ConversationHistory />} />
                    <Route path="/match-market" element={<MatchMarket />} />
                  </Routes>
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