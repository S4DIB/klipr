import { z } from "zod";

export const onboardingSchema = z.object({
  role: z.enum(["individual", "agency"]),
  displayName: z.string().trim().min(2, "Tell us your name").max(60),
  payoutNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{6,20}$/, "Enter a valid payout (wallet) number"),
  pageUrl: z.string().trim().url("Enter a valid page URL"),
  handle: z.string().trim().min(2, "Add your handle").max(40),
  platform: z.enum(["TikTok", "Instagram", "YouTube", "Facebook"]),
  followerCount: z.coerce.number().int().min(0, "Followers can't be negative"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
