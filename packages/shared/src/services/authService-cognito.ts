/**
 * Shared Authentication Service (Cognito Integration)
 * Used by all frontend platforms (Campus Voice, Campus Resolve, Campus Admin)
 * Handles communication with AWS Cognito authentication endpoints
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080';
const ID_TOKEN_KEY = 'cognito_id_token';
const ACCESS_TOKEN_KEY = 'cognito_access_token';
const REFRESH_TOKEN_KEY = 'cognito_refresh_token';
const USER_KEY = 'auth_user';
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

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
    const idToken = getToken();
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Send cookies (refresh token)
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
 * Sign up a new student user via Cognito
 */
export async function signup(
  email: string,
  password: string,
  studentNumber: string
) {
  // Dev mode: skip API call
  if (SKIP_AUTH) {
    const mockUser = {
      id: 'dev-user-' + Date.now(),
      email,
      studentNumber,
      role: 'student',
    };
    const mockToken = 'dev-token-' + Date.now();
    setToken(mockToken);
    setUser(mockUser);
    return { success: true, message: 'Sign-up successful', token: mockToken, user: mockUser };
  }

  try {
    // Call Cognito signup endpoint
    const { data } = await apiCall(
      '/api/auth/cognito/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          student_number: studentNumber,
          role: 'student',
        }),
      },
      false // Don't include auth token for signup
    );

    return data;
  } catch (error) {
    console.error('[AUTH] Signup failed:', error);
    throw error;
  }
}

/**
 * Confirm user email with verification code
 */
export async function confirmSignup(email: string, confirmationCode: string) {
  try {
    const { data } = await apiCall(
      '/api/auth/cognito/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ email, confirmationCode }),
      },
      false
    );

    return data;
  } catch (error) {
    console.error('[AUTH] Confirm signup failed:', error);
    throw error;
  }
}

/**
 * Resend verification code
 */
export async function resendConfirmationCode(email: string) {
  try {
    const { data } = await apiCall(
      '/api/auth/cognito/resend-code',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      false
    );

    return data;
  } catch (error) {
    console.error('[AUTH] Resend code failed:', error);
    throw error;
  }
}

/**
 * Sign in an existing user via Cognito
 */
export async function signin(email: string, password: string) {
  // Dev mode: skip API call
  if (SKIP_AUTH) {
    // Determine role based on email
    let role = 'student';
    if (email.includes('admin')) {
      role = 'admin';
    } else if (email.includes('staff')) {
      role = 'staff';
    }

    const mockUser = {
      id: 'dev-user-' + Date.now(),
      email,
      role,
    };
    const mockToken = 'dev-token-' + Date.now();
    setToken(mockToken);
    setUser(mockUser);
    return { success: true, idToken: mockToken, user: mockUser };
  }

  try {
    // Call Cognito signin endpoint
    const { data } = await apiCall(
      '/api/auth/cognito/signin',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false // Don't include auth token for signin
    );

    // Store tokens and user
    if (data.idToken) {
      setToken(data.idToken);
    }
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
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
 * Refresh JWT tokens using refresh token
 */
export async function refreshToken() {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const { data } = await apiCall(
      '/api/auth/cognito/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      false
    );

    // Update tokens
    if (data.idToken) {
      setToken(data.idToken);
    }
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }

    return true;
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
    await apiCall('/api/auth/cognito/logout', { method: 'POST' }, true);
  } catch (error) {
    console.error('[AUTH] Logout API call failed:', error);
  } finally {
    // Always clear local storage
    clearAuth();
  }
}

/**
 * Set ID token in localStorage
 */
export function setToken(token: string) {
  localStorage.setItem(ID_TOKEN_KEY, token);
}

/**
 * Get ID token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY);
}

/**
 * Set access token in localStorage
 */
export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Set refresh token in localStorage
 */
export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
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
    if (user?.role) {
      return user.role;
    }
    return 'admin';
  }
  const user = getUser();
  return user?.role || null;
}

/**
 * Clear all authentication data
 */
export function clearAuth() {
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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

    // Browser's atob function for base64 decoding
    const decoded = JSON.parse(atob(parts[1]));
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
  confirmSignup,
  resendConfirmationCode,
  signin,
  refreshToken,
  logout,
  setToken,
  getToken,
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  setUser,
  getUser,
  isAuthenticated,
  getUserRole,
  clearAuth,
  restoreAuth,
  decodeToken,
  isTokenExpired,
};
