import { useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useIsPremium } from '../../hooks';
import { UpgradeModal } from './UpgradeModal';

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
  showLock?: boolean;
}

export function FeatureGate({ children, feature, fallback, showLock = true }: FeatureGateProps) {
  const { isPremium, isLoading } = useIsPremium();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return null;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="relative group cursor-pointer"
      >
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        {showLock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
            <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
              <Lock className="h-5 w-5 text-primary" />
            </div>
          </div>
        )}
      </button>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
      />
    </>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
      <Lock className="h-3 w-3" />
      Premium
    </span>
  );
}
