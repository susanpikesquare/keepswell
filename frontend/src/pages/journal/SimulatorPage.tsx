import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, Phone, CheckCircle } from 'lucide-react';
import {
  useJournal,
  useParticipants,
  useSimulateEntry,
  useInviteParticipant,
  useAuthSync,
} from '../../hooks';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  PageLoader,
} from '../../components/ui';

export function SimulatorPage() {
  const { id: journalId } = useParams<{ id: string }>();
  const { isLoaded } = useAuthSync();
  const { data: journal, isLoading: journalLoading } = useJournal(journalId || '');
  const { data: participants, isLoading: participantsLoading, refetch: refetchParticipants } = useParticipants(journalId || '');
  const simulateEntry = useSimulateEntry(journalId || '');
  const inviteParticipant = useInviteParticipant();

  // Form state
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [success, setSuccess] = useState(false);

  // New participant form
  const [showNewParticipant, setShowNewParticipant] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');

  if (!isLoaded || journalLoading || participantsLoading) {
    return <PageLoader />;
  }

  if (!journal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Journal not found.</p>
          <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalId) return;
    try {
      const participant = await inviteParticipant.mutateAsync({
        journalId,
        data: {
          display_name: newName,
          phone_number: newPhone,
          relationship: newRelationship || undefined,
        },
      });
      setSelectedParticipant(participant.id);
      setShowNewParticipant(false);
      setNewName('');
      setNewPhone('');
      setNewRelationship('');
      refetchParticipants();
    } catch (error) {
      console.error('Failed to add participant:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !message.trim()) return;

    try {
      await simulateEntry.mutateAsync({
        participant_id: selectedParticipant,
        content: message,
        media_urls: imageUrl ? [imageUrl] : undefined,
      });
      setSuccess(true);
      setMessage('');
      setImageUrl('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to simulate entry:', error);
    }
  };

  const participantList = participants || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        to={`/journals/${journalId}`}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {journal.title}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SMS Simulator</h1>
        <p className="text-muted-foreground">
          Test the SMS response flow without actually sending texts. Simulate responses from
          participants to see how entries appear in the journal.
        </p>
      </div>

      {/* Participant Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Participant
          </CardTitle>
          <CardDescription>
            Choose who is sending this simulated SMS response
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participantList.length > 0 ? (
            <div className="space-y-2">
              {participantList.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedParticipant === p.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="participant"
                    value={p.id}
                    checked={selectedParticipant === p.id}
                    onChange={(e) => setSelectedParticipant(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedParticipant === p.id ? 'border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {selectedParticipant === p.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{p.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.relationship && `${p.relationship} • `}
                      {p.phone_number}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No participants yet. Add one to get started.
            </p>
          )}

          {!showNewParticipant ? (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowNewParticipant(true)}
            >
              <User className="h-4 w-4 mr-2" />
              Add Test Participant
            </Button>
          ) : (
            <form onSubmit={handleAddParticipant} className="mt-4 space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Add Test Participant</h4>
              <Input
                label="Name"
                placeholder="e.g., Grandma Rose"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                label="Phone Number"
                placeholder="e.g., +1 555-123-4567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
              <Input
                label="Relationship (optional)"
                placeholder="e.g., Grandmother"
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={inviteParticipant.isPending}>
                  {inviteParticipant.isPending ? 'Adding...' : 'Add Participant'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewParticipant(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Simulated SMS Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Simulated SMS Response
          </CardTitle>
          <CardDescription>
            Enter the text message and optional photo URL as if the participant sent it via SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Message
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type the simulated SMS response here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Input
              label="Photo URL (optional)"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />

            {imageUrl && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span>Entry created successfully! View it in the journal timeline.</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!selectedParticipant || !message.trim() || simulateEntry.isPending}
            >
              {simulateEntry.isPending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Simulate SMS Response
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link
          to={`/journals/${journalId}`}
          className="text-primary hover:underline"
        >
          View Journal Timeline →
        </Link>
      </div>
    </div>
  );
}
