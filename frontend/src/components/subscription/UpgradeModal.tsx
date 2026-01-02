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

  if (!isOpen) return null;

  const handleUpgrade = () => {
    createCheckout(window.location.href);
  };

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
          <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-muted-foreground">
            Unlock {feature} and more premium features.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="font-semibold mb-3">Premium includes:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Unlimited participants per journal
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Premium templates
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Watermark-free PDF exports
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Order physical printed books
            </li>
          </ul>
        </div>

        <div className="flex items-baseline justify-center gap-1 mb-6">
          <span className="text-3xl font-bold">$9.99</span>
          <span className="text-muted-foreground">/month</span>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleUpgrade} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Upgrade Now'
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Cancel anytime. You'll keep premium access until your billing period ends.
        </p>
      </div>
    </div>
  );
}
