/**
 * Protected Route Component
 * Wraps routes that require authentication and specific roles
 * Can be used by all three platforms (Campus Voice, Campus Resolve, Campus Admin)
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * Ensures user is authenticated and has required role
 *
 * @param children - Component to render if authorized
 * @param requiredRoles - Array of allowed roles (e.g., ['student', 'admin'])
 * @param redirectTo - Route to redirect to if not authorized (default: '/login')
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, user, token } = useAuth();

  console.log('[ProtectedRoute] Check:', { isAuthenticated, isLoading, user, token });

  // Still loading auth state - show nothing while checking
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading auth state');
    return null;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Authenticated but wrong role for this portal - redirect
  const userRole: string = user ? user.role : '';
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    console.log('[ProtectedRoute] Role not authorized, redirecting to', redirectTo, { role: userRole, requiredRoles });
    return <Navigate to={redirectTo} replace />;
  }

  // User is authenticated and authorized - allow access
  console.log('[ProtectedRoute] Authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
