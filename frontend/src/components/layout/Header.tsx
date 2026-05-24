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

export function Header() {
  // Check if we're in a Clerk context
  let isClerkAvailable = true;
  try {
    useAuth();
  } catch {
    isClerkAvailable = false;
  }

  return (
    <header className="border-b border-[#DCCCB7]/70 bg-[#F6F1EA]/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" aria-label="Keepswell — home" className="flex items-center">
          <img
            src="/logo-wordmark.png"
            alt="Keepswell"
            className="h-10 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {isClerkAvailable ? (
            <>
              <SignedOut>
                <Link to="/how-it-works" className="hidden sm:inline-flex">
                  <Button variant="ghost">How it works</Button>
                </Link>
                <Link to="/pricing" className="hidden sm:inline-flex">
                  <Button variant="ghost">Pricing</Button>
                </Link>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>Get Started</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link to="/how-it-works" className="hidden sm:inline-flex">
                  <Button variant="ghost">How it works</Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : (
            <>
              <Link to="/how-it-works" className="hidden sm:inline-flex">
                <Button variant="ghost">How it works</Button>
              </Link>
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
