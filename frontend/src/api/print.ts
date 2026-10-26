import { apiClient } from './client';

/**
 * Shipping address shape Lulu expects. Mirrors BookShippingAddress on the
 * backend — kept here as a separate interface so we don't import server types
 * into the web app.
 */
export interface BookShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  postcode: string;
  country_code: string;
  phone_number?: string;
}

export interface PrintStatus {
  configured: boolean;
  authOk: boolean;
  authError?: string;
}

export interface TestSubmitBody {
  journalId: string;
  trimSize?: string; // '6x9' | '8.5x11'
  binding?: string; // 'perfect' | ...
  shippingAddress?: BookShippingAddress; // backend falls back to a Lulu test address
  shippingLevel?: string; // 'MAIL' | 'GROUND' | 'EXPEDITED' | ...
}

export interface TestSubmitResult {
  orderId: string;
  jobId: string;
  status: string;
}

export interface BookOrder {
  id: string;
  journal_id: string;
  user_id: string;
  status: string;
  pod_package_id: string | null;
  trim_size: string;
  binding: string;
  page_count: number | null;
  quantity: number;
  interior_pdf_url: string | null;
  cover_pdf_url: string | null;
  lulu_job_id: string | null;
  printer_status: string | null;
  tracking_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Client for the print-on-demand (Lulu) endpoints. Mirrors print.controller.ts.
 * No subscription gating on the client side — the backend enforces ownership
 * and any future paywall.
 */
export const printApi = {
  /** Health probe: are Lulu credentials configured + valid? Public route. */
  status: async (): Promise<PrintStatus> => {
    const response = await apiClient.get('/print/status');
    return response.data;
  },

  /**
   * Submit a FREE sandbox print job end-to-end. Used by the "Print a test
   * book" button to validate Lulu accepts our generated PDFs before we
   * wire payment. Backend falls back to a sample test address if none given.
   */
  testSubmit: async (body: TestSubmitBody): Promise<TestSubmitResult> => {
    const response = await apiClient.post('/print/test-submit', body);
    return response.data;
  },

  /** Owner-scoped: refresh + return a book order's Lulu status. */
  orderStatus: async (orderId: string): Promise<BookOrder> => {
    const response = await apiClient.get(`/print/orders/${orderId}`);
    return response.data;
  },

  // ---- Book editor ---------------------------------------------------
  //
  // Three endpoints the editor UI uses to let the owner tailor the printed
  // book before placing an order: load the current state + entry list,
  // save title/exclude edits, and render a preview PDF with the current
  // settings so the owner can see the book before paying.

  /** Load the editor state and entry list for a journal. Owner-scoped. */
  getBookConfig: async (journalId: string): Promise<BookEditorConfig> => {
    const response = await apiClient.get(`/print/book-config/${journalId}`);
    return response.data;
  },

  /**
   * Save title and/or excluded-entry edits. Either field may be omitted
   * (undefined leaves it as-is); passing title: null or '' resets to the
   * journal's own title.
   */
  updateBookConfig: async (
    journalId: string,
    patch: { title?: string | null; excludedEntryIds?: string[] },
  ): Promise<{ title: string; excludedEntryIds: string[] }> => {
    const response = await apiClient.put(`/print/book-config/${journalId}`, patch);
    return response.data;
  },

  /**
   * Render the interior PDF with the current saved config and return a
   * hosted url the browser can open. No charge, no Lulu call.
   */
  previewBook: async (
    journalId: string,
    body: { trimSize?: string } = {},
  ): Promise<{ pdfUrl: string; pageCount: number }> => {
    const response = await apiClient.post(`/print/preview/${journalId}`, body);
    return response.data;
  },
};

/** Loaded shape returned by `getBookConfig`. */
export interface BookEditorConfig {
  // Resolved title the printed book will carry (override OR journal title).
  title: string;
  // The journal's own title — shown as the "reset to" value in the UI.
  journalTitle: string;
  // Entry ids the owner has toggled off. Everything else is included.
  excludedEntryIds: string[];
  entries: Array<{
    id: string;
    content: string;
    participantName: string;
    hasPhoto: boolean;
    createdAt: string;
  }>;
}
