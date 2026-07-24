import type { Metadata } from "next";
import { QueuePanel } from "./queue-panel";
import { WaitlistQueue } from "./waitlist-queue";

export const metadata: Metadata = { title: "Applications" };

/**
 * The vetting console: both intake queues side by side. Left, in-app
 * applications (signed-up users, reviewed on their detail page). Right,
 * landing-waitlist clippers — vetted before they even have an account.
 */
export default async function AdminApplicationsPage() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <QueuePanel />
      <WaitlistQueue />
    </div>
  );
}
