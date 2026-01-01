import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, AlertCircle, Heart, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useSendVerificationCode, useVerifyAndGetSharedJournal } from '../../hooks';
import { MemoryTimeline } from '../../components/journal/MemoryTimeline';
import { Button } from '../../components/ui';
import type { TemplateType, Entry, Journal } from '../../types';

type VerificationStep = 'phone' | 'code' | 'verified';

export function SharedBookPage() {
  const { token } = useParams<{ token: string }>();

  // Verification state
  const [step, setStep] = useState<VerificationStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Verified journal data
  const [verifiedData, setVerifiedData] = useState<{
    journal: Partial<Journal>;
    entries: Entry[];
  } | null>(null);

  const sendCodeMutation = useSendVerificationCode();
  const verifyMutation = useVerifyAndGetSharedJournal();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 6
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(digits);
    setError(null);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Extract just the digits
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      await sendCodeMutation.mutateAsync({
        token: token || '',
        phoneNumber: `+1${digits}`,
      });
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    const digits = phoneNumber.replace(/\D/g, '');

    try {
      const data = await verifyMutation.mutateAsync({
        token: token || '',
        phoneNumber: `+1${digits}`,
        code: verificationCode,
      });
      setVerifiedData(data);
      setStep('verified');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    }
  };

  const handleResendCode = async () => {
    setError(null);
    const digits = phoneNumber.replace(/\D/g, '');

    try {
      await sendCodeMutation.mutateAsync({
        token: token || '',
        phoneNumber: `+1${digits}`,
      });
      setVerificationCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  // Show verification UI if not verified
  if (step !== 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Private Memory Book
            </h1>
            <p className="text-slate-600">
              {step === 'phone'
                ? 'Enter your phone number to verify your access to this memory book.'
                : 'Enter the 6-digit code sent to your phone.'}
            </p>
          </div>

          {/* Verification Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {step === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(555) 555-5555"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    US numbers only. We'll send a verification code via SMS.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendCodeMutation.isPending}
                >
                  {sendCodeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    placeholder="000000"
                    className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-2xl text-center tracking-[0.5em] font-mono"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-slate-500 text-center">
                    Code sent to {phoneNumber}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & View Memory Book
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setVerificationCode('');
                      setError(null);
                    }}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={sendCodeMutation.isPending}
                    className="text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    {sendCodeMutation.isPending ? 'Sending...' : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info text */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Only participants invited to this memory book can view it.
            Your phone number must match the one used when you were invited.
          </p>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              Create your own Memory Book →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show the verified journal
  const { journal, entries } = verifiedData!;

  return (
    <div className="min-h-screen">
      {/* Shared header banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Shared Memory Book</span>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">
            Create your own →
          </Link>
        </div>
      </div>

      {/* Memory Timeline */}
      <MemoryTimeline
        entries={entries as Entry[]}
        templateType={(journal.template_type as TemplateType) || 'custom'}
        journalTitle={journal.title || 'Memory Book'}
      />

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Create Your Own Memory Book
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Collect stories, photos, and cherished moments from the people you love.
            Send prompts via text and watch the memories flow in.
          </p>
          <Link to="/">
            <Button size="lg">
              <Heart className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
