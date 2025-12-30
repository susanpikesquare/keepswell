/**
 * MOMENTS TEMPLATE SYSTEM
 *
 * A flexible template architecture that shapes the journal experience through:
 * - Prompt selection and cadence
 * - Visual emphasis rules
 * - Entry framing and language
 * - Structural rhythm (recaps, chapters)
 * - Export formatting
 */

// =============================================================================
// CORE ENUMS
// =============================================================================

export type TemplateType = 'family' | 'friends' | 'romantic' | 'vacation' | 'custom';

export type PromptCategory =
  | 'memories'      // Past experiences, nostalgia
  | 'gratitude'     // Appreciation, thankfulness
  | 'milestones'    // Achievements, celebrations
  | 'traditions'    // Recurring customs, rituals
  | 'wisdom'        // Lessons learned, advice
  | 'stories'       // Narratives, anecdotes
  | 'dreams'        // Future hopes, aspirations
  | 'daily'         // Day-to-day moments
  | 'reflection'    // Introspection, growth
  | 'adventure';    // Experiences, discoveries

export type PromptTone =
  | 'warm'          // Affectionate, cozy
  | 'playful'       // Light, fun
  | 'reflective'    // Thoughtful, deep
  | 'celebratory'   // Excited, joyful
  | 'nostalgic'     // Sentimental, wistful
  | 'intimate';     // Personal, vulnerable

export type PromptFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export type EntryEmphasis = 'photo' | 'text' | 'balanced';

export type ChapterTrigger =
  | 'date_milestone'    // Monthly/quarterly/yearly
  | 'entry_count'       // Every N entries
  | 'participant_first' // First entry from new participant
  | 'media_heavy'       // Photo-heavy section
  | 'topic_shift';      // AI-detected topic change (premium)

// =============================================================================
// PROMPT PACK SYSTEM
// =============================================================================

/**
 * Individual prompt definition
 */
export interface Prompt {
  id: string;
  text: string;
  category: PromptCategory;
  tone: PromptTone;

  // Frequency weighting (1-10, higher = more likely to be selected)
  weight: number;

  // Season/time restrictions (optional)
  seasonality?: {
    months?: number[];           // 1-12
    daysOfWeek?: number[];       // 0-6 (Sunday = 0)
    holidays?: string[];         // 'thanksgiving', 'christmas', 'valentines', etc.
  };

  // Participant targeting (optional)
  targeting?: {
    relationships?: string[];    // 'parent', 'grandparent', 'sibling', etc.
    minResponses?: number;       // Only after N responses from participant
    maxResponses?: number;       // Stop after N responses
  };

  // Follow-up prompt reference (for conversational threads)
  followUpTo?: string;           // ID of prompt this follows up on

  // Metadata
  isStarter: boolean;            // Good for first prompt to new participant
  requiresPhoto: boolean;        // Hints that photo response is expected
  isDeep: boolean;               // Emotionally deeper, use sparingly

  // Tracking
  createdAt: Date;
  usageCount: number;            // Global usage tracking
}

/**
 * Collection of prompts for a specific template
 */
export interface PromptPack {
  id: string;
  name: string;
  templateType: TemplateType;
  description: string;

  // Prompt organization
  prompts: Prompt[];

  // Category distribution (percentages, should sum to 100)
  categoryWeights: Record<PromptCategory, number>;

  // Rotation settings
  rotation: {
    avoidRepeatDays: number;     // Don't repeat same prompt within N days
    avoidCategoryRepeat: number; // Don't repeat same category within N prompts
    prioritizeUnused: boolean;   // Prefer prompts not yet used in this journal
  };

  // Metadata
  version: string;
  isSystem: boolean;             // Built-in vs user-created
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tracks prompt usage per journal to avoid repetition
 */
export interface PromptUsageLog {
  journalId: string;
  promptId: string;
  participantId: string;
  sentAt: Date;
  respondedAt?: Date;
  responseEntryId?: string;
}

// =============================================================================
// VISUAL RULES
// =============================================================================

/**
 * Controls how entries appear in the timeline
 */
export interface VisualRules {
  // Photo handling
  photo: {
    emphasis: EntryEmphasis;
    defaultAspectRatio: '1:1' | '4:3' | '16:9' | 'original';
    gridLayout: 'single' | 'masonry' | 'carousel';
    showCaptions: boolean;
    frameStyle: 'none' | 'polaroid' | 'rounded' | 'shadow';
  };

  // Text styling
  text: {
    quoteStyle: 'italic' | 'serif' | 'handwritten' | 'clean';
    showAttribution: boolean;    // Show participant name
    maxPreviewLength: number;    // Characters before "read more"
    highlightFirstEntry: boolean;// Style first entry differently
  };

  // Timeline appearance
  timeline: {
    groupBy: 'day' | 'week' | 'month' | 'chapter';
    showDateHeaders: boolean;
    showParticipantAvatars: boolean;
    animationStyle: 'fade' | 'slide' | 'none';
  };

  // Color theming (CSS variable overrides)
  colors: {
    primary: string;
    accent: string;
    background: string;
    cardBackground: string;
    text: string;
    muted: string;
  };

  // Decorative elements
  decorations: {
    icon: string;               // Primary icon (heart, sparkles, plane, etc.)
    pattern?: string;           // Background pattern
    showMoodIndicators: boolean;
    showReactionEmojis: boolean;
  };
}

// =============================================================================
// ENTRY FRAMING
// =============================================================================

/**
 * Language and presentation rules for entries
 */
export interface EntryFramingRules {
  // Headlines/labels
  headlines: {
    showPromptAsHeadline: boolean;     // Display the prompt above entry
    generateHeadline: boolean;          // AI-generate headline (premium)
    headlineStyle: 'question' | 'statement' | 'date' | 'participant';
  };

  // Badges and tags
  badges: {
    showCategory: boolean;              // "Memory", "Gratitude", etc.
    showMilestones: boolean;            // "First entry!", "100th memory"
    showStreak: boolean;                // "5 week streak"
    customBadges: Badge[];              // Template-specific badges
  };

  // Attribution
  attribution: {
    format: 'name' | 'relationship' | 'both' | 'anonymous';
    showTimestamp: boolean;
    timestampFormat: 'relative' | 'absolute' | 'friendly';
  };

  // Language customization
  language: {
    entryNoun: string;                  // "memory", "moment", "story", "snapshot"
    collectionNoun: string;             // "journal", "book", "collection", "album"
    participantNoun: string;            // "contributor", "family member", "friend"
    actionVerb: string;                 // "shared", "captured", "recorded"
  };
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  triggerCondition: {
    type: 'entry_count' | 'streak' | 'category' | 'first' | 'custom';
    value: number | string;
  };
}

// =============================================================================
// STRUCTURAL RULES
// =============================================================================

/**
 * Organizational structure for the journal
 */
export interface StructuralRules {
  // Chapter/section breaks
  chapters: {
    enabled: boolean;
    trigger: ChapterTrigger;
    triggerValue: number | string;      // e.g., 30 for entry_count
    naming: 'auto' | 'date' | 'numbered' | 'custom';
    showChapterSummary: boolean;        // AI summary of chapter (premium)
  };

  // Periodic recaps
  recaps: {
    enabled: boolean;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    includeHighlights: boolean;         // AI-selected top entries (premium)
    includeStats: boolean;              // Entry count, participant stats
    deliveryMethod: 'in_app' | 'email' | 'both';
  };

  // Special sections
  specialSections: {
    pinnedAtTop: boolean;               // Show pinned entries first
    highlightsSection: boolean;         // Curated highlights (premium)
    yearInReview: boolean;              // Annual summary generation
  };

  // Timeline density
  density: {
    entriesPerPage: number;
    lazyLoadThreshold: number;
    showLoadMore: boolean;
  };
}

// =============================================================================
// EXPORT CONFIGURATION
// =============================================================================

/**
 * Book/PDF export settings
 */
export interface ExportConfig {
  // Book formatting
  book: {
    pageSize: 'letter' | 'a4' | '6x9' | '8x10';
    orientation: 'portrait' | 'landscape';
    includeTableOfContents: boolean;
    includeCoverPage: boolean;
    includeParticipantIndex: boolean;
  };

  // Content selection
  content: {
    includeHidden: boolean;
    includePrompts: boolean;
    photoQuality: 'web' | 'print' | 'original';
    maxPhotosPerEntry: number;
  };

  // Styling
  styling: {
    fontFamily: string;
    fontSize: number;
    margins: { top: number; bottom: number; left: number; right: number };
    headerStyle: 'minimal' | 'decorative' | 'none';
    pageNumbers: boolean;
  };

  // Premium features
  premium: {
    aiNarrative: boolean;               // AI-written transitions
    professionalLayout: boolean;        // Advanced layouts
    hardcoverReady: boolean;            // Print-ready formatting
  };
}

// =============================================================================
// CADENCE CONFIGURATION
// =============================================================================

/**
 * Prompt timing and scheduling rules
 */
export interface CadenceConfig {
  // Default schedule
  defaultFrequency: PromptFrequency;
  defaultDayOfWeek: number | null;      // null for daily
  defaultTime: string;                  // "09:00" format
  defaultTimezone: string;

  // Adaptive scheduling
  adaptive: {
    enabled: boolean;                   // Premium feature
    minResponseRate: number;            // Slow down if below this %
    maxResponseRate: number;            // Speed up if above this %
    respectQuietHours: boolean;
    quietHoursStart: string;            // "22:00"
    quietHoursEnd: string;              // "08:00"
  };

  // Special timing
  special: {
    birthdayPrompts: boolean;           // Send on participant birthdays
    anniversaryPrompts: boolean;        // Send on journal anniversary
    holidayPrompts: boolean;            // Send holiday-specific prompts
  };

  // Participant-specific adjustments
  participantRules: {
    newParticipantBurst: boolean;       // More prompts initially
    burstDuration: number;              // Days of increased frequency
    burstFrequency: PromptFrequency;
    inactiveReminder: boolean;          // Gentle nudge after silence
    inactiveThresholdDays: number;
  };
}

// =============================================================================
// COMPLETE TEMPLATE DEFINITION
// =============================================================================

/**
 * Full template configuration combining all aspects
 */
export interface JournalTemplate {
  id: string;
  type: TemplateType;
  name: string;
  description: string;
  tagline: string;                      // Short marketing description

  // Core configurations
  promptPack: PromptPack;
  visualRules: VisualRules;
  framingRules: EntryFramingRules;
  structuralRules: StructuralRules;
  exportConfig: ExportConfig;
  cadenceConfig: CadenceConfig;

  // Template metadata
  metadata: {
    version: string;
    isSystem: boolean;
    isPremium: boolean;                 // Requires subscription
    previewImageUrl?: string;
    exampleEntriesCount: number;
  };

  // Relationship types suggested for this template
  suggestedRelationships: string[];

  // AI enhancement settings
  aiConfig: AITemplateConfig;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// PREMIUM AI LAYER
// =============================================================================

/**
 * AI-powered enhancements (paid feature)
 */
export interface AITemplateConfig {
  // Feature toggles (user can enable/disable)
  features: {
    adaptivePrompts: boolean;           // Generate contextual prompts
    smartScheduling: boolean;           // Optimize send times
    chapterSuggestions: boolean;        // Suggest chapter breaks
    highlightCuration: boolean;         // Auto-select best entries
    narrativeGeneration: boolean;       // Write transitions/summaries
    sentimentAnalysis: boolean;         // Track emotional tone
    topicClustering: boolean;           // Group related entries
  };

  // Prompt generation settings
  promptGeneration: {
    enabled: boolean;
    contextWindowEntries: number;       // How many past entries to consider
    personalizePerParticipant: boolean;
    avoidTopics: string[];              // User-defined sensitive topics
    encourageTopics: string[];          // Topics to explore more
  };

  // Content analysis
  analysis: {
    extractKeyMoments: boolean;         // Identify important entries
    trackThemes: boolean;               // Ongoing theme detection
    suggestFollowUps: boolean;          // "Ask more about X"
  };

  // Narrative features
  narrative: {
    generateChapterIntros: boolean;
    generateYearInReview: boolean;
    writingStyle: 'journalistic' | 'storytelling' | 'poetic' | 'casual';
    preserveVoice: boolean;             // Match participants' tone
  };

  // Privacy controls
  privacy: {
    aiProcessingConsent: boolean;       // User has consented
    dataRetentionDays: number;          // How long AI can access data
    excludeParticipants: string[];      // Participants opted out of AI
  };
}

/**
 * AI-generated content (never overwrites original)
 */
export interface AIGeneratedContent {
  id: string;
  journalId: string;
  type: 'prompt' | 'chapter_title' | 'chapter_summary' | 'highlight' | 'narrative' | 'recap';

  // Source tracking
  sourceEntryIds: string[];             // Entries used to generate this

  // Generated content
  content: string;
  confidence: number;                   // 0-1 confidence score

  // User interaction
  status: 'suggested' | 'accepted' | 'rejected' | 'edited';
  userEditedContent?: string;

  // Metadata
  model: string;                        // AI model used
  generatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

// =============================================================================
// JOURNAL INSTANCE (Runtime state)
// =============================================================================

/**
 * Active journal with template applied
 */
export interface JournalInstance {
  id: string;
  ownerId: string;
  title: string;
  description?: string;

  // Template reference
  templateId: string;
  templateType: TemplateType;

  // Customizations (overrides template defaults)
  customizations: {
    visualRules?: Partial<VisualRules>;
    framingRules?: Partial<EntryFramingRules>;
    cadenceConfig?: Partial<CadenceConfig>;
  };

  // State
  status: 'active' | 'paused' | 'archived';

  // Statistics
  stats: {
    entryCount: number;
    participantCount: number;
    photoCount: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: Date;
  };

  // AI state (premium)
  aiState?: {
    enabled: boolean;
    lastAnalysisAt?: Date;
    detectedThemes: string[];
    suggestedChapterBreaks: number[];   // Entry IDs
    highlightedEntryIds: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// FREE VS PREMIUM CAPABILITIES
// =============================================================================

/**
 * Feature availability by tier
 */
export const FEATURE_TIERS = {
  free: {
    maxJournals: 2,
    maxParticipants: 5,
    maxEntriesPerJournal: 100,
    templates: ['family', 'friends', 'custom'] as TemplateType[],
    promptPacks: 'system_only',
    exportFormats: ['pdf_basic'],
    aiFeatures: false,
    customBranding: false,
    prioritySupport: false,
  },
  premium: {
    maxJournals: 10,
    maxParticipants: 25,
    maxEntriesPerJournal: 'unlimited',
    templates: ['family', 'friends', 'romantic', 'vacation', 'custom'] as TemplateType[],
    promptPacks: 'all',
    exportFormats: ['pdf_basic', 'pdf_premium', 'book_ready', 'video_slideshow'],
    aiFeatures: true,
    customBranding: true,
    prioritySupport: true,
  },
  enterprise: {
    maxJournals: 'unlimited',
    maxParticipants: 'unlimited',
    maxEntriesPerJournal: 'unlimited',
    templates: 'all',
    promptPacks: 'all_plus_custom',
    exportFormats: 'all',
    aiFeatures: true,
    customBranding: true,
    prioritySupport: true,
    sso: true,
    apiAccess: true,
  },
} as const;
