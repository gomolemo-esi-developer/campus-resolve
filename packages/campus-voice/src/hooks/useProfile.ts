/**
 * useProfile Hook - Campus Voice
 * Read-only fetch of the logged-in student's Student Data record
 */

import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

export interface StudentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  idNumber: string;
  title: string;
  initials: string;
  faculty: string;
  facultyCode: string;
  department: string;
  departmentCode: string;
  campus: string;
  course: string;
  courseCode: string;
  extracurricular: string;
  residence: string;
  modules: string[];
}

export const useProfile = () => {
  const api = useApiClient();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Get the current user's student profile (read-only)
  const fetchProfile = useCallback(async () => {
    const response = await api.get<StudentProfile>('/profile');

    if (response?.success && response.data) {
      setProfile(response.data);
      return response.data;
    }
    return null;
  }, [api]);

  return {
    profile,
    loading: api.loading,
    error: api.error,
    fetchProfile,
  };
};
