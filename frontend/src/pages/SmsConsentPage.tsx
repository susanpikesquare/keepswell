import { Phone, UserPlus, MessageSquare, CheckSquare } from 'lucide-react';

export function SmsConsentPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Keepswell SMS Program</h1>
          <p className="text-gray-600">10DLC Compliant Opt-In Flow Documentation</p>
          <p className="text-sm text-gray-500 mt-2">PikeSquare, LLC | keepswell.com</p>
        </div>

        {/* Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Opt-In Methods Overview</h2>
          <p className="text-sm text-gray-700 mb-4">
            We use three opt-in methods: Digital (primary), Digital with SMS confirmation, and Keyword.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border">
              <p className="font-semibold text-blue-700">1. Digital Consent</p>
              <p className="text-gray-600">Owner Opt-in (Web Form)</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="font-semibold text-blue-700">2. Digital + SMS</p>
              <p className="text-gray-600">Participant Invitation</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="font-semibold text-blue-700">3. Keyword Opt-in</p>
              <p className="text-gray-600">JOIN [KEYWORD]</p>
            </div>
          </div>
        </div>

        {/* =========================== */}
        {/* OPT-IN METHOD 1: DIGITAL CONSENT - Owner Opt-in */}
        {/* =========================== */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">1</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">DIGITAL CONSENT - Owner Opt-in</h2>
              <p className="text-sm text-gray-600">Web Form during Journal Creation</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border">
            <p className="text-sm text-gray-700 mb-4">
              The user navigates to PikeSquare, LLC's website at <strong>keepswell.com</strong> and creates an account.
              During journal creation, they can opt-in to receive SMS prompts by checking "Include me as a contributor"
              and entering their phone number.
            </p>
          </div>

          {/* Mockup of Journal Creation Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto border-2 border-green-300">
            <p className="text-xs text-green-700 font-semibold mb-3 text-center">SCREENSHOT: Journal Creation Form</p>

            <h3 className="font-semibold text-center mb-4">Create Your Memory Journal</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Journal Title *</label>
                <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50">Family Memories 2024</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50 h-16">Collecting memories from our family...</div>
              </div>

              {/* Include me as contributor checkbox */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Include me as a contributor</span>
                    <p className="text-xs text-gray-600 mt-1">I want to receive SMS prompts and contribute to this journal</p>
                  </div>
                </label>
              </div>

              {/* Phone number field (shown when checkbox is checked) */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <label className="block text-sm font-medium mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Your Phone Number *
                </label>
                <div className="border rounded px-3 py-2 bg-white text-gray-400">(555) 123-4567</div>
              </div>

              {/* SMS Consent Disclaimer */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-xs text-gray-700">
                  <strong>SMS Consent:</strong> By providing your phone number, you agree to receive text messages
                  from Keepswell (a service of PikeSquare, LLC) including journal prompts and notifications.
                  Message frequency varies based on journal settings. Message and data rates may apply.
                  Reply STOP at any time to opt out, or HELP for assistance.
                </p>
              </div>

              <button className="w-full bg-blue-500 text-white rounded py-2 font-medium" disabled>
                Create Journal
              </button>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              <strong>Compliance:</strong> Opt-in checkbox is explicit and separate. Full SMS disclosure is displayed
              before submission including message frequency, data rates, and STOP/HELP keywords.
            </p>
          </div>
        </div>

        {/* =========================== */}
        {/* OPT-IN METHOD 2: DIGITAL + SMS CONFIRMATION - Participant Invitation */}
        {/* =========================== */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">2</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">DIGITAL CONSENT WITH SMS CONFIRMATION</h2>
              <p className="text-sm text-gray-600">Participant Invitation Flow</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border">
            <p className="text-sm text-gray-700">
              The journal owner navigates to <strong>keepswell.com</strong>, logs in, and invites a participant by entering their phone number.
              The participant must then reply YES via SMS to confirm their opt-in.
            </p>
          </div>

          {/* Step 2A: Invitation Form */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Step A: Owner Invites Participant (Web Form)
            </p>

            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto border-2 border-green-300">
              <p className="text-xs text-green-700 font-semibold mb-3 text-center">SCREENSHOT: Invite Participant Form</p>

              <h3 className="font-semibold text-center mb-4">Invite a Contributor</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Their Name *</label>
                  <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50">Grandma Rose</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Their Phone Number *
                  </label>
                  <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50">(555) 987-6543</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Relationship</label>
                  <div className="border rounded px-3 py-2 text-gray-400 bg-gray-50">Grandmother</div>
                </div>

                {/* SMS Consent Disclaimer for Inviter */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-xs text-gray-700">
                    <strong>SMS Consent:</strong> By inviting this person, you confirm they have agreed to receive
                    text messages from Keepswell (a service of PikeSquare, LLC) at the phone number provided.
                    They will receive an invitation SMS asking them to reply YES to confirm their participation.
                    Message frequency varies based on journal settings. Message and data rates may apply.
                    They can reply STOP at any time to opt out, or HELP for assistance.
                  </p>
                </div>

                <button className="w-full bg-blue-500 text-white rounded py-2 font-medium" disabled>
                  Send Invitation
                </button>
              </div>
            </div>
          </div>

          {/* Step 2B: SMS Flow */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Step B: SMS Invitation & Confirmation
            </p>

            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border-2 border-green-300">
              <p className="text-xs text-green-700 font-semibold mb-3 text-center">SCREENSHOT: SMS Message Flow</p>

              <div className="space-y-4">
                {/* Invitation SMS */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Invitation SMS sent to participant:</p>
                  <div className="bg-blue-500 text-white rounded-lg p-3 text-sm">
                    Hi Grandma Rose! Susan has invited you to contribute to "Family Memories 2024" - a Keepswell memory journal by PikeSquare, LLC.
                    You'll receive prompts via text. Reply with your thoughts, stories, or photos.
                    <br /><br />
                    <strong>Reply YES to join or STOP to opt out.</strong>
                  </div>
                </div>

                {/* User replies YES */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Participant replies:</p>
                  <div className="bg-gray-200 text-gray-900 rounded-lg p-3 text-sm ml-auto max-w-[100px] text-center font-medium">
                    YES
                  </div>
                </div>

                {/* Confirmation SMS */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Opt-in confirmation message:</p>
                  <div className="bg-blue-500 text-white rounded-lg p-3 text-sm">
                    Keepswell (PikeSquare, LLC): Welcome to "Family Memories 2024"! You've opted in to receive memory journal prompts.
                    Msg freq varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              <strong>Compliance:</strong> Double opt-in process. Owner confirms consent responsibility, then participant
              must explicitly reply YES. Confirmation message includes all required disclosures.
            </p>
          </div>
        </div>

        {/* =========================== */}
        {/* OPT-IN METHOD 3: KEYWORD OPT-IN */}
        {/* =========================== */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">3</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">OPT-IN BY KEYWORD</h2>
              <p className="text-sm text-gray-600">Text JOIN [KEYWORD] to Join</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border">
            <p className="text-sm text-gray-700">
              PikeSquare, LLC provides a keyword and phone number via the Keepswell web application (keepswell.com).
              Journal owners can share their journal's unique keyword with potential participants.
            </p>
          </div>

          {/* QR Code / Keyword Display */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">How Keywords Are Shared:</p>

            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto border-2 border-green-300">
              <p className="text-xs text-green-700 font-semibold mb-3 text-center">SCREENSHOT: Keyword Sharing Card</p>

              <div className="text-center space-y-4">
                <h3 className="font-semibold">Join "Family Memories 2024"</h3>

                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Text this keyword to join:</p>
                  <p className="text-2xl font-bold text-blue-600">JOIN FAMILY2024</p>
                  <p className="text-lg text-gray-700 mt-2">to +1 (916) 439-8709</p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Or scan the QR code:</p>
                  <div className="w-32 h-32 bg-gray-300 mx-auto rounded flex items-center justify-center text-gray-500 text-xs">
                    [QR Code]
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Flow */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Message Flow
            </p>

            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border-2 border-green-300">
              <p className="text-xs text-green-700 font-semibold mb-3 text-center">SCREENSHOT: Keyword Opt-in SMS Flow</p>

              <div className="space-y-4">
                {/* User sends keyword */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">User texts to +1 (916) 439-8709:</p>
                  <div className="bg-gray-200 text-gray-900 rounded-lg p-3 text-sm ml-auto max-w-[180px] text-center font-medium">
                    JOIN FAMILY2024
                  </div>
                </div>

                {/* Confirmation SMS */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Opt-in confirmation message:</p>
                  <div className="bg-blue-500 text-white rounded-lg p-3 text-sm">
                    Keepswell (PikeSquare, LLC): Welcome to "Family Memories 2024"! You've opted in to receive memory journal prompts.
                    Msg freq varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.
                    We will not share your mobile info with third parties for marketing.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              <strong>Compliance:</strong> User initiates contact by texting keyword. Confirmation includes all required
              disclosures plus third-party sharing policy.
            </p>
          </div>
        </div>

        {/* =========================== */}
        {/* KEYWORD RESPONSES */}
        {/* =========================== */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-purple-300">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-600" />
            Required Keyword Responses
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* STOP */}
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm font-semibold text-red-600 mb-2">STOP Keyword</p>
              <p className="text-xs text-gray-500 mb-2">User texts: STOP</p>
              <div className="bg-red-50 rounded p-2 text-xs">
                Keepswell: You are unsubscribed and will receive no further messages.
              </div>
            </div>

            {/* HELP */}
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm font-semibold text-blue-600 mb-2">HELP Keyword</p>
              <p className="text-xs text-gray-500 mb-2">User texts: HELP</p>
              <div className="bg-blue-50 rounded p-2 text-xs">
                Keepswell: For help, please visit keepswell.com/support or email support@keepswell.com
              </div>
            </div>

            {/* YES/START */}
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm font-semibold text-green-600 mb-2">YES/START Keywords</p>
              <p className="text-xs text-gray-500 mb-2">User texts: YES or START</p>
              <div className="bg-green-50 rounded p-2 text-xs">
                Keepswell: Thanks for subscribing to memory journal prompts! Reply HELP for help.
                Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out.
              </div>
            </div>
          </div>
        </div>

        {/* =========================== */}
        {/* COMPLIANCE SUMMARY */}
        {/* =========================== */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Compliance Summary</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Three opt-in methods</strong> all with explicit consent mechanisms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Full disclosure</strong> of message frequency, data rates, STOP/HELP keywords on all forms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Double opt-in</strong> for participant invitations (web form + SMS YES confirmation)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Opt-in confirmation messages</strong> sent for all methods with required disclosures</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>STOP keyword</strong> immediately unsubscribes with confirmation message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>HELP keyword</strong> returns contact information for support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Third-party sharing policy</strong> disclosed (we do not share mobile info for marketing)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Consent not required for purchase</strong> stated in opt-in confirmations</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="font-medium">Keepswell - A product of PikeSquare, LLC</p>
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
