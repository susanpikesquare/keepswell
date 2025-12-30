// Vonage SMS API format (legacy)
export class IncomingSmsDto {
  msisdn: string; // Sender's phone number
  to: string; // Your Vonage number
  text: string; // Message content
  messageId?: string;
  'message-timestamp'?: string;
  type?: string;
  keyword?: string;
}

// Vonage Messages API format (supports MMS)
export class IncomingMessageDto {
  message_uuid: string;
  from: string; // Sender's phone number
  to: string; // Your Vonage number
  timestamp: string;
  channel: string; // 'mms' or 'sms'
  message_type: string; // 'text', 'image', etc.

  // For text messages
  text?: string;

  // For image messages (MMS)
  image?: {
    url: string;
    caption?: string;
  };

  // Alternative format
  message?: {
    content: {
      type: string; // 'text' or 'image'
      text?: string;
      image?: {
        url: string;
        caption?: string;
      };
    };
  };
}
