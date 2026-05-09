import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Guards routes that require authentication or demo mode.
 *
 * Access is allowed when:
 *  - user is authenticated (real Supabase session), OR
 *  - user is in demo mode (explicitly chosen, or Supabase not configured)
 *
 * While loading, shows a spinner.
 * If neither condition is met, redirects to /auth.
 */
export default function ProtectedRoute({ children }: Props) {
  const { loading, isAuthenticated, isDemoMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yc/30 border-t-yc rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
