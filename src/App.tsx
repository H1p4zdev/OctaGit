import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import { MobileShell } from './components/layout/MobileShell';
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { ExploreScreen } from './features/explore/ExploreScreen';
import { NotificationsScreen } from './features/notifications/NotificationsScreen';
import { SearchScreen } from './features/search/SearchScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { UserProfileScreen } from './features/profile/UserProfileScreen';
import { RepositoryDetailScreen } from './features/repository/RepositoryDetailScreen';
import { RepositoriesScreen } from './features/repository/RepositoriesScreen';
import { FileViewerScreen } from './features/repository/FileViewerScreen';
import { CodeEditorScreen } from './features/repository/CodeEditorScreen';
import { CommitDiffScreen } from './features/repository/CommitDiffScreen';
import { WorkflowRunScreen } from './features/repository/WorkflowRunScreen';
import { NotificationManager } from './components/NotificationManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const session = useAuthStore(state => state.session);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationManager />
        <Routes>
          {!session ? (
            <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route element={<MobileShell />}>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/explore" element={<ExploreScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/profile/:username/repos" element={<RepositoriesScreen />} />
              <Route path="/user/:username" element={<UserProfileScreen />} />
              <Route path="/repo/:owner/:repo" element={<RepositoryDetailScreen />} />
              <Route path="/repo/:owner/:repo/file/*" element={<FileViewerScreen />} />
              <Route path="/repo/:owner/:repo/edit/*" element={<CodeEditorScreen />} />
              <Route path="/repo/:owner/:repo/commit/:ref" element={<CommitDiffScreen />} />
              <Route path="/repo/:owner/:repo/actions/:runId" element={<WorkflowRunScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

