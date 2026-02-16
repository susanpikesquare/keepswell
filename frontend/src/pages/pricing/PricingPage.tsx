import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Check, Crown, ArrowLeft, Loader2, X, Calendar, Users } from 'lucide-react';
import { Button } from '../../components/ui';
import {
  useCreateCheckoutSession,
  useSubscriptionStatus,
  useCreatePortalSession,
  useCreateEventPassCheckout,
  useCreateParticipantBundleCheckout,
} from '../../hooks';

export function PricingPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { data: subscription, isLoading: isLoadingStatus } = useSubscriptionStatus();
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckoutSession();
  const { mutate: createPortal, isPending: isCreatingPortal } = useCreatePortalSession();
  const { mutate: createEventPassCheckout, isPending: isCreatingEventPass } = useCreateEventPassCheckout();
  const { mutate: createParticipantBundle, isPending: isCreatingBundle } = useCreateParticipantBundleCheckout();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const isPro = (subscription?.tier === 'premium' || subscription?.tier === 'pro') && subscription?.status === 'active';
  const isEvent = subscription?.tier === 'event' && subscription?.status === 'active';
  const isPaid = isPro || isEvent;

  const yearlyPrice = 44.99;
  const monthlyPrice = 4.99;
  const yearlySavings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  const handleUpgrade = () => {
    if (!isSignedIn) {
      navigate('/sign-up');
      return;
    }
    createCheckout({ returnUrl: window.location.origin + '/pricing', billingPeriod });
  };

  const handleEventPass = () => {
    if (!isSignedIn) {
      navigate('/sign-up');
      return;
    }
    createEventPassCheckout(window.location.origin + '/pricing');
  };

  const handleManage = () => {
    createPortal(window.location.origin + '/pricing');
  };

  const handleAddParticipants = () => {
    createParticipantBundle({ returnUrl: window.location.origin + '/pricing', quantity: 1 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-pink-50">
      <div className="container mx-auto px-4 py-12">
        <Link to={isSignedIn ? '/dashboard' : '/'} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade for SMS prompts and more contributors, or get an Event Pass for a one-time occasion.
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Save {yearlySavings}%
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-background rounded-2xl p-8 border shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Perfect for trying out memory collection via the web dashboard.
            </p>

            <ul className="space-y-3 mb-8">
              <FeatureItem>1 memory journal</FeatureItem>
              <FeatureItem>Up to 3 contributors</FeatureItem>
              <FeatureItem>Web dashboard access</FeatureItem>
              <FeatureItem>Unlimited web uploads</FeatureItem>
              <FeatureItem>Photo attachments</FeatureItem>
              <FeatureItem>Basic templates</FeatureItem>
              <FeatureItem disabled>SMS prompts</FeatureItem>
              <FeatureItem disabled>Custom prompts</FeatureItem>
            </ul>

            {!isPaid && (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-background rounded-2xl p-8 border-2 border-primary shadow-lg relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Most Popular
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  ${billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice}
                </span>
                <span className="text-muted-foreground">
                  /{billingPeriod === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-green-600 mt-1">
                  That's just ${(yearlyPrice / 12).toFixed(2)}/month
                </p>
              )}
              <p className="text-sm text-primary mt-1 font-medium">
                7-day free trial included
              </p>
            </div>

            <p className="text-muted-foreground mb-6">
              For families who want SMS prompts, custom prompts, and more.
            </p>

            <ul className="space-y-3 mb-8">
              <FeatureItem included>Unlimited memory journals</FeatureItem>
              <FeatureItem included>Up to 15 contributors per journal</FeatureItem>
              <FeatureItem included>SMS prompts enabled</FeatureItem>
              <FeatureItem included>Custom prompts</FeatureItem>
              <FeatureItem included>Premium templates</FeatureItem>
              <FeatureItem included>PDF export (no watermark)</FeatureItem>
              <FeatureItem included>Priority support</FeatureItem>
            </ul>

            {isLoadingStatus ? (
              <Button className="w-full" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            ) : isPro ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleManage} disabled={isCreatingPortal}>
                  {isCreatingPortal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
                <Button variant="ghost" className="w-full text-sm" onClick={handleAddParticipants} disabled={isCreatingBundle}>
                  {isCreatingBundle ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-1" />
                      Add 5 more participants — $4.99
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleUpgrade} disabled={isCreatingCheckout}>
                {isCreatingCheckout ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Start Free Trial${billingPeriod === 'yearly' ? ' — Save ' + yearlySavings + '%' : ''}`
                )}
              </Button>
            )}

            {isPro && subscription?.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-600 mt-4 text-center">
                Your subscription will end on {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Event Pass */}
          <div className="bg-background rounded-2xl p-8 border shadow-sm relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                One-Time
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Event Pass</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$24.99</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Active for 90 days
              </p>
            </div>

            <p className="text-muted-foreground mb-6">
              Perfect for weddings, birthdays, reunions, and other special events.
            </p>

            <ul className="space-y-3 mb-8">
              <FeatureItem included>1 event journal</FeatureItem>
              <FeatureItem included>Up to 15 contributors</FeatureItem>
              <FeatureItem included>SMS prompts enabled</FeatureItem>
              <FeatureItem included>Custom prompts</FeatureItem>
              <FeatureItem included>Premium templates</FeatureItem>
              <FeatureItem included>PDF export (no watermark)</FeatureItem>
              <FeatureItem>No recurring charges</FeatureItem>
            </ul>

            {isLoadingStatus ? (
              <Button className="w-full" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            ) : isEvent ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  Event Pass Active
                </Button>
                {subscription?.eventPassExpiresAt && (
                  <p className="text-sm text-muted-foreground text-center">
                    Expires {new Date(subscription.eventPassExpiresAt).toLocaleDateString()}
                  </p>
                )}
                <Button variant="ghost" className="w-full text-sm" onClick={handleAddParticipants} disabled={isCreatingBundle}>
                  {isCreatingBundle ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-1" />
                      Add 5 more participants — $4.99
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
                onClick={handleEventPass}
                disabled={isCreatingEventPass || isPro}
              >
                {isCreatingEventPass ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : isPro ? (
                  'Included in Pro'
                ) : (
                  'Get Event Pass'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Participant Add-on Banner */}
        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Need more participants?</p>
                <p className="text-sm text-muted-foreground">
                  Add 5 extra contributor slots to any paid plan for just $4.99 per bundle.
                </p>
              </div>
            </div>
            {isPaid && (
              <Button variant="outline" onClick={handleAddParticipants} disabled={isCreatingBundle}>
                {isCreatingBundle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add Participants'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4 text-left">
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">Can I try Pro before committing?</p>
              <p className="text-muted-foreground text-sm">
                Yes! Pro comes with a 7-day free trial. You won't be charged until the trial ends, and you can cancel anytime during the trial.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">What's the difference between Pro and Event Pass?</p>
              <p className="text-muted-foreground text-sm">
                Pro is an ongoing subscription with unlimited journals — great for families collecting memories over time. The Event Pass is a one-time purchase that lasts 90 days — perfect for weddings, birthdays, or reunions.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">Can I cancel anytime?</p>
              <p className="text-muted-foreground text-sm">
                Yes! You can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">What happens to my data if I downgrade?</p>
              <p className="text-muted-foreground text-sm">
                All your journals and memories remain intact. You'll keep your first journal and up to 3 contributors. SMS prompts and custom prompts will be disabled.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">Why is SMS a paid feature?</p>
              <p className="text-muted-foreground text-sm">
                SMS messages have real carrier costs to send. Free users can still add memories through the web dashboard and mobile app at no cost!
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">Can I add more participants?</p>
              <p className="text-muted-foreground text-sm">
                Yes! Both Pro and Event Pass users can purchase participant bundles of 5 extra slots for $4.99 each. These are added permanently to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children, included = false, disabled = false }: { children: React.ReactNode; included?: boolean; disabled?: boolean }) {
  if (disabled) {
    return (
      <li className="flex items-start gap-3 text-muted-foreground">
        <X className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground/50" />
        <span className="line-through">{children}</span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3">
      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${included ? 'text-primary' : 'text-green-500'}`} />
      <span className={included ? 'text-foreground font-medium' : ''}>{children}</span>
    </li>
  );
}
