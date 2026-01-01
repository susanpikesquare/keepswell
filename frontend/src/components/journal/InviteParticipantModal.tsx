import { useState } from 'react';
import { UserPlus, Phone, User, Heart } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { useInviteParticipant } from '../../hooks';

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

  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

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

    // Validate phone number
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      await inviteParticipant.mutateAsync({
        journalId,
        data: {
          phone_number: `+1${digits}`,
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

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            <Phone className="h-4 w-4 inline mr-1" />
            Phone Number *
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            required
          />
        </div>

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

        {/* SMS Consent Disclosure */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
          <p>
            <strong>SMS Consent:</strong> By inviting this person, you confirm they have agreed
            to receive text messages from Keepswell (a service of PikeSquare, LLC) at the phone
            number provided. They will receive an invitation SMS asking them to reply YES to
            confirm their participation.
          </p>
          <p>
            Message frequency varies based on journal settings. Message and data rates may apply.
            They can reply STOP at any time to opt out, or HELP for assistance.
          </p>
        </div>

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
            disabled={inviteParticipant.isPending}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {inviteParticipant.isPending ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
