import { DataSource } from 'typeorm';
import { JournalTemplate, Prompt } from '../entities';
import type {
  VisualRulesConfig,
  FramingRulesConfig,
  StructuralRulesConfig,
  ExportConfigData,
  CadenceConfigData,
  AIConfigData,
  CategoryWeights,
  RotationSettings,
} from '../entities';

/**
 * Seeds all system templates with full configuration and prompts
 */
export async function seedAllTemplates(dataSource: DataSource): Promise<void> {
  const templateRepo = dataSource.getRepository(JournalTemplate);
  const promptRepo = dataSource.getRepository(Prompt);

  // Seed each template
  await seedFamilyTemplate(templateRepo, promptRepo);
  await seedFriendsTemplate(templateRepo, promptRepo);
  await seedRomanticTemplate(templateRepo, promptRepo);
  await seedVacationTemplate(templateRepo, promptRepo);
}

// =============================================================================
// FAMILY TEMPLATE
// =============================================================================

async function seedFamilyTemplate(
  templateRepo: ReturnType<DataSource['getRepository']>,
  promptRepo: ReturnType<DataSource['getRepository']>,
): Promise<void> {
  const existing = await templateRepo.findOne({
    where: { type: 'family', is_system_template: true },
  });
  if (existing) {
    console.log('Family template already exists, updating...');
    await updateTemplate(templateRepo, promptRepo, existing.id, getFamilyTemplateData());
    return;
  }

  const data = getFamilyTemplateData();
  const template = await templateRepo.save({
    name: data.name,
    type: 'family',
    description: data.description,
    tagline: data.tagline,
    is_system_template: true,
    is_premium: false,
    visual_rules: data.visualRules,
    framing_rules: data.framingRules,
    structural_rules: data.structuralRules,
    export_config: data.exportConfig,
    cadence_config: data.cadenceConfig,
    ai_config: data.aiConfig,
    category_weights: data.categoryWeights,
    rotation_settings: data.rotationSettings,
    suggested_relationships: data.suggestedRelationships,
    version: '1.0.0',
  });

  await seedPrompts(promptRepo, template.id, data.prompts);
  console.log(`Seeded family template with ${data.prompts.length} prompts`);
}

// =============================================================================
// FRIENDS TEMPLATE
// =============================================================================

async function seedFriendsTemplate(
  templateRepo: ReturnType<DataSource['getRepository']>,
  promptRepo: ReturnType<DataSource['getRepository']>,
): Promise<void> {
  const existing = await templateRepo.findOne({
    where: { type: 'friends', is_system_template: true },
  });
  if (existing) {
    console.log('Friends template already exists, updating...');
    await updateTemplate(templateRepo, promptRepo, existing.id, getFriendsTemplateData());
    return;
  }

  const data = getFriendsTemplateData();
  const template = await templateRepo.save({
    name: data.name,
    type: 'friends',
    description: data.description,
    tagline: data.tagline,
    is_system_template: true,
    is_premium: false,
    visual_rules: data.visualRules,
    framing_rules: data.framingRules,
    structural_rules: data.structuralRules,
    export_config: data.exportConfig,
    cadence_config: data.cadenceConfig,
    ai_config: data.aiConfig,
    category_weights: data.categoryWeights,
    rotation_settings: data.rotationSettings,
    suggested_relationships: data.suggestedRelationships,
    version: '1.0.0',
  });

  await seedPrompts(promptRepo, template.id, data.prompts);
  console.log(`Seeded friends template with ${data.prompts.length} prompts`);
}

// =============================================================================
// ROMANTIC TEMPLATE
// =============================================================================

async function seedRomanticTemplate(
  templateRepo: ReturnType<DataSource['getRepository']>,
  promptRepo: ReturnType<DataSource['getRepository']>,
): Promise<void> {
  const existing = await templateRepo.findOne({
    where: { type: 'romantic', is_system_template: true },
  });
  if (existing) {
    console.log('Romantic template already exists, updating...');
    await updateTemplate(templateRepo, promptRepo, existing.id, getRomanticTemplateData());
    return;
  }

  const data = getRomanticTemplateData();
  const template = await templateRepo.save({
    name: data.name,
    type: 'romantic',
    description: data.description,
    tagline: data.tagline,
    is_system_template: true,
    is_premium: true, // Premium template
    visual_rules: data.visualRules,
    framing_rules: data.framingRules,
    structural_rules: data.structuralRules,
    export_config: data.exportConfig,
    cadence_config: data.cadenceConfig,
    ai_config: data.aiConfig,
    category_weights: data.categoryWeights,
    rotation_settings: data.rotationSettings,
    suggested_relationships: data.suggestedRelationships,
    version: '1.0.0',
  });

  await seedPrompts(promptRepo, template.id, data.prompts);
  console.log(`Seeded romantic template with ${data.prompts.length} prompts`);
}

// =============================================================================
// VACATION TEMPLATE
// =============================================================================

async function seedVacationTemplate(
  templateRepo: ReturnType<DataSource['getRepository']>,
  promptRepo: ReturnType<DataSource['getRepository']>,
): Promise<void> {
  const existing = await templateRepo.findOne({
    where: { type: 'vacation', is_system_template: true },
  });
  if (existing) {
    console.log('Vacation template already exists, updating...');
    await updateTemplate(templateRepo, promptRepo, existing.id, getVacationTemplateData());
    return;
  }

  const data = getVacationTemplateData();
  const template = await templateRepo.save({
    name: data.name,
    type: 'vacation',
    description: data.description,
    tagline: data.tagline,
    is_system_template: true,
    is_premium: true, // Premium template
    visual_rules: data.visualRules,
    framing_rules: data.framingRules,
    structural_rules: data.structuralRules,
    export_config: data.exportConfig,
    cadence_config: data.cadenceConfig,
    ai_config: data.aiConfig,
    category_weights: data.categoryWeights,
    rotation_settings: data.rotationSettings,
    suggested_relationships: data.suggestedRelationships,
    version: '1.0.0',
  });

  await seedPrompts(promptRepo, template.id, data.prompts);
  console.log(`Seeded vacation template with ${data.prompts.length} prompts`);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function updateTemplate(
  templateRepo: ReturnType<DataSource['getRepository']>,
  promptRepo: ReturnType<DataSource['getRepository']>,
  templateId: string,
  data: TemplateData,
): Promise<void> {
  await templateRepo.update(templateId, {
    name: data.name,
    description: data.description,
    tagline: data.tagline,
    visual_rules: data.visualRules,
    framing_rules: data.framingRules,
    structural_rules: data.structuralRules,
    export_config: data.exportConfig,
    cadence_config: data.cadenceConfig,
    ai_config: data.aiConfig,
    category_weights: data.categoryWeights,
    rotation_settings: data.rotationSettings,
    suggested_relationships: data.suggestedRelationships,
    version: '1.0.0',
  });

  // Delete existing prompts and re-seed
  await promptRepo.delete({ template_id: templateId });
  await seedPrompts(promptRepo, templateId, data.prompts);
}

async function seedPrompts(
  promptRepo: ReturnType<DataSource['getRepository']>,
  templateId: string,
  prompts: PromptData[],
): Promise<void> {
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    await promptRepo.save({
      template_id: templateId,
      text: prompt.text,
      category: prompt.category,
      tone: prompt.tone,
      weight: prompt.weight,
      sequence_order: i + 1,
      seasonality: prompt.seasonality,
      targeting: prompt.targeting,
      is_starter: prompt.isStarter,
      requires_photo: prompt.requiresPhoto,
      is_deep: prompt.isDeep,
      is_custom: false,
    });
  }
}

// =============================================================================
// DATA TYPES
// =============================================================================

interface PromptData {
  text: string;
  category: string;
  tone: string;
  weight: number;
  seasonality?: { months?: number[]; daysOfWeek?: number[]; holidays?: string[] };
  targeting?: { relationships?: string[]; minResponses?: number; maxResponses?: number };
  isStarter: boolean;
  requiresPhoto: boolean;
  isDeep: boolean;
}

interface TemplateData {
  name: string;
  description: string;
  tagline: string;
  visualRules: VisualRulesConfig;
  framingRules: FramingRulesConfig;
  structuralRules: StructuralRulesConfig;
  exportConfig: ExportConfigData;
  cadenceConfig: CadenceConfigData;
  aiConfig: AIConfigData;
  categoryWeights: CategoryWeights;
  rotationSettings: RotationSettings;
  suggestedRelationships: string[];
  prompts: PromptData[];
}

// =============================================================================
// TEMPLATE DATA FUNCTIONS
// =============================================================================

function getFamilyTemplateData(): TemplateData {
  return {
    name: 'Family Memories',
    description: 'Collect stories, wisdom, and cherished moments from your family members across generations.',
    tagline: 'Every family has a story worth preserving',
    visualRules: {
      photo: { emphasis: 'photo', defaultAspectRatio: '4:3', gridLayout: 'single', showCaptions: true, frameStyle: 'polaroid' },
      text: { quoteStyle: 'serif', showAttribution: true, maxPreviewLength: 280, highlightFirstEntry: true },
      timeline: { groupBy: 'month', showDateHeaders: true, showParticipantAvatars: true, animationStyle: 'fade' },
      colors: { primary: '#92400e', accent: '#e11d48', background: '#fffbeb', cardBackground: '#ffffff', text: '#451a03', muted: '#b45309' },
      decorations: { icon: 'heart', pattern: 'dots', showMoodIndicators: false, showReactionEmojis: false },
    },
    framingRules: {
      headlines: { showPromptAsHeadline: true, generateHeadline: false, headlineStyle: 'question' },
      badges: { showCategory: false, showMilestones: true, showStreak: false, customBadges: [] },
      attribution: { format: 'relationship', showTimestamp: true, timestampFormat: 'friendly' },
      language: { entryNoun: 'memory', collectionNoun: 'family journal', participantNoun: 'family member', actionVerb: 'shared' },
    },
    structuralRules: {
      chapters: { enabled: true, trigger: 'date_milestone', triggerValue: 'monthly', naming: 'date', showChapterSummary: false },
      recaps: { enabled: true, frequency: 'monthly', includeHighlights: false, includeStats: true, deliveryMethod: 'email' },
      specialSections: { pinnedAtTop: true, highlightsSection: false, yearInReview: true },
      density: { entriesPerPage: 10, lazyLoadThreshold: 5, showLoadMore: true },
    },
    exportConfig: {
      book: { pageSize: '8x10', orientation: 'portrait', includeTableOfContents: true, includeCoverPage: true, includeParticipantIndex: true },
      content: { includeHidden: false, includePrompts: true, photoQuality: 'print', maxPhotosPerEntry: 4 },
      styling: { fontFamily: 'Georgia, serif', fontSize: 12, margins: { top: 72, bottom: 72, left: 72, right: 72 }, headerStyle: 'decorative', pageNumbers: true },
      premium: { aiNarrative: false, professionalLayout: false, hardcoverReady: false },
    },
    cadenceConfig: {
      defaultFrequency: 'weekly', defaultDayOfWeek: 0, defaultTime: '10:00', defaultTimezone: 'America/New_York',
      adaptive: { enabled: false, minResponseRate: 0.3, maxResponseRate: 0.8, respectQuietHours: true, quietHoursStart: '21:00', quietHoursEnd: '09:00' },
      special: { birthdayPrompts: true, anniversaryPrompts: true, holidayPrompts: true },
      participantRules: { newParticipantBurst: true, burstDuration: 7, burstFrequency: 'daily', inactiveReminder: true, inactiveThresholdDays: 21 },
    },
    aiConfig: {
      features: { adaptivePrompts: true, smartScheduling: true, chapterSuggestions: true, highlightCuration: true, narrativeGeneration: true, sentimentAnalysis: false, topicClustering: true },
      promptGeneration: { enabled: true, contextWindowEntries: 20, personalizePerParticipant: true, avoidTopics: [], encourageTopics: ['childhood', 'traditions', 'lessons'] },
      analysis: { extractKeyMoments: true, trackThemes: true, suggestFollowUps: true },
      narrative: { generateChapterIntros: true, generateYearInReview: true, writingStyle: 'storytelling', preserveVoice: true },
      privacy: { aiProcessingConsent: false, dataRetentionDays: 90, excludeParticipants: [] },
    },
    categoryWeights: { memories: 25, gratitude: 15, milestones: 10, traditions: 15, wisdom: 15, stories: 15, dreams: 0, daily: 5, reflection: 0, adventure: 0 },
    rotationSettings: { avoidRepeatDays: 30, avoidCategoryRepeat: 2, prioritizeUnused: true },
    suggestedRelationships: ['parent', 'grandparent', 'sibling', 'aunt', 'uncle', 'cousin', 'child', 'grandchild'],
    prompts: [
      { text: "What's your favorite childhood memory?", category: 'memories', tone: 'nostalgic', weight: 8, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "Tell us about a family tradition you cherish.", category: 'traditions', tone: 'warm', weight: 8, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What's the best advice you ever received from a family member?", category: 'wisdom', tone: 'reflective', weight: 7, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "Describe a meal that brings back special memories.", category: 'memories', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "What's something you're grateful for about our family?", category: 'gratitude', tone: 'warm', weight: 8, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "Share a funny story from a family gathering.", category: 'stories', tone: 'playful', weight: 8, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What family recipe has been passed down through generations?", category: 'traditions', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "Describe your favorite family vacation or trip.", category: 'memories', tone: 'celebratory', weight: 8, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "What values do you hope to pass on to future generations?", category: 'wisdom', tone: 'reflective', weight: 6, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "Tell us about a challenge our family overcame together.", category: 'stories', tone: 'reflective', weight: 6, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "What's your earliest memory of our family home?", category: 'memories', tone: 'nostalgic', weight: 6, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "Share a lesson you learned from a grandparent.", category: 'wisdom', tone: 'warm', weight: 6, isStarter: false, requiresPhoto: false, isDeep: true, targeting: { relationships: ['grandchild', 'child'] } },
      { text: "What holiday tradition means the most to you?", category: 'traditions', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false, seasonality: { months: [11, 12, 1] } },
      { text: "Describe a moment when you felt proud of our family.", category: 'milestones', tone: 'celebratory', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What song or music reminds you of family?", category: 'memories', tone: 'nostalgic', weight: 5, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Tell us about a family member who inspired you.", category: 'stories', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: true, isDeep: true },
      { text: "What's something unique about our family?", category: 'stories', tone: 'playful', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Share a memory of a birthday celebration.", category: 'milestones', tone: 'celebratory', weight: 6, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "What do you love most about being part of this family?", category: 'gratitude', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Describe a perfect family day together.", category: 'memories', tone: 'warm', weight: 7, isStarter: true, requiresPhoto: false, isDeep: false },
    ],
  };
}

function getFriendsTemplateData(): TemplateData {
  return {
    name: 'Friend Circle',
    description: 'Capture adventures, inside jokes, and shared memories with your closest friends.',
    tagline: 'Because the best stories start with friends',
    visualRules: {
      photo: { emphasis: 'photo', defaultAspectRatio: 'original', gridLayout: 'masonry', showCaptions: true, frameStyle: 'rounded' },
      text: { quoteStyle: 'clean', showAttribution: true, maxPreviewLength: 300, highlightFirstEntry: false },
      timeline: { groupBy: 'week', showDateHeaders: true, showParticipantAvatars: true, animationStyle: 'slide' },
      colors: { primary: '#3730a3', accent: '#8b5cf6', background: '#eef2ff', cardBackground: '#ffffff', text: '#1e1b4b', muted: '#4338ca' },
      decorations: { icon: 'sparkles', pattern: 'confetti', showMoodIndicators: false, showReactionEmojis: true },
    },
    framingRules: {
      headlines: { showPromptAsHeadline: false, generateHeadline: false, headlineStyle: 'participant' },
      badges: { showCategory: false, showMilestones: true, showStreak: true, customBadges: [] },
      attribution: { format: 'name', showTimestamp: true, timestampFormat: 'relative' },
      language: { entryNoun: 'moment', collectionNoun: 'group journal', participantNoun: 'friend', actionVerb: 'dropped' },
    },
    structuralRules: {
      chapters: { enabled: false, trigger: 'entry_count', triggerValue: 50, naming: 'auto', showChapterSummary: false },
      recaps: { enabled: true, frequency: 'weekly', includeHighlights: true, includeStats: true, deliveryMethod: 'both' },
      specialSections: { pinnedAtTop: true, highlightsSection: true, yearInReview: true },
      density: { entriesPerPage: 15, lazyLoadThreshold: 8, showLoadMore: true },
    },
    exportConfig: {
      book: { pageSize: 'letter', orientation: 'landscape', includeTableOfContents: false, includeCoverPage: true, includeParticipantIndex: true },
      content: { includeHidden: false, includePrompts: false, photoQuality: 'web', maxPhotosPerEntry: 6 },
      styling: { fontFamily: 'Inter, sans-serif', fontSize: 11, margins: { top: 36, bottom: 36, left: 36, right: 36 }, headerStyle: 'minimal', pageNumbers: false },
      premium: { aiNarrative: false, professionalLayout: false, hardcoverReady: false },
    },
    cadenceConfig: {
      defaultFrequency: 'weekly', defaultDayOfWeek: 5, defaultTime: '17:00', defaultTimezone: 'America/New_York',
      adaptive: { enabled: false, minResponseRate: 0.2, maxResponseRate: 0.7, respectQuietHours: false, quietHoursStart: '23:00', quietHoursEnd: '08:00' },
      special: { birthdayPrompts: true, anniversaryPrompts: false, holidayPrompts: false },
      participantRules: { newParticipantBurst: true, burstDuration: 3, burstFrequency: 'daily', inactiveReminder: true, inactiveThresholdDays: 30 },
    },
    aiConfig: {
      features: { adaptivePrompts: true, smartScheduling: false, chapterSuggestions: false, highlightCuration: true, narrativeGeneration: false, sentimentAnalysis: false, topicClustering: true },
      promptGeneration: { enabled: true, contextWindowEntries: 15, personalizePerParticipant: false, avoidTopics: [], encourageTopics: ['adventures', 'inside jokes', 'plans'] },
      analysis: { extractKeyMoments: true, trackThemes: false, suggestFollowUps: false },
      narrative: { generateChapterIntros: false, generateYearInReview: true, writingStyle: 'casual', preserveVoice: true },
      privacy: { aiProcessingConsent: false, dataRetentionDays: 30, excludeParticipants: [] },
    },
    categoryWeights: { memories: 25, gratitude: 15, milestones: 10, traditions: 0, wisdom: 0, stories: 25, dreams: 0, daily: 5, reflection: 5, adventure: 15 },
    rotationSettings: { avoidRepeatDays: 21, avoidCategoryRepeat: 2, prioritizeUnused: true },
    suggestedRelationships: ['best friend', 'college friend', 'work friend', 'childhood friend'],
    prompts: [
      { text: "What's your favorite memory of our group?", category: 'memories', tone: 'playful', weight: 9, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "Describe the moment you knew we'd be friends.", category: 'memories', tone: 'warm', weight: 7, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What's the most ridiculous thing we've done together?", category: 'memories', tone: 'playful', weight: 8, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Share a photo from a time we were all together.", category: 'memories', tone: 'nostalgic', weight: 7, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "Tell the story of our most epic adventure.", category: 'stories', tone: 'celebratory', weight: 8, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What's an inside joke only we would understand?", category: 'stories', tone: 'playful', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Share a story the group would want to remember forever.", category: 'stories', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What do you appreciate most about this friend group?", category: 'gratitude', tone: 'warm', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Who in this group always makes you laugh?", category: 'gratitude', tone: 'playful', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What's on our group bucket list?", category: 'adventure', tone: 'celebratory', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "If we could go anywhere tomorrow, where would it be?", category: 'adventure', tone: 'playful', weight: 5, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What happened this week that the group needs to hear about?", category: 'daily', tone: 'playful', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Drop a photo from your week!", category: 'daily', tone: 'playful', weight: 5, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "How has this friend group changed you?", category: 'reflection', tone: 'reflective', weight: 5, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "What's an achievement by someone in this group we should celebrate?", category: 'milestones', tone: 'celebratory', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
    ],
  };
}

function getRomanticTemplateData(): TemplateData {
  return {
    name: 'Love Story',
    description: 'Document your relationship journey with intimate prompts that deepen your connection.',
    tagline: 'Your love story, one moment at a time',
    visualRules: {
      photo: { emphasis: 'photo', defaultAspectRatio: '1:1', gridLayout: 'single', showCaptions: true, frameStyle: 'rounded' },
      text: { quoteStyle: 'handwritten', showAttribution: false, maxPreviewLength: 200, highlightFirstEntry: true },
      timeline: { groupBy: 'week', showDateHeaders: true, showParticipantAvatars: false, animationStyle: 'fade' },
      colors: { primary: '#9f1239', accent: '#ec4899', background: '#fff1f2', cardBackground: '#ffffff', text: '#4c0519', muted: '#be123c' },
      decorations: { icon: 'heart-filled', pattern: 'hearts', showMoodIndicators: true, showReactionEmojis: true },
    },
    framingRules: {
      headlines: { showPromptAsHeadline: false, generateHeadline: false, headlineStyle: 'date' },
      badges: { showCategory: false, showMilestones: true, showStreak: true, customBadges: [] },
      attribution: { format: 'name', showTimestamp: true, timestampFormat: 'friendly' },
      language: { entryNoun: 'moment', collectionNoun: 'love story', participantNoun: 'partner', actionVerb: 'captured' },
    },
    structuralRules: {
      chapters: { enabled: true, trigger: 'date_milestone', triggerValue: 'monthly', naming: 'numbered', showChapterSummary: false },
      recaps: { enabled: true, frequency: 'monthly', includeHighlights: false, includeStats: false, deliveryMethod: 'in_app' },
      specialSections: { pinnedAtTop: true, highlightsSection: true, yearInReview: true },
      density: { entriesPerPage: 8, lazyLoadThreshold: 4, showLoadMore: true },
    },
    exportConfig: {
      book: { pageSize: '6x9', orientation: 'portrait', includeTableOfContents: false, includeCoverPage: true, includeParticipantIndex: false },
      content: { includeHidden: false, includePrompts: false, photoQuality: 'print', maxPhotosPerEntry: 2 },
      styling: { fontFamily: 'Playfair Display, serif', fontSize: 11, margins: { top: 54, bottom: 54, left: 54, right: 54 }, headerStyle: 'minimal', pageNumbers: true },
      premium: { aiNarrative: true, professionalLayout: true, hardcoverReady: true },
    },
    cadenceConfig: {
      defaultFrequency: 'biweekly', defaultDayOfWeek: null, defaultTime: '19:00', defaultTimezone: 'America/New_York',
      adaptive: { enabled: true, minResponseRate: 0.4, maxResponseRate: 0.9, respectQuietHours: true, quietHoursStart: '23:00', quietHoursEnd: '08:00' },
      special: { birthdayPrompts: true, anniversaryPrompts: true, holidayPrompts: true },
      participantRules: { newParticipantBurst: false, burstDuration: 0, burstFrequency: 'weekly', inactiveReminder: true, inactiveThresholdDays: 14 },
    },
    aiConfig: {
      features: { adaptivePrompts: true, smartScheduling: true, chapterSuggestions: true, highlightCuration: true, narrativeGeneration: true, sentimentAnalysis: true, topicClustering: false },
      promptGeneration: { enabled: true, contextWindowEntries: 30, personalizePerParticipant: false, avoidTopics: [], encourageTopics: ['appreciation', 'future', 'growth'] },
      analysis: { extractKeyMoments: true, trackThemes: true, suggestFollowUps: true },
      narrative: { generateChapterIntros: true, generateYearInReview: true, writingStyle: 'poetic', preserveVoice: true },
      privacy: { aiProcessingConsent: false, dataRetentionDays: 60, excludeParticipants: [] },
    },
    categoryWeights: { memories: 25, gratitude: 20, milestones: 10, traditions: 0, wisdom: 0, stories: 10, dreams: 15, daily: 15, reflection: 5, adventure: 0 },
    rotationSettings: { avoidRepeatDays: 14, avoidCategoryRepeat: 2, prioritizeUnused: true },
    suggestedRelationships: ['partner', 'spouse', 'significant other'],
    prompts: [
      { text: "What's your favorite memory of us?", category: 'memories', tone: 'intimate', weight: 9, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "Describe the moment you knew this was special.", category: 'memories', tone: 'intimate', weight: 8, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "What do you remember about our first date?", category: 'memories', tone: 'nostalgic', weight: 7, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What's a small moment with us that you'll never forget?", category: 'memories', tone: 'intimate', weight: 7, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "What do you appreciate most about me?", category: 'gratitude', tone: 'intimate', weight: 8, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What's something I do that makes you feel loved?", category: 'gratitude', tone: 'warm', weight: 8, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What do you dream about for our future?", category: 'dreams', tone: 'intimate', weight: 7, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "Where would you love to travel together someday?", category: 'dreams', tone: 'playful', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What made you smile about us today?", category: 'daily', tone: 'warm', weight: 7, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "What's something that reminded you of me today?", category: 'daily', tone: 'warm', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What milestone in our relationship means the most to you?", category: 'milestones', tone: 'reflective', weight: 7, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "What's the funniest thing that's happened to us?", category: 'stories', tone: 'playful', weight: 7, isStarter: true, requiresPhoto: false, isDeep: false },
      { text: "How have I changed you for the better?", category: 'reflection', tone: 'intimate', weight: 6, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "Share a photo that captures how you feel about us.", category: 'memories', tone: 'warm', weight: 6, isStarter: false, requiresPhoto: true, isDeep: false },
    ],
  };
}

function getVacationTemplateData(): TemplateData {
  return {
    name: 'Travel Journal',
    description: 'Document your adventures with daily prompts designed for trips and vacations.',
    tagline: 'Every trip deserves its own story',
    visualRules: {
      photo: { emphasis: 'photo', defaultAspectRatio: '16:9', gridLayout: 'carousel', showCaptions: true, frameStyle: 'shadow' },
      text: { quoteStyle: 'clean', showAttribution: true, maxPreviewLength: 200, highlightFirstEntry: false },
      timeline: { groupBy: 'day', showDateHeaders: true, showParticipantAvatars: true, animationStyle: 'slide' },
      colors: { primary: '#0369a1', accent: '#f59e0b', background: '#f0f9ff', cardBackground: '#ffffff', text: '#0c4a6e', muted: '#0284c7' },
      decorations: { icon: 'plane', pattern: 'map', showMoodIndicators: false, showReactionEmojis: true },
    },
    framingRules: {
      headlines: { showPromptAsHeadline: false, generateHeadline: true, headlineStyle: 'date' },
      badges: { showCategory: true, showMilestones: true, showStreak: false, customBadges: [] },
      attribution: { format: 'name', showTimestamp: true, timestampFormat: 'absolute' },
      language: { entryNoun: 'snapshot', collectionNoun: 'travel journal', participantNoun: 'traveler', actionVerb: 'captured' },
    },
    structuralRules: {
      chapters: { enabled: true, trigger: 'date_milestone', triggerValue: 'daily', naming: 'date', showChapterSummary: true },
      recaps: { enabled: false, frequency: 'weekly', includeHighlights: true, includeStats: true, deliveryMethod: 'in_app' },
      specialSections: { pinnedAtTop: true, highlightsSection: true, yearInReview: false },
      density: { entriesPerPage: 12, lazyLoadThreshold: 6, showLoadMore: true },
    },
    exportConfig: {
      book: { pageSize: 'letter', orientation: 'landscape', includeTableOfContents: true, includeCoverPage: true, includeParticipantIndex: false },
      content: { includeHidden: false, includePrompts: false, photoQuality: 'print', maxPhotosPerEntry: 8 },
      styling: { fontFamily: 'Montserrat, sans-serif', fontSize: 11, margins: { top: 36, bottom: 36, left: 36, right: 36 }, headerStyle: 'decorative', pageNumbers: true },
      premium: { aiNarrative: true, professionalLayout: true, hardcoverReady: true },
    },
    cadenceConfig: {
      defaultFrequency: 'daily', defaultDayOfWeek: null, defaultTime: '20:00', defaultTimezone: 'America/New_York',
      adaptive: { enabled: true, minResponseRate: 0.5, maxResponseRate: 1.0, respectQuietHours: false, quietHoursStart: '01:00', quietHoursEnd: '07:00' },
      special: { birthdayPrompts: false, anniversaryPrompts: false, holidayPrompts: false },
      participantRules: { newParticipantBurst: false, burstDuration: 0, burstFrequency: 'daily', inactiveReminder: true, inactiveThresholdDays: 2 },
    },
    aiConfig: {
      features: { adaptivePrompts: true, smartScheduling: true, chapterSuggestions: false, highlightCuration: true, narrativeGeneration: true, sentimentAnalysis: false, topicClustering: true },
      promptGeneration: { enabled: true, contextWindowEntries: 10, personalizePerParticipant: false, avoidTopics: [], encourageTopics: ['local experiences', 'food', 'surprises'] },
      analysis: { extractKeyMoments: true, trackThemes: true, suggestFollowUps: true },
      narrative: { generateChapterIntros: true, generateYearInReview: false, writingStyle: 'journalistic', preserveVoice: true },
      privacy: { aiProcessingConsent: false, dataRetentionDays: 60, excludeParticipants: [] },
    },
    categoryWeights: { memories: 20, gratitude: 5, milestones: 0, traditions: 0, wisdom: 0, stories: 15, dreams: 0, daily: 25, reflection: 5, adventure: 30 },
    rotationSettings: { avoidRepeatDays: 3, avoidCategoryRepeat: 1, prioritizeUnused: true },
    suggestedRelationships: ['travel buddy', 'family', 'partner', 'friend'],
    prompts: [
      { text: "What was the highlight of today's adventure?", category: 'adventure', tone: 'celebratory', weight: 9, isStarter: true, requiresPhoto: true, isDeep: false },
      { text: "Share a photo of something that surprised you today.", category: 'adventure', tone: 'playful', weight: 8, isStarter: true, requiresPhoto: true, isDeep: false },
      { text: "What did you discover that wasn't in the guidebook?", category: 'adventure', tone: 'playful', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Describe the most beautiful thing you saw today.", category: 'adventure', tone: 'reflective', weight: 7, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "What did you eat today that was amazing?", category: 'daily', tone: 'playful', weight: 8, isStarter: true, requiresPhoto: true, isDeep: false },
      { text: "Who did you meet or interact with today?", category: 'daily', tone: 'warm', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What sounds or smells will you remember from today?", category: 'daily', tone: 'reflective', weight: 5, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Rate today's adventure on a scale of 1-10. Why?", category: 'daily', tone: 'playful', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Capture a moment you never want to forget.", category: 'memories', tone: 'warm', weight: 8, isStarter: false, requiresPhoto: true, isDeep: false },
      { text: "What made everyone laugh today?", category: 'memories', tone: 'playful', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "Share a photo that tells today's story.", category: 'memories', tone: 'warm', weight: 7, isStarter: true, requiresPhoto: true, isDeep: false },
      { text: "What went hilariously wrong today?", category: 'stories', tone: 'playful', weight: 7, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What was the most unexpected thing that happened?", category: 'stories', tone: 'celebratory', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
      { text: "What will you take home from this trip (besides souvenirs)?", category: 'reflection', tone: 'reflective', weight: 5, isStarter: false, requiresPhoto: false, isDeep: true },
      { text: "What are you most grateful for about this trip so far?", category: 'gratitude', tone: 'warm', weight: 6, isStarter: false, requiresPhoto: false, isDeep: false },
    ],
  };
}
