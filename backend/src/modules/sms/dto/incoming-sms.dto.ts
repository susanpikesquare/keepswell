export class IncomingSmsDto {
  // Vonage field names
  msisdn: string; // Sender's phone number
  to: string; // Your Vonage number
  text: string; // Message content
  messageId?: string;
  'message-timestamp'?: string;
  type?: string; // 'text' or 'unicode'
  keyword?: string;
}
