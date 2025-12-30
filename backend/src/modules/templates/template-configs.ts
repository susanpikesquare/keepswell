/**
 * TEMPLATE CONFIGURATIONS
 *
 * Complete template definitions for each journal type.
 * Each template shapes the experience through prompts, visuals, framing, and structure.
 */

import {
  JournalTemplate,
  PromptPack,
  Prompt,
  VisualRules,
  EntryFramingRules,
  StructuralRules,
  ExportConfig,
  CadenceConfig,
  AITemplateConfig,
  PromptCategory,
  PromptTone,
} from './template-system.types';

// =============================================================================
// HELPER: Generate UUID-like IDs for seed data
// =============================================================================

const generateId = (prefix: string, index: number) =>
  `${prefix}-${String(index).padStart(4, '0')}`;

// =============================================================================
// FAMILY TEMPLATE
// =============================================================================

const familyPrompts: Prompt[] = [
  // MEMORIES - Core nostalgic prompts
  {
    id: generateId('fam-mem', 1),
    text: "What's your favorite childhood memory?",
    category: 'memories',
    tone: 'nostalgic',
    weight: 8,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mem', 2),
    text: "Describe a meal that brings back special memories.",
    category: 'memories',
    tone: 'warm',
    weight: 7,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mem', 3),
    text: "What's your earliest memory of our family home?",
    category: 'memories',
    tone: 'nostalgic',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mem', 4),
    text: "Describe your favorite family vacation or trip.",
    category: 'memories',
    tone: 'celebratory',
    weight: 8,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mem', 5),
    text: "What song or music reminds you of family?",
    category: 'memories',
    tone: 'nostalgic',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mem', 6),
    text: "Describe a perfect family day together.",
    category: 'memories',
    tone: 'warm',
    weight: 7,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mem', 7),
    text: "What's a smell that instantly takes you back to childhood?",
    category: 'memories',
    tone: 'nostalgic',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // TRADITIONS - Family rituals and customs
  {
    id: generateId('fam-trad', 1),
    text: "Tell us about a family tradition you cherish.",
    category: 'traditions',
    tone: 'warm',
    weight: 8,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-trad', 2),
    text: "What family recipe has been passed down through generations?",
    category: 'traditions',
    tone: 'warm',
    weight: 7,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-trad', 3),
    text: "What holiday tradition means the most to you?",
    category: 'traditions',
    tone: 'warm',
    weight: 7,
    seasonality: { months: [11, 12, 1] }, // Nov-Jan for holidays
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-trad', 4),
    text: "What's a quirky thing only our family does?",
    category: 'traditions',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // WISDOM - Lessons and advice
  {
    id: generateId('fam-wis', 1),
    text: "What's the best advice you ever received from a family member?",
    category: 'wisdom',
    tone: 'reflective',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-wis', 2),
    text: "What values do you hope to pass on to future generations?",
    category: 'wisdom',
    tone: 'reflective',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-wis', 3),
    text: "Share a lesson you learned from a grandparent.",
    category: 'wisdom',
    tone: 'warm',
    weight: 6,
    targeting: { relationships: ['grandchild', 'child'] },
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-wis', 4),
    text: "What would you tell your younger self about family?",
    category: 'wisdom',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },

  // GRATITUDE - Appreciation
  {
    id: generateId('fam-grat', 1),
    text: "What's something you're grateful for about our family?",
    category: 'gratitude',
    tone: 'warm',
    weight: 8,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-grat', 2),
    text: "What do you love most about being part of this family?",
    category: 'gratitude',
    tone: 'warm',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-grat', 3),
    text: "Who in our family makes you laugh the most?",
    category: 'gratitude',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // STORIES - Narratives and anecdotes
  {
    id: generateId('fam-story', 1),
    text: "Share a funny story from a family gathering.",
    category: 'stories',
    tone: 'playful',
    weight: 8,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-story', 2),
    text: "Tell us about a challenge our family overcame together.",
    category: 'stories',
    tone: 'reflective',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-story', 3),
    text: "Tell us about a family member who inspired you.",
    category: 'stories',
    tone: 'warm',
    weight: 7,
    isStarter: false,
    requiresPhoto: true,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-story', 4),
    text: "What's something unique about our family?",
    category: 'stories',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-story', 5),
    text: "What's the most embarrassing family photo you remember?",
    category: 'stories',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // MILESTONES - Celebrations and achievements
  {
    id: generateId('fam-mile', 1),
    text: "Describe a moment when you felt proud of our family.",
    category: 'milestones',
    tone: 'celebratory',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mile', 2),
    text: "Share a memory of a birthday celebration.",
    category: 'milestones',
    tone: 'celebratory',
    weight: 6,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-mile', 3),
    text: "What's a family achievement we should never forget?",
    category: 'milestones',
    tone: 'celebratory',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // DAILY - Present moments
  {
    id: generateId('fam-daily', 1),
    text: "What made you think of family today?",
    category: 'daily',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fam-daily', 2),
    text: "Share a photo from today that feels like 'us'.",
    category: 'daily',
    tone: 'warm',
    weight: 5,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
];

const familyPromptPack: PromptPack = {
  id: 'pack-family-001',
  name: 'Family Memories',
  templateType: 'family',
  description: 'Prompts designed to capture multigenerational family stories, traditions, and wisdom.',
  prompts: familyPrompts,
  categoryWeights: {
    memories: 25,
    traditions: 15,
    wisdom: 15,
    gratitude: 15,
    stories: 15,
    milestones: 10,
    daily: 5,
    dreams: 0,
    reflection: 0,
    adventure: 0,
  },
  rotation: {
    avoidRepeatDays: 30,
    avoidCategoryRepeat: 2,
    prioritizeUnused: true,
  },
  version: '1.0.0',
  isSystem: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const familyVisualRules: VisualRules = {
  photo: {
    emphasis: 'photo',
    defaultAspectRatio: '4:3',
    gridLayout: 'single',
    showCaptions: true,
    frameStyle: 'polaroid',
  },
  text: {
    quoteStyle: 'serif',
    showAttribution: true,
    maxPreviewLength: 280,
    highlightFirstEntry: true,
  },
  timeline: {
    groupBy: 'month',
    showDateHeaders: true,
    showParticipantAvatars: true,
    animationStyle: 'fade',
  },
  colors: {
    primary: '#92400e',      // amber-800
    accent: '#e11d48',       // rose-600
    background: '#fffbeb',   // amber-50
    cardBackground: '#ffffff',
    text: '#451a03',         // amber-950
    muted: '#b45309',        // amber-700
  },
  decorations: {
    icon: 'heart',
    pattern: 'dots',
    showMoodIndicators: false,
    showReactionEmojis: false,
  },
};

const familyFramingRules: EntryFramingRules = {
  headlines: {
    showPromptAsHeadline: true,
    generateHeadline: false,
    headlineStyle: 'question',
  },
  badges: {
    showCategory: false,
    showMilestones: true,
    showStreak: false,
    customBadges: [
      {
        id: 'fam-badge-1',
        name: 'Family Historian',
        icon: 'book',
        description: 'Shared 10 memories',
        triggerCondition: { type: 'entry_count', value: 10 },
      },
      {
        id: 'fam-badge-2',
        name: 'Storyteller',
        icon: 'message-circle',
        description: 'First story shared',
        triggerCondition: { type: 'first', value: 'stories' },
      },
    ],
  },
  attribution: {
    format: 'relationship',
    showTimestamp: true,
    timestampFormat: 'friendly',
  },
  language: {
    entryNoun: 'memory',
    collectionNoun: 'family journal',
    participantNoun: 'family member',
    actionVerb: 'shared',
  },
};

const familyStructuralRules: StructuralRules = {
  chapters: {
    enabled: true,
    trigger: 'date_milestone',
    triggerValue: 'monthly',
    naming: 'date',
    showChapterSummary: false,
  },
  recaps: {
    enabled: true,
    frequency: 'monthly',
    includeHighlights: false,
    includeStats: true,
    deliveryMethod: 'email',
  },
  specialSections: {
    pinnedAtTop: true,
    highlightsSection: false,
    yearInReview: true,
  },
  density: {
    entriesPerPage: 10,
    lazyLoadThreshold: 5,
    showLoadMore: true,
  },
};

const familyExportConfig: ExportConfig = {
  book: {
    pageSize: '8x10',
    orientation: 'portrait',
    includeTableOfContents: true,
    includeCoverPage: true,
    includeParticipantIndex: true,
  },
  content: {
    includeHidden: false,
    includePrompts: true,
    photoQuality: 'print',
    maxPhotosPerEntry: 4,
  },
  styling: {
    fontFamily: 'Georgia, serif',
    fontSize: 12,
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    headerStyle: 'decorative',
    pageNumbers: true,
  },
  premium: {
    aiNarrative: false,
    professionalLayout: false,
    hardcoverReady: false,
  },
};

const familyCadenceConfig: CadenceConfig = {
  defaultFrequency: 'weekly',
  defaultDayOfWeek: 0, // Sunday
  defaultTime: '10:00',
  defaultTimezone: 'America/New_York',
  adaptive: {
    enabled: false,
    minResponseRate: 0.3,
    maxResponseRate: 0.8,
    respectQuietHours: true,
    quietHoursStart: '21:00',
    quietHoursEnd: '09:00',
  },
  special: {
    birthdayPrompts: true,
    anniversaryPrompts: true,
    holidayPrompts: true,
  },
  participantRules: {
    newParticipantBurst: true,
    burstDuration: 7,
    burstFrequency: 'daily',
    inactiveReminder: true,
    inactiveThresholdDays: 21,
  },
};

const familyAIConfig: AITemplateConfig = {
  features: {
    adaptivePrompts: true,
    smartScheduling: true,
    chapterSuggestions: true,
    highlightCuration: true,
    narrativeGeneration: true,
    sentimentAnalysis: false,
    topicClustering: true,
  },
  promptGeneration: {
    enabled: true,
    contextWindowEntries: 20,
    personalizePerParticipant: true,
    avoidTopics: [],
    encourageTopics: ['childhood', 'traditions', 'lessons'],
  },
  analysis: {
    extractKeyMoments: true,
    trackThemes: true,
    suggestFollowUps: true,
  },
  narrative: {
    generateChapterIntros: true,
    generateYearInReview: true,
    writingStyle: 'storytelling',
    preserveVoice: true,
  },
  privacy: {
    aiProcessingConsent: false,
    dataRetentionDays: 90,
    excludeParticipants: [],
  },
};

export const FAMILY_TEMPLATE: JournalTemplate = {
  id: 'template-family-001',
  type: 'family',
  name: 'Family Memories',
  description: 'Collect stories, wisdom, and cherished moments from your family members across generations.',
  tagline: 'Every family has a story worth preserving',
  promptPack: familyPromptPack,
  visualRules: familyVisualRules,
  framingRules: familyFramingRules,
  structuralRules: familyStructuralRules,
  exportConfig: familyExportConfig,
  cadenceConfig: familyCadenceConfig,
  aiConfig: familyAIConfig,
  metadata: {
    version: '1.0.0',
    isSystem: true,
    isPremium: false,
    exampleEntriesCount: 25,
  },
  suggestedRelationships: ['parent', 'grandparent', 'sibling', 'aunt', 'uncle', 'cousin', 'child', 'grandchild'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// ROMANTIC TEMPLATE
// =============================================================================

const romanticPrompts: Prompt[] = [
  // MEMORIES
  {
    id: generateId('rom-mem', 1),
    text: "What's your favorite memory of us?",
    category: 'memories',
    tone: 'intimate',
    weight: 9,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-mem', 2),
    text: "Describe the moment you knew this was special.",
    category: 'memories',
    tone: 'intimate',
    weight: 8,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-mem', 3),
    text: "What do you remember about our first date?",
    category: 'memories',
    tone: 'nostalgic',
    weight: 7,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-mem', 4),
    text: "What's a small moment with us that you'll never forget?",
    category: 'memories',
    tone: 'intimate',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-mem', 5),
    text: "Share a photo that captures how you feel about us.",
    category: 'memories',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // GRATITUDE
  {
    id: generateId('rom-grat', 1),
    text: "What do you appreciate most about me?",
    category: 'gratitude',
    tone: 'intimate',
    weight: 8,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-grat', 2),
    text: "What's something I do that makes you feel loved?",
    category: 'gratitude',
    tone: 'warm',
    weight: 8,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-grat', 3),
    text: "When did you last feel grateful for us?",
    category: 'gratitude',
    tone: 'reflective',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // DREAMS
  {
    id: generateId('rom-dream', 1),
    text: "What do you dream about for our future?",
    category: 'dreams',
    tone: 'intimate',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-dream', 2),
    text: "Where would you love to travel together someday?",
    category: 'dreams',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-dream', 3),
    text: "What's a goal you want us to achieve together?",
    category: 'dreams',
    tone: 'reflective',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // DAILY
  {
    id: generateId('rom-daily', 1),
    text: "What made you smile about us today?",
    category: 'daily',
    tone: 'warm',
    weight: 7,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-daily', 2),
    text: "What's something that reminded you of me today?",
    category: 'daily',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-daily', 3),
    text: "Share a recent photo of something that made you think of us.",
    category: 'daily',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // MILESTONES
  {
    id: generateId('rom-mile', 1),
    text: "What milestone in our relationship means the most to you?",
    category: 'milestones',
    tone: 'reflective',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-mile', 2),
    text: "Describe a challenge we overcame together.",
    category: 'milestones',
    tone: 'reflective',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },

  // STORIES
  {
    id: generateId('rom-story', 1),
    text: "What's the funniest thing that's happened to us?",
    category: 'stories',
    tone: 'playful',
    weight: 7,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-story', 2),
    text: "Tell me about a time I surprised you.",
    category: 'stories',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-story', 3),
    text: "What's our 'thing' that no one else would understand?",
    category: 'stories',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // REFLECTION
  {
    id: generateId('rom-ref', 1),
    text: "How have I changed you for the better?",
    category: 'reflection',
    tone: 'intimate',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('rom-ref', 2),
    text: "What have you learned about love from us?",
    category: 'reflection',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
];

const romanticPromptPack: PromptPack = {
  id: 'pack-romantic-001',
  name: 'Love Story',
  templateType: 'romantic',
  description: 'Intimate prompts to document your relationship journey and deepen your connection.',
  prompts: romanticPrompts,
  categoryWeights: {
    memories: 25,
    gratitude: 20,
    dreams: 15,
    daily: 15,
    milestones: 10,
    stories: 10,
    reflection: 5,
    traditions: 0,
    wisdom: 0,
    adventure: 0,
  },
  rotation: {
    avoidRepeatDays: 14,
    avoidCategoryRepeat: 2,
    prioritizeUnused: true,
  },
  version: '1.0.0',
  isSystem: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const romanticVisualRules: VisualRules = {
  photo: {
    emphasis: 'photo',
    defaultAspectRatio: '1:1',
    gridLayout: 'single',
    showCaptions: true,
    frameStyle: 'rounded',
  },
  text: {
    quoteStyle: 'handwritten',
    showAttribution: false,
    maxPreviewLength: 200,
    highlightFirstEntry: true,
  },
  timeline: {
    groupBy: 'week',
    showDateHeaders: true,
    showParticipantAvatars: false,
    animationStyle: 'fade',
  },
  colors: {
    primary: '#9f1239',      // rose-800
    accent: '#ec4899',       // pink-500
    background: '#fff1f2',   // rose-50
    cardBackground: '#ffffff',
    text: '#4c0519',         // rose-950
    muted: '#be123c',        // rose-700
  },
  decorations: {
    icon: 'heart-filled',
    pattern: 'hearts',
    showMoodIndicators: true,
    showReactionEmojis: true,
  },
};

const romanticFramingRules: EntryFramingRules = {
  headlines: {
    showPromptAsHeadline: false,
    generateHeadline: false,
    headlineStyle: 'date',
  },
  badges: {
    showCategory: false,
    showMilestones: true,
    showStreak: true,
    customBadges: [
      {
        id: 'rom-badge-1',
        name: 'Love Letter',
        icon: 'mail-heart',
        description: 'First heartfelt message',
        triggerCondition: { type: 'first', value: 'gratitude' },
      },
      {
        id: 'rom-badge-2',
        name: 'Memory Makers',
        icon: 'camera',
        description: 'Shared 5 photos together',
        triggerCondition: { type: 'entry_count', value: 5 },
      },
    ],
  },
  attribution: {
    format: 'name',
    showTimestamp: true,
    timestampFormat: 'friendly',
  },
  language: {
    entryNoun: 'moment',
    collectionNoun: 'love story',
    participantNoun: 'partner',
    actionVerb: 'captured',
  },
};

const romanticStructuralRules: StructuralRules = {
  chapters: {
    enabled: true,
    trigger: 'date_milestone',
    triggerValue: 'monthly',
    naming: 'numbered',
    showChapterSummary: false,
  },
  recaps: {
    enabled: true,
    frequency: 'monthly',
    includeHighlights: false,
    includeStats: false,
    deliveryMethod: 'in_app',
  },
  specialSections: {
    pinnedAtTop: true,
    highlightsSection: true,
    yearInReview: true,
  },
  density: {
    entriesPerPage: 8,
    lazyLoadThreshold: 4,
    showLoadMore: true,
  },
};

const romanticExportConfig: ExportConfig = {
  book: {
    pageSize: '6x9',
    orientation: 'portrait',
    includeTableOfContents: false,
    includeCoverPage: true,
    includeParticipantIndex: false,
  },
  content: {
    includeHidden: false,
    includePrompts: false,
    photoQuality: 'print',
    maxPhotosPerEntry: 2,
  },
  styling: {
    fontFamily: 'Playfair Display, serif',
    fontSize: 11,
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    headerStyle: 'minimal',
    pageNumbers: true,
  },
  premium: {
    aiNarrative: true,
    professionalLayout: true,
    hardcoverReady: true,
  },
};

const romanticCadenceConfig: CadenceConfig = {
  defaultFrequency: 'biweekly',
  defaultDayOfWeek: null,
  defaultTime: '19:00', // Evening, more intimate time
  defaultTimezone: 'America/New_York',
  adaptive: {
    enabled: true,
    minResponseRate: 0.4,
    maxResponseRate: 0.9,
    respectQuietHours: true,
    quietHoursStart: '23:00',
    quietHoursEnd: '08:00',
  },
  special: {
    birthdayPrompts: true,
    anniversaryPrompts: true,
    holidayPrompts: true, // Valentine's, etc.
  },
  participantRules: {
    newParticipantBurst: false, // Only 2 participants typically
    burstDuration: 0,
    burstFrequency: 'weekly',
    inactiveReminder: true,
    inactiveThresholdDays: 14,
  },
};

const romanticAIConfig: AITemplateConfig = {
  features: {
    adaptivePrompts: true,
    smartScheduling: true,
    chapterSuggestions: true,
    highlightCuration: true,
    narrativeGeneration: true,
    sentimentAnalysis: true,
    topicClustering: false,
  },
  promptGeneration: {
    enabled: true,
    contextWindowEntries: 30,
    personalizePerParticipant: false,
    avoidTopics: [],
    encourageTopics: ['appreciation', 'future', 'growth'],
  },
  analysis: {
    extractKeyMoments: true,
    trackThemes: true,
    suggestFollowUps: true,
  },
  narrative: {
    generateChapterIntros: true,
    generateYearInReview: true,
    writingStyle: 'poetic',
    preserveVoice: true,
  },
  privacy: {
    aiProcessingConsent: false,
    dataRetentionDays: 60,
    excludeParticipants: [],
  },
};

export const ROMANTIC_TEMPLATE: JournalTemplate = {
  id: 'template-romantic-001',
  type: 'romantic',
  name: 'Love Story',
  description: 'Document your relationship journey with intimate prompts that deepen your connection.',
  tagline: 'Your love story, one moment at a time',
  promptPack: romanticPromptPack,
  visualRules: romanticVisualRules,
  framingRules: romanticFramingRules,
  structuralRules: romanticStructuralRules,
  exportConfig: romanticExportConfig,
  cadenceConfig: romanticCadenceConfig,
  aiConfig: romanticAIConfig,
  metadata: {
    version: '1.0.0',
    isSystem: true,
    isPremium: true, // Premium template
    exampleEntriesCount: 20,
  },
  suggestedRelationships: ['partner', 'spouse', 'significant other'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// FRIENDS TEMPLATE
// =============================================================================

const friendsPrompts: Prompt[] = [
  // MEMORIES
  {
    id: generateId('fri-mem', 1),
    text: "What's your favorite memory of our group?",
    category: 'memories',
    tone: 'playful',
    weight: 9,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-mem', 2),
    text: "Describe the moment you knew we'd be friends.",
    category: 'memories',
    tone: 'warm',
    weight: 7,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-mem', 3),
    text: "What's the most ridiculous thing we've done together?",
    category: 'memories',
    tone: 'playful',
    weight: 8,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-mem', 4),
    text: "Share a photo from a time we were all together.",
    category: 'memories',
    tone: 'nostalgic',
    weight: 7,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // STORIES
  {
    id: generateId('fri-story', 1),
    text: "Tell the story of our most epic adventure.",
    category: 'stories',
    tone: 'celebratory',
    weight: 8,
    isStarter: true,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-story', 2),
    text: "What's an inside joke only we would understand?",
    category: 'stories',
    tone: 'playful',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-story', 3),
    text: "Share a story the group would want to remember forever.",
    category: 'stories',
    tone: 'warm',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-story', 4),
    text: "What's a secret about the group you can finally share?",
    category: 'stories',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // GRATITUDE
  {
    id: generateId('fri-grat', 1),
    text: "What do you appreciate most about this friend group?",
    category: 'gratitude',
    tone: 'warm',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-grat', 2),
    text: "Who in this group always makes you laugh?",
    category: 'gratitude',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-grat', 3),
    text: "When was a time someone in this group really showed up for you?",
    category: 'gratitude',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },

  // ADVENTURE
  {
    id: generateId('fri-adv', 1),
    text: "What's on our group bucket list?",
    category: 'adventure',
    tone: 'celebratory',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-adv', 2),
    text: "If we could go anywhere tomorrow, where would it be?",
    category: 'adventure',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-adv', 3),
    text: "What's the craziest thing you'd do with this group?",
    category: 'adventure',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // MILESTONES
  {
    id: generateId('fri-mile', 1),
    text: "What's an achievement by someone in this group we should celebrate?",
    category: 'milestones',
    tone: 'celebratory',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-mile', 2),
    text: "Describe a moment when this group made you proud.",
    category: 'milestones',
    tone: 'warm',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // DAILY
  {
    id: generateId('fri-daily', 1),
    text: "What happened this week that the group needs to hear about?",
    category: 'daily',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('fri-daily', 2),
    text: "Drop a photo from your week!",
    category: 'daily',
    tone: 'playful',
    weight: 5,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // REFLECTION
  {
    id: generateId('fri-ref', 1),
    text: "How has this friend group changed you?",
    category: 'reflection',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
];

const friendsPromptPack: PromptPack = {
  id: 'pack-friends-001',
  name: 'Friend Circle',
  templateType: 'friends',
  description: 'Fun, energetic prompts for friend groups to capture adventures and inside jokes.',
  prompts: friendsPrompts,
  categoryWeights: {
    memories: 25,
    stories: 25,
    gratitude: 15,
    adventure: 15,
    milestones: 10,
    daily: 5,
    reflection: 5,
    traditions: 0,
    wisdom: 0,
    dreams: 0,
  },
  rotation: {
    avoidRepeatDays: 21,
    avoidCategoryRepeat: 2,
    prioritizeUnused: true,
  },
  version: '1.0.0',
  isSystem: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const friendsVisualRules: VisualRules = {
  photo: {
    emphasis: 'photo',
    defaultAspectRatio: 'original',
    gridLayout: 'masonry',
    showCaptions: true,
    frameStyle: 'rounded',
  },
  text: {
    quoteStyle: 'clean',
    showAttribution: true,
    maxPreviewLength: 300,
    highlightFirstEntry: false,
  },
  timeline: {
    groupBy: 'week',
    showDateHeaders: true,
    showParticipantAvatars: true,
    animationStyle: 'slide',
  },
  colors: {
    primary: '#3730a3',      // indigo-800
    accent: '#8b5cf6',       // violet-500
    background: '#eef2ff',   // indigo-50
    cardBackground: '#ffffff',
    text: '#1e1b4b',         // indigo-950
    muted: '#4338ca',        // indigo-700
  },
  decorations: {
    icon: 'sparkles',
    pattern: 'confetti',
    showMoodIndicators: false,
    showReactionEmojis: true,
  },
};

const friendsFramingRules: EntryFramingRules = {
  headlines: {
    showPromptAsHeadline: false,
    generateHeadline: false,
    headlineStyle: 'participant',
  },
  badges: {
    showCategory: false,
    showMilestones: true,
    showStreak: true,
    customBadges: [
      {
        id: 'fri-badge-1',
        name: 'Story Time',
        icon: 'megaphone',
        description: 'Shared an epic story',
        triggerCondition: { type: 'first', value: 'stories' },
      },
      {
        id: 'fri-badge-2',
        name: 'Squad Goals',
        icon: 'users',
        description: 'Everyone contributed this week',
        triggerCondition: { type: 'streak', value: 7 },
      },
    ],
  },
  attribution: {
    format: 'name',
    showTimestamp: true,
    timestampFormat: 'relative',
  },
  language: {
    entryNoun: 'moment',
    collectionNoun: 'group journal',
    participantNoun: 'friend',
    actionVerb: 'dropped',
  },
};

const friendsStructuralRules: StructuralRules = {
  chapters: {
    enabled: false,
    trigger: 'entry_count',
    triggerValue: 50,
    naming: 'auto',
    showChapterSummary: false,
  },
  recaps: {
    enabled: true,
    frequency: 'weekly',
    includeHighlights: true,
    includeStats: true,
    deliveryMethod: 'both',
  },
  specialSections: {
    pinnedAtTop: true,
    highlightsSection: true,
    yearInReview: true,
  },
  density: {
    entriesPerPage: 15,
    lazyLoadThreshold: 8,
    showLoadMore: true,
  },
};

const friendsExportConfig: ExportConfig = {
  book: {
    pageSize: 'letter',
    orientation: 'landscape',
    includeTableOfContents: false,
    includeCoverPage: true,
    includeParticipantIndex: true,
  },
  content: {
    includeHidden: false,
    includePrompts: false,
    photoQuality: 'web',
    maxPhotosPerEntry: 6,
  },
  styling: {
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
    headerStyle: 'minimal',
    pageNumbers: false,
  },
  premium: {
    aiNarrative: false,
    professionalLayout: false,
    hardcoverReady: false,
  },
};

const friendsCadenceConfig: CadenceConfig = {
  defaultFrequency: 'weekly',
  defaultDayOfWeek: 5, // Friday
  defaultTime: '17:00', // After work
  defaultTimezone: 'America/New_York',
  adaptive: {
    enabled: false,
    minResponseRate: 0.2,
    maxResponseRate: 0.7,
    respectQuietHours: false,
    quietHoursStart: '23:00',
    quietHoursEnd: '08:00',
  },
  special: {
    birthdayPrompts: true,
    anniversaryPrompts: false,
    holidayPrompts: false,
  },
  participantRules: {
    newParticipantBurst: true,
    burstDuration: 3,
    burstFrequency: 'daily',
    inactiveReminder: true,
    inactiveThresholdDays: 30,
  },
};

const friendsAIConfig: AITemplateConfig = {
  features: {
    adaptivePrompts: true,
    smartScheduling: false,
    chapterSuggestions: false,
    highlightCuration: true,
    narrativeGeneration: false,
    sentimentAnalysis: false,
    topicClustering: true,
  },
  promptGeneration: {
    enabled: true,
    contextWindowEntries: 15,
    personalizePerParticipant: false,
    avoidTopics: [],
    encourageTopics: ['adventures', 'inside jokes', 'plans'],
  },
  analysis: {
    extractKeyMoments: true,
    trackThemes: false,
    suggestFollowUps: false,
  },
  narrative: {
    generateChapterIntros: false,
    generateYearInReview: true,
    writingStyle: 'casual',
    preserveVoice: true,
  },
  privacy: {
    aiProcessingConsent: false,
    dataRetentionDays: 30,
    excludeParticipants: [],
  },
};

export const FRIENDS_TEMPLATE: JournalTemplate = {
  id: 'template-friends-001',
  type: 'friends',
  name: 'Friend Circle',
  description: 'Capture adventures, inside jokes, and shared memories with your closest friends.',
  tagline: 'Because the best stories start with friends',
  promptPack: friendsPromptPack,
  visualRules: friendsVisualRules,
  framingRules: friendsFramingRules,
  structuralRules: friendsStructuralRules,
  exportConfig: friendsExportConfig,
  cadenceConfig: friendsCadenceConfig,
  aiConfig: friendsAIConfig,
  metadata: {
    version: '1.0.0',
    isSystem: true,
    isPremium: false,
    exampleEntriesCount: 30,
  },
  suggestedRelationships: ['best friend', 'college friend', 'work friend', 'childhood friend'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// VACATION TEMPLATE
// =============================================================================

const vacationPrompts: Prompt[] = [
  // ADVENTURE
  {
    id: generateId('vac-adv', 1),
    text: "What was the highlight of today's adventure?",
    category: 'adventure',
    tone: 'celebratory',
    weight: 9,
    isStarter: true,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-adv', 2),
    text: "Share a photo of something that surprised you today.",
    category: 'adventure',
    tone: 'playful',
    weight: 8,
    isStarter: true,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-adv', 3),
    text: "What did you discover that wasn't in the guidebook?",
    category: 'adventure',
    tone: 'playful',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-adv', 4),
    text: "Describe the most beautiful thing you saw today.",
    category: 'adventure',
    tone: 'reflective',
    weight: 7,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // DAILY
  {
    id: generateId('vac-daily', 1),
    text: "What did you eat today that was amazing?",
    category: 'daily',
    tone: 'playful',
    weight: 8,
    isStarter: true,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-daily', 2),
    text: "Who did you meet or interact with today?",
    category: 'daily',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-daily', 3),
    text: "What sounds or smells will you remember from today?",
    category: 'daily',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-daily', 4),
    text: "Rate today's adventure on a scale of 1-10. Why?",
    category: 'daily',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // MEMORIES
  {
    id: generateId('vac-mem', 1),
    text: "Capture a moment you never want to forget.",
    category: 'memories',
    tone: 'warm',
    weight: 8,
    isStarter: false,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-mem', 2),
    text: "What made everyone laugh today?",
    category: 'memories',
    tone: 'playful',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-mem', 3),
    text: "Share a photo that tells today's story.",
    category: 'memories',
    tone: 'warm',
    weight: 7,
    isStarter: true,
    requiresPhoto: true,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // STORIES
  {
    id: generateId('vac-story', 1),
    text: "What went hilariously wrong today?",
    category: 'stories',
    tone: 'playful',
    weight: 7,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-story', 2),
    text: "Describe a 'you had to be there' moment.",
    category: 'stories',
    tone: 'playful',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-story', 3),
    text: "What was the most unexpected thing that happened?",
    category: 'stories',
    tone: 'celebratory',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // REFLECTION
  {
    id: generateId('vac-ref', 1),
    text: "What will you take home from this trip (besides souvenirs)?",
    category: 'reflection',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: true,
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: generateId('vac-ref', 2),
    text: "How is this place different from what you expected?",
    category: 'reflection',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // GRATITUDE
  {
    id: generateId('vac-grat', 1),
    text: "What are you most grateful for about this trip so far?",
    category: 'gratitude',
    tone: 'warm',
    weight: 6,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },

  // DREAMS (future travel)
  {
    id: generateId('vac-dream', 1),
    text: "Would you come back here? What would you do differently?",
    category: 'dreams',
    tone: 'reflective',
    weight: 5,
    isStarter: false,
    requiresPhoto: false,
    isDeep: false,
    createdAt: new Date(),
    usageCount: 0,
  },
];

const vacationPromptPack: PromptPack = {
  id: 'pack-vacation-001',
  name: 'Travel Journal',
  templateType: 'vacation',
  description: 'Daily prompts to capture every moment of your adventure.',
  prompts: vacationPrompts,
  categoryWeights: {
    adventure: 30,
    daily: 25,
    memories: 20,
    stories: 15,
    reflection: 5,
    gratitude: 5,
    dreams: 0,
    traditions: 0,
    wisdom: 0,
    milestones: 0,
  },
  rotation: {
    avoidRepeatDays: 3, // Short trip = tighter rotation
    avoidCategoryRepeat: 1,
    prioritizeUnused: true,
  },
  version: '1.0.0',
  isSystem: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const vacationVisualRules: VisualRules = {
  photo: {
    emphasis: 'photo',
    defaultAspectRatio: '16:9',
    gridLayout: 'carousel',
    showCaptions: true,
    frameStyle: 'shadow',
  },
  text: {
    quoteStyle: 'clean',
    showAttribution: true,
    maxPreviewLength: 200,
    highlightFirstEntry: false,
  },
  timeline: {
    groupBy: 'day',
    showDateHeaders: true,
    showParticipantAvatars: true,
    animationStyle: 'slide',
  },
  colors: {
    primary: '#0369a1',      // sky-700
    accent: '#f59e0b',       // amber-500
    background: '#f0f9ff',   // sky-50
    cardBackground: '#ffffff',
    text: '#0c4a6e',         // sky-900
    muted: '#0284c7',        // sky-600
  },
  decorations: {
    icon: 'plane',
    pattern: 'map',
    showMoodIndicators: false,
    showReactionEmojis: true,
  },
};

const vacationFramingRules: EntryFramingRules = {
  headlines: {
    showPromptAsHeadline: false,
    generateHeadline: true, // AI-generated day summaries
    headlineStyle: 'date',
  },
  badges: {
    showCategory: true, // "Adventure", "Food", etc.
    showMilestones: true,
    showStreak: false,
    customBadges: [
      {
        id: 'vac-badge-1',
        name: 'Explorer',
        icon: 'compass',
        description: 'Documented 5 adventures',
        triggerCondition: { type: 'category', value: 'adventure' },
      },
      {
        id: 'vac-badge-2',
        name: 'Foodie',
        icon: 'utensils',
        description: 'Shared 3 food photos',
        triggerCondition: { type: 'entry_count', value: 3 },
      },
    ],
  },
  attribution: {
    format: 'name',
    showTimestamp: true,
    timestampFormat: 'absolute', // Exact time matters for trips
  },
  language: {
    entryNoun: 'snapshot',
    collectionNoun: 'travel journal',
    participantNoun: 'traveler',
    actionVerb: 'captured',
  },
};

const vacationStructuralRules: StructuralRules = {
  chapters: {
    enabled: true,
    trigger: 'date_milestone',
    triggerValue: 'daily', // Each day is a chapter
    naming: 'date',
    showChapterSummary: true, // AI day summaries
  },
  recaps: {
    enabled: false, // Trip is short, no weekly recaps
    frequency: 'weekly',
    includeHighlights: true,
    includeStats: true,
    deliveryMethod: 'in_app',
  },
  specialSections: {
    pinnedAtTop: true,
    highlightsSection: true,
    yearInReview: false, // Trip-specific, not yearly
  },
  density: {
    entriesPerPage: 12,
    lazyLoadThreshold: 6,
    showLoadMore: true,
  },
};

const vacationExportConfig: ExportConfig = {
  book: {
    pageSize: 'letter',
    orientation: 'landscape',
    includeTableOfContents: true,
    includeCoverPage: true,
    includeParticipantIndex: false,
  },
  content: {
    includeHidden: false,
    includePrompts: false,
    photoQuality: 'print',
    maxPhotosPerEntry: 8,
  },
  styling: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
    headerStyle: 'decorative',
    pageNumbers: true,
  },
  premium: {
    aiNarrative: true,
    professionalLayout: true,
    hardcoverReady: true,
  },
};

const vacationCadenceConfig: CadenceConfig = {
  defaultFrequency: 'daily', // Trips need daily prompts
  defaultDayOfWeek: null,
  defaultTime: '20:00', // Evening reflection
  defaultTimezone: 'America/New_York',
  adaptive: {
    enabled: true,
    minResponseRate: 0.5, // High engagement expected
    maxResponseRate: 1.0,
    respectQuietHours: false, // Vacation hours are weird
    quietHoursStart: '01:00',
    quietHoursEnd: '07:00',
  },
  special: {
    birthdayPrompts: false,
    anniversaryPrompts: false,
    holidayPrompts: false,
  },
  participantRules: {
    newParticipantBurst: false, // Trip is already time-limited
    burstDuration: 0,
    burstFrequency: 'daily',
    inactiveReminder: true,
    inactiveThresholdDays: 2, // Quick reminder on trips
  },
};

const vacationAIConfig: AITemplateConfig = {
  features: {
    adaptivePrompts: true,
    smartScheduling: true,
    chapterSuggestions: false, // Days are natural chapters
    highlightCuration: true,
    narrativeGeneration: true,
    sentimentAnalysis: false,
    topicClustering: true,
  },
  promptGeneration: {
    enabled: true,
    contextWindowEntries: 10,
    personalizePerParticipant: false,
    avoidTopics: [],
    encourageTopics: ['local experiences', 'food', 'surprises'],
  },
  analysis: {
    extractKeyMoments: true,
    trackThemes: true, // Track trip themes
    suggestFollowUps: true,
  },
  narrative: {
    generateChapterIntros: true, // Day summaries
    generateYearInReview: false,
    writingStyle: 'journalistic',
    preserveVoice: true,
  },
  privacy: {
    aiProcessingConsent: false,
    dataRetentionDays: 60,
    excludeParticipants: [],
  },
};

export const VACATION_TEMPLATE: JournalTemplate = {
  id: 'template-vacation-001',
  type: 'vacation',
  name: 'Travel Journal',
  description: 'Document your adventures with daily prompts designed for trips and vacations.',
  tagline: 'Every trip deserves its own story',
  promptPack: vacationPromptPack,
  visualRules: vacationVisualRules,
  framingRules: vacationFramingRules,
  structuralRules: vacationStructuralRules,
  exportConfig: vacationExportConfig,
  cadenceConfig: vacationCadenceConfig,
  aiConfig: vacationAIConfig,
  metadata: {
    version: '1.0.0',
    isSystem: true,
    isPremium: true, // Premium template
    exampleEntriesCount: 15,
  },
  suggestedRelationships: ['travel buddy', 'family', 'partner', 'friend'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const SYSTEM_TEMPLATES: Record<string, JournalTemplate> = {
  family: FAMILY_TEMPLATE,
  romantic: ROMANTIC_TEMPLATE,
  friends: FRIENDS_TEMPLATE,
  vacation: VACATION_TEMPLATE,
};

export const getTemplateByType = (type: string): JournalTemplate | undefined => {
  return SYSTEM_TEMPLATES[type];
};

export const getAllTemplates = (): JournalTemplate[] => {
  return Object.values(SYSTEM_TEMPLATES);
};

export const getFreeTemplates = (): JournalTemplate[] => {
  return Object.values(SYSTEM_TEMPLATES).filter(t => !t.metadata.isPremium);
};

export const getPremiumTemplates = (): JournalTemplate[] => {
  return Object.values(SYSTEM_TEMPLATES).filter(t => t.metadata.isPremium);
};
