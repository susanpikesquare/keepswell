import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Clock, AlertTriangle, Sparkles, Check } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { useUpdateJournal, useDeleteJournal, useGenerateDemoData } from '../../hooks';
import type { Journal } from '../../types';

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
        {/* Prompt Schedule Section */}
        <section>
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
