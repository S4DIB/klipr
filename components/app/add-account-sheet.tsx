"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/app/sheet";
import { Button } from "@/components/ui/button";
import { IconAdd } from "@/components/icons";
import {
  InstagramIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/ui/platform-icons";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "x", label: "X", Icon: XIcon },
];

/**
 * "Add account" → a link-your-socials sheet. Every declared account is
 * hand-reviewed against the Clipper Standard before it goes live, so the
 * connect actions route into the vetting flow (no silent instant-connect).
 */
export function AddAccountSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="secondary"
        className="h-10 gap-1.5 px-4 text-[13.5px]"
      >
        <IconAdd size={16} strokeWidth={1.5} /> Add account
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Link a new account"
        className="rounded-t-[28px] md:rounded-[28px]"
      >
        {/* platform connect rows */}
        <div className="flex flex-col gap-2.5">
          {PLATFORMS.map(({ key, label, Icon }) => (
            <Link
              key={key}
              href={`/apply?platform=${key}`}
              className="glass-well flex items-center gap-3 rounded-[16px] px-4 py-3.5 transition-colors hover:border-[rgba(125,4,215,0.4)] hover:bg-[rgba(53,5,90,0.05)]"
            >
              <Icon className="h-[20px] w-[20px] text-ink-800" />
              <span className="flex-1 text-[14px] font-semibold text-ink-900">
                Connect {label}
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(53,5,90,0.18)] text-ink-500">
                <IconAdd size={13} strokeWidth={1.6} />
              </span>
            </Link>
          ))}
        </div>
      </Sheet>
    </>
  );
}
