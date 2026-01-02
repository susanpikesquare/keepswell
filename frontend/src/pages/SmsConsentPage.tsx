export function SmsConsentPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Keepswell SMS Program</h1>
          <p className="text-gray-600">10DLC Compliant Opt-In Flow Documentation</p>
        </div>

        {/* Digital Opt-In Form Screenshot */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
            Digital Opt-In Form
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Users join via a web form at <strong>keepswell.com/join/[keyword]</strong>. The form includes:
          </p>

          {/* Mock form preview */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border">
            <h3 className="font-semibold text-center mb-4">Request to Join Memory Journal</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50">(555) 123-4567</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50">Jane Smith</div>
              </div>

              {/* SMS Consent Checkbox - UNCHECKED BY DEFAULT */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-green-300">
                <p className="text-xs text-green-700 font-semibold mb-2">SMS CONSENT CHECKBOX (unchecked by default):</p>
                <label className="flex items-start gap-3">
                  <input type="checkbox" disabled className="mt-1 h-4 w-4" />
                  <span className="text-sm text-gray-700">
                    I agree to receive SMS messages from Keepswell including memory prompts and journal notifications.
                  </span>
                </label>
                <p className="text-xs text-gray-600 mt-3 ml-7">
                  By providing your phone number, you agree to receive SMS notifications from Keepswell.
                  Message frequency may vary. Standard Message and Data Rates may apply.
                  Reply STOP to opt out. Reply HELP for help.
                  We will not share mobile information with third parties for promotional or marketing purposes.
                </p>
              </div>

              <button className="w-full bg-blue-500 text-white rounded py-2 font-medium" disabled>
                Request to Join
              </button>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              <strong>Compliance Notes:</strong> The SMS consent checkbox is separate from other consents,
              is unchecked by default, and includes all required disclosures (message frequency, data rates,
              STOP/HELP keywords, and third-party sharing policy).
            </p>
          </div>
        </div>

        {/* Opt-In Keyword & Confirmation */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
            Opt-In Confirmation Message
          </h2>

          <div className="space-y-3">
            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-500 mb-1">Opt-In Keyword:</p>
              <p className="font-mono text-sm"><strong>YES</strong> or <strong>START</strong></p>
            </div>

            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-500 mb-1">Opt-In Confirmation Message:</p>
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-sm">
                Keepswell: Thanks for subscribing to memory journal prompts! Reply HELP for help.
                Message frequency may vary. Msg&data rates may apply.
                Consent is not a condition of purchase. Reply STOP to opt out.
              </div>
            </div>
          </div>
        </div>

        {/* Opt-Out Keyword & Confirmation */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
            Opt-Out Confirmation Message
          </h2>

          <div className="space-y-3">
            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-500 mb-1">Opt-Out Keyword:</p>
              <p className="font-mono text-sm"><strong>STOP</strong></p>
            </div>

            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-500 mb-1">Opt-Out Confirmation Message:</p>
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-sm">
                Keepswell: You are unsubscribed and will receive no further messages.
              </div>
            </div>
          </div>
        </div>

        {/* Help Keyword & Confirmation */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
            Help Response Message
          </h2>

          <div className="space-y-3">
            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-500 mb-1">Help Keyword:</p>
              <p className="font-mono text-sm"><strong>HELP</strong></p>
            </div>

            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-500 mb-1">Help Confirmation Message:</p>
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-sm">
                Keepswell: For help, please visit keepswell.com/support or email support@keepswell.com
              </div>
            </div>
          </div>
        </div>

        {/* Full Message Flow */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
            Complete Message Flow Example
          </h2>

          <div className="space-y-4">
            {/* Invitation */}
            <div>
              <p className="text-xs text-gray-500 mb-2">1. Initial Invitation (after web form submission & owner approval):</p>
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-sm">
                Hi Jane! Susan has invited you to contribute to "Family Memories" - a Keepswell memory journal.
                You'll receive prompts via text. Reply YES to join or STOP to opt out.
                Msg&data rates may apply. Msg frequency varies. Text HELP for help.
              </div>
            </div>

            {/* User responds YES */}
            <div>
              <p className="text-xs text-gray-500 mb-2">2. User responds:</p>
              <div className="bg-gray-200 text-gray-900 rounded-lg p-3 text-sm ml-auto max-w-[80px] text-center">
                YES
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <p className="text-xs text-gray-500 mb-2">3. Opt-In Confirmation:</p>
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-sm">
                Keepswell: Thanks for subscribing to memory journal prompts! Reply HELP for help.
                Message frequency may vary. Msg&data rates may apply.
                Consent is not a condition of purchase. Reply STOP to opt out.
              </div>
            </div>

            {/* Sample Prompt */}
            <div>
              <p className="text-xs text-gray-500 mb-2">4. Sample Prompt (sent on schedule):</p>
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-sm">
                What's your favorite holiday memory? Reply with your story or send a photo!
                Reply STOP to unsubscribe.
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Compliance Summary</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Digital opt-in form</strong> with separate SMS consent checkbox (unchecked by default)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Full disclosure</strong> of message frequency, data rates, STOP/HELP keywords</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Third-party sharing policy</strong> included in opt-in language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Opt-in confirmation</strong> includes all required elements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>STOP keyword</strong> honored with confirmation message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>HELP keyword</strong> returns contact information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Consent is not required for purchase</strong> - stated in confirmation</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Keepswell - A product of PikeSquare, LLC</p>
          <p className="mt-2">
            <a href="https://keepswell.com/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>
            {' | '}
            <a href="https://keepswell.com/terms" className="text-blue-500 hover:underline">Terms & Conditions</a>
            {' | '}
            <a href="https://keepswell.com/support" className="text-blue-500 hover:underline">Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
