import { createContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { useUser } from '@clerk/clerk-expo';

// API key is read from env. In dev (Expo Go / `expo run:ios`) a test key
// (`test_...`) is fine; in TestFlight / App Store builds RevenueCat refuses
// to start with a test key and closes the app, so we require a production
// key for non-dev builds.
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';

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
    // Skip init entirely if no key configured (e.g. TestFlight builds where we
    // haven't wired up a production key yet). The app stays usable; IAP just
    // won't be available until a key is provided.
    if (!REVENUECAT_API_KEY) {
      console.warn(
        '[RevenueCat] No API key configured (EXPO_PUBLIC_REVENUECAT_IOS_KEY). Skipping init; IAP disabled.'
      );
      setLoading(false);
      return;
    }

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
