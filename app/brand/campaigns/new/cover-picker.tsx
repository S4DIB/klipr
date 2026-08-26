"use client";

import { useEffect, useRef, useState } from "react";
import { IconUpload, IconX } from "@/components/icons";
import { COVER_ACCEPT, VIDEO_EXT, classifyCover, rejectCoverFile } from "@/lib/media/cover";
import { cn } from "@/lib/cn";

/**
 * Campaign cover picker — a picture OR a video. The chosen file rides along in
 * the wizard's FormData as `cover`; the server action uploads it and stores the
 * public URL on the campaign. Preview is local (object URL), so the brand sees
 * exactly what clippers will see before anything is saved.
 *
 * When editing, clearing the cover sets `removeCover` so the action knows the
 * difference between "left it alone" (no file, no flag) and "take it off".
 */
export function CoverPicker({
  control,
  existingUrl,
}: {
  /** The wizard's shared field styling, so this matches the violet card. */
  control: string;
  existingUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // revoke the object URL when it's replaced or the picker unmounts
  useEffect(() => {
    const url = preview?.url;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [preview?.url]);

  const shownUrl = preview?.url ?? (removed ? undefined : existingUrl);
  const shownIsVideo = preview ? preview.isVideo : shownUrl ? VIDEO_EXT.test(shownUrl) : false;

  function onPick(file: File | undefined) {
    if (!file) return;
    const why = rejectCoverFile(file);
    if (why) {
      setError(why);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setRemoved(false);
    setPreview({
      url: URL.createObjectURL(file),
      isVideo: classifyCover(file.type)?.kind === "video",
    });
  }

  function clear() {
    setPreview(null);
    setRemoved(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {/* only sent when the brand explicitly cleared an existing cover */}
      {removed && existingUrl ? <input type="hidden" name="removeCover" value="1" /> : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-white/60",
          shownUrl ? "border-solid border-white/40" : "",
        )}
      >
        {shownUrl ? (
          <div className="relative aspect-[16/9] w-full bg-black/20">
            {shownIsVideo ? (
              <video
                src={shownUrl}
                className="h-full w-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- local preview, not LCP
              <img src={shownUrl} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={clear}
              aria-label="Remove cover"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-black/65"
            >
              <IconX size={14} strokeWidth={1.6} />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white ring-1 ring-white/30 backdrop-blur">
              {shownIsVideo ? "Video" : "Picture"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-5 text-center">
            <span className="text-ivory">
              <IconUpload size={22} strokeWidth={1.4} />
            </span>
            <p className="text-[13px] text-white">
              Upload a picture or a video — it becomes the cover on every campaign card.
            </p>
            <p className="text-[12px] text-white/70">
              PNG · JPG · WEBP · GIF up to 8 MB, or MP4 · WEBM · MOV up to 30 MB
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        name="cover"
        type="file"
        accept={COVER_ACCEPT}
        onChange={(e) => onPick(e.target.files?.[0])}
        className={cn(
          control,
          "mt-2.5 cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-3.5 file:py-1.5 file:text-[12.5px] file:font-bold file:text-violet-900",
        )}
      />

      {error ? (
        <p className="mt-1.5 text-[12.5px] font-semibold text-yellow" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
