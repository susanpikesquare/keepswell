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
  getJournalPrompts,
  updatePromptOrder,
  resetPromptOrder,
  createJournalPrompt,
  updateJournalPrompt,
  deleteJournalPrompt,
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

/**
 * Hook to get prompts for a specific journal with custom ordering
 */
export function useJournalPrompts(journalId: string) {
  return useQuery({
    queryKey: ['journal-prompts', journalId],
    queryFn: () => getJournalPrompts(journalId),
    enabled: !!journalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to update custom prompt order for a journal
 */
export function useUpdatePromptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journalId, promptIds }: { journalId: string; promptIds: string[] }) =>
      updatePromptOrder(journalId, promptIds),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journal-config', journalId] });
    },
  });
}

/**
 * Hook to reset prompt order to default
 */
export function useResetPromptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journalId: string) => resetPromptOrder(journalId),
    onSuccess: (_, journalId) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journal-config', journalId] });
    },
  });
}

/**
 * Hook to create a custom prompt for a journal
 */
export function useCreateJournalPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      journalId,
      data,
    }: {
      journalId: string;
      data: {
        text: string;
        category?: string;
        is_starter?: boolean;
        is_deep?: boolean;
        requires_photo?: boolean;
      };
    }) => createJournalPrompt(journalId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}

/**
 * Hook to update a custom prompt
 */
export function useUpdateJournalPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      journalId,
      promptId,
      data,
    }: {
      journalId: string;
      promptId: string;
      data: {
        text?: string;
        category?: string;
        is_starter?: boolean;
        is_deep?: boolean;
        requires_photo?: boolean;
      };
    }) => updateJournalPrompt(journalId, promptId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}

/**
 * Hook to delete a custom prompt
 */
export function useDeleteJournalPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journalId, promptId }: { journalId: string; promptId: string }) =>
      deleteJournalPrompt(journalId, promptId),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}
