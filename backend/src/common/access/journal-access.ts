import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import type { Journal, Participant, User } from '../../database/entities';

/**
 * Shared journal-access helpers used by entries / comments / reactions /
 * participants services.
 *
 * We keep this as plain async functions (rather than an injectable service)
 * so each consumer can call it without importing JournalsModule and
 * tangling the DI graph. Each function takes the repos it needs as
 * arguments — every consuming service already injects them.
 */

interface Repos {
  userRepo: Repository<User>;
  journalRepo: Repository<Journal>;
  participantRepo: Repository<Participant>;
}

interface AccessResult {
  user: User;
  journal: Journal;
  role: 'owner' | 'contributor';
}

/**
 * Resolve the requesting user, load the journal, and verify the user has
 * *read* access — i.e. they own the journal or are an active Participant
 * on it (matched by email or phone).
 *
 * Throws:
 *   - NotFoundException if the user can't be found (caller hasn't synced
 *     yet) or the journal doesn't exist
 *   - ForbiddenException if the user has no relationship to the journal
 *
 * Returns the loaded user, journal, and the user's role.
 */
export async function requireJournalReader(
  repos: Repos,
  journalId: string,
  clerkId: string,
): Promise<AccessResult> {
  const user = await repos.userRepo.findOne({ where: { clerk_id: clerkId } });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  const journal = await repos.journalRepo.findOne({ where: { id: journalId } });
  if (!journal) {
    throw new NotFoundException('Journal not found');
  }

  if (journal.owner_id === user.id) {
    return { user, journal, role: 'owner' };
  }

  // Active-contributor match by phone OR email. We deliberately exclude
  // 'pending' / 'removed' so unanswered invites and removed contributors
  // can't read.
  const where: Array<Record<string, unknown>> = [];
  if (user.email) {
    where.push({ journal_id: journalId, email: user.email, status: 'active' });
  }
  if (user.phone_number) {
    where.push({
      journal_id: journalId,
      phone_number: user.phone_number,
      status: 'active',
    });
  }

  const participant = where.length
    ? await repos.participantRepo.findOne({ where: where as any })
    : null;

  if (!participant) {
    throw new ForbiddenException('You do not have access to this journal');
  }

  return { user, journal, role: 'contributor' };
}

/**
 * Owner-only variant. Throws ForbiddenException if the user is anything
 * other than the journal's owner. Use for mutations that contributors
 * shouldn't be able to perform (delete, invite, settings, etc).
 */
export async function requireJournalOwner(
  repos: Repos,
  journalId: string,
  clerkId: string,
): Promise<{ user: User; journal: Journal }> {
  const access = await requireJournalReader(repos, journalId, clerkId);
  if (access.role !== 'owner') {
    throw new ForbiddenException('Only the journal owner can do this');
  }
  return { user: access.user, journal: access.journal };
}
