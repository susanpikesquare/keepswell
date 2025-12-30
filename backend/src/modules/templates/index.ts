/**
 * TEMPLATE SYSTEM MODULE
 *
 * This module provides the complete template system for Moments journals.
 *
 * Architecture Overview:
 * ----------------------
 * 1. Templates define the complete experience for each journal type
 * 2. Prompt Packs provide categorized, weighted prompts with rotation logic
 * 3. Visual Rules control timeline appearance and theming
 * 4. Framing Rules shape how entries are presented and labeled
 * 5. Structural Rules define chapters, recaps, and organization
 * 6. Export Config prepares content for book/PDF generation
 * 7. Cadence Config controls prompt timing and scheduling
 * 8. AI Config (Premium) enables intelligent enhancements
 *
 * Free vs Premium:
 * ----------------
 * FREE: family, friends, custom templates with standard features
 * PREMIUM: romantic, vacation templates + AI features across all templates
 */

// Core type definitions
export * from './template-system.types';

// Template configurations
export {
  FAMILY_TEMPLATE,
  ROMANTIC_TEMPLATE,
  FRIENDS_TEMPLATE,
  VACATION_TEMPLATE,
  SYSTEM_TEMPLATES,
  getTemplateByType,
  getAllTemplates,
  getFreeTemplates,
  getPremiumTemplates,
} from './template-configs';

// AI layer types and hooks
export * from './ai-layer.types';
