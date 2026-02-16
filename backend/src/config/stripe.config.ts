import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  priceIdMonthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  priceIdYearly: process.env.STRIPE_PRICE_ID_YEARLY,
  priceIdEventPass: process.env.STRIPE_PRICE_ID_EVENT_PASS,
  priceIdParticipantBundle: process.env.STRIPE_PRICE_ID_PARTICIPANT_BUNDLE,
}));
