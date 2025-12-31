export function SmsConsentPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Keepswell SMS Consent Flow</h1>
          <p className="text-gray-600">Text-to-Join Opt-In Process</p>
        </div>

        {/* SMS Invite Example */}
        <div className="bg-gray-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Invitation SMS</h2>
          <p className="text-sm text-gray-600 mb-3">
            When a journal owner adds a participant, they receive this SMS invitation:
          </p>
          <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm mx-auto">
            <div className="bg-blue-500 text-white rounded-2xl rounded-bl-sm p-3 text-sm">
              Hi [Name]! [Owner] has invited you to contribute to "[Journal Title]" - a memory journal to collect and share special moments. You'll receive prompts via text. Simply reply with your thoughts, stories, or photos.
              <br /><br />
              <strong>Reply YES to join or STOP to opt out.</strong>
              <br /><br />
              <span className="text-xs opacity-90">
                Msg & data rates may apply. Msg frequency varies. Text HELP for help. Text STOP to opt-out.
              </span>
            </div>
          </div>
        </div>

        {/* Opt-in Response */}
        <div className="bg-gray-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: User Opts In</h2>
          <p className="text-sm text-gray-600 mb-3">
            The user must reply <strong>YES</strong> to opt-in and start receiving prompts:
          </p>
          <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm mx-auto">
            <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-br-sm p-3 text-sm ml-auto max-w-[80%] text-right">
              YES
            </div>
          </div>
        </div>

        {/* Confirmation */}
        <div className="bg-gray-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Confirmation</h2>
          <p className="text-sm text-gray-600 mb-3">
            After opting in, the user receives a confirmation message:
          </p>
          <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm mx-auto">
            <div className="bg-blue-500 text-white rounded-2xl rounded-bl-sm p-3 text-sm">
              Welcome to "[Journal Title]"! You're all set to receive prompts and share your memories. Reply anytime to contribute. Text STOP to unsubscribe.
            </div>
          </div>
        </div>

        {/* Key Points */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consent Requirements</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>Users must explicitly reply <strong>YES</strong> to opt-in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>No messages are sent until user opts in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>Users can text <strong>STOP</strong> at any time to opt-out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>Users can text <strong>HELP</strong> for assistance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>Message frequency varies based on journal settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>Message and data rates may apply</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Keepswell Memory Journals</p>
          <p>
            <a href="https://keepswell.com/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>
            {' | '}
            <a href="https://keepswell.com/terms" className="text-blue-500 hover:underline">Terms & Conditions</a>
          </p>
        </div>
      </div>
    </div>
  );
}
