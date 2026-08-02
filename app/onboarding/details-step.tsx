"use client";

import { useActionState, useState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { BrandPreviewCard } from "./brand-preview-card";
import { VSelect } from "./violet-field";
import { saveCompanyDetails, type BrandDetailsState } from "./actions";
import { COUNTRIES, INDUSTRIES, SPEND } from "./options";

/** Brand step 2 — Company details. */
export function DetailsStep({
  businessName,
  website,
  logoUrl,
  industry: initialIndustry,
  country: initialCountry,
  monthlySpend: initialSpend,
  onBack,
}: {
  businessName: string;
  website: string;
  logoUrl?: string;
  industry: string;
  country: string;
  monthlySpend: string;
  onBack: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<BrandDetailsState, FormData>(
    saveCompanyDetails,
    {},
  );
  const [industry, setIndustry] = useState(initialIndustry || "");
  const [country, setCountry] = useState(initialCountry || "");
  const [spend, setSpend] = useState(initialSpend || "");

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Company details
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        This helps us match you with the right clippers.
      </p>

      <div className="mt-5">
        <BrandPreviewCard
          businessName={businessName}
          website={website}
          logoUrl={logoUrl}
          industry={industry}
          country={country}
        />
      </div>

      <form action={action} className="mt-5 space-y-4">
        <VSelect
          label="Select your industry"
          name="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          required
        >
          <option value="" disabled>
            Industry
          </option>
          {INDUSTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </VSelect>

        <VSelect
          label="Your location"
          name="location"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        >
          <option value="" disabled>
            Country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </VSelect>

        <VSelect
          label="Estimated monthly spend"
          name="monthlySpend"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          required
        >
          <option value="" disabled>
            Select range
          </option>
          {SPEND.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </VSelect>

        {state.error ? (
          <p className="text-[12.5px] font-semibold text-yellow">{state.error}</p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          {onBack}
          <Button type="submit" variant="inverse" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Continue"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
