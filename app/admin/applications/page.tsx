import type { Metadata } from "next";
import { normalizeFilter } from "@/components/app/filter-tabs";
import { WaitlistQueue } from "./waitlist-queue";

export const metadata: Metadata = { title: "Applications" };

/**
 * The vetting console: landing-waitlist clippers + brands awaiting manual
 * vetting, filtered into Pending / Approved / Rejected.
 */
export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return <WaitlistQueue status={normalizeFilter(status)} />;
}
