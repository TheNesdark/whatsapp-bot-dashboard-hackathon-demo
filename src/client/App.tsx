import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import Instances from './pages/Instances';
import Flow from './pages/Flow';
import { Sidebar, AppLayout } from './components/layout';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSettings } from './hooks';

function AppContent() {
  const { isLocked } = useAuth();
  const { settings } = useSettings();
  const siteName = settings?.site_name || 'WA Bot';

  useEffect(() => {
    document.title = siteName;
  }, [siteName]);

  if (isLocked) return <LoginScreen />;

  return (
    <Router>
      <AppLayout sidebar={<Sidebar siteName={siteName} />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/instances" element={<Instances />} />
          <Route path="/flow" element={<Flow />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
