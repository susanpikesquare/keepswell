import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TwilioWebhookGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-twilio-signature'];
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!signature || !authToken) {
      this.logger.warn('Missing Twilio signature header or auth token');
      return false;
    }

    // Construct the full URL
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host;
    const url = `${protocol}://${host}${request.originalUrl}`;

    // Validate the request
    const isValid = twilio.validateRequest(
      authToken,
      signature,
      url,
      request.body,
    );

    if (!isValid) {
      this.logger.warn('Invalid Twilio webhook signature');
    }

    return isValid;
  }
}
