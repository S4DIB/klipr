import { IconUpload } from "@/components/icons";

/**
 * Optional image-upload placeholder for the brand onboarding (logo / picture).
 * Real upload isn't built yet — this shows the affordance and stays skippable.
 */
export function UploadStub({ label, buttonLabel }: { label: string; buttonLabel: string }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-white">
        {label}
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
          optional
        </span>
      </p>
      <button
        type="button"
        aria-disabled="true"
        title="Uploads coming soon"
        className="inline-flex cursor-default items-center gap-2 rounded-[14px] border border-white/25 bg-white/[0.08] px-4 py-2.5 text-[13.5px] font-medium text-white/80"
      >
        <IconUpload size={16} strokeWidth={1.5} />
        {buttonLabel}
      </button>
    </div>
  );
}
