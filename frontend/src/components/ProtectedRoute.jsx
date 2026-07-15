import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireSecurity = false }) {
  const { user, isSecurity, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSecurity && !isSecurity) return <Navigate to="/dashboard" replace />;

  return children;
}
