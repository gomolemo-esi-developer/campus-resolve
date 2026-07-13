/**
 * useProfile Hook - Campus Resolve
 * Read-only fetch of the logged-in staff member's Staff Data record
 */

import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

export interface ProfessionalEntry {
  id: string;
  course: string;
  courseCode: string;
  department: string;
  departmentCode: string;
  faculty: string;
  facultyCode: string;
}

export interface StaffProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  staffNumber: string;
  idNumber: string;
  title: string;
  initials: string;
  location: string;
  campus: string;
  faculty: string;
  facultyCode: string;
  department: string;
  departmentCode: string;
  course: string;
  courseCode: string;
  extracurricular: string;
  residence: string;
  modules: string[];
  professionalEntries: ProfessionalEntry[];
}

export const useProfile = () => {
  const api = useApiClient();
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  // Get the current user's staff profile (read-only)
  const fetchProfile = useCallback(async () => {
    const response = await api.get<StaffProfile>('/profile', {
      showToast: false,
    });

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
