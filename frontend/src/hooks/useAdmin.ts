import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { adminApi } from '../api/admin';
import { setAuthToken } from '../api/client';

export function useAdminAccess() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ['admin', 'access'],
    queryFn: async () => {
      // Ensure token is set before making the request
      const token = await getToken();
      setAuthToken(token);
      return adminApi.checkAccess();
    },
    retry: false,
    // Only run query after auth is loaded and user is signed in
    enabled: isLoaded && !!isSignedIn,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
  });
}

export function useSetAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      adminApi.setAdminStatus(userId, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
