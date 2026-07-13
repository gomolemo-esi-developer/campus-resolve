/**
 * API Client Hook - Campus Resolve
 * Handles all HTTP requests to backend API (port 8081)
 * Centralized error handling and token management
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8086') + '/api/resolve';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string[];
}

export interface ApiError {
  message: string;
  error: string;
  details?: string[];
}

interface UseApiOptions {
  showToast?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

export const useApiClient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  const request = useCallback(
    async <T,>(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      endpoint: string,
      data?: any,
      options: UseApiOptions = {}
    ): Promise<ApiResponse<T> | null> => {
      const { showToast = true, onSuccess, onError } = options;

      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
          method,
          headers,
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          config.body = JSON.stringify(data);
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, config);

        if (!response.ok) {
          let errorData: ApiError = {
            message: 'An error occurred',
            error: 'Unknown Error',
          };

          try {
            const responseData = await response.json();
            errorData = {
              message: responseData.message || 'An error occurred',
              error: responseData.error || 'Error',
              details: responseData.details,
            };
          } catch {
            errorData.message = `HTTP ${response.status}: ${response.statusText}`;
          }

          setError(errorData);
          if (showToast) {
            toast({
              title: 'Error',
              description: errorData.message,
              variant: 'destructive',
            });
          }
          if (onError) {
            onError(errorData);
          }
          return null;
        }

        const responseData: ApiResponse<T> = await response.json();

        if (responseData.success && showToast && responseData.message) {
          toast({
            title: 'Success',
            description: responseData.message,
          });
        }

        if (onSuccess) {
          onSuccess(responseData.data);
        }

        setLoading(false);
        return responseData;
      } catch (err) {
        const errorData: ApiError = {
          message: err instanceof Error ? err.message : 'Network error',
          error: 'Network Error',
        };

        setError(errorData);
        if (showToast) {
          toast({
            title: 'Error',
            description: errorData.message,
            variant: 'destructive',
          });
        }
        if (onError) {
          onError(errorData);
        }

        setLoading(false);
        return null;
      }
    },
    [getToken]
  );

  const get = useCallback(
    async <T,>(endpoint: string, options?: UseApiOptions): Promise<ApiResponse<T> | null> => {
      return request<T>('GET', endpoint, undefined, options);
    },
    [request]
  );

  const post = useCallback(
    async <T,>(endpoint: string, data?: any, options?: UseApiOptions): Promise<ApiResponse<T> | null> => {
      return request<T>('POST', endpoint, data, options);
    },
    [request]
  );

  const put = useCallback(
    async <T,>(endpoint: string, data?: any, options?: UseApiOptions): Promise<ApiResponse<T> | null> => {
      return request<T>('PUT', endpoint, data, options);
    },
    [request]
  );

  const del = useCallback(
    async <T,>(endpoint: string, options?: UseApiOptions): Promise<ApiResponse<T> | null> => {
      return request<T>('DELETE', endpoint, undefined, options);
    },
    [request]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(
    () => ({
      loading,
      error,
      get,
      post,
      put,
      delete: del,
      request,
      clearError,
    }),
    [loading, error, get, post, put, del, request, clearError]
  );
};
