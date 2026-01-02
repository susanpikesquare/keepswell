import { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { setAuthToken, setGetTokenFn, authApi } from '../api';

export function useAuthSync() {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();

  // Register the getToken function with the API client on mount
  useEffect(() => {
    if (getToken) {
      setGetTokenFn(getToken);
    }
  }, [getToken]);

  useEffect(() => {
    async function syncAuth() {
      if (!isLoaded) return;

      if (isSignedIn && user) {
        try {
          // Get token and set it for API calls
          const token = await getToken();
          setAuthToken(token);

          // Sync user to backend
          await authApi.syncUser({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            full_name: user.fullName || undefined,
            phone_number: user.primaryPhoneNumber?.phoneNumber || undefined,
            avatar_url: user.imageUrl || undefined,
          });
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      } else {
        setAuthToken(null);
      }
    }

    syncAuth();
  }, [isLoaded, isSignedIn, user, getToken]);

  return { isSignedIn, isLoaded, user };
}

// Hook to ensure token is set before making API calls
export function useAuthToken() {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();

  useEffect(() => {
    async function setToken() {
      if (isLoaded && isSignedIn) {
        const token = await getToken();
        setAuthToken(token);
      }
    }
    setToken();
  }, [isLoaded, isSignedIn, getToken]);

  return { isSignedIn, isLoaded };
}
