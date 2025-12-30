import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTemplates,
  getTemplateByType,
  getJournalConfig,
  getTemplatePrompts,
  getStarterPrompts,
  selectNextPrompt,
  getPromptUsageStats,
  updateJournalCustomizations,
} from '../api/templates';

/**
 * Hook to get all available templates
 */
export function useTemplates(premium?: boolean) {
  return useQuery({
    queryKey: ['templates', { premium }],
    queryFn: () => getTemplates(premium),
    staleTime: 1000 * 60 * 10, // Templates don't change often
  });
}

/**
 * Hook to get a specific template by type
 */
export function useTemplateByType(type: string) {
  return useQuery({
    queryKey: ['template', type],
    queryFn: () => getTemplateByType(type),
    enabled: !!type,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to get resolved config for a journal
 */
export function useJournalConfig(journalId: string) {
  return useQuery({
    queryKey: ['journal-config', journalId],
    queryFn: () => getJournalConfig(journalId),
    enabled: !!journalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to get prompts for a template
 */
export function useTemplatePrompts(templateId: string) {
  return useQuery({
    queryKey: ['template-prompts', templateId],
    queryFn: () => getTemplatePrompts(templateId),
    enabled: !!templateId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to get starter prompts for a template type
 */
export function useStarterPrompts(type: string) {
  return useQuery({
    queryKey: ['starter-prompts', type],
    queryFn: () => getStarterPrompts(type),
    enabled: !!type,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to select next prompt for a journal
 */
export function useSelectPrompt() {
  return useMutation({
    mutationFn: ({
      journalId,
      options,
    }: {
      journalId: string;
      options?: {
        participantId?: string;
        preferCategory?: string;
        excludePromptIds?: string[];
      };
    }) => selectNextPrompt(journalId, options),
  });
}

/**
 * Hook to get prompt usage stats
 */
export function usePromptUsageStats(journalId: string) {
  return useQuery({
    queryKey: ['prompt-stats', journalId],
    queryFn: () => getPromptUsageStats(journalId),
    enabled: !!journalId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to update journal customizations
 */
export function useUpdateJournalCustomizations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      journalId,
      customizations,
    }: {
      journalId: string;
      customizations: {
        visualRules?: Record<string, unknown>;
        framingRules?: Record<string, unknown>;
        cadenceConfig?: Record<string, unknown>;
      };
    }) => updateJournalCustomizations(journalId, customizations),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-config', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journals', journalId] });
    },
  });
}
