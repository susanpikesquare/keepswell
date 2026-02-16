import { useState } from 'react';
import { Crown, X, Check, Loader2 } from 'lucide-react';
import { Button } from '../ui';
import { useCreateCheckoutSession } from '../../hooks';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ isOpen, onClose, feature = 'this feature' }: UpgradeModalProps) {
  const { mutate: createCheckout, isPending } = useCreateCheckoutSession();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  const handleUpgrade = () => {
    createCheckout({ returnUrl: window.location.href, billingPeriod });
  };

  const yearlyPrice = 44.99;
  const monthlyPrice = 4.99;
  const yearlySavings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
          <p className="text-muted-foreground">
            Unlock {feature} and more Pro features.
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-4">
          <div className="bg-muted p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                billingPeriod === 'yearly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                -{yearlySavings}%
              </span>
            </button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="font-semibold mb-3">Pro includes:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <strong>Unlimited memory journals</strong>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Up to 15 contributors per journal
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <strong>SMS prompts enabled</strong>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Premium templates
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Watermark-free PDF exports
            </li>
          </ul>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold">
              ${billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice}
            </span>
            <span className="text-muted-foreground">
              /{billingPeriod === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          {billingPeriod === 'yearly' && (
            <p className="text-sm text-green-600 mt-1">
              Just ${(yearlyPrice / 12).toFixed(2)}/month
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleUpgrade} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              `Upgrade Now${billingPeriod === 'yearly' ? ' - Save ' + yearlySavings + '%' : ''}`
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Cancel anytime. You'll keep Pro access until your billing period ends.
        </p>
      </div>
    </div>
  );
}
