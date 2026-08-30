"use client";

import { useState, useTransition } from "react";
import { IconUpload, IconX } from "@/components/icons";
import { removeCover, updateCover } from "@/lib/profile/cover-actions";

const chip =
  "flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.78)] px-3 text-[12.5px] font-semibold text-ink-700 shadow-[0_4px_14px_-6px_rgba(31,3,53,0.35)] ring-1 ring-[rgba(53,5,90,0.12)] backdrop-blur transition-colors hover:bg-white";

/** Cover-band contents: the custom cover photo (else the dot-grid over the
 *  gradient) plus the change/remove controls. Preview is optimistic — cleared
 *  once the action settles so the server-persisted cover is the truth. */
export function CoverControls({ coverUrl }: { coverUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = preview ?? coverUrl;

  function onPick(file: File | undefined) {
    if (!file || pending) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const fd = new FormData();
    fd.set("cover", file);
    startTransition(async () => {
      await updateCover(fd);
      setPreview(null);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <>
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="dot-grid absolute inset-0" aria-hidden="true" />
      )}

      <div
        className={`absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4 ${
          pending ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <label className={chip} aria-label="Change cover photo">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <IconUpload size={14} strokeWidth={1.5} />
          Change cover
        </label>

        {coverUrl ? (
          <button
            type="button"
            aria-label="Remove cover photo"
            className={`${chip} w-8 justify-center gap-0 px-0`}
            disabled={pending}
            onClick={() => startTransition(() => removeCover())}
          >
            <IconX size={14} strokeWidth={1.5} />
          </button>
        ) : null}
      </div>
    </>
  );
}
