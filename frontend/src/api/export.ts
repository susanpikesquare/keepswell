import { apiClient } from './client';

export interface ExportOptions {
  pageSize?: 'letter' | '6x9' | '8x10';
  includeTableOfContents?: boolean;
}

export const exportApi = {
  exportPdf: async (journalId: string, options: ExportOptions = {}): Promise<Blob> => {
    const response = await apiClient.post(`/export/pdf/${journalId}`, options, {
      responseType: 'blob',
    });
    return response.data;
  },
};
