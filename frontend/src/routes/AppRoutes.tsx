import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { DocumentsPage } from '../pages/admin/DocumentsPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';
import { ChatPage } from '../pages/employee/ChatPage';

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Root redirect helper
  const renderRootRedirect = () => {
    if (isLoading) return null;
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/chat" replace />;
  };

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={renderRootRedirect()} />

      {/* Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/chat'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
        </Route>
      </Route>

      {/* Employee Routes */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route path="/chat" element={<ChatPage />} />
      </Route>

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
