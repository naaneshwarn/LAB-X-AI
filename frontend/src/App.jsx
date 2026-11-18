import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import { LoadingState } from './components/StatusStates';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const VirtualLabPage = lazy(() => import('./pages/VirtualLabPage'));
const PhysicsPlaygroundPage = lazy(() => import('./pages/PhysicsPlaygroundPage'));
const VideoLibraryPage = lazy(() => import('./pages/VideoLibraryPage'));
const AiTutorPage = lazy(() => import('./pages/AiTutorPage'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<LoadingState message="Loading LabXAI module..." />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/experiments" element={<LibraryPage />} />
              <Route path="/lab" element={<Navigate to="/lab/ohms-law" replace />} />
              <Route path="/lab/:experimentId" element={<VirtualLabPage />} />
              <Route path="/playground" element={<PhysicsPlaygroundPage />} />
              <Route path="/videos" element={<VideoLibraryPage />} />
              <Route path="/tutor" element={<AiTutorPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/reports" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
