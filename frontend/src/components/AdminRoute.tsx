import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Protects routes that require admin privileges.
 * - While auth state is being restored, renders nothing to avoid flicker.
 * - Unauthenticated users are redirected to /auth.
 * - Authenticated non-admin users are redirected to /.
 * - Admin users are rendered via <Outlet />.
 */
const AdminRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
