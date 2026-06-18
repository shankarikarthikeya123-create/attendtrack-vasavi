import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context & Routes
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import SupervisorLayout from './layouts/SupervisorLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import WorkersPage from './pages/admin/WorkersPage';
import SitesPage from './pages/admin/SitesPage';
import SupervisorsPage from './pages/admin/SupervisorsPage';
import AttendanceRecordsPage from './pages/admin/AttendanceRecordsPage';
import MonthlyReportsPage from './pages/admin/MonthlyReportsPage';

// Supervisor Pages
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import MarkAttendancePage from './pages/supervisor/MarkAttendancePage';
import AttendanceHistoryPage from './pages/supervisor/AttendanceHistoryPage';
import SupervisorReportsPage from './pages/supervisor/SupervisorReportsPage';

// Shared Pages
import UnauthorizedPage from './pages/shared/UnauthorizedPage';
import NotFoundPage from './pages/shared/NotFoundPage';

// Root redirect logic based on token / role
const RootRedirect = () => {
  const token = localStorage.getItem('attendtrack_token');
  const userString = localStorage.getItem('attendtrack_user');
  
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      if (user.role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (user.role === 'SUPERVISOR') {
        return <Navigate to="/supervisor/dashboard" replace />;
      }
    } catch (e) {
      localStorage.removeItem('attendtrack_token');
      localStorage.removeItem('attendtrack_user');
    }
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="workers" element={<WorkersPage />} />
                <Route path="sites" element={<SitesPage />} />
                <Route path="supervisors" element={<SupervisorsPage />} />
                <Route path="mark-attendance" element={<MarkAttendancePage />} />
                <Route path="attendance-records" element={<AttendanceRecordsPage />} />
                <Route path="reports" element={<MonthlyReportsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Supervisor Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['SUPERVISOR']} />}>
              <Route path="/supervisor" element={<SupervisorLayout />}>
                <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
                <Route path="dashboard" element={<SupervisorDashboard />} />
                <Route path="mark-attendance" element={<MarkAttendancePage />} />
                <Route path="history" element={<AttendanceHistoryPage />} />
                <Route path="report" element={<SupervisorReportsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          },
          success: {
            iconTheme: {
              primary: '#0F9D8A',
              secondary: '#ffffff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#ffffff'
            }
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
