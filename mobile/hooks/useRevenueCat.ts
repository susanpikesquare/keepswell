import { useContext, useCallback } from 'react';
import { Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { paymentsApi } from '../api/payments';

export function useRevenueCat() {
  return useContext(RevenueCatContext);
}

export function usePurchase() {
  const { initialized } = useRevenueCat();

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (!initialized) {
      Alert.alert('Not Ready', 'Purchase system is still loading. Please try again.');
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywall();

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Sync with backend immediately
          try {
            await paymentsApi.syncRevenueCat();
          } catch {
            // Non-critical — webhook will sync eventually
          }
          return true;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        default:
          return false;
      }
    } catch (error) {
      console.error('Paywall error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return false;
    }
  }, [initialized]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!initialized) {
      Alert.alert('Not Ready', 'Purchase system is still loading. Please try again.');
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;

      if (hasEntitlement) {
        // Sync with backend
        try {
          await paymentsApi.syncRevenueCat();
        } catch {
          // Non-critical
        }
        Alert.alert('Restored', 'Your purchases have been restored.');
        return true;
      } else {
        Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
        return false;
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      return false;
    }
  }, [initialized]);

  return { presentPaywall, restorePurchases };
}
