import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';

import { useColorScheme } from '@/components/useColorScheme';
import { tokenCache } from '@/lib/tokenCache';
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';
import { registerPushTokenWithBackend } from '@/lib/notifications';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
          <RevenueCatProvider>
            <QueryClientProvider client={queryClient}>
              <RootLayoutNav />
            </QueryClientProvider>
          </RevenueCatProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((value) => {
      setHasOnboarded(value === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !onboardingChecked) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      if (hasOnboarded) {
        router.replace('/(auth)/sign-in');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } else if (isSignedIn && inAuthGroup) {
      // Redirect to home if signed in and in auth group
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, segments, onboardingChecked, hasOnboarded]);

  // Defense-in-depth: if the signed-in user identity ever transitions
  // (sign-out → sign-in as someone else, or sign-in as a different user
  // than was last cached), clear React Query so we never serve one user's
  // cached journals/entries/participants to another. Sign-out also clears
  // the cache explicitly in settings.tsx; this catches paths that don't go
  // through that handler.
  useEffect(() => {
    if (!isLoaded) return;
    const prev = previousUserIdRef.current;
    if (prev !== undefined && prev !== userId) {
      console.log(`[auth] user transition (${prev} → ${userId}); clearing query cache`);
      queryClient.clear();
    }
    previousUserIdRef.current = userId;
  }, [isLoaded, userId, queryClient]);

  // Register push token with the backend whenever the user is signed in.
  // Best-effort — failures don't break the app.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    registerPushTokenWithBackend().catch((err) =>
      console.warn('[push] registerPushTokenWithBackend threw:', err)
    );
  }, [isLoaded, isSignedIn]);

  // Handle taps on notifications: deep-link the user into the right journal
  // or entry based on the notification's `data` payload (set on the backend).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { kind?: string; journalId?: string; entryId?: string; promptSendId?: string }
        | undefined;

      // In-app prompt: route straight into the Prompts tab so the user can
      // pick which prompt to respond to. (We could deep-link directly into
      // add-entry, but landing on the feed keeps the multi-journal mental
      // model intact and lets us avoid stale prompt text.)
      if (data?.kind === 'prompt') {
        router.push('/(tabs)/prompts');
        return;
      }

      if (!data?.journalId) return;
      // For entries / comments / reactions, land the user on the journal
      // detail (which scrolls through entries). When we have a dedicated
      // entry-detail screen we can deep-link more precisely.
      router.push(`/journal/${data.journalId}`);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-journal"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add-entry"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="journal-settings/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="journal-book/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
