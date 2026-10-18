import { Routes, Route } from 'react-router-dom';
import PrivateRoute from '@/components/layout/PrivateRoute';
import AppLayout from '@/components/layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import LoginPage from '@/pages/auth/LoginPage';
import VerifyPage from '@/pages/auth/VerifyPage';
import DashboardPage from '@/pages/DashboardPage';
import FeedPage from '@/pages/feed/FeedPage';
import SearchJobsPage from '@/pages/jobs/SearchJobsPage';
import JobDetailPage from '@/pages/jobs/JobDetailPage';
import PublishJobPage from '@/pages/jobs/PublishJobPage';
import MyPublicationsPage from '@/pages/jobs/MyPublicationsPage';
import ManageApplicantsPage from '@/pages/jobs/ManageApplicantsPage';
import MyApplicationsPage from '@/pages/applications/MyApplicationsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import UserSearchPage from '@/pages/users/UserSearchPage';
import PublicProfilePage from '@/pages/users/PublicProfilePage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import ChatPage from '@/pages/chat/ChatPage';
import DirectMessagesPage from '@/pages/messages/DirectMessagesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:token" element={<VerifyPage />} />

      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/trabajos/buscar" element={<SearchJobsPage />} />
        <Route path="/trabajos/:id" element={<JobDetailPage />} />
        <Route path="/trabajos/publicar" element={<PublishJobPage />} />
        <Route path="/trabajos/:id/editar" element={<PublishJobPage />} />
        <Route path="/mis-publicaciones" element={<MyPublicationsPage />} />
        <Route path="/mis-publicaciones/:id/postulantes" element={<ManageApplicantsPage />} />
        <Route path="/mis-postulaciones" element={<MyApplicationsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/usuarios" element={<UserSearchPage />} />
        <Route path="/usuarios/:id" element={<PublicProfilePage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/mensajes" element={<ChatPage />} />
        {/* Rutas directas antes de /mensajes/:applicationId (orden de mayor especificidad) */}
        <Route path="/mensajes/directos" element={<DirectMessagesPage />} />
        <Route path="/mensajes/directos/:conversationId" element={<DirectMessagesPage />} />
        <Route path="/mensajes/:applicationId" element={<ChatPage />} />
      </Route>

      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
