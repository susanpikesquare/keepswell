import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder';

export function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Clerk authentication is not configured yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              To enable authentication, add your Clerk publishable key to{' '}
              <code className="bg-muted px-1 rounded">frontend/.env</code>
            </p>
            <div className="flex gap-2">
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full" variant="outline">
                  Preview Dashboard
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
