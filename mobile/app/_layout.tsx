import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { tokenCache } from '@/lib/tokenCache';
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';

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
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RevenueCatProvider>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
          </QueryClientProvider>
        </RevenueCatProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

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
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
