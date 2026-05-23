import { Link } from 'react-router-dom';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from '@clerk/clerk-react';
import { Button } from '../ui';
import { KeepswellLogo } from './KeepswellLogo';

export function Header() {
  // Check if we're in a Clerk context
  let isClerkAvailable = true;
  try {
    useAuth();
  } catch {
    isClerkAvailable = false;
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <KeepswellLogo className="h-9 w-9" />
          <span className="text-2xl font-serif text-charcoal">keepswell</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isClerkAvailable ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>Get Started</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
