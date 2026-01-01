import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomInt } from 'crypto';
import { Journal, User, Entry, Participant } from '../../database/entities';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class JournalsService {
  private readonly logger = new Logger(JournalsService.name);

  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @Inject(forwardRef(() => SmsService))
    private smsService: SmsService,
  ) {}

  async create(clerkId: string, createJournalDto: CreateJournalDto): Promise<Journal> {
    // Find the user by clerk_id
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a unique join keyword
    const joinKeyword = await this.generateUniqueKeyword(createJournalDto.title);

    // Extract owner participation fields before creating journal
    const { owner_phone, owner_participate, ...journalData } = createJournalDto;

    const journal = this.journalRepository.create({
      ...journalData,
      owner_id: user.id,
      join_keyword: joinKeyword,
    });

    const savedJournal = await this.journalRepository.save(journal);

    // If owner wants to participate, create a participant record for them
    if (owner_participate && owner_phone) {
      // Update user's phone and SMS opt-in
      await this.userRepository.update(user.id, {
        phone_number: owner_phone,
        sms_opted_in: true,
        sms_opted_in_at: new Date(),
      });

      // Create participant record for owner
      const ownerParticipant = this.participantRepository.create({
        journal_id: savedJournal.id,
        phone_number: owner_phone,
        display_name: user.full_name || 'Me',
        relationship: 'Owner',
        status: 'active',
        opted_in: true,
        opted_in_at: new Date(),
      });

      await this.participantRepository.save(ownerParticipant);
      this.logger.log(`Owner added as participant to journal ${savedJournal.id}`);
    }

    return savedJournal;
  }

  /**
   * Generate a unique join keyword from the journal title
   */
  private async generateUniqueKeyword(title: string): Promise<string> {
    // Create base keyword from title: remove special chars, uppercase, max 12 chars
    let baseKeyword = title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 12);

    // If empty, use random string
    if (!baseKeyword) {
      baseKeyword = randomBytes(4).toString('hex').toUpperCase();
    }

    // Check if it's unique
    let keyword = baseKeyword;
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.journalRepository.findOne({
        where: { join_keyword: keyword },
      });
      if (!existing) {
        return keyword;
      }
      // Add random suffix
      keyword = baseKeyword.substring(0, 8) + randomBytes(2).toString('hex').toUpperCase();
      attempts++;
    }

    // Fallback to fully random
    return randomBytes(6).toString('hex').toUpperCase();
  }

  async findAllByUser(clerkId: string): Promise<Journal[]> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      return [];
    }

    return this.journalRepository.find({
      where: { owner_id: user.id },
      relations: ['participants'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, clerkId: string): Promise<Journal> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const journal = await this.journalRepository.findOne({
      where: { id },
      relations: ['participants', 'entries'],
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    if (journal.owner_id !== user.id) {
      throw new ForbiddenException('You do not have access to this journal');
    }

    return journal;
  }

  async update(id: string, clerkId: string, updateJournalDto: UpdateJournalDto): Promise<Journal> {
    const journal = await this.findOne(id, clerkId);

    Object.assign(journal, updateJournalDto);
    return this.journalRepository.save(journal);
  }

  async remove(id: string, clerkId: string): Promise<void> {
    const journal = await this.findOne(id, clerkId);
    await this.journalRepository.remove(journal);
  }

  /**
   * Enable sharing for a journal and generate a share token
   */
  async enableSharing(id: string, clerkId: string): Promise<{ shareToken: string; shareUrl: string }> {
    const journal = await this.findOne(id, clerkId);

    // Generate a new token if one doesn't exist
    if (!journal.share_token) {
      journal.share_token = randomBytes(16).toString('hex');
    }

    journal.is_shared = true;
    journal.shared_at = new Date();
    await this.journalRepository.save(journal);

    return {
      shareToken: journal.share_token,
      shareUrl: `/shared/${journal.share_token}`,
    };
  }

  /**
   * Disable sharing for a journal
   */
  async disableSharing(id: string, clerkId: string): Promise<void> {
    const journal = await this.findOne(id, clerkId);
    journal.is_shared = false;
    await this.journalRepository.save(journal);
  }

  /**
   * Get sharing status for a journal
   */
  async getSharingStatus(id: string, clerkId: string): Promise<{
    isShared: boolean;
    shareToken: string | null;
    shareUrl: string | null;
    sharedAt: Date | null;
  }> {
    const journal = await this.findOne(id, clerkId);

    return {
      isShared: journal.is_shared,
      shareToken: journal.is_shared ? journal.share_token : null,
      shareUrl: journal.is_shared ? `/shared/${journal.share_token}` : null,
      sharedAt: journal.shared_at,
    };
  }

  /**
   * Find a journal by its join keyword (public - for SMS join)
   */
  async findByJoinKeyword(keyword: string): Promise<Journal | null> {
    return this.journalRepository.findOne({
      where: { join_keyword: keyword.toUpperCase() },
      relations: ['owner'],
    });
  }

  /**
   * Update the join keyword for a journal
   */
  async updateJoinKeyword(id: string, clerkId: string, newKeyword: string): Promise<Journal> {
    const journal = await this.findOne(id, clerkId);

    // Validate and normalize the keyword
    const normalizedKeyword = newKeyword.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12);

    if (normalizedKeyword.length < 3) {
      throw new ForbiddenException('Keyword must be at least 3 characters');
    }

    // Check if keyword is already in use by another journal
    const existing = await this.journalRepository.findOne({
      where: { join_keyword: normalizedKeyword },
    });

    if (existing && existing.id !== id) {
      throw new ForbiddenException('This keyword is already in use');
    }

    journal.join_keyword = normalizedKeyword;
    return this.journalRepository.save(journal);
  }

  /**
   * Get a shared journal by its share token (public - no auth required)
   */
  async findByShareToken(shareToken: string): Promise<{
    journal: Partial<Journal>;
    entries: Entry[];
  }> {
    const journal = await this.journalRepository.findOne({
      where: { share_token: shareToken, is_shared: true },
      relations: ['participants'],
    });

    if (!journal) {
      throw new NotFoundException('Shared journal not found or sharing is disabled');
    }

    // Get entries for the shared journal
    const entries = await this.entryRepository.find({
      where: { journal_id: journal.id, is_hidden: false },
      relations: ['participant', 'media_attachments'],
      order: { created_at: 'DESC' },
    });

    // Return limited journal info for privacy
    return {
      journal: {
        id: journal.id,
        title: journal.title,
        description: journal.description,
        template_type: journal.template_type,
        created_at: journal.created_at,
        participants: journal.participants?.map(p => ({
          id: p.id,
          display_name: p.display_name,
          relationship: p.relationship,
          avatar_url: p.avatar_url,
        })) as any,
      },
      entries,
    };
  }

  /**
   * Check if a phone number is a participant in a shared journal
   */
  async checkSharedJournalAccess(shareToken: string, phoneNumber: string): Promise<{
    hasAccess: boolean;
    journalTitle?: string;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const journal = await this.journalRepository.findOne({
      where: { share_token: shareToken, is_shared: true },
      relations: ['participants'],
    });

    if (!journal) {
      throw new NotFoundException('Shared journal not found');
    }

    const participant = journal.participants?.find(
      p => this.normalizePhoneNumber(p.phone_number) === normalizedPhone
    );

    return {
      hasAccess: !!participant,
      journalTitle: journal.title,
    };
  }

  /**
   * Send verification code to a phone number for shared journal access
   */
  async sendVerificationCode(shareToken: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const journal = await this.journalRepository.findOne({
      where: { share_token: shareToken, is_shared: true },
      relations: ['participants'],
    });

    if (!journal) {
      throw new NotFoundException('Shared journal not found');
    }

    // Find participant with this phone number
    const participant = journal.participants?.find(
      p => this.normalizePhoneNumber(p.phone_number) === normalizedPhone
    );

    if (!participant) {
      // Don't reveal whether the phone number exists - return generic message
      this.logger.log(`Verification attempt for non-participant phone: ${normalizedPhone}`);
      return {
        success: true,
        message: 'If this phone number is a participant, a verification code will be sent.',
      };
    }

    // Generate 6-digit code
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save code to participant
    participant.verification_code = code;
    participant.verification_code_expires_at = expiresAt;
    await this.participantRepository.save(participant);

    // Send SMS
    const smsResult = await this.smsService.sendSms(
      normalizedPhone,
      `Your Keepswell (PikeSquare, LLC) verification code is: ${code}\n\nThis code expires in 10 minutes.`
    );

    if (!smsResult.success) {
      this.logger.error(`Failed to send verification SMS: ${smsResult.error}`);
      throw new BadRequestException('Failed to send verification code. Please try again.');
    }

    this.logger.log(`Verification code sent to ${normalizedPhone} for journal ${journal.id}`);

    return {
      success: true,
      message: 'Verification code sent.',
    };
  }

  /**
   * Verify code and return shared journal data
   */
  async verifyAndGetSharedJournal(shareToken: string, phoneNumber: string, code: string): Promise<{
    journal: Partial<Journal>;
    entries: Entry[];
    participantId: string;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const journal = await this.journalRepository.findOne({
      where: { share_token: shareToken, is_shared: true },
      relations: ['participants'],
    });

    if (!journal) {
      throw new NotFoundException('Shared journal not found');
    }

    // Find participant with this phone number
    const participant = journal.participants?.find(
      p => this.normalizePhoneNumber(p.phone_number) === normalizedPhone
    );

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this memory book.');
    }

    // Check verification code
    if (!participant.verification_code || participant.verification_code !== code) {
      throw new ForbiddenException('Invalid verification code.');
    }

    // Check if code expired
    if (!participant.verification_code_expires_at || new Date() > participant.verification_code_expires_at) {
      throw new ForbiddenException('Verification code has expired. Please request a new one.');
    }

    // Clear verification code after successful verification
    await this.participantRepository.update(participant.id, {
      verification_code: null as any,
      verification_code_expires_at: null as any,
    });

    this.logger.log(`Phone verified for participant ${participant.id} viewing journal ${journal.id}`);

    // Get entries for the shared journal
    const entries = await this.entryRepository.find({
      where: { journal_id: journal.id, is_hidden: false },
      relations: ['participant', 'media_attachments'],
      order: { created_at: 'DESC' },
    });

    return {
      journal: {
        id: journal.id,
        title: journal.title,
        description: journal.description,
        template_type: journal.template_type,
        created_at: journal.created_at,
        participants: journal.participants?.map(p => ({
          id: p.id,
          display_name: p.display_name,
          relationship: p.relationship,
          avatar_url: p.avatar_url,
        })) as any,
      },
      entries,
      participantId: participant.id,
    };
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }
}
