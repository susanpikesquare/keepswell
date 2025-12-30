// Visual themes for each journal template type
import type { VisualRulesConfig, TemplateType } from '../types';

export interface JournalTheme {
  name: string;
  // Background
  bgGradient: string;
  bgPattern?: string;
  // Colors
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  // Entry card styling
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  // Timeline
  timelineColor: string;
  timelineDot: string;
  // Photo frame
  photoFrame: string;
  photoBorder: string;
  // Decorative
  icon: string;
  // Text styling
  quoteStyle: string;
  // Animation
  animationStyle: 'fade' | 'slide' | 'none';
}

// Static theme definitions (fallback when API data not available)
export const journalThemes: Record<string, JournalTheme> = {
  family: {
    name: 'Family Memories',
    bgGradient: 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50',
    bgPattern: 'bg-[radial-gradient(#f9731620_1px,transparent_1px)] bg-[size:20px_20px]',
    primaryColor: 'text-amber-800',
    accentColor: 'text-rose-600',
    textColor: 'text-amber-950',
    mutedColor: 'text-amber-700/70',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    cardBorder: 'border-amber-200/50',
    cardShadow: 'shadow-lg shadow-amber-100/50',
    timelineColor: 'bg-gradient-to-b from-amber-300 to-rose-300',
    timelineDot: 'bg-amber-500 ring-4 ring-amber-100',
    photoFrame: 'ring-4 ring-white shadow-xl',
    photoBorder: 'border-4 border-white',
    icon: 'heart',
    quoteStyle: 'font-serif italic',
    animationStyle: 'fade',
  },
  friends: {
    name: 'Friend Circle',
    bgGradient: 'bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50',
    bgPattern: 'bg-[radial-gradient(#6366f120_1px,transparent_1px)] bg-[size:20px_20px]',
    primaryColor: 'text-indigo-800',
    accentColor: 'text-purple-600',
    textColor: 'text-indigo-950',
    mutedColor: 'text-indigo-700/70',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    cardBorder: 'border-indigo-200/50',
    cardShadow: 'shadow-lg shadow-indigo-100/50',
    timelineColor: 'bg-gradient-to-b from-sky-300 to-purple-300',
    timelineDot: 'bg-indigo-500 ring-4 ring-indigo-100',
    photoFrame: 'ring-4 ring-white shadow-xl',
    photoBorder: 'border-4 border-white',
    icon: 'sparkles',
    quoteStyle: 'font-sans',
    animationStyle: 'slide',
  },
  romantic: {
    name: 'Love Story',
    bgGradient: 'bg-gradient-to-br from-pink-50 via-rose-50 to-red-50',
    bgPattern: 'bg-[radial-gradient(#f4316320_1px,transparent_1px)] bg-[size:20px_20px]',
    primaryColor: 'text-rose-800',
    accentColor: 'text-pink-600',
    textColor: 'text-rose-950',
    mutedColor: 'text-rose-700/70',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    cardBorder: 'border-rose-200/50',
    cardShadow: 'shadow-lg shadow-rose-100/50',
    timelineColor: 'bg-gradient-to-b from-pink-300 to-red-300',
    timelineDot: 'bg-rose-500 ring-4 ring-rose-100',
    photoFrame: 'ring-4 ring-white shadow-xl',
    photoBorder: 'border-4 border-white',
    icon: 'heart',
    quoteStyle: 'font-serif italic',
    animationStyle: 'fade',
  },
  vacation: {
    name: 'Travel Journal',
    bgGradient: 'bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50',
    bgPattern: 'bg-[radial-gradient(#0891b220_1px,transparent_1px)] bg-[size:20px_20px]',
    primaryColor: 'text-sky-800',
    accentColor: 'text-amber-500',
    textColor: 'text-sky-950',
    mutedColor: 'text-sky-700/70',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    cardBorder: 'border-sky-200/50',
    cardShadow: 'shadow-lg shadow-sky-100/50',
    timelineColor: 'bg-gradient-to-b from-sky-300 to-teal-300',
    timelineDot: 'bg-sky-500 ring-4 ring-sky-100',
    photoFrame: 'ring-4 ring-white shadow-xl',
    photoBorder: 'border-4 border-white',
    icon: 'plane',
    quoteStyle: 'font-sans',
    animationStyle: 'slide',
  },
  custom: {
    name: 'Custom Journal',
    bgGradient: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
    bgPattern: 'bg-[radial-gradient(#71717a20_1px,transparent_1px)] bg-[size:20px_20px]',
    primaryColor: 'text-slate-800',
    accentColor: 'text-zinc-600',
    textColor: 'text-slate-950',
    mutedColor: 'text-slate-700/70',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    cardBorder: 'border-slate-200/50',
    cardShadow: 'shadow-lg shadow-slate-100/50',
    timelineColor: 'bg-gradient-to-b from-slate-300 to-zinc-300',
    timelineDot: 'bg-slate-500 ring-4 ring-slate-100',
    photoFrame: 'ring-4 ring-white shadow-xl',
    photoBorder: 'border-4 border-white',
    icon: 'book',
    quoteStyle: 'font-sans',
    animationStyle: 'fade',
  },
};

/**
 * Get theme by template type (static fallback)
 */
export function getTheme(templateType: string): JournalTheme {
  return journalThemes[templateType] || journalThemes.custom;
}

/**
 * Convert hex color to Tailwind-compatible classes
 * This maps hex colors from API to Tailwind utility classes
 */
function hexToTailwindClass(hex: string, property: 'text' | 'bg' | 'border'): string {
  // Common color mappings from our API colors
  const colorMap: Record<string, string> = {
    // Family - amber/rose
    '#92400e': 'amber-800',
    '#e11d48': 'rose-600',
    '#fffbeb': 'amber-50',
    '#451a03': 'amber-950',
    '#b45309': 'amber-700',
    // Friends - indigo/purple
    '#3730a3': 'indigo-800',
    '#8b5cf6': 'violet-500',
    '#eef2ff': 'indigo-50',
    '#1e1b4b': 'indigo-950',
    '#4338ca': 'indigo-700',
    // Romantic - rose/pink
    '#9f1239': 'rose-800',
    '#ec4899': 'pink-500',
    '#fff1f2': 'rose-50',
    '#4c0519': 'rose-950',
    '#be123c': 'rose-700',
    // Vacation - sky/amber
    '#0369a1': 'sky-700',
    '#f59e0b': 'amber-500',
    '#f0f9ff': 'sky-50',
    '#0c4a6e': 'sky-900',
    '#0284c7': 'sky-600',
    // Custom - slate
    '#475569': 'slate-600',
    '#64748b': 'slate-500',
    '#f8fafc': 'slate-50',
    '#0f172a': 'slate-900',
    '#94a3b8': 'slate-400',
  };

  const tailwindColor = colorMap[hex.toLowerCase()];
  if (tailwindColor) {
    return `${property}-${tailwindColor}`;
  }

  // Fallback: use inline style approach or default
  return `${property}-slate-600`;
}

/**
 * Convert API VisualRulesConfig to JournalTheme
 */
export function visualRulesToTheme(
  visualRules: VisualRulesConfig,
  templateType: TemplateType
): JournalTheme {
  const baseTheme = journalThemes[templateType] || journalThemes.custom;
  const { colors, decorations, text, timeline } = visualRules;

  // Map quote style to font classes
  const quoteStyleMap: Record<string, string> = {
    serif: 'font-serif',
    italic: 'font-serif italic',
    handwritten: 'font-serif italic',
    clean: 'font-sans',
  };

  return {
    ...baseTheme,
    // Override with API colors if different from base
    primaryColor: hexToTailwindClass(colors.primary, 'text'),
    accentColor: hexToTailwindClass(colors.accent, 'text'),
    textColor: hexToTailwindClass(colors.text, 'text'),
    mutedColor: `${hexToTailwindClass(colors.muted, 'text')}/70`,
    // Keep card styling from base (complex gradients)
    cardBg: baseTheme.cardBg,
    cardBorder: baseTheme.cardBorder,
    cardShadow: baseTheme.cardShadow,
    // Decorations
    icon: decorations.icon,
    // Text styling
    quoteStyle: quoteStyleMap[text.quoteStyle] || 'font-sans',
    // Animation
    animationStyle: timeline.animationStyle,
  };
}

/**
 * Get theme from API visual rules or fall back to static theme
 */
export function getThemeFromConfig(
  visualRules: VisualRulesConfig | null | undefined,
  templateType: TemplateType
): JournalTheme {
  if (visualRules) {
    return visualRulesToTheme(visualRules, templateType);
  }
  return getTheme(templateType);
}

/**
 * Template display information for UI
 */
export interface TemplateInfo {
  type: TemplateType;
  name: string;
  description: string;
  tagline: string;
  icon: string;
  isPremium: boolean;
  gradient: string;
}

export const templateInfo: Record<TemplateType, TemplateInfo> = {
  family: {
    type: 'family',
    name: 'Family Memories',
    description: 'Collect stories, wisdom, and cherished moments from your family members across generations.',
    tagline: 'Every family has a story worth preserving',
    icon: 'heart',
    isPremium: false,
    gradient: 'from-amber-500 to-rose-500',
  },
  friends: {
    type: 'friends',
    name: 'Friend Circle',
    description: 'Capture adventures, inside jokes, and shared memories with your closest friends.',
    tagline: 'Because the best stories start with friends',
    icon: 'sparkles',
    isPremium: false,
    gradient: 'from-indigo-500 to-purple-500',
  },
  romantic: {
    type: 'romantic',
    name: 'Love Story',
    description: 'Document your relationship journey with intimate prompts that deepen your connection.',
    tagline: 'Your love story, one moment at a time',
    icon: 'heart',
    isPremium: true,
    gradient: 'from-pink-500 to-rose-500',
  },
  vacation: {
    type: 'vacation',
    name: 'Travel Journal',
    description: 'Document your adventures with daily prompts designed for trips and vacations.',
    tagline: 'Every trip deserves its own story',
    icon: 'plane',
    isPremium: true,
    gradient: 'from-sky-500 to-teal-500',
  },
  custom: {
    type: 'custom',
    name: 'Custom Journal',
    description: 'Create your own journal with custom prompts and settings.',
    tagline: 'Your story, your way',
    icon: 'book',
    isPremium: false,
    gradient: 'from-slate-500 to-zinc-500',
  },
};

/**
 * Get all template types in display order
 */
export function getTemplateTypes(): TemplateType[] {
  return ['family', 'friends', 'romantic', 'vacation', 'custom'];
}

/**
 * Get free template types only
 */
export function getFreeTemplateTypes(): TemplateType[] {
  return ['family', 'friends', 'custom'];
}

/**
 * Get premium template types only
 */
export function getPremiumTemplateTypes(): TemplateType[] {
  return ['romantic', 'vacation'];
}
