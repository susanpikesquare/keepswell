import { Link } from 'react-router-dom';
import { BookHeart, MessageSquare, Users, Camera } from 'lucide-react';
import { Button } from '../components/ui';

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold mb-6">
            Capture Family Memories, One Text at a Time
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create a Memory Journal and invite your loved ones to share their stories via SMS.
            Build a beautiful collection of memories without requiring anyone to download an app.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start Your Journal
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Invite Family & Friends"
              description="Add participants by phone number. They'll receive an SMS invitation to join your memory journal."
            />
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10" />}
              title="SMS Prompts"
              description="We send thoughtful prompts via text message. Participants simply reply with their memories."
            />
            <FeatureCard
              icon={<Camera className="h-10 w-10" />}
              title="Photos & Stories"
              description="Collect text responses and photos via MMS. Everything is organized in a beautiful timeline."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <BookHeart className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Start Collecting Memories?</h2>
          <p className="text-muted-foreground mb-8">
            Create your first Memory Journal today. No credit card required for the free tier.
          </p>
          <Link to="/sign-up">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background rounded-lg p-6 shadow-sm border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
