import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Clock, AlertTriangle, Sparkles, Check, Image, X, MessageSquare, Copy, CheckCircle } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { useUpdateJournal, useDeleteJournal, useGenerateDemoData } from '../../hooks';
import type { Journal } from '../../types';

// SMS phone number (Telnyx number)
const SMS_PHONE_NUMBER = '+1 (916) 439-8709';

// Cover image templates - using Unsplash for high-quality free images
const COVER_TEMPLATES = [
  {
    id: 'family-1',
    name: 'Warm Sunset',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=400&fit=crop',
    category: 'family',
  },
  {
    id: 'family-2',
    name: 'Cozy Home',
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop',
    category: 'family',
  },
  {
    id: 'nature-1',
    name: 'Mountain View',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    category: 'nature',
  },
  {
    id: 'nature-2',
    name: 'Ocean Waves',
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=400&fit=crop',
    category: 'nature',
  },
  {
    id: 'minimal-1',
    name: 'Soft Gradient',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
    category: 'minimal',
  },
  {
    id: 'minimal-2',
    name: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
    category: 'minimal',
  },
  {
    id: 'floral-1',
    name: 'Spring Flowers',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=400&fit=crop',
    category: 'floral',
  },
  {
    id: 'vintage-1',
    name: 'Vintage Paper',
    url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=1200&h=400&fit=crop',
    category: 'vintage',
  },
];

interface JournalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: Journal;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

type PromptFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export function JournalSettingsModal({ isOpen, onClose, journal }: JournalSettingsModalProps) {
  const navigate = useNavigate();
  const updateJournal = useUpdateJournal();
  const deleteJournal = useDeleteJournal();
  const generateDemoData = useGenerateDemoData();

  // Schedule settings
  const [frequency, setFrequency] = useState<PromptFrequency>(journal.prompt_frequency as PromptFrequency);

  // Demo data state
  const [demoResult, setDemoResult] = useState<{ entriesCreated: number; participantsCreated: number } | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(journal.prompt_day_of_week ?? 1);
  const [promptTime, setPromptTime] = useState(journal.prompt_time?.slice(0, 5) || '09:00');
  const [timezone, setTimezone] = useState(journal.timezone);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Cover image
  const [coverImage, setCoverImage] = useState(journal.cover_image_url || '');
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const hasScheduleChanges =
    frequency !== journal.prompt_frequency ||
    dayOfWeek !== journal.prompt_day_of_week ||
    promptTime !== journal.prompt_time?.slice(0, 5) ||
    timezone !== journal.timezone;

  const handleSaveSchedule = async () => {
    try {
      await updateJournal.mutateAsync({
        id: journal.id,
        data: {
          prompt_frequency: frequency,
          prompt_day_of_week: frequency !== 'daily' ? dayOfWeek : undefined,
          prompt_time: promptTime,
          timezone,
        },
      });
      onClose();
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== journal.title) return;

    try {
      await deleteJournal.mutateAsync(journal.id);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete journal:', error);
    }
  };

  const handleGenerateDemoData = async () => {
    try {
      const result = await generateDemoData.mutateAsync(journal.id);
      setDemoResult(result);
    } catch (error) {
      console.error('Failed to generate demo data:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Journal Settings"
      description={journal.title}
      size="lg"
    >
      <div className="space-y-8">
        {/* SMS Join Section */}
        <section>
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4" />
            SMS Join Info
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share this info so people can join your journal by text message.
          </p>

          <div className="space-y-3">
            {/* Phone Number */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">SMS Number</p>
                <p className="font-mono font-medium">{SMS_PHONE_NUMBER}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(SMS_PHONE_NUMBER.replace(/[^0-9+]/g, ''), 'phone')}
              >
                {copiedField === 'phone' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Join Keyword */}
            {journal.join_keyword && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Join Keyword</p>
                  <p className="font-mono font-medium">JOIN {journal.join_keyword}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(`JOIN ${journal.join_keyword}`, 'keyword')}
                >
                  {copiedField === 'keyword' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Full Instructions */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">How to join:</p>
              <p className="text-sm text-muted-foreground">
                Text <span className="font-mono font-medium bg-background px-1.5 py-0.5 rounded">JOIN {journal.join_keyword || 'KEYWORD'}</span> to{' '}
                <span className="font-mono font-medium bg-background px-1.5 py-0.5 rounded">{SMS_PHONE_NUMBER}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleCopy(`Text "JOIN ${journal.join_keyword || 'KEYWORD'}" to ${SMS_PHONE_NUMBER} to join our memory journal!`, 'instructions')}
              >
                {copiedField === 'instructions' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Instructions
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Cover Image Section */}
        <section className="border-t pt-6">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Image className="h-4 w-4" />
            Cover Image
          </h3>

          {/* Current cover preview */}
          <div className="mb-4">
            {coverImage ? (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No cover image selected</p>
              </div>
            )}
          </div>

          {/* Cover picker toggle */}
          {!showCoverPicker ? (
            <Button
              variant="outline"
              onClick={() => setShowCoverPicker(true)}
              className="w-full"
            >
              <Image className="h-4 w-4 mr-2" />
              {coverImage ? 'Change Cover Image' : 'Add Cover Image'}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Template grid */}
              <div>
                <p className="text-sm font-medium mb-2">Choose a template</p>
                <div className="grid grid-cols-4 gap-2">
                  {COVER_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setCoverImage(template.url);
                        setShowCoverPicker(false);
                      }}
                      className={`relative aspect-[3/1] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                        coverImage === template.url
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <img
                        src={template.url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      {coverImage === template.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL input */}
              <div>
                <p className="text-sm font-medium mb-2">Or enter an image URL</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={coverImage.startsWith('https://images.unsplash.com') ? '' : coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCoverPicker(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Save cover changes */}
          {coverImage !== (journal.cover_image_url || '') && (
            <Button
              onClick={async () => {
                try {
                  await updateJournal.mutateAsync({
                    id: journal.id,
                    data: { cover_image_url: coverImage || null },
                  });
                } catch (error) {
                  console.error('Failed to update cover:', error);
                }
              }}
              disabled={updateJournal.isPending}
              className="w-full mt-4"
            >
              {updateJournal.isPending ? 'Saving...' : 'Save Cover Image'}
            </Button>
          )}
        </section>

        {/* Prompt Schedule Section */}
        <section className="border-t pt-6">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            Prompt Schedule
          </h3>

          <div className="grid gap-4">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PromptFrequency)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week (only for non-daily) */}
            {frequency !== 'daily' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Time</label>
              <input
                type="time"
                value={promptTime}
                onChange={(e) => setPromptTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {hasScheduleChanges && (
              <Button
                onClick={handleSaveSchedule}
                disabled={updateJournal.isPending}
                className="w-full"
              >
                {updateJournal.isPending ? 'Saving...' : 'Save Schedule Changes'}
              </Button>
            )}
          </div>
        </section>

        {/* Demo Data Section */}
        <section className="border-t pt-6">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4" />
            Demo Mode
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate sample entries and participants to see how your journal will look with real content.
            Perfect for demos and testing.
          </p>

          {demoResult ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                <Check className="h-4 w-4" />
                Demo data generated!
              </div>
              <p className="text-sm text-green-700">
                Created {demoResult.entriesCreated} entries
                {demoResult.participantsCreated > 0 && ` and ${demoResult.participantsCreated} participants`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setDemoResult(null);
                  onClose();
                }}
              >
                View Journal
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleGenerateDemoData}
              disabled={generateDemoData.isPending}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateDemoData.isPending ? 'Generating...' : 'Generate Demo Data'}
            </Button>
          )}
        </section>

        {/* Danger Zone */}
        <section className="border-t pt-6">
          <h3 className="font-medium flex items-center gap-2 mb-4 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h3>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Journal
            </Button>
          ) : (
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <p className="text-sm font-medium text-destructive mb-2">
                This will permanently delete this journal and all its entries.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Type <strong>{journal.title}</strong> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type journal title to confirm"
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== journal.title || deleteJournal.isPending}
                  className="flex-1"
                >
                  {deleteJournal.isPending ? 'Deleting...' : 'Delete Forever'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
