import { z } from "zod";
import { NICHES } from "@/lib/platforms";

/** One declared page in an application — information for the reviewer, not a gate. */
export const declaredPageSchema = z.object({
  platform: z.enum(["facebook", "tiktok", "instagram", "youtube"]),
  handle: z.string().trim().min(2, "Add the page handle").max(60),
  url: z.string().trim().url("Enter the full page link"),
  selfReportedFollowers: z.coerce
    .number()
    .int()
    .min(0, "Followers can't be negative")
    .max(1_000_000_000),
  niche: z.enum(NICHES),
});

export const applicationSchema = z.object({
  role: z.enum(["clipper", "agency"]),
  orgName: z.string().trim().max(80).optional(),
  note: z
    .string()
    .trim()
    .min(10, "Tell the reviewer how often you post — one or two sentences.")
    .max(600),
  pages: z
    .array(declaredPageSchema)
    .min(1, "Declare at least one page")
    .max(8, "Up to 8 pages per application"),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const brandSignupSchema = z.object({
  orgName: z.string().trim().min(2, "Company name").max(80),
  contactNumber: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid BD mobile number (01XXXXXXXXX)"),
  designation: z.string().trim().min(2, "Your role at the company").max(60),
});

export const bkashSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Enter a valid bKash number (01XXXXXXXXX)");
