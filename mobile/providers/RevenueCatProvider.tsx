import { createContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { useUser } from '@clerk/clerk-expo';

const REVENUECAT_API_KEY = 'test_wKYmCLfOITeiUElHLjbvDQVafqi';

const ENTITLEMENTS = {
  PRO: 'Keepswell Pro',
} as const;

export interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  isEvent: boolean;
  loading: boolean;
  initialized: boolean;
}

export const RevenueCatContext = createContext<RevenueCatContextType>({
  customerInfo: null,
  isPro: false,
  isEvent: false,
  loading: true,
  initialized: false,
});

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const initRevenueCat = useCallback(async () => {
    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });

      setInitialized(true);

      // If user is signed in, identify them
      if (user?.id) {
        await Purchases.logIn(user.id);
      }

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      initRevenueCat();
    } else {
      setLoading(false);
    }
  }, [initRevenueCat]);

  // Listen for real-time customer info updates
  useEffect(() => {
    if (!initialized) return;

    const onCustomerInfoUpdate = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
    };
  }, [initialized]);

  // Re-identify when user changes
  useEffect(() => {
    if (!initialized || !user?.id) return;

    const identify = async () => {
      try {
        const { customerInfo: info } = await Purchases.logIn(user.id);
        setCustomerInfo(info);
      } catch (error) {
        console.error('RevenueCat logIn error:', error);
      }
    };

    identify();
  }, [initialized, user?.id]);

  const isPro =
    customerInfo !== null &&
    typeof customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== 'undefined';

  // Event pass would be a non-renewing purchase — check active entitlements or manage via backend
  const isEvent = false; // Managed via backend tier for now

  return (
    <RevenueCatContext.Provider value={{ customerInfo, isPro, isEvent, loading, initialized }}>
      {children}
    </RevenueCatContext.Provider>
  );
}
