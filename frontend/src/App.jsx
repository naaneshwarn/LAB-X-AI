import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import VirtualLabPage from './pages/VirtualLabPage';
import QuizzesPage from './pages/QuizzesPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/lab" element={<Navigate to="/lab/ohms-law" replace />} />
            <Route path="/lab/:experimentId" element={<VirtualLabPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
