import { Link } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  Sun,
  Plane,
  Baby,
  Music,
  ArrowRight,
  Check,
  Smartphone,
  Mail,
} from 'lucide-react';
import { Button } from '../components/ui';

// Pre-formatted mailto for beta access requests. Keeps the user out of
// having to think about subject/body and gives PikeSquare a clean inbox
// filter to triage from. Swap to an App Store link once shipped.
const BETA_MAILTO =
  'mailto:susan@pikesquare.co?subject=' +
  encodeURIComponent('Keepswell iOS beta access request') +
  '&body=' +
  encodeURIComponent(
    "Hi! I'd like beta access to the Keepswell iOS app.\n\n" +
      'My Apple ID email (for the TestFlight invite):\n\n' +
      'Anything you want to share about what you plan to use Keepswell for:\n\n' +
      'Thanks!\n',
  );

// Editorial lifestyle photography for the landing page.
const LANDING_IMAGES = {
  heroHands: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1400&h=900&fit=crop&q=80',
  useWedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
  useFamily: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&h=400&fit=crop&q=80',
  useBaby: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=400&fit=crop&q=80',
  useTravel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop&q=80',
  useEvents: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop&q=80',
  useYear: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&q=80',
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#1F2328]">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden">
        {/* Warm wash background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F6F1EA] via-[#F6F1EA] to-[#DCCCB7]/40" />
        <div className="absolute -top-32 -right-24 w-[36rem] h-[36rem] rounded-full bg-[#D86F5C]/10 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-[#7A8A74]/15 blur-3xl -z-10" />

        <div className="container mx-auto px-6 py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Copy side */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-[#DCCCB7] text-[#3C4858] px-4 py-2 rounded-full text-sm font-medium mb-8">
                <img src="/logo-mark.png" alt="" className="h-5 w-auto" />
                <span>Capture moments. Cherish life.</span>
              </div>

              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[#1F2328] mb-6 tracking-tight">
                A beautiful way to <em className="text-[#D86F5C] not-italic font-medium">remember</em> life.
              </h1>

              <p className="text-lg md:text-xl text-[#3C4858] leading-relaxed mb-10 max-w-xl">
                Keepswell helps you collect the stories, photos, and small moments
                that make up a life — from milestones to mornings — and keep them
                in one place you'll always come back to.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link to="/sign-up">
                  <Button
                    size="lg"
                    className="text-base px-8 py-6 rounded-full bg-[#D86F5C] text-[#F6F1EA] hover:bg-[#c2604f] shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  >
                    Start your journal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-8 py-6 rounded-full border-[#DCCCB7] bg-transparent text-[#3C4858] hover:bg-white/60 w-full sm:w-auto"
                  >
                    See how it works
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-[#3C4858]/70 mb-10">
                New to Keepswell?{' '}
                <Link to="/how-it-works" className="text-[#D86F5C] underline-offset-4 hover:underline">
                  Read the full guide
                </Link>{' '}
                — what Keepswell does, how to invite people, and how it works
                over text. Or{' '}
                <Link to="/sign-in" className="text-[#D86F5C] underline-offset-4 hover:underline">
                  sign in
                </Link>
                {' '}if you already have an account.
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#3C4858]/80">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#7A8A74]" />
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#7A8A74]" />
                  Works on any phone
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#7A8A74]" />
                  No app required
                </span>
              </div>
            </div>

            {/* Image side */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-[#3C4858]/15 border border-white/40">
                <img
                  src={LANDING_IMAGES.heroHands}
                  alt="A family looking at photos together"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating editorial card */}
              <div className="absolute -bottom-10 -left-6 max-w-xs bg-white rounded-2xl p-5 shadow-xl shadow-[#3C4858]/10 border border-[#DCCCB7]/60 hidden md:block">
                <p className="font-serif text-lg italic text-[#1F2328] leading-snug">
                  "Grandma told us how she and Grandpa met at a church dance —
                  we'd never heard the whole story."
                </p>
                <p className="text-xs text-[#3C4858]/70 mt-3">— a memory collected for our family journal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section className="py-28 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D86F5C] font-medium mb-4">
              How it works
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1F2328] mb-6">
              Memories arrive, one text at a time.
            </h2>
            <p className="text-lg text-[#3C4858] leading-relaxed">
              You set the prompts. We send them to the people you love.
              Their replies — stories, photos, voice notes — gather into
              one beautiful keepsake.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            <StepCard
              number="01"
              title="Create a journal"
              description="Choose a moment to remember — a wedding, a baby's first year, a road trip, a season of life — and we'll suggest prompts."
            />
            <StepCard
              number="02"
              title="Invite the people you love"
              description="Add anyone by phone number. They reply by text. No app, no login, no friction."
            />
            <StepCard
              number="03"
              title="Cherish what comes back"
              description="Stories and photos collect into a private memory book you can share, print, or keep close."
            />
          </div>
        </div>
      </section>

      {/* ============================== USE CASES ============================== */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D86F5C] font-medium mb-4">
              For every kind of memory
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1F2328] mb-6">
              Whatever you want to remember.
            </h2>
            <p className="text-lg text-[#3C4858] leading-relaxed">
              From once-in-a-lifetime celebrations to the quiet days you'll
              miss someday — Keepswell holds them all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<Heart className="h-5 w-5" />}
              title="Weddings"
              description="Collect well-wishes and toasts from guests across the room or across the world."
              imageUrl={LANDING_IMAGES.useWedding}
            />
            <UseCaseCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Family stories"
              description="Preserve the stories grandparents tell — in their own words, before time slips by."
              imageUrl={LANDING_IMAGES.useFamily}
            />
            <UseCaseCard
              icon={<Baby className="h-5 w-5" />}
              title="Baby journals"
              description="Capture the firsts and the in-betweens of a first year you'll want back."
              imageUrl={LANDING_IMAGES.useBaby}
            />
            <UseCaseCard
              icon={<Plane className="h-5 w-5" />}
              title="Travel memories"
              description="Trade postcards for prompts — and come home with more than photos."
              imageUrl={LANDING_IMAGES.useTravel}
            />
            <UseCaseCard
              icon={<Music className="h-5 w-5" />}
              title="Concerts & events"
              description="Save the night — the soundcheck, the encore, the after-party, the friends you went with."
              imageUrl={LANDING_IMAGES.useEvents}
            />
            <UseCaseCard
              icon={<Sun className="h-5 w-5" />}
              title="Year in review"
              description="One prompt a week. By December, you have a year you can actually hold onto."
              imageUrl={LANDING_IMAGES.useYear}
            />
          </div>
        </div>
      </section>

      {/* ============================== EDITORIAL QUOTE ============================== */}
      <section className="py-28 px-6 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <img src="/logo-mark.png" alt="" className="h-12 w-auto mx-auto mb-8 opacity-70" />
          <p className="font-serif text-3xl md:text-4xl leading-[1.3] text-[#1F2328] italic mb-8">
            "I made a journal for my mom's 70th. Getting stories by text was so
            easy — even my 85-year-old grandmother joined in. The book made
            her cry happy tears."
          </p>
          <p className="text-sm uppercase tracking-[0.2em] text-[#3C4858]/70">
            — Sarah M., 47 memories collected
          </p>
        </div>
      </section>

      {/* ============================== iOS APP / BETA ============================== */}
      <section className="py-24 px-6 bg-[#F6F1EA]">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white border border-[#DCCCB7] text-[#3C4858] px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
                <Smartphone className="h-3.5 w-3.5 text-[#D86F5C]" />
                Currently in beta
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-[#1F2328] mb-4 leading-tight">
                The iOS app is in <em className="text-[#D86F5C] not-italic font-medium">private beta</em>.
              </h2>
              <p className="text-[#3C4858] text-lg leading-relaxed mb-6">
                Capture memories on the go, browse your memory book on your
                phone, and get gentle push notifications when family
                contributes. The full Keepswell website experience is
                available today — the iOS app is coming soon to the App
                Store, and we're inviting a small group of testers right
                now.
              </p>
              <p className="text-[#3C4858] mb-8">
                <strong>Want in?</strong> Email us your Apple ID and we'll
                send you a TestFlight invite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={BETA_MAILTO}>
                  <Button
                    size="lg"
                    className="text-base px-7 py-6 rounded-full bg-[#D86F5C] text-[#F6F1EA] hover:bg-[#c2604f] shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Request beta access
                  </Button>
                </a>
                <Link to="/how-it-works#ios">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-7 py-6 rounded-full border-[#DCCCB7] bg-transparent text-[#3C4858] hover:bg-white/60 w-full sm:w-auto"
                  >
                    What's in the app
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative mx-auto w-64 md:w-72 aspect-[9/19] rounded-[2.5rem] bg-gradient-to-br from-[#DCCCB7]/60 to-[#F5C9BF]/40 border-8 border-[#1F2328]/85 shadow-xl flex flex-col items-center justify-center p-6 text-center">
                <img src="/logo-mark.png" alt="" className="h-16 w-auto mb-4 opacity-90" />
                <p className="font-serif text-2xl text-[#1F2328] mb-2 leading-tight">
                  Capture moments. Cherish life.
                </p>
                <p className="text-xs text-[#3C4858]/70 uppercase tracking-widest">
                  Keepswell for iOS
                </p>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-[#1F2328]/85" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FINAL CTA ============================== */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#F6F1EA] to-[#DCCCB7]/60" />
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-4xl md:text-6xl text-[#1F2328] mb-6 leading-tight">
            The moments worth keeping <em className="text-[#D86F5C] not-italic font-medium">don't keep themselves</em>.
          </h2>
          <p className="text-lg md:text-xl text-[#3C4858] mb-10 leading-relaxed max-w-2xl mx-auto">
            Start a Keepswell journal today. Free, simple, and shaped around
            the people and moments that matter most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
              <Button
                size="lg"
                className="text-base px-10 py-7 rounded-full bg-[#D86F5C] text-[#F6F1EA] hover:bg-[#c2604f] shadow-md hover:shadow-xl transition-all"
              >
                Start your journal — free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-10 py-7 rounded-full border-[#DCCCB7] bg-transparent text-[#3C4858] hover:bg-white/60"
              >
                Read the full guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="py-12 px-6 bg-[#1F2328] text-[#F6F1EA]/80">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo-mark.png"
                alt="Keepswell"
                className="h-9 w-auto rounded-lg bg-[#F6F1EA] p-1"
              />
              <span className="font-serif text-xl text-[#F6F1EA]">keepswell</span>
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link to="/how-it-works" className="hover:text-[#F6F1EA] transition-colors">
                How it works
              </Link>
              <a href={BETA_MAILTO} className="hover:text-[#F6F1EA] transition-colors">
                iOS beta
              </a>
              <Link to="/pricing" className="hover:text-[#F6F1EA] transition-colors">
                Pricing
              </Link>
              <Link to="/privacy" className="hover:text-[#F6F1EA] transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-[#F6F1EA] transition-colors">
                Terms
              </Link>
              <Link to="/sms-consent" className="hover:text-[#F6F1EA] transition-colors">
                SMS program
              </Link>
              <Link to="/support" className="hover:text-[#F6F1EA] transition-colors">
                Support
              </Link>
            </nav>
          </div>

          <p className="mt-8 text-xs text-[#F6F1EA]/50 text-center md:text-left">
            &copy; {new Date().getFullYear()} Keepswell. A product of PikeSquare, LLC.
          </p>
        </div>
      </footer>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
  imageUrl,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  imageUrl: string;
}) {
  return (
    <article className="group bg-white rounded-3xl overflow-hidden border border-[#DCCCB7]/60 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="aspect-[5/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-7">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#D86F5C]/10 text-[#D86F5C] mb-4">
          {icon}
        </div>
        <h3 className="font-serif text-2xl text-[#1F2328] mb-2">{title}</h3>
        <p className="text-[#3C4858] leading-relaxed">{description}</p>
      </div>
    </article>
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
    <div className="text-center md:text-left">
      <span className="font-serif text-5xl text-[#D86F5C]/80 leading-none">{number}</span>
      <h3 className="font-serif text-2xl text-[#1F2328] mt-4 mb-3">{title}</h3>
      <p className="text-[#3C4858] leading-relaxed">{description}</p>
    </div>
  );
}
