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
};
