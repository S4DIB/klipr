"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, TextAreaField } from "@/components/app/field";
import { GlassPanel } from "@/components/app/glass-panel";
import { IconAdd, IconX } from "@/components/icons";
import { PLATFORMS, PLATFORM_ORDER, NICHES } from "@/lib/platforms";
import { submitApplication, type ApplyState } from "@/app/apply/actions";

type Kind = "clipper" | "agency";

interface PageRow {
  platform: string;
  handle: string;
  url: string;
  selfReportedFollowers: string;
  niche: string;
}

const emptyRow = (): PageRow => ({
  platform: "tiktok",
  handle: "",
  url: "",
  selfReportedFollowers: "",
  niche: "Memes",
});

const KINDS: { id: Kind; label: string }[] = [
  { id: "clipper", label: "Clipper" },
  { id: "agency", label: "Agency" },
];

export function ApplyForm() {
  const [kind, setKind] = useState<Kind>("clipper");
  const [rows, setRows] = useState<PageRow[]>([emptyRow()]);
  const [applyState, applyAction, applying] = useActionState<ApplyState, FormData>(
    submitApplication,
    {},
  );
  const setRow = (i: number, patch: Partial<PageRow>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const pagesJson = JSON.stringify(
    rows.map((r) => ({
      platform: r.platform,
      handle: r.handle,
      url: r.url,
      selfReportedFollowers: r.selfReportedFollowers === "" ? 0 : Number(r.selfReportedFollowers),
      niche: r.niche,
    })),
  );

  return (
    <div className="flex flex-col gap-[14px]">
      {/* role toggle */}
      <div>
        <p className="eyebrow mb-2">You are a</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Account type">
          {KINDS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={kind === id}
              onClick={() => setKind(id)}
              className={cn(
                "flex-1 rounded-[14px] px-3 py-[11px] text-center text-[13px] transition-colors",
                kind === id
                  ? "bg-violet-900 font-bold text-white"
                  : "bg-white font-semibold text-ink-600 shadow-[var(--shadow-xs)] hover:text-ink-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form action={applyAction} className="flex flex-col gap-[14px]">
          <input type="hidden" name="role" value={kind} />
          <input type="hidden" name="pages" value={pagesJson} />

          {kind === "agency" ? (
            <TextField
              label="Agency / network name"
              name="orgName"
              placeholder="What your network is called"
              required
            />
          ) : null}

          {rows.map((row, i) => (
            <GlassPanel key={i} className="relative p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Page {i + 1}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-400">
                    {PLATFORMS[row.platform as keyof typeof PLATFORMS]?.label ?? ""}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                      aria-label={`Remove page ${i + 1}`}
                      className="text-ink-400 transition-colors hover:text-ink-900"
                    >
                      <IconX size={14} />
                    </button>
                  )}
                </span>
              </div>
              <div className="mt-[11px] flex flex-col gap-[9px]">
                <TextField
                  label="Page link"
                  name={`url_${i}`}
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="youtube.com/@yourpage"
                  value={row.url}
                  onChange={(e) => setRow(i, { url: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-[9px]">
                  <TextField
                    label="Handle"
                    name={`handle_${i}`}
                    placeholder="@yourpage"
                    value={row.handle}
                    onChange={(e) => setRow(i, { handle: e.target.value })}
                    required
                  />
                  <TextField
                    label="Followers (approx.)"
                    name={`followers_${i}`}
                    inputMode="numeric"
                    placeholder="e.g. 12000"
                    value={row.selfReportedFollowers}
                    onChange={(e) =>
                      setRow(i, { selfReportedFollowers: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-[9px]">
                  <SelectField
                    label="Platform"
                    name={`platform_${i}`}
                    value={row.platform}
                    onChange={(e) => setRow(i, { platform: e.target.value })}
                  >
                    {PLATFORM_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORMS[p].surface}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Niche"
                    name={`niche_${i}`}
                    value={row.niche}
                    onChange={(e) => setRow(i, { niche: e.target.value })}
                  >
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>
            </GlassPanel>
          ))}

          {rows.length < 8 && (
            <button
              type="button"
              onClick={() => setRows((r) => [...r, emptyRow()])}
              className="flex items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[rgba(53,5,90,0.2)] p-3 text-[13px] font-semibold text-violet-700 transition-colors hover:border-[rgba(53,5,90,0.35)]"
            >
              <IconAdd size={16} strokeWidth={1.5} /> Add another page
            </button>
          )}

          <div>
            <p className="eyebrow mb-2">Posting habits</p>
            <TextAreaField
              label="How often do you post?"
              name="note"
              placeholder="e.g. I post Reels 4-5× a week, mostly comedy skits with 8-15k views…"
              required
            />
          </div>

          <GlassPanel variant="well" className="px-3.5 py-3 text-[12px] leading-[1.5] text-ink-600">
            No follower minimum. This is information for our reviewers, not a gate.
          </GlassPanel>

          {applyState.error ? (
            <p className="text-[13px] font-medium text-danger-600" role="alert">
              {applyState.error}
            </p>
          ) : null}

          <Button type="submit" disabled={applying} className="h-[52px] w-full text-[15px]">
            {applying ? "Submitting…" : "Submit application"}
          </Button>
        </form>
    </div>
  );
}
