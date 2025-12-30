import { registerAs } from '@nestjs/config';

export default registerAs('vonage', () => ({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  phoneNumber: process.env.VONAGE_PHONE_NUMBER,
}));
