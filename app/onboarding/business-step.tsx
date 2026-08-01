"use client";

import { useActionState, useState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { BrandPreviewCard } from "./brand-preview-card";
import { VField } from "./violet-field";
import { UploadStub } from "./upload-stub";
import { saveBusinessProfile, type BrandProfileState } from "./actions";

/** Brand step 1 — Make your business profile. */
export function BusinessStep({
  orgName: initialOrg,
  website: initialWebsite,
}: {
  orgName: string;
  website: string;
}) {
  const [state, action, pending] = useActionState<BrandProfileState, FormData>(
    saveBusinessProfile,
    {},
  );
  const [orgName, setOrgName] = useState(initialOrg);
  const [website, setWebsite] = useState(initialWebsite);

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Make your business profile
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        This is how clippers and campaigns will see you.
      </p>

      <div className="mt-5">
        <BrandPreviewCard businessName={orgName} website={website} />
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
        <UploadStub label="Add your logo" buttonLabel="Upload brand logo" />

        <div className="pt-1">
          <Button type="submit" variant="inverse" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Continue"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
