/**
 * Shared Authentication Service
 * Used by all frontend platforms (Campus Voice, Campus Resolve, Campus Admin)
 * Handles communication with backend auth endpoints
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
const USE_COGNITO = import.meta.env.VITE_USE_COGNITO === 'true';

/**
 * API Client with automatic token injection
 */
async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  includeAuth = true
) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add authorization token if available and requested
  if (includeAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle 401 - Token might be expired, try to refresh
    if (response.status === 401 && includeAuth) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request with new token
        return apiCall(endpoint, options, true);
      }
       // Refresh failed, clear auth and redirect to login
       clearAuth();
       window.location.href = `${import.meta.env.BASE_URL}login`;
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'API request failed');
    }

    return { data, status: response.status };
  } catch (error) {
    console.error('[AUTH] API call failed:', error);
    throw error;
  }
}

/**
 * Sign up a new student user
 */
export async function signup(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  studentNumber: string,
  role?: string,
  portal?: 'voice' | 'resolve' | 'admin'
) {
  try {
    const endpoint = USE_COGNITO ? '/api/auth/cognito/signup' : '/api/auth/signup';
    const isStaffPortal = portal === 'resolve';
    const { data } = await apiCall(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(
          USE_COGNITO
            ? {
                email,
                password,
                given_name: firstName,
                family_name: lastName,
                student_number: isStaffPortal ? undefined : studentNumber,
                staff_number: isStaffPortal ? studentNumber : undefined,
                role: role || 'student',
                portal,
              }
            : {
                email,
                password,
                firstName,
                lastName,
                studentNumber,
              }
        ),
      },
      false // Don't include auth token for signup
    );

    // Store token and user
    if (data.token) {
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }

    return data;
  } catch (error) {
    console.error('[AUTH] Signup failed:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 */
export async function signin(email: string, password: string) {
  try {
    const endpoint = USE_COGNITO ? '/api/auth/cognito/signin' : '/api/auth/signin';
    const { data } = await apiCall(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false // Don't include auth token for signin
    );

    // Store token and user
    if (data.token) {
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }

    return data;
  } catch (error) {
    console.error('[AUTH] Signin failed:', error);
    throw error;
  }
}

/**
 * Refresh JWT token
 */
export async function refreshToken() {
  try {
    const endpoint = USE_COGNITO ? '/api/auth/cognito/refresh' : '/api/auth/refresh';
    const { data } = await apiCall(
      endpoint,
      { method: 'POST' },
      true // Include current token for refresh
    );

    if (data.token) {
      setToken(data.token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[AUTH] Token refresh failed:', error);
    return false;
  }
}

/**
 * Sign out user
 */
export async function logout() {
  try {
    // Call backend logout endpoint
    const endpoint = USE_COGNITO ? '/api/auth/cognito/logout' : '/api/auth/logout';
    await apiCall(endpoint, { method: 'POST' }, true);
  } catch (error) {
    console.error('[AUTH] Logout API call failed:', error);
  } finally {
    // Always clear local storage
    clearAuth();
  }
}

/**
 * Set JWT token in localStorage
 */
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set user object in localStorage
 */
export function setUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user object from localStorage
 */
export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  // Dev mode: bypass authentication
  if (SKIP_AUTH) {
    return true;
  }
  return !!getToken() && !!getUser();
}

/**
 * Get user role
 */
export function getUserRole(): string | null {
  // Dev mode: return role based on current app/user
  if (SKIP_AUTH) {
    const user = getUser();
    // If user was set by signin/signup in dev mode, use that role
    if (user?.role) {
      return user.role;
    }
    // Otherwise default to admin
    return 'admin';
  }
  const user = getUser();
  return user?.role || null;
}

/**
 * Clear all authentication data
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Restore authentication on app load
 */
export function restoreAuth() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    return { token, user };
  }

  return null;
}

/**
 * Decode JWT token (client-side, for debugging)
 * Note: This does NOT verify the token signature
 */
export function decodeToken(token?: string) {
  try {
    const tokenToDecode = token || getToken();
    if (!tokenToDecode) return null;

    const parts = tokenToDecode.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return decoded;
  } catch (error) {
    console.error('[AUTH] Token decode failed:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token?: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

export default {
  signup,
  signin,
  refreshToken,
  logout,
  setToken,
  getToken,
  setUser,
  getUser,
  isAuthenticated,
  getUserRole,
  clearAuth,
  restoreAuth,
  decodeToken,
  isTokenExpired,
};
