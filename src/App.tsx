/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './hooks/useApp';
import { Layout } from './components/Layout';
import { AuthView } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PeopleView } from './components/People';
import { SupervisionForm } from './components/SupervisionForm';
import { HistoryView } from './components/History';
import { SettingsView } from './components/Settings';

export default function App() {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {currentUser ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/people" element={<PeopleView />} />
            <Route path="/discovery" element={<Navigate to="/people" replace />} />
            <Route path="/log-session" element={<SupervisionForm />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/network" element={<Navigate to="/people" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      ) : (
        <AuthView />
      )}
    </BrowserRouter>
  );
}
