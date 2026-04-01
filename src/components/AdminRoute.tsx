import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

/**
 * Protects admin routes.
 * - Unauthenticated → /auth
 * - Authenticated but not admin → / (with toast warning)
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const toasted = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin && !toasted.current) {
      toasted.current = true;
      toast.error('Bạn không có quyền truy cập trang quản trị.');
    }
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminRoute;
