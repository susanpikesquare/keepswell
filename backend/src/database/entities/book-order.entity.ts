import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Journal } from './journal.entity';
import { User } from './user.entity';

/**
 * Shipping address for a printed-book order. Mirrors the fields Lulu's
 * print API requires. Kept as embedded JSON (rather than a separate table)
 * since it's only ever read/written with its parent order.
 */
export interface BookShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string; // e.g. "CA"
  postcode: string;
  country_code: string; // ISO-2, e.g. "US"
  phone_number?: string;
}

/**
 * Lifecycle of a printed-book order:
 *   draft            → user is configuring (size/binding), not yet paid
 *   awaiting_payment → Stripe checkout created, not yet confirmed
 *   paid             → Stripe payment confirmed; ready to submit to printer
 *   submitted        → print job sent to Lulu (lulu_job_id set)
 *   in_production    → Lulu is printing
 *   shipped          → Lulu shipped it (tracking set)
 *   canceled         → user/Lulu canceled before production
 *   error            → something failed (see error_message)
 *
 * The Lulu-side status is mirrored into `printer_status` verbatim so we
 * don't lose fidelity from their richer state machine.
 */
export type BookOrderStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'paid'
  | 'submitted'
  | 'in_production'
  | 'shipped'
  | 'canceled'
  | 'error';

@Entity('book_orders')
export class BookOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journal_id: string;

  @ManyToOne(() => Journal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  // The user who placed (and pays for) the order — the journal owner.
  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status: BookOrderStatus;

  // ---- Book spec -------------------------------------------------------

  /**
   * Lulu pod_package_id — the 27-char code encoding trim size, color,
   * binding, paper, finish (e.g. 0850X1100FCSTDPB080CW444GXX). We store the
   * resolved value so re-orders and support are reproducible even if our
   * size→package mapping changes later.
   */
  @Column({ type: 'varchar', length: 40, nullable: true })
  pod_package_id: string;

  // Human-friendly spec for display + our own logic.
  @Column({ type: 'varchar', length: 16, default: '8.5x11' })
  trim_size: string; // '6x9' | '8.5x11' (Lulu-validated, renderable sizes)

  @Column({ type: 'varchar', length: 16, default: 'perfect' })
  binding: string; // 'perfect' | 'hardcover' | 'saddle' | 'coil'

  @Column({ type: 'int', nullable: true })
  page_count: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // ---- Money (all integer minor units, e.g. cents) --------------------

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  // What Lulu charges us (print + their shipping), in cents.
  @Column({ type: 'int', nullable: true })
  print_cost_cents: number;

  // Our markup, in cents (print_cost + markup + shipping = retail).
  @Column({ type: 'int', default: 0 })
  markup_cents: number;

  // Shipping we charge the customer, in cents.
  @Column({ type: 'int', default: 0 })
  shipping_cents: number;

  // Total charged to the customer via Stripe, in cents.
  @Column({ type: 'int', nullable: true })
  retail_total_cents: number;

  @Column({ type: 'varchar', length: 32, default: 'MAIL' })
  shipping_level: string; // Lulu shipping level (MAIL, GROUND, EXPEDITED, …)

  // ---- Print assets (Cloudinary or our own hosted URLs) ---------------

  @Column({ type: 'text', nullable: true })
  interior_pdf_url: string;

  @Column({ type: 'text', nullable: true })
  cover_pdf_url: string;

  // ---- Shipping + fulfillment -----------------------------------------

  @Column({ type: 'jsonb', nullable: true })
  shipping_address: BookShippingAddress;

  // ---- Stripe ----------------------------------------------------------

  @Column({ type: 'varchar', nullable: true })
  stripe_checkout_session_id: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_payment_intent_id: string;

  // ---- Lulu ------------------------------------------------------------

  @Column({ type: 'varchar', nullable: true })
  lulu_job_id: string;

  // Verbatim Lulu status name (CREATED, IN_PRODUCTION, SHIPPED, …).
  @Column({ type: 'varchar', nullable: true })
  printer_status: string;

  @Column({ type: 'text', nullable: true })
  tracking_url: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
