import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button, Input, Modal } from '../ui';
import { printApi, type BookShippingAddress, type EstimateResult } from '../../api/print';

interface OrderBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalId: string;
}

/**
 * Blank-ish default address — we don't try to pre-fill from the Clerk
 * profile because the shipping destination is often not the account
 * owner's own address (e.g. a gift to a parent). country_code defaults
 * to US since Lulu's cheapest shipping tier is US-only; non-US users
 * change it before pricing.
 */
const EMPTY_ADDRESS: BookShippingAddress = {
  name: '',
  street1: '',
  street2: '',
  city: '',
  state_code: '',
  postcode: '',
  country_code: 'US',
  phone_number: '',
};

/** Dollars string from integer cents (never has a locale-dependent format). */
function fmtMoney(cents: number, currency: string): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${(abs / 100).toFixed(2)} ${currency}`;
}

/**
 * Order flow for a printed memory book: shipping address → price review
 * → Stripe Checkout. Separate from BookEditorModal because it has a
 * different purpose (designing vs. ordering) and we want the editor to
 * stay available while the order is reviewed.
 *
 * Deliberately simple: the design (title, included entries) comes from
 * whatever the editor last saved. Trim size and binding default to
 * 8.5x11 perfect — the only size/binding we currently expose; a size
 * picker goes here when we add more.
 */
export function OrderBookModal({ isOpen, onClose, journalId }: OrderBookModalProps) {
  const [address, setAddress] = useState<BookShippingAddress>(EMPTY_ADDRESS);
  const [quantity, setQuantity] = useState<number>(1);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const estimateMutation = useMutation({
    mutationFn: () =>
      printApi.estimate({
        journalId,
        trimSize: '8.5x11',
        binding: 'perfect',
        quantity,
        shippingAddress: address,
      }),
    onSuccess: (data) => {
      setEstimate(data);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setEstimate(null);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Couldn't price your order. Please check the address and try again.",
      );
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      printApi.createCheckoutSession({
        journalId,
        trimSize: '8.5x11',
        binding: 'perfect',
        quantity,
        shippingAddress: address,
        // Stripe redirects back here on success/cancel; the Memory Book
        // page reads ?book_order=success|canceled to show a message.
        returnUrl: window.location.href.split('?')[0],
      }),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Couldn't start checkout. Please try again.",
      );
    },
  });

  /** Change any address field and invalidate the previous estimate. */
  const setField = <K extends keyof BookShippingAddress>(
    key: K,
    value: BookShippingAddress[K],
  ) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
    if (estimate) setEstimate(null);
    if (errorMessage) setErrorMessage(null);
  };

  const addressComplete =
    address.name.trim() &&
    address.street1.trim() &&
    address.city.trim() &&
    address.state_code.trim() &&
    address.postcode.trim() &&
    address.country_code.trim().length === 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order your printed book"
      description="Enter where it ships, review the price, and pay securely with Stripe."
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Recipient name"
            value={address.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. Grandma Rose"
          />
          <Input
            label="Phone (optional)"
            value={address.phone_number || ''}
            onChange={(e) => setField('phone_number', e.target.value)}
            placeholder="For carrier delivery notices"
          />
          <div className="md:col-span-2">
            <Input
              label="Street address"
              value={address.street1}
              onChange={(e) => setField('street1', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Apt / suite (optional)"
              value={address.street2 || ''}
              onChange={(e) => setField('street2', e.target.value)}
            />
          </div>
          <Input
            label="City"
            value={address.city}
            onChange={(e) => setField('city', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              value={address.state_code}
              onChange={(e) => setField('state_code', e.target.value.toUpperCase().slice(0, 3))}
              placeholder="CA"
              maxLength={3}
            />
            <Input
              label="Postal code"
              value={address.postcode}
              onChange={(e) => setField('postcode', e.target.value)}
            />
          </div>
          <Input
            label="Country (ISO-2)"
            value={address.country_code}
            onChange={(e) => setField('country_code', e.target.value.toUpperCase().slice(0, 2))}
            placeholder="US"
            maxLength={2}
          />
          <Input
            label="Copies"
            type="number"
            min={1}
            max={20}
            value={quantity}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setQuantity(Number.isFinite(n) && n > 0 ? n : 1);
              if (estimate) setEstimate(null);
            }}
          />
        </div>

        {errorMessage && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {errorMessage}
          </div>
        )}

        {estimate && (
          <div className="border rounded-md p-4 bg-accent/20 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Print ({estimate.pageCount} pages × {quantity})</span>
              <span>{fmtMoney(estimate.printCostCents, estimate.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping (passed through at cost)</span>
              <span>{fmtMoney(estimate.shippingCents, estimate.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Keepswell service fee ({estimate.markupPercent}%)</span>
              <span>{fmtMoney(estimate.markupCents, estimate.currency)}</span>
            </div>
            <div className="flex justify-between font-medium text-base pt-2 border-t mt-2">
              <span>Total</span>
              <span>{fmtMoney(estimate.retailTotalCents, estimate.currency)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!estimate ? (
            <Button
              onClick={() => estimateMutation.mutate()}
              disabled={!addressComplete || estimateMutation.isPending}
            >
              {estimateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pricing…
                </>
              ) : (
                'Get price'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting…
                </>
              ) : (
                `Pay ${fmtMoney(estimate.retailTotalCents, estimate.currency)}`
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
