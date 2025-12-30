import { apiClient } from './client';
import type { JournalTemplate, ResolvedTemplateConfig, Prompt } from '../types';

/**
 * Get all available templates
 */
export async function getTemplates(premium?: boolean): Promise<JournalTemplate[]> {
  const params = premium !== undefined ? { premium: String(premium) } : {};
  const response = await apiClient.get<JournalTemplate[]>('/templates', { params });
  return response.data;
}

/**
 * Get a template by type
 */
export async function getTemplateByType(type: string): Promise<JournalTemplate> {
  const response = await apiClient.get<JournalTemplate>(`/templates/type/${type}`);
  return response.data;
}

/**
 * Get prompts for a template
 */
export async function getTemplatePrompts(templateId: string): Promise<Prompt[]> {
  const response = await apiClient.get<Prompt[]>(`/templates/${templateId}/prompts`);
  return response.data;
}

/**
 * Get starter prompts for a template type
 */
export async function getStarterPrompts(type: string): Promise<Prompt[]> {
  const response = await apiClient.get<Prompt[]>(`/templates/type/${type}/starters`);
  return response.data;
}

/**
 * Get resolved config for a journal (merged template + customizations)
 */
export async function getJournalConfig(journalId: string): Promise<ResolvedTemplateConfig> {
  const response = await apiClient.get<ResolvedTemplateConfig>(`/templates/journal/${journalId}/config`);
  return response.data;
}

/**
 * Select next prompt for a journal
 */
export async function selectNextPrompt(
  journalId: string,
  options?: {
    participantId?: string;
    preferCategory?: string;
    excludePromptIds?: string[];
  }
): Promise<{ prompt: Prompt; selectionReason: string; confidence: number }> {
  const response = await apiClient.post(`/templates/journal/${journalId}/select-prompt`, options || {});
  return response.data;
}

/**
 * Get prompt usage stats for a journal
 */
export async function getPromptUsageStats(journalId: string): Promise<{
  totalSent: number;
  totalResponded: number;
  responseRate: number;
  categoryBreakdown: Record<string, number>;
}> {
  const response = await apiClient.get(`/templates/journal/${journalId}/stats`);
  return response.data;
}

/**
 * Update journal customizations
 */
export async function updateJournalCustomizations(
  journalId: string,
  customizations: {
    visualRules?: Record<string, unknown>;
    framingRules?: Record<string, unknown>;
    cadenceConfig?: Record<string, unknown>;
  }
): Promise<void> {
  await apiClient.patch(`/templates/journal/${journalId}/customize`, customizations);
}
