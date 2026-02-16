// Core types for Keepswell mobile app

export type TemplateType = 'family' | 'friends' | 'romantic' | 'vacation' | 'retirement' | 'custom';

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
  phone_number: string | null;
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

// Reaction types
export type ReactionType = 'heart' | 'fire' | 'laugh' | 'sad' | 'wow' | 'clap';

export const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  heart: '❤️',
  fire: '🔥',
  laugh: '😂',
  sad: '😢',
  wow: '😮',
  clap: '👏',
};

export const ALLOWED_REACTIONS: ReactionType[] = ['heart', 'fire', 'laugh', 'sad', 'wow', 'clap'];

export interface Reaction {
  id: string;
  entry_id: string;
  participant_id: string;
  emoji: ReactionType;
  created_at: string;
  participant?: Participant;
}

export interface ReactionGroup {
  count: number;
  participants: Array<{ id: string; display_name: string }>;
}

export interface EntryReactions {
  entry_id: string;
  reactions: Record<string, ReactionGroup>;
  total: number;
}

export interface CreateReactionDto {
  emoji: ReactionType;
  participant_id?: string;
}

export interface ToggleReactionResponse {
  action: 'added' | 'removed';
  reaction?: Reaction;
}

export interface Prompt {
  id: string;
  template_id: string | null;
  journal_id?: string | null;
  text: string;
  category: string | null;
  sequence_order: number | null;
  is_starter?: boolean;
  requires_photo?: boolean;
  is_deep?: boolean;
  is_custom?: boolean;
  created_at: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateJournalDto {
  title: string;
  description?: string;
  template_type: TemplateType;
  prompt_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  prompt_day_of_week?: number;
  prompt_time?: string;
  timezone?: string;
  cover_image_url?: string | null;
  owner_phone?: string;
  owner_participate?: boolean;
}

export interface CreateEntryDto {
  participant_id?: string;
  content?: string;
  media_urls?: string[];
  contributor_name?: string;
}

export interface InviteParticipantDto {
  phone_number?: string;
  display_name: string;
  email?: string;
  relationship?: string;
}

export interface UsageLimits {
  journalCount: number;
  maxJournals: number;
  canCreateJournal: boolean;
  tier: string;
  isPro: boolean;
  smsEnabled: boolean;
  customPrompts: boolean;
  maxContributorsPerJournal: number;
  extraParticipantSlots: number;
  eventPassExpiresAt: string | null;
  trialEndsAt: string | null;
}

export interface SubscriptionStatus {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  eventPassExpiresAt: string | null;
  extraParticipantSlots: number;
}

export interface Pricing {
  pro: {
    monthly: number;
    yearly: number;
    trialDays: number;
  };
  event: {
    oneTime: number;
    durationDays: number;
  };
  addOns: {
    participantBundle: {
      price: number;
      slots: number;
    };
  };
}
