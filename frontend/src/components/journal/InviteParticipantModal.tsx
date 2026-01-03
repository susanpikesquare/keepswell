import { useState } from 'react';
import { UserPlus, Phone, User, Heart, AlertCircle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal, Button, Input } from '../ui';
import { useInviteParticipant, useParticipants, useUsageLimits } from '../../hooks';

interface InviteParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalId: string;
}

const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Grandparent',
  'Child',
  'Sibling',
  'Spouse',
  'Partner',
  'Friend',
  'Aunt/Uncle',
  'Cousin',
  'Other',
];

export function InviteParticipantModal({ isOpen, onClose, journalId }: InviteParticipantModalProps) {
  const inviteParticipant = useInviteParticipant();
  const { data: participants } = useParticipants(journalId);
  const { data: usageLimits } = useUsageLimits();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [error, setError] = useState('');

  // Tier-based limits
  const isPro = usageLimits?.isPro ?? false;
  const smsEnabled = usageLimits?.smsEnabled ?? false;
  const maxContributors = isPro ? 15 : 3;
  const currentContributorCount = participants?.length ?? 0;
  const hasReachedContributorLimit = currentContributorCount >= maxContributors;

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter a name');
      return;
    }

    // Validate phone number if provided
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // If phone number is provided, SMS consent is required
    if (digits.length >= 10 && !smsConsent) {
      setError('Please confirm SMS consent before inviting');
      return;
    }

    try {
      await inviteParticipant.mutateAsync({
        journalId,
        data: {
          phone_number: digits.length >= 10 ? `+1${digits}` : undefined,
          display_name: displayName.trim(),
          relationship: relationship || undefined,
          email: email || undefined,
        },
      });

      // Reset form and close
      setPhoneNumber('');
      setDisplayName('');
      setRelationship('');
      setEmail('');
      setSmsConsent(false);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite participant');
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setDisplayName('');
    setRelationship('');
    setEmail('');
    setSmsConsent(false);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Participant"
      description="Add someone to receive prompts and share memories"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Contributor Limit Warning */}
        {hasReachedContributorLimit && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Contributor limit reached
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You've reached the maximum of {maxContributors} contributors{!isPro && ' on the free plan'}.{' '}
                  {!isPro && (
                    <>
                      <Link to="/pricing" className="text-primary hover:underline font-medium">
                        Upgrade to Pro
                      </Link>{' '}
                      for up to 15 contributors per journal.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contributor Count */}
        {!hasReachedContributorLimit && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <span>Contributors</span>
            <span className="font-medium">{currentContributorCount} / {maxContributors}</span>
          </div>
        )}

        {/* Phone Number - Pro only */}
        {smsEnabled ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional - provide to send SMS prompts
            </p>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  SMS prompts require Pro
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This contributor will access prompts through the web dashboard.{' '}
                  <Link to="/pricing" className="text-primary hover:underline font-medium">
                    Upgrade to Pro
                  </Link>{' '}
                  to enable SMS prompts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            <User className="h-4 w-4 inline mr-1" />
            Name *
          </label>
          <Input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Mom, Dad, Grandma..."
            required
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            <Heart className="h-4 w-4 inline mr-1" />
            Relationship
          </label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select relationship (optional)</option>
            {RELATIONSHIP_OPTIONS.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Email (optional)
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
          <p className="text-xs text-muted-foreground mt-1">
            For sending a link to view the memory book
          </p>
        </div>

        {/* SMS Consent Checkbox - Only show when phone number is entered and SMS is enabled */}
        {smsEnabled && phoneNumber.replace(/\D/g, '').length >= 10 && (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">
                I confirm this person has agreed to receive SMS messages from Keepswell
              </span>
            </label>

            {/* SMS Consent Text */}
            <div className="mt-3 ml-7 text-xs text-muted-foreground space-y-2">
              <p>
                <strong>SMS Consent:</strong> By inviting this person, you confirm they have agreed
                to receive text messages from Keepswell (a service of PikeSquare, LLC) at the phone
                number provided. They will receive an invitation SMS asking them to reply YES to
                confirm their participation. Message frequency varies based on journal settings.
                Message and data rates may apply. They can reply STOP at any time to opt out, or
                HELP for assistance.
              </p>
              <p>
                <strong>Your mobile information will not be sold or shared with third parties for
                promotional or marketing purposes.</strong>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={inviteParticipant.isPending || hasReachedContributorLimit}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {inviteParticipant.isPending ? 'Inviting...' : 'Add Contributor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
