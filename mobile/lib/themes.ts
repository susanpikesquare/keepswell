// Visual themes for the mobile Memory Book view, keyed by journal template type.
// Hex colors (React Native friendly) — keep in sync with frontend/src/lib/themes.ts.

import type { TemplateType } from '../api';

export interface JournalTheme {
  name: string;
  // Background
  bgColor: string;
  // Text colors
  primaryColor: string;   // headings
  accentColor: string;    // accents (icons, timeline dot)
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

export const journalThemes: Record<TemplateType, JournalTheme> = {
  family: {
    name: 'Family Memories',
    bgColor: '#fff7ed', // amber-50/orange-50 blend
    primaryColor: '#92400e', // amber-800
    accentColor: '#e11d48', // rose-600
    textColor: '#451a03', // amber-950
    mutedColor: '#b45309', // amber-700
    cardBg: '#ffffff',
    cardBorder: '#fde68a', // amber-200
    timelineColor: '#fbbf24', // amber-400
    timelineDot: '#f59e0b', // amber-500
    iconName: 'heart',
    quoteFontStyle: 'italic',
    quoteFontFamily: 'serif',
  },
  friends: {
    name: 'Friend Circle',
    bgColor: '#eef2ff', // indigo-50
    primaryColor: '#3730a3', // indigo-800
    accentColor: '#8b5cf6', // violet-500
    textColor: '#1e1b4b', // indigo-950
    mutedColor: '#4338ca', // indigo-700
    cardBg: '#ffffff',
    cardBorder: '#c7d2fe', // indigo-200
    timelineColor: '#a5b4fc', // indigo-300
    timelineDot: '#6366f1', // indigo-500
    iconName: 'star',
    quoteFontStyle: 'normal',
    quoteFontFamily: 'sans',
  },
  romantic: {
    name: 'Love Story',
    bgColor: '#fff1f2', // rose-50
    primaryColor: '#9f1239', // rose-800
    accentColor: '#ec4899', // pink-500
    textColor: '#4c0519', // rose-950
    mutedColor: '#be123c', // rose-700
    cardBg: '#ffffff',
    cardBorder: '#fecdd3', // rose-200
    timelineColor: '#fda4af', // rose-300
    timelineDot: '#f43f5e', // rose-500
    iconName: 'heart',
    quoteFontStyle: 'italic',
    quoteFontFamily: 'serif',
  },
  vacation: {
    name: 'Travel Journal',
    bgColor: '#f0f9ff', // sky-50
    primaryColor: '#075985', // sky-800
    accentColor: '#f59e0b', // amber-500
    textColor: '#0c4a6e', // sky-900
    mutedColor: '#0369a1', // sky-700
    cardBg: '#ffffff',
    cardBorder: '#bae6fd', // sky-200
    timelineColor: '#7dd3fc', // sky-300
    timelineDot: '#0ea5e9', // sky-500
    iconName: 'plane',
    quoteFontStyle: 'normal',
    quoteFontFamily: 'sans',
  },
  retirement: {
    name: 'Retirement Journey',
    bgColor: '#fefce8', // yellow-50
    primaryColor: '#854d0e', // yellow-800
    accentColor: '#ca8a04', // yellow-600
    textColor: '#422006', // yellow-950
    mutedColor: '#a16207', // yellow-700
    cardBg: '#ffffff',
    cardBorder: '#fde68a', // amber-200
    timelineColor: '#fde047', // yellow-300
    timelineDot: '#eab308', // yellow-500
    iconName: 'sun-o',
    quoteFontStyle: 'italic',
    quoteFontFamily: 'serif',
  },
  custom: {
    name: 'Custom Journal',
    bgColor: '#f8fafc', // slate-50
    primaryColor: '#1e293b', // slate-800
    accentColor: '#64748b', // slate-500
    textColor: '#0f172a', // slate-900
    mutedColor: '#475569', // slate-600
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0', // slate-200
    timelineColor: '#cbd5e1', // slate-300
    timelineDot: '#64748b', // slate-500
    iconName: 'book',
    quoteFontStyle: 'normal',
    quoteFontFamily: 'sans',
  },
};

export function getTheme(templateType: TemplateType): JournalTheme {
  return journalThemes[templateType] || journalThemes.custom;
}
