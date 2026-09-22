import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@client/src/contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import HomePage from './pages/HomePage/HomePage';
import RecordsPage from './pages/RecordsPage/RecordsPage';
import StatsPage from './pages/StatsPage/StatsPage';
import GoalsPage from './pages/GoalsPage/GoalsPage';
import RemindersPage from './pages/RemindersPage/RemindersPage';
import DataPage from './pages/DataPage/DataPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage/ProfileEditPage';
import ReportPage from './pages/ReportPage/ReportPage';
import AchievementsPage from './pages/AchievementsPage/AchievementsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import HelpPage from './pages/HelpPage/HelpPage';
import AgreementPage from './pages/AgreementPage/AgreementPage';

const RoutesComponent = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/agreement/:type" element={<AgreementPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="records/*" element={<RecordsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="data" element={<DataPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<ProfileEditPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
