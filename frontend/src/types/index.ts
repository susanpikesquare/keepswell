export interface User {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'premium' | 'pro';
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export type TemplateType = 'family' | 'friends' | 'romantic' | 'vacation' | 'custom';

export interface Journal {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  template_type: TemplateType;
  cover_image_url: string | null;
  status: 'active' | 'paused' | 'archived';
  prompt_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  prompt_day_of_week: number | null;
  prompt_time: string;
  timezone: string;
  join_keyword: string | null;
  created_at: string;
  updated_at: string;
  participants?: Participant[];
}

export interface Participant {
  id: string;
  journal_id: string;
  phone_number: string;
  email: string | null;
  display_name: string;
  relationship: string | null;
  avatar_url: string | null;
  status: 'pending' | 'active' | 'paused' | 'removed';
  opted_in: boolean;
  last_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  journal_id: string;
  participant_id: string;
  prompt_send_id: string | null;
  content: string;
  entry_type: 'text' | 'photo' | 'mixed';
  is_hidden: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  participant?: Participant;
  media_attachments?: MediaAttachment[];
}

export interface MediaAttachment {
  id: string;
  entry_id: string;
  stored_url: string;
  thumbnail_url: string | null;
  media_type: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  template_id: string | null;
  text: string;
  category: string | null;
  sequence_order: number | null;
  is_starter?: boolean;
  requires_photo?: boolean;
  is_deep?: boolean;
  created_at: string;
}

// Visual Rules from Template
export interface VisualRulesConfig {
  photo: {
    emphasis: 'photo' | 'text' | 'balanced';
    defaultAspectRatio: '1:1' | '4:3' | '16:9' | 'original';
    gridLayout: 'single' | 'masonry' | 'carousel';
    showCaptions: boolean;
    frameStyle: 'none' | 'polaroid' | 'rounded' | 'shadow';
  };
  text: {
    quoteStyle: 'italic' | 'serif' | 'handwritten' | 'clean';
    showAttribution: boolean;
    maxPreviewLength: number;
    highlightFirstEntry: boolean;
  };
  timeline: {
    groupBy: 'day' | 'week' | 'month' | 'chapter';
    showDateHeaders: boolean;
    showParticipantAvatars: boolean;
    animationStyle: 'fade' | 'slide' | 'none';
  };
  colors: {
    primary: string;
    accent: string;
    background: string;
    cardBackground: string;
    text: string;
    muted: string;
  };
  decorations: {
    icon: string;
    pattern?: string;
    showMoodIndicators: boolean;
    showReactionEmojis: boolean;
  };
}

// Framing Rules from Template
export interface FramingRulesConfig {
  headlines: {
    showPromptAsHeadline: boolean;
    generateHeadline: boolean;
    headlineStyle: 'question' | 'statement' | 'date' | 'participant';
  };
  badges: {
    showCategory: boolean;
    showMilestones: boolean;
    showStreak: boolean;
  };
  attribution: {
    format: 'name' | 'relationship' | 'both' | 'anonymous';
    showTimestamp: boolean;
    timestampFormat: 'relative' | 'absolute' | 'friendly';
  };
  language: {
    entryNoun: string;
    collectionNoun: string;
    participantNoun: string;
    actionVerb: string;
  };
}

// Cadence Config from Template
export interface CadenceConfigData {
  defaultFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  defaultDayOfWeek: number | null;
  defaultTime: string;
  defaultTimezone: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description: string | null;
  tagline: string | null;
  is_system_template: boolean;
  is_premium: boolean;
  visual_rules: VisualRulesConfig | null;
  framing_rules: FramingRulesConfig | null;
  cadence_config: CadenceConfigData | null;
  suggested_relationships: string[] | null;
  prompts?: Prompt[];
}

// Resolved template config for a journal
export interface ResolvedTemplateConfig {
  templateId: string;
  templateType: TemplateType;
  visualRules: VisualRulesConfig;
  framingRules: FramingRulesConfig;
  cadenceConfig: CadenceConfigData;
  suggestedRelationships: string[];
  isPremium: boolean;
}

// API Request/Response types
export interface CreateJournalDto {
  title: string;
  description?: string;
  template_type: string;
  prompt_frequency?: string;
  prompt_day_of_week?: number;
  prompt_time?: string;
  timezone?: string;
  cover_image_url?: string | null;
  owner_phone?: string;
  owner_participate?: boolean;
}

export interface InviteParticipantDto {
  phone_number?: string;
  display_name: string;
  email?: string;
  relationship?: string;
}

export interface UpdateEntryDto {
  is_hidden?: boolean;
  is_pinned?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
