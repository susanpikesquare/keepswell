import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Check, Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { useCreateCheckoutSession, useSubscriptionStatus, useCreatePortalSession } from '../../hooks';

export function PricingPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { data: subscription, isLoading: isLoadingStatus } = useSubscriptionStatus();
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckoutSession();
  const { mutate: createPortal, isPending: isCreatingPortal } = useCreatePortalSession();

  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';

  const handleUpgrade = () => {
    if (!isSignedIn) {
      navigate('/sign-up');
      return;
    }
    createCheckout(window.location.origin + '/pricing');
  };

  const handleManage = () => {
    createPortal(window.location.origin + '/pricing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-pink-50">
      <div className="container mx-auto px-4 py-12">
        <Link to={isSignedIn ? '/dashboard' : '/'} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features to create beautiful printed memory books and access exclusive templates.
          </p>
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
              Perfect for getting started with memory collection.
            </p>

            <ul className="space-y-3 mb-8">
              <FeatureItem>Unlimited journals</FeatureItem>
              <FeatureItem>Up to 5 participants per journal</FeatureItem>
              <FeatureItem>SMS prompt delivery</FeatureItem>
              <FeatureItem>Photo attachments</FeatureItem>
              <FeatureItem>Basic templates</FeatureItem>
              <FeatureItem>Digital memory book viewer</FeatureItem>
              <FeatureItem>PDF export (with watermark)</FeatureItem>
            </ul>

            {!isPremium && (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            )}
          </div>

          {/* Premium Plan */}
          <div className="bg-background rounded-2xl p-8 border-2 border-primary shadow-lg relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Most Popular
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Premium</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Everything in Free, plus exclusive features for creating beautiful keepsakes.
            </p>

            <ul className="space-y-3 mb-8">
              <FeatureItem included>Everything in Free</FeatureItem>
              <FeatureItem included>Unlimited participants</FeatureItem>
              <FeatureItem included>Premium templates</FeatureItem>
              <FeatureItem included>PDF export (no watermark)</FeatureItem>
              <FeatureItem included>Print-ready memory books</FeatureItem>
              <FeatureItem included>Order physical prints</FeatureItem>
              <FeatureItem included>Priority support</FeatureItem>
            </ul>

            {isLoadingStatus ? (
              <Button className="w-full" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            ) : isPremium ? (
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
                  'Upgrade to Premium'
                )}
              </Button>
            )}

            {isPremium && subscription?.cancelAtPeriodEnd && (
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
                Yes! You can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="font-medium mb-2">What happens to my data if I downgrade?</p>
              <p className="text-muted-foreground text-sm">
                All your journals and memories remain intact. You'll just lose access to premium features like watermark-free exports and print ordering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${included ? 'text-primary' : 'text-green-500'}`} />
      <span className={included ? 'text-foreground font-medium' : ''}>{children}</span>
    </li>
  );
}
