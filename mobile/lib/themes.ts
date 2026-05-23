// Visual themes for the mobile Memory Book view, keyed by journal template type.
// Derived from the Keepswell brand palette:
//   Coral       #D86F5C   primary accent
//   Warm Cream  #F6F1EA   background
//   Sand        #DCCCB7   secondary surface / border
//   Sage        #7A8A74   accent / nature
//   Slate       #3C4858   secondary text
//   Charcoal    #1F2328   primary text

import type { TemplateType } from '../api';

export interface JournalTheme {
  name: string;
  // Background
  bgColor: string;
  // Text colors
  primaryColor: string;   // headings
  accentColor: string;    // icons, timeline dot
  textColor: string;      // body text
  mutedColor: string;     // secondary text
  // Card
  cardBg: string;
  cardBorder: string;
  // Timeline
  timelineColor: string;
  timelineDot: string;
  // Decorative
  iconName: 'heart' | 'star' | 'plane' | 'book' | 'sun-o' | 'leaf';
  // Typography
  quoteFontStyle: 'italic' | 'normal';
  quoteFontFamily: 'serif' | 'sans';
}

// Brand colors as named constants for readability
const CORAL = '#D86F5C';
const WARM_CREAM = '#F6F1EA';
const SAND = '#DCCCB7';
const SAGE = '#7A8A74';
const SLATE = '#3C4858';
const CHARCOAL = '#1F2328';

export const journalThemes: Record<TemplateType, JournalTheme> = {
  family: {
    name: 'Family Memories',
    bgColor: WARM_CREAM,
    primaryColor: CORAL,
    accentColor: SAGE,
    textColor: CHARCOAL,
    mutedColor: SLATE,
    cardBg: '#ffffff',
    cardBorder: SAND,
    timelineColor: SAND,
    timelineDot: CORAL,
    iconName: 'heart',
    quoteFontStyle: 'italic',
    quoteFontFamily: 'serif',
  },
  friends: {
    name: 'Friend Circle',
    bgColor: WARM_CREAM,
    primaryColor: SAGE,
    accentColor: CORAL,
    textColor: CHARCOAL,
    mutedColor: SLATE,
    cardBg: '#ffffff',
    cardBorder: SAND,
    timelineColor: SAND,
    timelineDot: SAGE,
    iconName: 'star',
    quoteFontStyle: 'normal',
    quoteFontFamily: 'sans',
  },
  romantic: {
    name: 'Love Story',
    bgColor: WARM_CREAM,
    primaryColor: CORAL,
    accentColor: CORAL,
    textColor: CHARCOAL,
    mutedColor: SLATE,
    cardBg: '#ffffff',
    cardBorder: SAND,
    timelineColor: SAND,
    timelineDot: CORAL,
    iconName: 'heart',
    quoteFontStyle: 'italic',
    quoteFontFamily: 'serif',
  },
  vacation: {
    name: 'Travel Journal',
    bgColor: WARM_CREAM,
    primaryColor: SLATE,
    accentColor: SAGE,
    textColor: CHARCOAL,
    mutedColor: SLATE,
    cardBg: '#ffffff',
    cardBorder: SAND,
    timelineColor: SAND,
    timelineDot: SLATE,
    iconName: 'plane',
    quoteFontStyle: 'normal',
    quoteFontFamily: 'sans',
  },
  retirement: {
    name: 'Retirement Journey',
    bgColor: WARM_CREAM,
    primaryColor: SAND,
    accentColor: CORAL,
    textColor: CHARCOAL,
    mutedColor: SLATE,
    cardBg: '#ffffff',
    cardBorder: SAND,
    timelineColor: SAND,
    timelineDot: CORAL,
    iconName: 'sun-o',
    quoteFontStyle: 'italic',
    quoteFontFamily: 'serif',
  },
  custom: {
    name: 'Custom Journal',
    bgColor: WARM_CREAM,
    primaryColor: CHARCOAL,
    accentColor: CORAL,
    textColor: CHARCOAL,
    mutedColor: SLATE,
    cardBg: '#ffffff',
    cardBorder: SAND,
    timelineColor: SAND,
    timelineDot: SLATE,
    iconName: 'book',
    quoteFontStyle: 'normal',
    quoteFontFamily: 'sans',
  },
};

export function getTheme(templateType: TemplateType): JournalTheme {
  return journalThemes[templateType] || journalThemes.custom;
}
