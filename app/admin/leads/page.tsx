import type { Metadata } from "next";
import Link from "next/link";
import { listLeads, type Lead } from "@/lib/leads";

export const metadata: Metadata = { title: "Waitlist leads · Admin" };

// Always fresh — this is the private lead list, never cached.
export const dynamic = "force-dynamic";

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detailOf(l: Lead): string {
  if (l.role === "brand") {
    return [l.company, l.designation].filter(Boolean).join(" · ") || "—";
  }
  const pages = (l.pages ?? []).map((p) => `${p.link} (${p.niche})`).join(", ");
  const freq = l.postFrequency ? `posts ${l.postFrequency}` : "";
  return [pages, freq].filter(Boolean).join(" · ") || "—";
}

export default async function LeadsPage() {
  const leads = await listLeads();
  const clippers = leads.filter((l) => l.role === "clipper").length;
  const brands = leads.filter((l) => l.role === "brand").length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = leads.filter((l) => l.at.slice(0, 10) === todayKey).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-text-hi">Waitlist leads</h1>
          <p className="mt-1 text-sm text-text-low">
            Everyone who joined the waitlist, newest first.
          </p>
        </div>
        {leads.length > 0 && (
          <a
            href="/admin/leads/export"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-volt-500 px-4 text-sm font-medium text-white hover:bg-volt-400"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Download CSV
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total leads" value={String(leads.length)} accent={leads.length > 0} />
        <Stat label="Clippers" value={String(clippers)} />
        <Stat label="Brands" value={String(brands)} />
        <Stat label="Today" value={String(today)} />
      </div>

      {leads.length === 0 ? (
        <Empty>No leads yet. Signups from the landing page appear here.</Empty>
      ) : (
        <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line bg-ink-850 text-left text-xs uppercase tracking-wide text-text-low">
                  <Th>When</Th>
                  <Th>Role</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Details</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={`${l.email}-${i}`} className="border-b border-line last:border-0 align-top">
                    <Td className="whitespace-nowrap text-text-low">{fmtWhen(l.at)}</Td>
                    <Td>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.role === "brand"
                            ? "bg-volt-500/10 text-volt-600"
                            : "bg-ok/10 text-ok"
                        }`}
                      >
                        {l.role}
                      </span>
                    </Td>
                    <Td className="font-medium text-text-hi">{l.name ?? "—"}</Td>
                    <Td>
                      <a href={`mailto:${l.email}`} className="text-volt-600 hover:underline">
                        {l.email}
                      </a>
                    </Td>
                    <Td className="whitespace-nowrap text-text-mid">{l.phone ?? "—"}</Td>
                    <Td className="max-w-[22rem] text-text-mid">
                      <span className="line-clamp-2 break-words">{detailOf(l)}</span>
                    </Td>
                    <Td className="max-w-[12rem] text-text-low">
                      <span className="line-clamp-2 break-words">{l.source ?? "—"}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-text-low">
        Showing {leads.length} lead{leads.length === 1 ? "" : "s"}.{" "}
        <Link href="/admin" className="text-volt-600 hover:underline">
          Back to admin console
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-shadow rounded-2xl border border-line bg-white p-5">
      <p className={`font-mono text-2xl font-semibold ${accent ? "text-volt-500" : "text-text-hi"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-text-low">{label}</p>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center text-text-mid">
      {children}
    </div>
  );
}
