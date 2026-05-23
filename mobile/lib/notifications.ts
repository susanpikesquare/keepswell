// Push notification helpers. Two responsibilities:
//   1) On sign-in: ask the OS for notification permission, fetch the device's
//      Expo push token, and POST it to our backend so the backend can target
//      this user/device.
//   2) Configure how arriving notifications behave when the app is foregrounded
//      (we still show banners so the user knows new memories arrived).
//
// Deep-linking from notification taps is handled separately in _layout via
// addNotificationResponseReceivedListener.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';

// When a notification arrives with the app open, show the banner anyway so the
// user knows a new memory/comment/etc. just landed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const TOKEN_REGISTER_ENDPOINT = '/notifications/tokens';

/**
 * Request permission and register this device's Expo push token with our
 * backend. Returns the token string on success, or null if the user denied
 * permission or we're on a non-physical device (simulator).
 */
export async function registerPushTokenWithBackend(): Promise<string | null> {
  // Push tokens don't work on the iOS simulator
  if (!Device.isDevice) {
    console.warn('[push] Skipping push token: not a physical device');
    return null;
  }

  // Android channel setup (no-op on iOS but cheap to do unconditionally)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  // Permission. iOS prompts the user the first time only.
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }
  if (status !== 'granted') {
    console.log('[push] User declined notification permission');
    return null;
  }

  // Fetch the Expo push token. We pass the EAS projectId so Expo's push
  // service knows which app this is for.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] No EAS projectId in app.json; cannot get push token');
    return null;
  }

  let tokenResponse: { data: string };
  try {
    tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch (err) {
    console.error('[push] getExpoPushTokenAsync failed:', err);
    return null;
  }
  const token = tokenResponse.data;

  // POST to backend. The apiClient already attaches the Clerk session token
  // via its request interceptor, so this is authenticated.
  try {
    await apiClient.post(TOKEN_REGISTER_ENDPOINT, {
      token,
      platform: Platform.OS,
      device_name: Device.deviceName ?? undefined,
    });
    console.log('[push] Token registered with backend');
  } catch (err: any) {
    console.warn('[push] Backend register failed:', err?.message ?? err);
    // Don't bubble — the rest of the app stays functional without push.
  }

  return token;
}

/**
 * Unregister this device's token from the backend (call on sign-out so the
 * next user on this device doesn't receive someone else's notifications).
 */
export async function unregisterPushTokenWithBackend(token: string): Promise<void> {
  try {
    await apiClient.delete(`${TOKEN_REGISTER_ENDPOINT}/${encodeURIComponent(token)}`);
  } catch (err: any) {
    console.warn('[push] Backend unregister failed:', err?.message ?? err);
  }
}
