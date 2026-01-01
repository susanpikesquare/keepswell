import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private apiKey: string;
  private fromNumber: string;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('telnyx.apiKey') || '';
    this.fromNumber = this.configService.get<string>('telnyx.phoneNumber') || '';

    if (this.apiKey && this.fromNumber) {
      this.isConfigured = true;
      this.logger.log('Telnyx SMS service initialized');
    } else {
      this.logger.warn('Telnyx credentials not configured - SMS sending disabled');
    }
  }

  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      this.logger.warn('Attempted to send SMS but Telnyx is not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      // Clean phone number - ensure it has + prefix
      let cleanTo = to.replace(/[^0-9]/g, '');
      if (!cleanTo.startsWith('+')) {
        cleanTo = `+${cleanTo}`;
      }

      const response = await axios.post(
        'https://api.telnyx.com/v2/messages',
        {
          from: this.fromNumber,
          to: cleanTo,
          text: message,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const messageId = response.data?.data?.id;
      this.logger.log(`SMS sent successfully to ${to}, messageId: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message;
      this.logger.error(`Error sending SMS: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async sendMms(to: string, message: string, mediaUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      this.logger.warn('Attempted to send MMS but Telnyx is not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      let cleanTo = to.replace(/[^0-9]/g, '');
      if (!cleanTo.startsWith('+')) {
        cleanTo = `+${cleanTo}`;
      }

      const response = await axios.post(
        'https://api.telnyx.com/v2/messages',
        {
          from: this.fromNumber,
          to: cleanTo,
          text: message,
          media_urls: [mediaUrl],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const messageId = response.data?.data?.id;
      this.logger.log(`MMS sent successfully to ${to}, messageId: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message;
      this.logger.error(`Error sending MMS: ${errorMessage}`);
      return { success: false, error: errorMessage };
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
    const message = `Hi ${participantName}! ${ownerName} has invited you to contribute to "${journalTitle}" - a Keepswell memory journal by PikeSquare, LLC. You'll receive prompts via text. Reply with your thoughts, stories, or photos. Reply YES to join or STOP to opt out.`;

    return this.sendSms(to, message);
  }
}
