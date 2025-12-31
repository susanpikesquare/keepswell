import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
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

        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Keepswell ("the Service"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Keepswell is a memory journal platform that allows users to create shared journals, invite family members and friends to participate, and collect memories through SMS prompts and web responses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. SMS Terms</h2>
            <p className="text-muted-foreground mb-2">
              By participating in Keepswell via SMS:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You consent to receive SMS messages from Keepswell</li>
              <li>Message frequency varies based on journal settings</li>
              <li>Message and data rates may apply</li>
              <li>Text STOP to opt-out at any time</li>
              <li>Text HELP for assistance</li>
              <li>Carriers are not liable for delayed or undelivered messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. User Content</h2>
            <p className="text-muted-foreground mb-2">
              You retain ownership of content you submit (memories, photos, stories). By submitting content, you grant Keepswell a license to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Store and display your content within the Service</li>
              <li>Share your content with other journal participants</li>
              <li>Create backups of your content</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              You are responsible for ensuring you have the right to share any content you submit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Conduct</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use the Service for any illegal purpose</li>
              <li>Submit content that is harmful, offensive, or infringes on others' rights</li>
              <li>Add participants to journals without their knowledge or consent</li>
              <li>Attempt to interfere with or disrupt the Service</li>
              <li>Use the Service to send spam or unsolicited messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service, including its design, features, and content (excluding user-submitted content), is owned by Keepswell and protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, KEEPSWELL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your access to the Service at any time, with or without cause. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by the laws of the United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms, please contact us at support@keepswell.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
