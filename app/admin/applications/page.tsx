import type { Metadata } from "next";
import { WaitlistQueue } from "./waitlist-queue";

export const metadata: Metadata = { title: "Applications" };

/**
 * The vetting console: landing-waitlist clippers awaiting manual vetting,
 * reviewed before they even have an account. (In-app applications are
 * reviewed on their own detail page.)
 */
export default async function AdminApplicationsPage() {
  return <WaitlistQueue />;
}
