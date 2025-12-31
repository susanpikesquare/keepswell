import { Controller, Post, Body, Get, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Public } from '../../common/decorators';
import { IncomingSmsDto, IncomingMessageDto } from './dto/incoming-sms.dto';
import { Entry, Participant, MediaAttachment } from '../../database/entities';
import { StorageService } from '../storage/storage.service';
import { SmsService } from './sms.service';

// Keywords for opt-in/opt-out
const OPT_IN_KEYWORDS = ['yes', 'y', 'start', 'subscribe', 'optin', 'opt-in'];
const OPT_OUT_KEYWORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit', 'optout', 'opt-out'];

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
    private storageService: StorageService,
    private smsService: SmsService,
  ) {}

  /**
   * Handle incoming SMS from Vonage (legacy SMS API)
   */
  @Public()
  @Post('incoming')
  @HttpCode(HttpStatus.OK)
  async handleIncomingSms(@Body() body: any): Promise<string> {
    // Check if this is Messages API format (has 'from' field) or SMS API format (has 'msisdn' field)
    if (body.from) {
      return this.processIncomingMessage(body as IncomingMessageDto);
    } else if (body.msisdn) {
      return this.processIncomingSms(body as IncomingSmsDto);
    }

    this.logger.warn(`Unknown webhook format: ${JSON.stringify(body)}`);
    return 'OK';
  }

  @Public()
  @Get('incoming')
  async handleIncomingSmsGet(@Query() query: any): Promise<string> {
    if (query.from) {
      return this.processIncomingMessage(query as IncomingMessageDto);
    } else if (query.msisdn) {
      return this.processIncomingSms(query as IncomingSmsDto);
    }
    return 'OK';
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

      // Regular message - find active participant
      const participant = await this.findParticipant(fromNumber);

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
      }

      // Regular message - find active participant
      const participant = await this.findParticipant(fromNumber);

      if (!participant) {
        return 'OK';
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

      this.logger.log(`Message content: "${textContent?.substring(0, 50)}", images: ${imageUrls.length}`);

      await this.createEntry(participant, textContent, imageUrls);
      return 'OK';
    } catch (error) {
      this.logger.error(`Error processing incoming message: ${error.message}`);
      return 'OK';
    }
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
        });
        this.logger.log(`Participant ${participant.display_name} opted in for journal ${participant.journal?.title}`);

        // Send confirmation
        await this.smsService.sendSms(
          phoneNumber,
          `Welcome to "${participant.journal?.title}"! You're all set to receive prompts and share your memories. Reply anytime to contribute.`,
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
          `You've been unsubscribed from memory journal prompts. Reply YES anytime to rejoin.`,
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
   * Find participant by phone number
   */
  private async findParticipant(phoneNumber: string): Promise<Participant | null> {
    // Try exact match first
    let participant = await this.participantRepo.findOne({
      where: { phone_number: phoneNumber, status: 'active' },
      relations: ['journal'],
    });

    // Try without + prefix
    if (!participant && phoneNumber.startsWith('+')) {
      participant = await this.participantRepo.findOne({
        where: { phone_number: phoneNumber.substring(1), status: 'active' },
        relations: ['journal'],
      });
    }

    // Try with + prefix
    if (!participant && !phoneNumber.startsWith('+')) {
      participant = await this.participantRepo.findOne({
        where: { phone_number: `+${phoneNumber}`, status: 'active' },
        relations: ['journal'],
      });
    }

    if (!participant) {
      this.logger.warn(`No active participant found for phone: ${phoneNumber}`);
    }

    return participant;
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
}
