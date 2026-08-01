"use client";

import { useActionState, useState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { IconUpload } from "@/components/icons";
import { BrandPreviewCard } from "./brand-preview-card";
import { VField } from "./violet-field";
import { saveBusinessProfile, type BrandProfileState } from "./actions";

/** Brand step 1 — Make your business profile. */
export function BusinessStep({
  orgName: initialOrg,
  website: initialWebsite,
  logoUrl: initialLogo,
}: {
  orgName: string;
  website: string;
  logoUrl?: string;
}) {
  const [state, action, pending] = useActionState<BrandProfileState, FormData>(
    saveBusinessProfile,
    {},
  );
  const [orgName, setOrgName] = useState(initialOrg);
  const [website, setWebsite] = useState(initialWebsite);
  // Live preview: the persisted logo, or a local object-URL for a just-picked file.
  const [logoPreview, setLogoPreview] = useState<string | undefined>(initialLogo);

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Make your business profile
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        This is how clippers and campaigns will see you.
      </p>

      <div className="mt-5">
        <BrandPreviewCard businessName={orgName} website={website} logoUrl={logoPreview} />
      </div>

      <form action={action} className="mt-5 space-y-4">
        <VField
          label="What’s the name of your business?"
          name="orgName"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Your brand or company"
          error={state.field === "orgName" ? state.error : undefined}
          required
        />
        <VField
          label="What’s your company website?"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="yourcompany.com"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          error={state.field === "website" ? state.error : undefined}
          required
        />

        <div>
          <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-white">
            Add your logo
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
              optional
            </span>
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-white/25 bg-white/[0.08] px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-white/[0.14]">
            <IconUpload size={16} strokeWidth={1.5} />
            {logoPreview ? "Change logo" : "Upload brand logo"}
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={onLogoPick}
            />
          </label>
          <p className="mt-1.5 text-[11.5px] text-white/70">PNG, JPG, WEBP or SVG · up to 3 MB.</p>
        </div>

        <div className="pt-1">
          <Button type="submit" variant="inverse" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Continue"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
