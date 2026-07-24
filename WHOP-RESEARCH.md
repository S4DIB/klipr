# Whop Content Rewards — Research & Reference

> Reference for building **Klipr** (a content-rewards marketplace modeled on Whop
> Rewards). Captures how Whop's Content Rewards / Whop Clips product works —
> brand flow, clipper flow, and the verification/payout machinery — plus how
> Klipr intends to differ. Compiled from Whop's own docs, blog, and Terms of
> Service, cross-checked against third-party clipper guides (July 2026).

---

## What it is

Whop is a marketplace for digital products/communities. **Content Rewards** is an
app inside Whop that turns marketing into a pay-per-view marketplace: a brand
funds a budget, everyday creators ("clippers") post short videos promoting the
brand to their **own** social accounts, and the brand pays **per 1,000 views** out
of that budget. The creator-facing side is branded **Whop Clips**. This is the
model Klipr is copying.

**Two campaign types**
- **Clipping** — creators repurpose the brand's existing long-form content
  (podcasts, streams, videos) into short clips.
- **UGC** — creators make original content featuring the brand.

**Supported platforms:** TikTok, Instagram Reels, YouTube Shorts, X (Twitter).

---

## 1. Brand / Seller flow

### A. Create the campaign
Add the "Content Rewards" app from the Whop App Store → "Create Content Reward".
Six **mandatory** fields:

| Field | What it does |
|---|---|
| **Campaign name/title** | Public, seen by creators |
| **Campaign type** | Clipping / UGC / Other |
| **Category** | Niche |
| **Total budget** | Total the brand will spend (the ceiling) |
| **Reward rate** | How much creators earn **per 1,000 views** |
| **Allowed platforms** | Which socials submissions are accepted from |

**Optional but important controls**
- **Minimum payout** — a *review threshold*. Example: $3 rate + $6 minimum ⇒ only
  videos with ≥2,000 views get submitted for review. Keeps low-view spam out.
- **Maximum payout** — caps how much a single video/creator can earn, to protect
  the budget.
- **Flat fee bonus** — optional fixed $ per approved submission, *on top of* the
  per-view reward.
- **Requirements** — rules creators must follow (length, hook, captions, required
  tags/links, geography, prohibited claims, brand tone).
- **Available content / assets** — source clips, audio links (TikTok/IG sounds),
  brand guidelines, examples.

### B. Fund it
The brand **deposits the full budget up front** (escrow). Status goes
**Pending budget → Active**. Budget can be topped up anytime. Per the ToS, the
seller must have funds covering **max payout + Whop's 10% fee** before publishing.

### C. Review submissions
Submissions land in **Pending / Approved / Flagged / Rejected**.
- An **AI Content Rewards Reviewer** auto-checks every submission against the
  campaign requirements and flags ones that don't meet them.
- The brand has **48 hours** to approve/reject. **If not actioned in 48h and the
  AI flagged it as legit, it auto-approves.**
- Rejection requires a brief reason; there's an optional **"ban the user for
  botting."**
- Bulk approval is available.

### D. Pay
On approval, Whop pays the creator based on verified views × the per-1k rate. The
brand only ever pays for approved views, and only until the budget runs out.

---

## 2. Clipper / Creator flow

1. **Sign up & connect accounts** — create a Whop account (must be **18+**), then
   **link the social accounts** you'll post from. Accounts must be *public* and
   connected — some campaigns require the account linked *at posting time*. Best
   practice: link accounts *before* you need them.
2. **Discover a campaign** — browse the Content Rewards marketplace/discover feed,
   pick a **live** campaign, read its rate, budget-remaining, platforms, and
   requirements.
3. **Create the clip** — repurpose the brand's content (or make UGC) following the
   requirements (hook, length, captions, required tags/links).
4. **Post & submit** — publish to your linked account, then submit the **post URL**
   (and the **content media file**) back into Content Rewards.
5. **Tracking & verification** — Whop tracks the post's views over a **tracking
   window** and verifies them against the real platform post.
6. **Get paid** — once approved and views verify, earnings credit to your Whop
   balance; withdraw via Whop Payments.

**Earnings formula:** `approved eligible views ÷ 1,000 × campaign rate`
(50,000 views at $1/1k = $50).

---

## 3. How views are verified & tracked (core mechanic)

- **Connected public accounts are the backbone** — you can only submit posts from
  linked accounts, which is how Whop ties a post to a creator and reads its view
  count.
- **Views verified "against the actual platform post"** over a **tracking window**
  (most campaigns "several days"; some third-party sources cite a ~**30-day
  verification period**). Whop's ToS leaves exact timing to **Whop's sole
  discretion**.
- **Critical rule: views only count from submission onward.** Submit late and the
  views you already had don't count — "a self-inflicted haircut."
- **Bot/fake-view exclusion:** Whop "excludes views generated by, or suspected to
  be generated by, any bots, script, macro or other automated means," and views
  obtained via "prizes, payments, barters, or other inducements." **Whop alone
  decides** what's legitimate.

> Whop's public "instant payouts, earn on day one" messaging refers to how fast
> you can *withdraw once credited* + fast-verifying small clips — not that views
> skip the tracking window. The ToS is deliberately vague on timing.

---

## 4. Payout & money mechanics

- **Form:** payouts move from the seller's Whop account to the participant as
  **Whop Credits**, then withdrawn via Whop Payments.
- **Whop's cut:** **10% of all amounts paid** from seller to participants (the
  Content Rewards platform fee; separate from Whop's general ~2.7%+
  processing/withdrawal fees).
- **Withdrawal options (general Whop):** ACH ~$2.50 (3–5 days), instant 4% + $1,
  crypto 5% + $1.
- **Budget exhaustion:** payouts run until **max payout is met or the end date
  hits, whichever first**. If the budget runs dry before all views verify,
  **late-verifying views can go unpaid**; Whop may issue **pro-rata payments
  first-come-first-served**.
- **Market rates seen:** **$0.20–$6 per 1,000 views**, averaging **~$1**
  (e.g. Roobet $1.50/1k on a $250k budget; MUTUUM $6/1k).

---

## 5. Anti-fraud & eligibility rules

- **AI Content Rewards Reviewer** screens every submission against requirements.
- **No duplicate/reused deliverables** — each submission must be unique.
- **Per-clipper payout caps** and **max-payout-per-video** limit farming.
- **Ban-for-botting** on rejection; suspected bot views are stripped.
- **Inducement ban** — no paying/bribing for views.
- **Participant eligibility:** 18+, Whop account, connected socials, **not**
  SAG-AFTRA members, **no** virtual influencers/bots.
- **Seller eligibility:** 18+, must pre-fund max payout + 10%.

---

## 6. Whop → Klipr mapping

Whop is the blueprint; a few deliberate differences define Klipr.

| Dimension | Whop | Klipr's plan |
|---|---|---|
| **View verification** | Tracks/verifies at Whop's discretion + **AI + manual 48h approval** by the brand | **Fully automatic** via platform insight APIs — connected accounts + settlement window (no manual check-up) |
| **Rate model** | Brand sets any rate; effective rate is per-view of a budget | **Fixed ৳50/1k clipper, ৳60/1k brand** (budget-as-ceiling — TBC) |
| **Platform cut** | 10% of payouts | **৳10/1k spread** = the margin |
| **Payout** | Whop Credits → withdraw | **bKash**, ৳ |
| **Market** | US/global, $ | **Bangladesh-first** |
| **Approval** | Brand reviews & approves each clip | Auto — the platform's settled view count is the truth |
| **Content match** | AI reviewer + brand eyeballs | Open fork: fingerprint / watermark / spot-audit |

**Takeaways worth stealing directly:** budget escrowed up front · min-payout
review threshold · max-payout-per-video cap · per-clipper caps · views only count
from submission onward · connected-accounts-only submissions · a
tracking/settlement window before money locks. These aren't cosmetic — they're
what keeps a pay-per-view marketplace from being drained by fraud.

---

## Open forks for Klipr (decide before full build)

1. **Content-matching approach** — how do we confirm the posted clip is *the
   campaign's content*, not just any video? Options: perceptual/audio
   fingerprinting · watermark/asset-hash · spot-audit on flagged outliers.
2. **Rate model** — fixed ৳50/1k clipper + ৳60/1k brand with budget as ceiling
   (assumed), vs. proportional budget split (old V1).

---

## Sources

- [Whop Docs — Content Rewards](https://docs.whop.com/memberships-and-access/third-party-apps/content-rewards)
- [Whop blog — set up Content Rewards](https://whop.com/blog/set-up-content-rewards/)
- [Whop blog — Content Rewards guide](https://whop.com/blog/whop-content-rewards/)
- [Content Rewards Terms of Service](https://whop.com/content-rewards-terms-of-service/)
- [WhopReviews — clipping guide](https://www.whopreviews.com/guides/whop-clipping)
- [OpenClip — Whop clipping guide](https://openclip.app/guides/whop-clipping-guide)
- [Whop fees](https://docs.whop.com/fees)
