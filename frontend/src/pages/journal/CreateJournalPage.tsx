import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, Plane, BookOpen, Crown, Users, ChevronDown, ChevronUp, MessageCircle, Camera, Lightbulb } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import { useCreateJournal, useStarterPrompts } from '../../hooks';
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

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('family');
  const [expandedTemplate, setExpandedTemplate] = useState<TemplateType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Get all template types from themes
  const templates = getTemplateTypes().map((type) => templateInfo[type]);

  const togglePromptPreview = (type: TemplateType, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't select template when clicking preview
    setExpandedTemplate(expandedTemplate === type ? null : type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const journal = await createJournal.mutateAsync({
        title,
        description: description || undefined,
        template_type: selectedTemplate,
      });

      navigate(`/journals/${journal.id}`);
    } catch (error) {
      console.error('Failed to create journal:', error);
    }
  };

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
                    : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedTemplate(template.type)}
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
    </div>
  );
}
