import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Protects routes that require the user to be authenticated.
 * - While auth state is being restored, renders nothing to avoid flicker.
 * - Unauthenticated users are redirected to /auth, with the original
 *   destination saved in location state so the user can be sent back
 *   after a successful login.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
