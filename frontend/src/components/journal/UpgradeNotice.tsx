import { Link } from 'react-router-dom';

/**
 * Renders an error/notice message and, when it looks like a plan-gate
 * (the backend messages for Pro features say "Pro" / "Upgrade" / "trial"),
 * adds a link to the pricing page. Used wherever a free-tier action is
 * blocked server-side so the user gets a clean upgrade path instead of a
 * dead-end error.
 */
export function UpgradeNotice({ message }: { message: string }) {
  if (!message) return null;
  const isUpgrade = /\b(pro|upgrade|trial|plan)\b/i.test(message);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <p>{message}</p>
      {isUpgrade ? (
        <Link
          to="/pricing"
          className="mt-1 inline-block font-medium text-[#D86F5C] underline-offset-4 hover:underline"
        >
          View plans →
        </Link>
      ) : null}
    </div>
  );
}
