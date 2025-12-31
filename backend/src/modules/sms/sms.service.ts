import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Vonage } from '@vonage/server-sdk';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private vonage: Vonage;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('vonage.apiKey');
    const apiSecret = this.configService.get<string>('vonage.apiSecret');
    this.fromNumber = this.configService.get<string>('vonage.phoneNumber') || '';

    if (apiKey && apiSecret) {
      this.vonage = new Vonage({
        apiKey,
        apiSecret,
      });
      this.logger.log('Vonage SMS service initialized');
    } else {
      this.logger.warn('Vonage credentials not configured - SMS sending disabled');
    }
  }

  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.vonage) {
      this.logger.warn('Attempted to send SMS but Vonage is not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const response = await this.vonage.sms.send({
        from: this.fromNumber,
        to: to.replace(/[^0-9]/g, ''), // Strip non-numeric characters
        text: message,
      });

      const firstMessage = response.messages[0];

      if (firstMessage.status === '0') {
        const messageId = (firstMessage as any).messageId || (firstMessage as any)['message-id'];
        this.logger.log(`SMS sent successfully to ${to}, messageId: ${messageId}`);
        return { success: true, messageId };
      } else {
        this.logger.error(`Failed to send SMS: ${firstMessage.errorText}`);
        return { success: false, error: firstMessage.errorText };
      }
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendPrompt(to: string, promptText: string, journalTitle: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `${journalTitle}: ${promptText}\n\nReply to this message with your response.`;
    return this.sendSms(to, message);
  }

  async sendInvite(
    to: string,
    participantName: string,
    journalTitle: string,
    ownerName: string,
    viewUrl?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Note: Some carriers filter messages with links, so we keep the message simple
    // The viewUrl is included only if provided and can be removed if delivery issues occur
    let message = `Hi ${participantName}! ${ownerName} has invited you to contribute to "${journalTitle}" - a memory journal to collect and share special moments. You'll receive prompts via text. Simply reply with your thoughts, stories, or photos. Reply YES to join or STOP to opt out.`;

    // Temporarily disabled link due to carrier filtering - uncomment when 10DLC registered
    // if (viewUrl) {
    //   message += `\n\nView memories: ${viewUrl}`;
    // }

    return this.sendSms(to, message);
  }
}
