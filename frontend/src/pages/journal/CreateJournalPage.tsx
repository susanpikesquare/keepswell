import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, Plane, BookOpen, Crown, Users, ChevronDown, ChevronUp, MessageCircle, Camera, Lightbulb, Phone, AlertCircle, Lock } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import { UpgradeModal } from '../../components/subscription';
import { useCreateJournal, useStarterPrompts, useIsPremium, useUsageLimits } from '../../hooks';
import { cn } from '../../lib/utils';
import { templateInfo, getTemplateTypes } from '../../lib/themes';
import type { TemplateType } from '../../types';

// Map template icons
const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  sparkles: Sparkles,
  plane: Plane,
  book: BookOpen,
};

// Get icon component for a template
function getTemplateIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return templateIcons[iconName] || Users;
}

// Component to show prompt preview for a template
function PromptPreview({ templateType, isExpanded }: { templateType: TemplateType; isExpanded: boolean }) {
  const { data: prompts, isLoading } = useStarterPrompts(isExpanded ? templateType : '');

  if (!isExpanded) return null;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/30">
      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span>Sample prompts participants will receive:</span>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : prompts && prompts.length > 0 ? (
        <ul className="space-y-2">
          {prompts.slice(0, 5).map((prompt, index) => (
            <li key={prompt.id} className="text-sm text-foreground/80 flex items-start gap-2">
              <span className="text-muted-foreground">{index + 1}.</span>
              <span className="flex-1">
                <span className="italic">"{prompt.text}"</span>
                {/* Indicators */}
                <span className="ml-2 inline-flex gap-1">
                  {prompt.requires_photo && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      <Camera className="h-3 w-3" />
                      photo
                    </span>
                  )}
                  {prompt.is_deep && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                      <Lightbulb className="h-3 w-3" />
                      deep
                    </span>
                  )}
                </span>
              </span>
            </li>
          ))}
          {prompts.length > 5 && (
            <li className="text-xs text-muted-foreground">
              + {prompts.length - 5} more prompts available
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">No prompts available yet</p>
      )}
    </div>
  );
}

export function CreateJournalPage() {
  const navigate = useNavigate();
  const createJournal = useCreateJournal();
  const isPremium = useIsPremium();
  const { data: usageLimits, isLoading: limitsLoading } = useUsageLimits();

  // Tier-based limits
  const smsEnabled = usageLimits?.smsEnabled ?? false;
  const canCreateJournal = usageLimits?.canCreateJournal ?? true;
  const journalCount = usageLimits?.journalCount ?? 0;
  const maxJournals = usageLimits?.maxJournals ?? 1;

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('family');
  const [expandedTemplate, setExpandedTemplate] = useState<TemplateType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeOwner, setIncludeOwner] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleOwnerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnerPhone(formatPhoneNumber(e.target.value));
    setPhoneError(null); // Clear error when typing
  };

  // Get all template types from themes
  const templates = getTemplateTypes().map((type) => templateInfo[type]);

  const handleTemplateSelect = (template: typeof templates[0]) => {
    if (template.isPremium && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedTemplate(template.type);
  };

  const togglePromptPreview = (type: TemplateType, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't select template when clicking preview
    setExpandedTemplate(expandedTemplate === type ? null : type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    // Validate owner phone if they want to participate and have provided a phone
    const ownerPhoneDigits = ownerPhone.replace(/\D/g, '');

    // If including owner with a phone number, SMS consent is required
    if (includeOwner && ownerPhoneDigits.length > 0) {
      if (ownerPhoneDigits.length < 10) {
        setPhoneError('Please enter a valid 10-digit phone number');
        return;
      }
      if (!smsConsent) {
        setPhoneError('Please check the SMS consent box to receive text messages');
        return;
      }
    }

    try {
      const journal = await createJournal.mutateAsync({
        title,
        description: description || undefined,
        template_type: selectedTemplate,
        owner_phone: (includeOwner && smsConsent && ownerPhoneDigits.length >= 10) ? `+1${ownerPhoneDigits}` : undefined,
        owner_participate: includeOwner,
      });

      navigate(`/journals/${journal.id}`);
    } catch (error: any) {
      console.error('Failed to create journal:', error);
      setPhoneError(error.response?.data?.message || 'Failed to create journal. Please try again.');
    }
  };

  // Show journal limit reached screen for free users
  if (!limitsLoading && !canCreateJournal) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Journal Limit Reached</h1>
          <p className="text-muted-foreground mb-6">
            You've created {journalCount} of {maxJournals} journal{maxJournals !== 1 ? 's' : ''} on the free plan.
            Upgrade to Pro for unlimited journals.
          </p>
          <div className="space-y-3">
            <Link to="/pricing">
              <Button size="lg" className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
              View My Journals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => (step === 1 ? navigate('/dashboard') : setStep(1))}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Create a Memory Journal</h1>
      <p className="text-muted-foreground mb-8">
        {step === 1 ? 'Choose a template to get started' : 'Give your journal a name'}
      </p>

      {step === 1 ? (
        <div className="space-y-4">
          {templates.map((template) => {
            const IconComponent = getTemplateIcon(template.icon);
            return (
              <Card
                key={template.type}
                className={cn(
                  'cursor-pointer transition-all relative overflow-hidden',
                  selectedTemplate === template.type
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'hover:border-primary/50',
                  template.isPremium && !isPremium && 'opacity-75'
                )}
                onClick={() => handleTemplateSelect(template)}
              >
                {/* Premium badge */}
                {template.isPremium && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium
                  </div>
                )}
                <CardHeader className="flex-row items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-full',
                    template.isPremium
                      ? `bg-gradient-to-br ${template.gradient} text-white`
                      : 'bg-primary/10'
                  )}>
                    <IconComponent className={cn(
                      'h-6 w-6',
                      template.isPremium ? 'text-white' : 'text-primary'
                    )} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">
                      {template.tagline}
                    </p>
                    {/* Preview prompts button */}
                    <button
                      type="button"
                      onClick={(e) => togglePromptPreview(template.type, e)}
                      className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      {expandedTemplate === template.type ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Hide sample prompts
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Preview sample prompts
                        </>
                      )}
                    </button>
                  </div>
                </CardHeader>
                <PromptPreview
                  templateType={template.type}
                  isExpanded={expandedTemplate === template.type}
                />
              </Card>
            );
          })}

          <Button className="w-full mt-6" size="lg" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Journal Title"
            placeholder="e.g., The Johnson Family Memories"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description (optional)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What's this journal about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Owner participation option */}
          <div className="border rounded-lg p-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOwner}
                onChange={(e) => setIncludeOwner(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-foreground">Include me as a contributor</span>
                <p className="text-sm text-muted-foreground">
                  {smsEnabled
                    ? 'Receive prompts via SMS and contribute my own memories to this journal'
                    : 'Access prompts through the web dashboard and contribute my own memories'}
                </p>
              </div>
            </label>

            {includeOwner && (
              <div className="pl-7 space-y-3">
                {smsEnabled ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Your Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={ownerPhone}
                        onChange={handleOwnerPhoneChange}
                        placeholder="(555) 123-4567"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional - provide to receive prompts via SMS
                      </p>
                    </div>

                    {/* SMS Consent Checkbox - Required for SMS */}
                    {ownerPhone.replace(/\D/g, '').length >= 10 && (
                      <div className="bg-muted/50 rounded-lg p-4 border">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={smsConsent}
                            onChange={(e) => setSmsConsent(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-foreground">
                            I agree to receive SMS text messages from Keepswell at this number
                          </span>
                        </label>

                        {/* SMS Consent Text */}
                        <div className="mt-3 ml-7 text-xs text-muted-foreground space-y-2">
                          <p>
                            <strong>SMS Consent:</strong> By providing your phone number, you agree to receive
                            text messages from Keepswell (a service of PikeSquare, LLC) including journal prompts
                            and notifications. Message frequency varies based on journal settings. Message and
                            data rates may apply. Reply STOP at any time to opt out, or HELP for assistance.
                          </p>
                          <p>
                            <strong>Your mobile information will not be sold or shared with third parties for
                            promotional or marketing purposes.</strong>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <div className="flex items-start gap-3">
                      <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          SMS prompts require Pro
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          As a free user, you'll receive prompts through the web dashboard.{' '}
                          <Link to="/pricing" className="text-primary hover:underline font-medium">
                            Upgrade to Pro
                          </Link>{' '}
                          to receive SMS prompts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {phoneError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {phoneError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!title || createJournal.isPending}
          >
            {createJournal.isPending ? 'Creating...' : 'Create Journal'}
          </Button>
        </form>
      )}

      {/* Upgrade Modal for Premium Templates */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Premium journal templates with specialized prompts"
      />
    </div>
  );
}
