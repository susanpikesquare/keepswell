import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const BRAND_COLOR = '#6366F1';

interface Slide {
  id: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'book',
    title: 'Capture Family Memories',
    description:
      'Create beautiful memory journals for weddings, birthdays, family history, and more.',
  },
  {
    id: '2',
    icon: 'comments',
    title: 'Collect Stories via SMS',
    description:
      'Send text prompts to family and friends. They reply by text — no app needed for contributors.',
  },
  {
    id: '3',
    icon: 'heart',
    title: 'Treasure Forever',
    description:
      'Turn collected memories into a keepsake book you can share, print, or export as PDF.',
  },
];

const ONBOARDING_KEY = 'onboarding_complete';

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleFinish = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)/sign-up');
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)/sign-up');
  };

  const handleSignIn = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)/sign-in');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <FontAwesome name={item.icon} size={80} color={BRAND_COLOR} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={styles.bottomSection}>
        <View style={styles.dotContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={isLastSlide ? handleFinish : handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignIn} style={styles.signInLink}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  skipButton: {
    padding: 8,
    minWidth: 50,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: BRAND_COLOR,
    width: 24,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: BRAND_COLOR,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  signInLink: {
    padding: 8,
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInTextBold: {
    color: BRAND_COLOR,
    fontWeight: '600',
  },
});
