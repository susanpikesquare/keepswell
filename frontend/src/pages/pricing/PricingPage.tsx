import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Check, Crown, ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '../../components/ui';
import { useCreateCheckoutSession, useSubscriptionStatus, useCreatePortalSession } from '../../hooks';

export function PricingPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { data: subscription, isLoading: isLoadingStatus } = useSubscriptionStatus();
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckoutSession();
  const { mutate: createPortal, isPending: isCreatingPortal } = useCreatePortalSession();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  // Check for both 'premium' and 'pro' tiers for backwards compatibility
  const isPro = (subscription?.tier === 'premium' || subscription?.tier === 'pro') && subscription?.status === 'active';

  const handleUpgrade = () => {
    if (!isSignedIn) {
      navigate('/sign-up');
      return;
    }
    createCheckout({ returnUrl: window.location.origin + '/pricing', billingPeriod });
  };

  const handleManage = () => {
    createPortal(window.location.origin + '/pricing');
  };

  const yearlyPrice = 79;
  const monthlyPrice = 9;
  const yearlySavings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

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
            Start free and upgrade when you're ready for SMS prompts and more contributors.
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

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
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
              <FeatureItem>Digital memory book viewer</FeatureItem>
              <FeatureItem disabled>SMS prompts</FeatureItem>
              <FeatureItem disabled>Premium templates</FeatureItem>
            </ul>

            {!isPro && (
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
            </div>

            <p className="text-muted-foreground mb-6">
              For families who want SMS prompts and more contributors.
            </p>

            <ul className="space-y-3 mb-8">
              <FeatureItem included>Unlimited memory journals</FeatureItem>
              <FeatureItem included>Up to 15 contributors per journal</FeatureItem>
              <FeatureItem included>SMS prompts enabled</FeatureItem>
              <FeatureItem included>Unlimited SMS messages</FeatureItem>
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
            ) : (
              <Button className="w-full" onClick={handleUpgrade} disabled={isCreatingCheckout}>
                {isCreatingCheckout ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Upgrade to Pro${billingPeriod === 'yearly' ? ' - Save ' + yearlySavings + '%' : ''}`
                )}
              </Button>
            )}

            {isPro && subscription?.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-600 mt-4 text-center">
                Your subscription will end on {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4 text-left">
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">Can I cancel anytime?</p>
              <p className="text-muted-foreground text-sm">
                Yes! You can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">What happens to my data if I downgrade?</p>
              <p className="text-muted-foreground text-sm">
                All your journals and memories remain intact. You'll keep your first journal and up to 3 contributors per journal. SMS prompts will be disabled.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">Why is SMS a Pro feature?</p>
              <p className="text-muted-foreground text-sm">
                SMS messages have real carrier costs to send. Free users can still add memories through the web dashboard at no cost!
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">What are premium templates?</p>
              <p className="text-muted-foreground text-sm">
                Premium templates include specialized prompts for unique occasions like Retirement, Travel Adventures, and more. They're designed to capture deeper, more meaningful memories.
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
