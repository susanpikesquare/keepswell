import { Controller, Post, Body, Get, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../common/decorators';
import { IncomingSmsDto } from './dto/incoming-sms.dto';
import { Entry, Participant, MediaAttachment } from '../../database/entities';

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
  ) {}

  /**
   * Handle incoming SMS from Vonage
   * Vonage can send as GET or POST depending on configuration
   */
  @Public()
  @Post('incoming')
  @HttpCode(HttpStatus.OK)
  async handleIncomingSms(@Body() dto: IncomingSmsDto): Promise<string> {
    return this.processIncomingSms(dto);
  }

  @Public()
  @Get('incoming')
  async handleIncomingSmsGet(@Query() dto: IncomingSmsDto): Promise<string> {
    return this.processIncomingSms(dto);
  }

  private async processIncomingSms(dto: IncomingSmsDto): Promise<string> {
    this.logger.log(`Received SMS from ${dto.msisdn}: ${dto.text?.substring(0, 50)}...`);

    try {
      // Normalize the phone number (add + prefix if needed)
      const fromNumber = this.normalizePhoneNumber(dto.msisdn);

      // Find participant by phone number
      const participant = await this.participantRepo.findOne({
        where: { phone_number: fromNumber, status: 'active' },
        relations: ['journal'],
      });

      if (!participant) {
        this.logger.warn(`No active participant found for phone: ${fromNumber}`);
        return 'OK';
      }

      // Create entry from the SMS
      const entry = await this.entryRepo.save({
        journal_id: participant.journal_id,
        participant_id: participant.id,
        content: dto.text,
        entry_type: 'text',
        is_hidden: false,
        is_pinned: false,
        from_phone_number: fromNumber,
      });

      // Update participant's last response time
      await this.participantRepo.update(participant.id, {
        last_response_at: new Date(),
      });

      this.logger.log(`Created entry ${entry.id} for participant ${participant.display_name}`);

      return 'OK';
    } catch (error) {
      this.logger.error(`Error processing incoming SMS: ${error.message}`);
      return 'OK'; // Always return OK to prevent Vonage from retrying
    }
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
    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '');
    // Add + prefix if not present
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }
}
