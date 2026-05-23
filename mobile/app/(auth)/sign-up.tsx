import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSignUp = async () => {
    if (!isLoaded) return;

    // Require all three fields up front so Clerk's sign-up never starts in a
    // half-state that can't be completed (Steve B. hit this: an email-only
    // sign-up that left firstName empty got stuck at missing_requirements
    // after verification, so the User was never actually created).
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    if (!password) {
      Alert.alert('Password required', 'Please enter a password.');
      return;
    }
    if (!legalAccepted) {
      Alert.alert(
        'Please accept the terms',
        'You need to agree to the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    const firstName = fullName.trim().split(/\s+/)[0];
    const lastName = fullName.trim().split(/\s+/).slice(1).join(' ');

    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName: lastName || undefined,
        // Clerk requires express consent to legal documents (Configure →
        // Legal in the Clerk dashboard). We collect that via the checkbox
        // below; passing legalAccepted lets Clerk record the consent and
        // complete the sign-up after email verification.
        legalAccepted: true,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      Alert.alert(
        'Sign-up failed',
        err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to sign up. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // Log everything we know about the attempt so TestFlight crash logs
      // and Clerk dashboard logs can be cross-referenced.
      console.log('[sign-up] verify attempt result:', {
        status: signUpAttempt.status,
        missingFields: signUpAttempt.missingFields,
        unverifiedFields: signUpAttempt.unverifiedFields,
        createdSessionId: signUpAttempt.createdSessionId,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      // Status is 'missing_requirements' (or 'abandoned'): the email is verified
      // but Clerk requires more attributes before the User record is created.
      // Surface exactly what's missing so the user (and we) can act.
      if (signUpAttempt.status === 'missing_requirements') {
        const missing = signUpAttempt.missingFields ?? [];
        const unverified = signUpAttempt.unverifiedFields ?? [];
        const both = [...missing, ...unverified];

        // Be specific so users aren't stuck guessing.
        const messageBits: string[] = [];
        if (missing.includes('first_name') || missing.includes('last_name')) {
          messageBits.push('Please enter your full name on the previous step.');
        }
        if (unverified.includes('phone_number') || missing.includes('phone_number')) {
          messageBits.push('A phone number is required for your account.');
        }
        if (missing.includes('username')) {
          messageBits.push('A username is required.');
        }

        Alert.alert(
          'Almost there',
          messageBits.length > 0
            ? messageBits.join(' ')
            : `Your email is verified, but the account isn't complete yet. ` +
              `Missing: ${both.join(', ') || 'unknown'}. Please contact support@keepswell.com.`
        );
        return;
      }

      // Some other unexpected status
      Alert.alert(
        'Verification incomplete',
        `Got unexpected status "${signUpAttempt.status}". Please contact support@keepswell.com.`
      );
    } catch (err: any) {
      console.error('Verification error:', err);

      // Clerk returns a specific error code for "already verified". Don't
      // surface that as "invalid code" — it almost always means the previous
      // attempt actually succeeded and we just need to look at the SignUp
      // object's current state.
      const errCode = err.errors?.[0]?.code;
      if (errCode === 'verification_already_verified') {
        Alert.alert(
          'Already verified',
          'Your email is already verified. If you still see this, your account may be missing required fields. Please contact support@keepswell.com.'
        );
      } else {
        Alert.alert(
          'Verification error',
          err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>
                We sent a verification code to {email}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter code"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Keepswell</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            {/* Terms / Privacy consent — required by Clerk (Configure → Legal). */}
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => setLegalAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}>
                {legalAccepted && (
                  <FontAwesome name="check" size={12} color="#fff" />
                )}
              </View>
              <Text style={styles.legalText}>
                I agree to the{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => Linking.openURL('https://keepswell.com/terms')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => Linking.openURL('https://keepswell.com/privacy')}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, (loading || !legalAccepted) && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  button: {
    height: 48,
    backgroundColor: '#D86F5C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  linkText: {
    color: '#D86F5C',
    fontSize: 14,
    fontWeight: '600',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#D86F5C',
    borderColor: '#D86F5C',
  },
  legalText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
  legalLink: {
    color: '#D86F5C',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
