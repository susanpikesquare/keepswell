/**
 * PREMIUM AI LAYER ARCHITECTURE
 *
 * The AI layer ENHANCES the core experience without replacing user-generated content.
 * All AI features are:
 * - Opt-in per journal
 * - Non-destructive (original content is always preserved)
 * - Clearly labeled as AI-generated
 * - Reviewable/editable by users
 */

// =============================================================================
// AI SERVICE INTERFACES
// =============================================================================

/**
 * Main AI service interface for all premium features
 */
export interface AIService {
  // Prompt generation
  generateContextualPrompt(context: PromptContext): Promise<GeneratedPrompt>;
  generateFollowUpPrompt(entryId: string): Promise<GeneratedPrompt>;

  // Content analysis
  analyzeEntry(entryId: string): Promise<EntryAnalysis>;
  extractThemes(journalId: string): Promise<ThemeAnalysis>;
  identifyHighlights(journalId: string, count: number): Promise<string[]>;

  // Narrative generation
  generateChapterSummary(journalId: string, chapterRange: DateRange): Promise<NarrativeContent>;
  generateYearInReview(journalId: string, year: number): Promise<NarrativeContent>;
  generateBookNarrative(journalId: string): Promise<BookNarrative>;

  // Scheduling optimization
  optimizeSendTime(journalId: string, participantId: string): Promise<OptimalTime>;
  predictEngagement(journalId: string): Promise<EngagementPrediction>;
}

// =============================================================================
// PROMPT GENERATION
// =============================================================================

/**
 * Context provided to AI for generating prompts
 */
export interface PromptContext {
  journalId: string;
  templateType: string;

  // Recent history
  recentEntries: EntrySnapshot[];
  recentPrompts: PromptSnapshot[];

  // Participant info (optional for personalization)
  participant?: {
    id: string;
    relationship: string;
    responseCount: number;
    lastResponseAt?: Date;
  };

  // Template constraints
  categoryWeights: Record<string, number>;
  avoidTopics: string[];
  encourageTopics: string[];

  // Timing context
  currentDate: Date;
  dayOfWeek: number;
  isHoliday: boolean;
  holidayName?: string;
}

export interface EntrySnapshot {
  id: string;
  content: string;
  category?: string;
  createdAt: Date;
  hasMedia: boolean;
}

export interface PromptSnapshot {
  id: string;
  text: string;
  category: string;
  sentAt: Date;
  hadResponse: boolean;
}

/**
 * AI-generated prompt with metadata
 */
export interface GeneratedPrompt {
  text: string;
  category: string;
  tone: string;

  // Why this prompt was generated
  reasoning: string;

  // Confidence score (0-1)
  confidence: number;

  // References to context used
  basedOnEntryIds: string[];

  // Suggested follow-up if response received
  suggestedFollowUp?: string;

  // Generation metadata
  model: string;
  generatedAt: Date;
}

// =============================================================================
// CONTENT ANALYSIS
// =============================================================================

/**
 * Analysis of a single entry
 */
export interface EntryAnalysis {
  entryId: string;

  // Sentiment (-1 to 1)
  sentiment: {
    score: number;
    label: 'negative' | 'neutral' | 'positive' | 'very_positive';
  };

  // Detected topics/themes
  topics: string[];

  // Key phrases worth highlighting
  keyPhrases: string[];

  // Is this a significant/highlight-worthy entry?
  isHighlight: boolean;
  highlightReason?: string;

  // Suggested badges to award
  suggestedBadges: string[];

  // People mentioned
  mentionedPeople: string[];

  // Dates/events referenced
  temporalReferences: TemporalReference[];
}

export interface TemporalReference {
  text: string;           // "last Christmas"
  type: 'past' | 'future' | 'recurring';
  approximateDate?: Date;
}

/**
 * Theme analysis across a journal
 */
export interface ThemeAnalysis {
  journalId: string;
  analyzedEntryCount: number;

  // Top themes with frequency
  themes: Theme[];

  // Emotional arc over time
  emotionalArc: EmotionalDataPoint[];

  // Suggested chapter breaks based on topic shifts
  suggestedChapterBreaks: ChapterBreak[];

  // Participants' most common topics
  participantThemes: ParticipantTheme[];

  analyzedAt: Date;
}

export interface Theme {
  name: string;
  frequency: number;
  sentiment: number;
  representativeEntryIds: string[];
}

export interface EmotionalDataPoint {
  date: Date;
  sentiment: number;
  entryCount: number;
}

export interface ChapterBreak {
  afterEntryId: string;
  reason: string;
  suggestedTitle: string;
}

export interface ParticipantTheme {
  participantId: string;
  themes: string[];
  averageSentiment: number;
}

// =============================================================================
// NARRATIVE GENERATION
// =============================================================================

/**
 * AI-generated narrative content
 */
export interface NarrativeContent {
  id: string;
  journalId: string;
  type: 'chapter_summary' | 'year_in_review' | 'book_intro' | 'chapter_intro';

  // The generated content
  content: string;
  title?: string;

  // Source entries used
  sourceEntryIds: string[];

  // Writing style applied
  style: 'journalistic' | 'storytelling' | 'poetic' | 'casual';

  // User review status
  status: 'generated' | 'reviewed' | 'approved' | 'edited' | 'rejected';
  userEditedContent?: string;
  reviewedAt?: Date;
  reviewedBy?: string;

  // Generation metadata
  model: string;
  confidence: number;
  generatedAt: Date;
}

/**
 * Complete book narrative structure
 */
export interface BookNarrative {
  journalId: string;

  // Book-level content
  introduction: NarrativeContent;
  dedication?: string;

  // Chapter-by-chapter
  chapters: BookChapter[];

  // Epilogue/conclusion
  conclusion?: NarrativeContent;

  // Generation metadata
  totalWordCount: number;
  generatedAt: Date;
}

export interface BookChapter {
  number: number;
  title: string;
  introduction?: NarrativeContent;
  entryIds: string[];          // Entries in this chapter
  transitionToNext?: string;   // Smooth transition text
}

// =============================================================================
// SCHEDULING OPTIMIZATION
// =============================================================================

export interface OptimalTime {
  participantId: string;

  // Recommended send time
  recommendedTime: string;      // "HH:MM" format
  recommendedDay?: number;      // 0-6

  // Confidence and reasoning
  confidence: number;
  reasoning: string;

  // Historical data used
  basedOnResponseCount: number;
  averageResponseTimeMinutes: number;
}

export interface EngagementPrediction {
  journalId: string;

  // Overall health
  healthScore: number;         // 0-100

  // Participant engagement
  participantEngagement: ParticipantEngagement[];

  // Recommendations
  recommendations: EngagementRecommendation[];

  predictedAt: Date;
}

export interface ParticipantEngagement {
  participantId: string;
  responseRate: number;        // 0-1
  averageResponseTime: number; // minutes
  trend: 'increasing' | 'stable' | 'decreasing';
  riskOfChurn: 'low' | 'medium' | 'high';
}

export interface EngagementRecommendation {
  type: 'frequency' | 'timing' | 'content' | 'participant';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionable: boolean;
}

// =============================================================================
// AI HOOKS - WHERE AI INTEGRATES INTO THE SYSTEM
// =============================================================================

/**
 * Hook points where AI can enhance the experience
 * Each hook is triggered by an event and can produce AI content
 */
export const AI_HOOKS = {
  // PROMPT SELECTION
  beforePromptSelection: {
    trigger: 'When scheduler selects next prompt to send',
    input: 'PromptContext',
    output: 'GeneratedPrompt | null',
    fallback: 'Use standard prompt rotation',
    isPremium: true,
  },

  // ENTRY PROCESSING
  afterEntryCreated: {
    trigger: 'When a new entry is saved',
    input: 'Entry',
    output: 'EntryAnalysis',
    fallback: 'Skip analysis',
    isPremium: true,
  },

  // CHAPTER MANAGEMENT
  onChapterThreshold: {
    trigger: 'When chapter trigger condition is met',
    input: 'JournalId, EntryRange',
    output: 'ChapterBreak | null',
    fallback: 'Use date-based chapters',
    isPremium: true,
  },

  // RECAP GENERATION
  onRecapDue: {
    trigger: 'When periodic recap is scheduled',
    input: 'JournalId, DateRange',
    output: 'NarrativeContent',
    fallback: 'Use stats-only recap',
    isPremium: true,
  },

  // HIGHLIGHT CURATION
  onHighlightRequest: {
    trigger: 'When user views highlights or exports',
    input: 'JournalId, Count',
    output: 'EntryId[]',
    fallback: 'Use pinned entries only',
    isPremium: true,
  },

  // EXPORT ENHANCEMENT
  onBookExport: {
    trigger: 'When user exports to book format',
    input: 'JournalId, ExportConfig',
    output: 'BookNarrative',
    fallback: 'Export without narrative',
    isPremium: true,
  },

  // SCHEDULING OPTIMIZATION
  onScheduleOptimization: {
    trigger: 'Weekly optimization check',
    input: 'JournalId',
    output: 'OptimalTime[]',
    fallback: 'Use default schedule',
    isPremium: true,
  },
} as const;

// =============================================================================
// AI CONTENT STORAGE
// =============================================================================

/**
 * All AI-generated content is stored separately and linked to source content
 */
export interface AIContentRecord {
  id: string;
  journalId: string;
  type: keyof typeof AI_HOOKS;

  // The generated content (JSON)
  content: Record<string, unknown>;

  // Source references
  sourceEntryIds: string[];
  sourcePromptIds: string[];

  // Model info
  model: string;
  modelVersion: string;
  confidence: number;

  // User interaction
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  userEditedContent?: string;
  reviewedAt?: Date;
  reviewedBy?: string;

  // Timestamps
  generatedAt: Date;
  expiresAt?: Date;    // Some content may have limited relevance
}

// =============================================================================
// FREE VS PREMIUM AI FEATURES
// =============================================================================

export const AI_FEATURE_AVAILABILITY = {
  // FREE TIER - Basic functionality
  free: {
    promptRotation: true,              // Standard rotation algorithm
    basicStats: true,                  // Entry count, participant activity
    manualHighlights: true,            // User-pinned entries
    basicExport: true,                 // PDF without narrative
  },

  // PREMIUM TIER - AI-enhanced
  premium: {
    // Prompt features
    adaptivePrompts: true,             // AI generates contextual prompts
    followUpPrompts: true,             // AI suggests follow-ups
    personalizedPrompts: true,         // Per-participant customization

    // Analysis features
    sentimentTracking: true,           // Emotional arc visualization
    themeDetection: true,              // Topic clustering
    autoHighlights: true,              // AI-curated highlights

    // Narrative features
    chapterSummaries: true,            // AI-written chapter intros
    yearInReview: true,                // Annual narrative summary
    bookNarrative: true,               // Full book with transitions

    // Scheduling features
    smartScheduling: true,             // Optimized send times
    engagementPrediction: true,        // Churn risk alerts

    // Export features
    professionalLayouts: true,         // Advanced export templates
    hardcoverReady: true,              // Print-ready formatting
  },
} as const;

// =============================================================================
// AI PRIVACY & CONSENT
// =============================================================================

/**
 * Privacy controls for AI processing
 */
export interface AIPrivacySettings {
  journalId: string;

  // Master toggle
  aiProcessingEnabled: boolean;

  // Granular consent
  consent: {
    promptGeneration: boolean;
    contentAnalysis: boolean;
    narrativeGeneration: boolean;
    schedulingOptimization: boolean;
  };

  // Data handling
  dataRetention: {
    analysisResultsDays: number;       // How long to keep analysis
    generatedContentDays: number;      // How long to keep narratives
    deleteOnJournalArchive: boolean;   // Auto-delete when archived
  };

  // Participant-level opt-outs
  excludedParticipantIds: string[];    // Don't process these participants

  // Content restrictions
  contentRestrictions: {
    excludePhotos: boolean;            // Don't analyze images
    excludeTopics: string[];           // Don't reference these topics
  };

  updatedAt: Date;
  updatedBy: string;
}

// =============================================================================
// USAGE TRACKING & LIMITS
// =============================================================================

/**
 * Track AI usage for billing and rate limiting
 */
export interface AIUsageRecord {
  userId: string;
  journalId: string;
  month: string;                       // "2024-01" format

  // Usage counts
  promptsGenerated: number;
  entriesAnalyzed: number;
  narrativesGenerated: number;
  scheduleOptimizations: number;

  // Token usage (for cost tracking)
  inputTokens: number;
  outputTokens: number;

  // Limits (based on tier)
  limits: {
    promptsPerMonth: number;
    narrativesPerMonth: number;
    analysisPerMonth: number;
  };
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}
