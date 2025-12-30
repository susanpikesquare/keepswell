import { useAuth, RedirectToSignIn } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // In preview mode (no Clerk), allow access to all routes
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}
