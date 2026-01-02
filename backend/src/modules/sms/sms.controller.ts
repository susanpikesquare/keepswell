import { Controller, Post, Body, Get, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { randomBytes } from 'crypto';
import { Public } from '../../common/decorators';
import { IncomingSmsDto, IncomingMessageDto } from './dto/incoming-sms.dto';
import { Entry, Participant, MediaAttachment, Journal, PromptSend, PendingMemory } from '../../database/entities';
import { StorageService } from '../storage/storage.service';
import { SmsService } from './sms.service';
import { JournalsService } from '../journals/journals.service';

// Keywords for opt-in/opt-out/help
const OPT_IN_KEYWORDS = ['yes', 'y', 'start', 'subscribe', 'optin', 'opt-in'];
const OPT_OUT_KEYWORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit', 'optout', 'opt-out'];
const HELP_KEYWORDS = ['help', 'info', 'support'];

@Controller('webhooks/sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(
    @InjectRepository(Entry)
    private entryRepo: Repository<Entry>,
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
    @InjectRepository(MediaAttachment)
    private mediaRepo: Repository<MediaAttachment>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(PromptSend)
    private promptSendRepo: Repository<PromptSend>,
    @InjectRepository(PendingMemory)
    private pendingMemoryRepo: Repository<PendingMemory>,
    private storageService: StorageService,
    private smsService: SmsService,
    private journalsService: JournalsService,
  ) {
    this.logger.log('SmsController initialized - webhooks ready at /api/webhooks/sms/*');
  }

  /**
   * Simple test endpoint to verify webhook URL is reachable
   */
  @Public()
  @Get('test')
  testWebhook(): string {
    this.logger.log('Test webhook endpoint hit successfully!');
    return 'Webhook endpoint is working! Configure Telnyx to POST to /api/webhooks/sms/incoming';
  }

  /**
   * Test sending an SMS - returns the full Vonage response
   * Usage: POST /api/webhooks/sms/test-send with { "to": "+1234567890", "message": "Test" }
   */
  @Public()
  @Post('test-send')
  async testSendSms(@Body() body: { to: string; message?: string }): Promise<any> {
    const testMessage = body.message || 'Keepswell test message. Reply STOP to opt out.';
    this.logger.log(`Test SMS requested to: ${body.to}`);

    const result = await this.smsService.sendSms(body.to, testMessage);

    this.logger.log(`Test SMS result: ${JSON.stringify(result)}`);
    return {
      ...result,
      sentTo: body.to,
      sentMessage: testMessage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ultra-simple debug endpoint - accepts anything
   */
  @Public()
  @Post('debug')
  @HttpCode(HttpStatus.OK)
  handleDebug(@Body() body: any): string {
    this.logger.log(`[DEBUG POST] Received: ${JSON.stringify(body)}`);
    return 'OK';
  }

  @Public()
  @Get('debug')
  handleDebugGet(@Query() query: any): string {
    this.logger.log(`[DEBUG GET] Received: ${JSON.stringify(query)}`);
    return 'OK';
  }

  /**
   * Handle incoming SMS/MMS webhooks from Telnyx (or legacy Vonage)
   */
  @Public()
  @Post('incoming')
  @HttpCode(HttpStatus.OK)
  async handleIncomingSms(@Body() body: any): Promise<string> {
    // Log the full incoming webhook for debugging
    this.logger.log(`[POST] Incoming webhook received`);
    this.logger.log(`[POST] Body: ${JSON.stringify(body)}`);

    // Check for Telnyx format (has data.event_type)
    if (body.data?.event_type) {
      return this.processTelnyxWebhook(body);
    }

    // Legacy Vonage Messages API format (has 'from' field as string)
    if (body.from && typeof body.from === 'string') {
      return this.processIncomingMessage(body as IncomingMessageDto);
    }

    // Legacy Vonage SMS API format (has 'msisdn' field)
    if (body.msisdn) {
      return this.processIncomingSms(body as IncomingSmsDto);
    }

    this.logger.warn(`Unknown webhook format: ${JSON.stringify(body)}`);
    return 'OK';
  }

  @Public()
  @Get('incoming')
  async handleIncomingSmsGet(@Query() query: any): Promise<string> {
    this.logger.log(`[GET] Incoming webhook received`);
    this.logger.log(`[GET] Query: ${JSON.stringify(query)}`);

    if (query.from) {
      return this.processIncomingMessage(query as IncomingMessageDto);
    } else if (query.msisdn) {
      return this.processIncomingSms(query as IncomingSmsDto);
    }
    this.logger.warn(`[GET] Unknown query format`);
    return 'OK';
  }

  /**
   * Process Telnyx webhook format
   */
  private async processTelnyxWebhook(body: any): Promise<string> {
    const eventType = body.data?.event_type;
    const payload = body.data?.payload;

    // Only process inbound messages
    if (eventType !== 'message.received') {
      this.logger.log(`Ignoring Telnyx event: ${eventType}`);
      return 'OK';
    }

    if (!payload) {
      this.logger.warn('Telnyx webhook missing payload');
      return 'OK';
    }

    try {
      // Extract phone number (Telnyx format: { phone_number: "+1..." })
      const fromNumber = this.normalizePhoneNumber(
        payload.from?.phone_number || payload.from || ''
      );

      // Extract text content
      const textContent = payload.text || '';
      const messageText = textContent.trim().toLowerCase();

      this.logger.log(`Received Telnyx message from ${fromNumber}: ${textContent.substring(0, 50)}...`);

      // Extract media URLs (for MMS)
      const imageUrls: string[] = [];
      if (payload.media && Array.isArray(payload.media)) {
        for (const media of payload.media) {
          if (media.url && media.content_type?.startsWith('image/')) {
            imageUrls.push(media.url);
            this.logger.log(`[MMS] Found image: ${media.url}`);
          }
        }
      }

      // Check for opt-in/opt-out/help keywords first (only for text-only messages)
      if (messageText && imageUrls.length === 0) {
        // Check for HELP keyword
        if (HELP_KEYWORDS.includes(messageText)) {
          await this.smsService.sendSms(
            fromNumber,
            `Keepswell (PikeSquare, LLC): You're receiving memory journal prompts. Reply to share memories, photos & stories. Msg freq varies. Msg & data rates may apply. Reply STOP to opt out. For support visit keepswell.com/support`,
          );
          return 'OK';
        }

        const optInOutResult = await this.handleOptInOut(fromNumber, messageText);
        if (optInOutResult) {
          return 'OK';
        }

        // Check for JOIN keyword
        const joinResult = await this.handleJoinKeyword(fromNumber, messageText);
        if (joinResult) {
          return 'OK';
        }

        // Check for journal selection (numeric reply for pending memory)
        const journalSelectionResult = await this.handleJournalSelection(fromNumber, messageText, imageUrls);
        if (journalSelectionResult) {
          return 'OK';
        }
      }

      // Regular message - find active participant with multi-journal handling
      const participant = await this.findParticipantWithMultiJournalHandling(fromNumber, textContent, imageUrls);

      if (!participant) {
        // Either no participant found, or pending memory created for multi-journal selection
        return 'OK';
      }

      this.logger.log(`Message content: "${textContent?.substring(0, 50)}", images: ${imageUrls.length}`);

      await this.createEntry(participant, textContent, imageUrls);
      return 'OK';
    } catch (error) {
      this.logger.error(`Error processing Telnyx webhook: ${error.message}`);
      return 'OK';
    }
  }

  /**
   * Process legacy SMS API format
   */
  private async processIncomingSms(dto: IncomingSmsDto): Promise<string> {
    this.logger.log(`Received SMS from ${dto.msisdn}: ${dto.text?.substring(0, 50)}...`);

    try {
      const fromNumber = this.normalizePhoneNumber(dto.msisdn);
      const messageText = (dto.text || '').trim().toLowerCase();

      // Check for opt-in/opt-out keywords first
      const optInOutResult = await this.handleOptInOut(fromNumber, messageText);
      if (optInOutResult) {
        return 'OK';
      }

      // Check for JOIN keyword
      const joinResult = await this.handleJoinKeyword(fromNumber, messageText);
      if (joinResult) {
        return 'OK';
      }

      // Check for journal selection (numeric reply for pending memory)
      const journalSelectionResult = await this.handleJournalSelection(fromNumber, messageText, []);
      if (journalSelectionResult) {
        return 'OK';
      }

      // Regular message - find active participant with multi-journal handling
      const participant = await this.findParticipantWithMultiJournalHandling(fromNumber, dto.text || '', []);

      if (!participant) {
        return 'OK';
      }

      await this.createEntry(participant, dto.text, []);
      return 'OK';
    } catch (error) {
      this.logger.error(`Error processing incoming SMS: ${error.message}`);
      return 'OK';
    }
  }

  /**
   * Process Messages API format (supports MMS with images)
   */
  private async processIncomingMessage(dto: IncomingMessageDto): Promise<string> {
    this.logger.log(`Received message from ${dto.from}, type: ${dto.message_type || dto.channel}`);
    this.logger.log(`[MMS DEBUG] Full DTO: ${JSON.stringify(dto)}`);

    try {
      const fromNumber = this.normalizePhoneNumber(dto.from);

      // Extract text content
      let textContent = dto.text || dto.message?.content?.text || '';
      const messageText = textContent.trim().toLowerCase();

      // Check for opt-in/opt-out keywords first (only for text messages)
      if (messageText && !dto.image?.url && !dto.message?.content?.image?.url) {
        const optInOutResult = await this.handleOptInOut(fromNumber, messageText);
        if (optInOutResult) {
          return 'OK';
        }

        // Check for JOIN keyword
        const joinResult = await this.handleJoinKeyword(fromNumber, messageText);
        if (joinResult) {
          return 'OK';
        }

        // Check for journal selection (numeric reply for pending memory)
        const journalSelectionResult = await this.handleJournalSelection(fromNumber, messageText, []);
        if (journalSelectionResult) {
          return 'OK';
        }
      }

      // Extract image URLs
      const imageUrls: string[] = [];

      // Direct image field
      if (dto.image?.url) {
        imageUrls.push(dto.image.url);
        if (dto.image.caption && !textContent) {
          textContent = dto.image.caption;
        }
      }

      // Nested message.content format
      if (dto.message?.content?.image?.url) {
        imageUrls.push(dto.message.content.image.url);
        if (dto.message.content.image.caption && !textContent) {
          textContent = dto.message.content.image.caption;
        }
      }

      // Regular message - find active participant with multi-journal handling
      const participant = await this.findParticipantWithMultiJournalHandling(fromNumber, textContent, imageUrls);

      if (!participant) {
        return 'OK';
      }

      this.logger.log(`Message content: "${textContent?.substring(0, 50)}", images: ${imageUrls.length}`);
      if (imageUrls.length > 0) {
        this.logger.log(`[MMS DEBUG] Image URLs: ${JSON.stringify(imageUrls)}`);
      }

      await this.createEntry(participant, textContent, imageUrls);
      return 'OK';
    } catch (error) {
      this.logger.error(`Error processing incoming message: ${error.message}`);
      return 'OK';
    }
  }

  /**
   * Handle JOIN keyword to join a journal
   * Format: "JOIN KEYWORD" or just "KEYWORD"
   * Returns true if the message was a join command
   */
  private async handleJoinKeyword(phoneNumber: string, messageText: string): Promise<boolean> {
    // Check for "JOIN KEYWORD" format
    const joinMatch = messageText.match(/^join\s+(\w+)$/i);
    const keyword = joinMatch ? joinMatch[1].toUpperCase() : null;

    if (!keyword) {
      return false;
    }

    // Find journal by keyword
    const journal = await this.journalsService.findByJoinKeyword(keyword);

    if (!journal) {
      this.logger.log(`No journal found for keyword: ${keyword}`);
      await this.smsService.sendSms(
        phoneNumber,
        `Keepswell: We couldn't find a journal with that keyword. Please check and try again.`,
      );
      return true;
    }

    // Check if this phone is already a participant
    const existingParticipant = await this.participantRepo.findOne({
      where: { journal_id: journal.id, phone_number: phoneNumber },
    });

    if (existingParticipant) {
      if (existingParticipant.status === 'active') {
        await this.smsService.sendSms(
          phoneNumber,
          `Keepswell: You're already a member of "${journal.title}". Reply with your memories anytime!`,
        );
      } else if (existingParticipant.status === 'pending') {
        // Still waiting for approval
        await this.smsService.sendSms(
          phoneNumber,
          `Keepswell: Your request to join "${journal.title}" is still pending approval from the journal owner.`,
        );
      } else {
        // Was removed or paused - create new pending request
        await this.participantRepo.update(existingParticipant.id, {
          status: 'pending',
          opted_in: false,
        });
        await this.smsService.sendSms(
          phoneNumber,
          `Keepswell: Your request to join "${journal.title}" has been sent to the owner for approval. You'll receive a confirmation once approved.`,
        );

        // Notify owner
        await this.notifyOwnerOfJoinRequest(journal, phoneNumber);
      }
      return true;
    }

    // Create new participant in PENDING status (requires owner approval)
    const magicToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 1);

    const participant = this.participantRepo.create({
      journal_id: journal.id,
      phone_number: phoneNumber,
      display_name: `Member ${phoneNumber.slice(-4)}`, // Default name from last 4 digits
      status: 'pending', // Requires owner approval
      opted_in: false, // Not opted in until approved
      magic_token: magicToken,
      magic_token_expires_at: tokenExpiry,
    });

    await this.participantRepo.save(participant);

    this.logger.log(`New join request for "${journal.title}" via keyword ${keyword} - pending approval`);

    // Notify the person who requested to join
    await this.smsService.sendSms(
      phoneNumber,
      `Keepswell: Your request to join "${journal.title}" has been sent to the owner for approval. You'll receive a confirmation once approved.`,
    );

    // Notify the journal owner
    await this.notifyOwnerOfJoinRequest(journal, phoneNumber);

    return true;
  }

  /**
   * Notify journal owner that someone wants to join via keyword
   */
  private async notifyOwnerOfJoinRequest(journal: Journal, requesterPhone: string): Promise<void> {
    // Get owner's phone number
    const ownerPhone = (journal as any).owner?.phone_number;

    if (!ownerPhone) {
      this.logger.log(`Cannot notify owner of "${journal.title}" - no phone number on file`);
      return;
    }

    // Don't notify if the owner is the one requesting (shouldn't happen, but safety check)
    if (this.normalizePhoneNumber(ownerPhone) === this.normalizePhoneNumber(requesterPhone)) {
      return;
    }

    const lastFour = requesterPhone.slice(-4);
    await this.smsService.sendSms(
      ownerPhone,
      `Keepswell: Someone (***-***-${lastFour}) wants to join "${journal.title}". Log in to keepswell.com to approve or decline their request.`,
    );

    this.logger.log(`Notified owner of "${journal.title}" about join request from ${requesterPhone}`);
  }

  /**
   * Handle opt-in/opt-out keywords
   * Returns true if the message was an opt-in/opt-out command
   */
  private async handleOptInOut(phoneNumber: string, messageText: string): Promise<boolean> {
    const isOptIn = OPT_IN_KEYWORDS.includes(messageText);
    const isOptOut = OPT_OUT_KEYWORDS.includes(messageText);

    if (!isOptIn && !isOptOut) {
      return false;
    }

    // Find all participants with this phone number (any status)
    const participants = await this.findParticipantsByPhone(phoneNumber);

    if (participants.length === 0) {
      this.logger.warn(`No participants found for phone ${phoneNumber} during opt-in/out`);
      return true; // Still handled, just no participants
    }

    if (isOptIn) {
      // Activate pending participants
      const pendingParticipants = participants.filter(p => p.status === 'pending');
      for (const participant of pendingParticipants) {
        await this.participantRepo.update(participant.id, {
          status: 'active',
          opted_in: true,
          opted_in_at: new Date(),
        });
        this.logger.log(`Participant ${participant.display_name} opted in for journal ${participant.journal?.title}`);

        // Send confirmation with all required elements
        await this.smsService.sendSms(
          phoneNumber,
          `Keepswell (PikeSquare, LLC): Welcome to "${participant.journal?.title}"! You've opted in to receive memory journal prompts. Msg freq varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`,
        );
      }

      if (pendingParticipants.length === 0) {
        this.logger.log(`No pending participants to activate for ${phoneNumber}`);
      }
    } else if (isOptOut) {
      // Deactivate all active participants
      const activeParticipants = participants.filter(p => p.status === 'active' || p.status === 'pending');
      for (const participant of activeParticipants) {
        await this.participantRepo.update(participant.id, {
          status: 'paused',
          opted_in: false,
        });
        this.logger.log(`Participant ${participant.display_name} opted out of journal ${participant.journal?.title}`);
      }

      if (activeParticipants.length > 0) {
        // Send confirmation
        await this.smsService.sendSms(
          phoneNumber,
          `Keepswell (PikeSquare, LLC): You've been unsubscribed from all memory journal prompts. Reply YES anytime to rejoin.`,
        );
      }
    }

    return true;
  }

  /**
   * Find all participants by phone number (any status)
   */
  private async findParticipantsByPhone(phoneNumber: string): Promise<Participant[]> {
    const phoneVariants = [
      phoneNumber,
      phoneNumber.startsWith('+') ? phoneNumber.substring(1) : `+${phoneNumber}`,
    ];

    return this.participantRepo.find({
      where: phoneVariants.map(phone => ({ phone_number: phone })),
      relations: ['journal'],
    });
  }

  /**
   * Create an entry with optional media attachments
   */
  private async createEntry(
    participant: Participant,
    content: string,
    imageUrls: string[],
  ): Promise<Entry> {
    // Determine entry type
    let entryType: 'text' | 'photo' | 'mixed' = 'text';
    if (imageUrls.length > 0) {
      entryType = content ? 'mixed' : 'photo';
    }

    // Create the entry
    const entry = await this.entryRepo.save(
      this.entryRepo.create({
        journal_id: participant.journal_id,
        participant_id: participant.id,
        content: content || '',
        entry_type: entryType,
        is_hidden: false,
        is_pinned: false,
      }),
    );

    // Process and store images
    for (const imageUrl of imageUrls) {
      try {
        // Upload to Cloudinary
        const uploadResult = await this.storageService.uploadFromUrl(
          imageUrl,
          `keepswell/${participant.journal_id}`,
        );

        if (uploadResult) {
          await this.mediaRepo.save({
            entry_id: entry.id,
            original_url: imageUrl,
            stored_url: uploadResult.url,
            thumbnail_url: uploadResult.thumbnailUrl,
            media_type: 'image',
          });
          this.logger.log(`Stored image for entry ${entry.id}`);
        } else {
          // Fallback: store original URL if Cloudinary fails
          await this.mediaRepo.save({
            entry_id: entry.id,
            original_url: imageUrl,
            stored_url: imageUrl,
            media_type: 'image',
          });
          this.logger.warn(`Cloudinary upload failed, using original URL for entry ${entry.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to process image: ${error.message}`);
      }
    }

    // Update participant's last response time
    await this.participantRepo.update(participant.id, {
      last_response_at: new Date(),
    });

    this.logger.log(`Created entry ${entry.id} for participant ${participant.display_name}`);
    return entry;
  }

  /**
   * Handle delivery receipts from Vonage
   */
  @Public()
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async handleDeliveryReceipt(@Body() body: any): Promise<string> {
    this.logger.log(`Delivery receipt: ${JSON.stringify(body)}`);
    return 'OK';
  }

  @Public()
  @Get('status')
  async handleDeliveryReceiptGet(@Query() query: any): Promise<string> {
    this.logger.log(`Delivery receipt: ${JSON.stringify(query)}`);
    return 'OK';
  }

  private normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  /**
   * Handle numeric selection for pending memory (multi-journal routing)
   * Returns true if this was a journal selection, false otherwise
   */
  private async handleJournalSelection(
    phoneNumber: string,
    messageText: string,
    imageUrls: string[],
  ): Promise<boolean> {
    // Check if message is a single digit (1-9)
    const selectionMatch = messageText.match(/^[1-9]$/);
    if (!selectionMatch) {
      return false;
    }

    const selection = parseInt(selectionMatch[0], 10);

    // Find pending memory for this phone
    const pendingMemory = await this.pendingMemoryRepo.findOne({
      where: { phone_number: phoneNumber },
      order: { created_at: 'DESC' },
    });

    if (!pendingMemory) {
      return false;
    }

    // Check if expired
    if (new Date() > pendingMemory.expires_at) {
      await this.pendingMemoryRepo.remove(pendingMemory);
      await this.smsService.sendSms(
        phoneNumber,
        `Keepswell: Your previous message expired. Please send it again.`,
      );
      return true;
    }

    // Validate selection
    if (selection < 1 || selection > pendingMemory.journal_ids.length) {
      await this.smsService.sendSms(
        phoneNumber,
        `Keepswell: Please reply with a number 1-${pendingMemory.journal_ids.length} to select a journal.`,
      );
      return true;
    }

    // Get the selected journal and participant
    const selectedJournalId = pendingMemory.journal_ids[selection - 1];
    const selectedParticipantId = pendingMemory.participant_ids[selection - 1];

    const participant = await this.participantRepo.findOne({
      where: { id: selectedParticipantId },
      relations: ['journal'],
    });

    if (!participant) {
      this.logger.error(`Participant ${selectedParticipantId} not found for pending memory`);
      await this.pendingMemoryRepo.remove(pendingMemory);
      return true;
    }

    // Create the entry with the pending content
    await this.createEntry(
      participant,
      pendingMemory.content,
      pendingMemory.image_urls || [],
    );

    this.logger.log(`Pending memory saved to journal "${participant.journal?.title}"`);

    // Send confirmation
    await this.smsService.sendSms(
      phoneNumber,
      `Keepswell: Got it! Your memory has been added to "${participant.journal?.title}"`,
    );

    // Clean up pending memory
    await this.pendingMemoryRepo.remove(pendingMemory);

    return true;
  }

  /**
   * Create pending memory and prompt user to select a journal
   */
  private async createPendingMemoryAndPrompt(
    phoneNumber: string,
    content: string,
    imageUrls: string[],
    participants: Participant[],
  ): Promise<void> {
    // Clean up any existing pending memories for this phone
    await this.pendingMemoryRepo.delete({ phone_number: phoneNumber });

    // Create new pending memory (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const pendingMemory = this.pendingMemoryRepo.create({
      phone_number: phoneNumber,
      content: content,
      image_urls: imageUrls,
      journal_ids: participants.map(p => p.journal_id),
      participant_ids: participants.map(p => p.id),
      expires_at: expiresAt,
    });

    await this.pendingMemoryRepo.save(pendingMemory);

    // Build journal selection message with disambiguation
    const journalList = participants
      .map((p, i) => {
        const title = p.journal?.title || 'Unknown Journal';
        // Add relationship or display name to help disambiguate journals with same name
        const context = p.relationship ? ` (as ${p.relationship})` : '';
        return `${i + 1}. ${title}${context}`;
      })
      .join('\n');

    await this.smsService.sendSms(
      phoneNumber,
      `Keepswell: You're in multiple memory books. Reply with a number to save your message:\n\n${journalList}`,
    );

    this.logger.log(`Created pending memory for ${phoneNumber} with ${participants.length} journal options`);
  }

  /**
   * Clean up expired pending memories (called periodically)
   */
  private async cleanupExpiredPendingMemories(): Promise<void> {
    const deleted = await this.pendingMemoryRepo.delete({
      expires_at: LessThan(new Date()),
    });
    if (deleted.affected && deleted.affected > 0) {
      this.logger.log(`Cleaned up ${deleted.affected} expired pending memories`);
    }
  }

  /**
   * Find participant by phone number using context-based routing.
   * Returns the participant if single journal or clear context exists.
   * Returns null and creates pending memory if multiple journals need selection.
   */
  private async findParticipantWithMultiJournalHandling(
    phoneNumber: string,
    content: string,
    imageUrls: string[],
  ): Promise<Participant | null> {
    // Get all phone number variants
    const phoneVariants = [
      phoneNumber,
      phoneNumber.startsWith('+') ? phoneNumber.substring(1) : `+${phoneNumber}`,
    ];

    // Find all active participants with this phone number
    const participants = await this.participantRepo.find({
      where: phoneVariants.map(phone => ({ phone_number: phone, status: 'active' })),
      relations: ['journal'],
    });

    if (participants.length === 0) {
      this.logger.warn(`No active participant found for phone: ${phoneNumber}`);
      return null;
    }

    // If only one participant, return it
    if (participants.length === 1) {
      return participants[0];
    }

    // Multiple participants - try context-based routing first
    this.logger.log(`Phone ${phoneNumber} is in ${participants.length} journals, checking context`);

    const participantIds = participants.map(p => p.id);

    // Find the most recent prompt sent to any of these participants (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPromptSend = await this.promptSendRepo
      .createQueryBuilder('ps')
      .where('ps.participant_id IN (:...participantIds)', { participantIds })
      .andWhere('ps.status = :status', { status: 'sent' })
      .andWhere('ps.sent_at > :oneDayAgo', { oneDayAgo })
      .orderBy('ps.sent_at', 'DESC')
      .getOne();

    if (recentPromptSend) {
      const contextParticipant = participants.find(p => p.id === recentPromptSend.participant_id);
      if (contextParticipant) {
        this.logger.log(`Routing to journal "${contextParticipant.journal?.title}" based on recent prompt`);
        return contextParticipant;
      }
    }

    // No clear context - ask user to select
    await this.createPendingMemoryAndPrompt(phoneNumber, content, imageUrls, participants);
    return null;
  }
}
