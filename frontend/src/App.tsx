import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { ProtectedRoute } from './components/auth';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CreateJournalPage } from './pages/journal/CreateJournalPage';
import { JournalDetailPage } from './pages/journal/JournalDetailPage';
import { MemoryBookPage } from './pages/journal/MemoryBookPage';
import { SharedBookPage } from './pages/shared/SharedBookPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journals/new"
          element={
            <ProtectedRoute>
              <CreateJournalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journals/:id"
          element={
            <ProtectedRoute>
              <JournalDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Full-screen Memory Book view (outside MainLayout) */}
      <Route
        path="/journals/:id/book"
        element={
          <ProtectedRoute>
            <MemoryBookPage />
          </ProtectedRoute>
        }
      />

      {/* Public shared memory book view */}
      <Route path="/shared/:token" element={<SharedBookPage />} />
    </Routes>
  );
}

export default App;
