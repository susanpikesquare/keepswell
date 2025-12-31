import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 31, 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Keepswell ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our memory journal service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We collect information you provide directly:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Account information (name, email address)</li>
              <li>Phone numbers of journal participants (with their consent)</li>
              <li>Journal entries, memories, and stories submitted via SMS or the web</li>
              <li>Photos and media shared as part of journal entries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>To provide and maintain our memory journal service</li>
              <li>To send SMS prompts to opted-in participants</li>
              <li>To collect and display journal entries</li>
              <li>To communicate with you about your account</li>
              <li>To improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. SMS Messaging</h2>
            <p className="text-muted-foreground mb-2">
              When you add a participant to a journal, they will receive an SMS invitation. Participants must reply YES to opt-in to receiving prompts. By opting in:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Participants consent to receive periodic memory prompts via SMS</li>
              <li>Message frequency varies based on journal settings (typically 1-4 messages per month)</li>
              <li>Message and data rates may apply</li>
              <li>Participants can text STOP at any time to opt-out</li>
              <li>Participants can text HELP for assistance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Service providers who assist in operating our platform (SMS delivery, cloud hosting)</li>
              <li>Other participants in your shared journals (entries you submit)</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your journal entries and account information for as long as your account is active. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of SMS communications at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at privacy@keepswell.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
