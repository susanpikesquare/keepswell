import { registerAs } from '@nestjs/config';

// Telnyx configuration (replacing Vonage)
export default registerAs('telnyx', () => ({
  apiKey: process.env.TELNYX_API_KEY,
  phoneNumber: process.env.TELNYX_PHONE_NUMBER,
}));
