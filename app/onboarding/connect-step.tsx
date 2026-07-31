"use client";

import { useActionState } from "react";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/db/types";
import { Button, ArrowEast } from "@/components/ui/button";
import { IconLink, IconCheckCircle } from "@/components/icons";
import { PreviewCard } from "./preview-card";
import { VField } from "./violet-field";
import { connectVettedPage, addPageLink, continueToPayout, type LinkState } from "./actions";

export type ConnectPage = {
  id: string;
  platform: Platform;
  handle: string;
  url?: string;
  status: "none" | "pending" | "active";
  fromWaitlist: boolean;
};

const BENEFITS = ["Import your stats", "Stand out as a top clipper", "Be included in more campaigns"];

/**
 * Step 3 — Connect your socials (skippable). No platform API, so waitlist pages
 * are shown locked and "connecting" means pasting a link. Single column, violet.
 */
export function ConnectStep({
  avatarUrl,
  name,
  username,
  location,
  languages,
  pages,
  onBack,
}: {
  avatarUrl?: string;
  name: string;
  username: string;
  location?: string;
  languages?: string[];
  pages: ConnectPage[];
  onBack: React.ReactNode;
}) {
  const [linkState, addAction, adding] = useActionState<LinkState, FormData>(addPageLink, {});

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Link your socials
      </h1>
      <p className="mt-1.5 text-[13.5px] text-white">Already posting clips?</p>
      <ul className="mt-3 space-y-1.5">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2.5 text-[13px] text-white">
            <IconCheckCircle size={18} strokeWidth={1.5} className="shrink-0 text-white" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <PreviewCard
          avatarUrl={avatarUrl}
          name={name}
          username={username}
          location={location}
          languages={languages}
        />
      </div>

      {pages.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-white">Your pages</p>
          {pages.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-[14px] border border-white/15 bg-white/[0.06] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold text-white">{p.handle}</p>
                <p className="text-[12px] text-white">
                  {PLATFORMS[p.platform].surface}
                  {p.fromWaitlist ? " · from your application" : ""}
                </p>
              </div>
              {p.status === "active" ? (
                <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-violet-900">
                  Connected
                </span>
              ) : p.status === "pending" ? (
                <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">
                  Pending review
                </span>
              ) : (
                <form action={connectVettedPage}>
                  <input type="hidden" name="pageId" value={p.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-bold text-violet-900 transition-colors hover:bg-ivory"
                  >
                    Connect
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No OAuth API — paste a link instead */}
      <form action={addAction} className="mt-5">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <VField
              label="Link another page"
              name="link"
              placeholder="https://tiktok.com/@yourhandle"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              error={linkState.error}
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="flex h-[46px] shrink-0 items-center gap-1.5 rounded-full border border-white/30 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            <IconLink size={15} strokeWidth={1.6} /> {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-center gap-3">
        {onBack}
        <form action={continueToPayout} className="flex-1">
          <Button type="submit" variant="inverse" className="w-full">
            {pages.some((p) => p.status !== "none") ? "Continue" : "Skip for now"} <ArrowEast />
          </Button>
        </form>
      </div>
    </div>
  );
}
