import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, AlertCircle, Heart, Users, Plane, Sparkles, Phone, User, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { apiClient } from '../../api/client';

// Template icons
const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  family: Heart,
  friends: Users,
  romantic: Heart,
  vacation: Plane,
  custom: Sparkles,
};

type JournalInfo = {
  title: string;
  description: string | null;
  ownerName: string;
  templateType: string;
};

type PageState = 'loading' | 'not_found' | 'form' | 'submitting' | 'success';

export function JoinPage() {
  const { keyword } = useParams<{ keyword: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [journalInfo, setJournalInfo] = useState<JournalInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  // Fetch journal info on mount
  useEffect(() => {
    const fetchJournalInfo = async () => {
      if (!keyword) {
        setPageState('not_found');
        return;
      }

      try {
        const response = await apiClient.get(`/journals/join/${keyword}`);
        if (response.data.found) {
          setJournalInfo(response.data.journal);
          setPageState('form');
        } else {
          setPageState('not_found');
        }
      } catch (err) {
        setPageState('not_found');
      }
    };

    fetchJournalInfo();
  }, [keyword]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!smsConsent) {
      setError('Please check the SMS consent box to continue');
      return;
    }

    setPageState('submitting');

    try {
      const response = await apiClient.post(`/journals/join/${keyword}`, {
        phone_number: `+1${digits}`,
        display_name: displayName || undefined,
        relationship: relationship || undefined,
      });

      setSuccessMessage(response.data.message);
      setPageState('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit join request');
      setPageState('form');
    }
  };

  const IconComponent = journalInfo ? (templateIcons[journalInfo.templateType] || Users) : Users;

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Journal Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find a memory journal with this code. Please check the link and try again.
          </p>
          <Link to="/">
            <Button variant="outline">Go to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Request Sent!</h1>
          <p className="text-muted-foreground mb-6">{successMessage}</p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-left">
            <p className="font-medium mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>The journal owner will review your request</li>
              <li>You'll receive an SMS when approved</li>
              <li>Then you can start sharing memories!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">You're invited to join</p>
              <h1 className="text-xl font-bold">{journalInfo?.title}</h1>
            </div>
          </div>
          {journalInfo?.description && (
            <p className="text-white/90 text-sm mt-2">{journalInfo.description}</p>
          )}
          <p className="text-white/70 text-sm mt-2">
            Created by {journalInfo?.ownerName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-4">
            <UserPlus className="h-8 w-8 text-primary mx-auto mb-2" />
            <h2 className="font-semibold">Request to Join</h2>
            <p className="text-sm text-muted-foreground">
              Enter your details below. The owner will approve your request.
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll receive memory prompts and updates via SMS
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <User className="h-4 w-4 inline mr-1" />
              Your Name
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
            />
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Relationship to {journalInfo?.ownerName}
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select relationship...</option>
              <option value="Family">Family</option>
              <option value="Friend">Friend</option>
              <option value="Colleague">Colleague</option>
              <option value="Partner">Partner</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* SMS Consent Checkbox - Required by 10DLC compliance */}
          <div className="bg-muted/50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                I agree to receive SMS messages from Keepswell including memory prompts and journal notifications.
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-3 ml-7">
              By providing your phone number, you agree to receive SMS notifications from Keepswell.
              Message frequency may vary. Standard Message and Data Rates may apply.
              Reply STOP to opt out. Reply HELP for help.
              We will not share mobile information with third parties for promotional or marketing purposes.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pageState === 'submitting'}
          >
            {pageState === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              'Request to Join'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="bg-muted/30 px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3 inline mr-1" />
            Powered by <a href="/" className="text-primary hover:underline">Keepswell</a>
          </p>
        </div>
      </div>
    </div>
  );
}
