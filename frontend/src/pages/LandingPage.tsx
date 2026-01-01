import { Link } from 'react-router-dom';
import { BookHeart, MessageSquare, Users, Camera, Heart, Gift, Clock, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-pink-100/30 -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              The easiest way to collect family memories
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Turn Family Stories Into a{' '}
              <span className="text-primary">Treasured Keepsake</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Send thoughtful prompts via text message, collect memories from loved ones,
              and create a beautiful book — no app downloads required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/sign-up">
                <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="outline" size="lg" className="text-lg px-8 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                No app required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Works with any phone
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Free to start
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phone mockup / Visual section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-primary/5 to-pink-50 rounded-3xl p-8 md:p-12 border">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">As Simple as Texting</h2>
                <p className="text-muted-foreground mb-6">
                  Your family members receive prompts like "What's your favorite childhood memory?"
                  via text. They simply reply — no accounts, no passwords, no apps.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">We send the prompt</p>
                      <p className="text-sm text-muted-foreground">Thoughtful questions delivered on your schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">They reply with stories & photos</p>
                      <p className="text-sm text-muted-foreground">Text or MMS — whatever works for them</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BookHeart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Memories are collected for you</p>
                      <p className="text-sm text-muted-foreground">View and organize in a beautiful timeline</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone mockup */}
              <div className="flex justify-center">
                <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl max-w-[280px]">
                  <div className="bg-background rounded-[2rem] overflow-hidden">
                    <div className="bg-green-500/10 p-4">
                      <p className="text-xs text-muted-foreground mb-1">From: Keepswell</p>
                      <p className="text-sm">What's your favorite memory from a family holiday?</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-primary/10 rounded-lg p-3 ml-8">
                        <p className="text-sm">Oh, I remember when we all went to Grandma's house for Christmas 1987. Dad dressed up as Santa and got stuck in the chimney! 😂</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 mr-8">
                        <p className="text-xs text-muted-foreground">Thanks for sharing! This memory has been saved to "Family Christmas Memories" ❤️</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For Every Occasion</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're celebrating a milestone or preserving everyday moments,
              Keepswell makes it easy to collect what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UseCaseCard
              icon={<Heart className="h-8 w-8" />}
              title="Wedding Guest Book"
              description="Collect well-wishes and stories from guests before, during, or after the big day."
              gradient="from-pink-500 to-rose-500"
            />
            <UseCaseCard
              icon={<Gift className="h-8 w-8" />}
              title="Birthday Memories"
              description="Create a surprise book of memories from friends and family for a milestone birthday."
              gradient="from-purple-500 to-indigo-500"
            />
            <UseCaseCard
              icon={<Users className="h-8 w-8" />}
              title="Family History"
              description="Preserve stories from grandparents and older relatives before they're lost to time."
              gradient="from-amber-500 to-orange-500"
            />
            <UseCaseCard
              icon={<Clock className="h-8 w-8" />}
              title="Year in Review"
              description="Gather highlights and favorite moments from family members throughout the year."
              gradient="from-emerald-500 to-teal-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-muted-foreground">Three simple steps to start collecting memories</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Your Journal"
              description="Pick a theme and customize your prompts, or use our ready-made templates."
            />
            <StepCard
              number="2"
              title="Invite Participants"
              description="Add family members by phone number. They'll get an SMS invitation to join."
            />
            <StepCard
              number="3"
              title="Watch Memories Arrive"
              description="Prompts go out automatically. Responses flow in and are beautifully organized."
            />
          </div>
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-primary/5 to-pink-50 rounded-3xl p-8 md:p-12 text-center border">
            <div className="max-w-2xl mx-auto">
              <div className="text-5xl mb-6">"</div>
              <p className="text-xl md:text-2xl font-medium mb-6">
                I created a journal for my mom's 70th birthday. Getting stories from aunts, uncles,
                and cousins via text was so easy — even my 85-year-old grandmother participated!
                The final book made my mom cry happy tears.
              </p>
              <p className="text-muted-foreground">
                — Sarah M., collected 47 memories for her mom's birthday book
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-pink-50">
        <div className="container mx-auto text-center max-w-2xl">
          <BookHeart className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Collecting Memories Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create your first Memory Journal in minutes. Free to start,
            no credit card required.
          </p>
          <Link to="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Keepswell. A product of PikeSquare, LLC.</p>
        </div>
      </footer>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-br ${gradient} text-white p-3 rounded-lg inline-block mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
