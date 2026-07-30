# Go‑Live + Manual Verification — Plan

Status: **executed** (code complete + verified in stub). Remaining = your infra steps in
[SETUP-GOOGLE-AUTH.md](SETUP-GOOGLE-AUTH.md): apply migrations, configure the Google provider,
make yourself admin, deploy without `KLIPR_FORCE_STUB`. Scope decided with product:

- **Real backend + real Google auth.** Switch off stub/demo, run on the existing Supabase project + Google OAuth.
- **No demo data.** Remove the seeded demo world and the one‑tap demo logins.
- **No platform APIs → manual verification in admin.** Because we don't have the YouTube/TikTok/Instagram APIs, an admin manually (a) approves that a clipper owns a connected account, and (b) reviews each clip and enters/approves its real view count, which drives earnings + XP.
- **Keep stub mode for local dev only** — but with the demo seed and demo logins removed, so stub boots an empty, honest store.

Supabase credentials are already present in `.env`; the app is only in stub mode because of `KLIPR_FORCE_STUB=1`.

---

## 1. How it works today (grounding)

- **Backend switch:** `hasSupabase` in `lib/env.ts` = `!KLIPR_FORCE_STUB && (SUPABASE_URL && ANON_KEY)`. True → real Supabase Auth + Postgres (`lib/db/supabase-impl.ts`). False → local JSON store (`lib/db/store.ts`) + cookie auth. The data facade `lib/db/index.ts` dispatches every call by this flag.
- **Demo world:** `seed()` in `lib/db/store.ts` (lines ~46–357) fabricates demo users/campaigns/clips/ledger. `.data/db.json` is reseeded when its `version` ≠ 4.
- **Demo logins:** `app/login/page.tsx` renders a "Local demo identities" panel (behind `!hasSupabase`) wired to six `signInAs*` actions in `app/login/actions.ts`. `app/dev-login/route.ts` is a dev cookie identity switch.
- **Verification engine:** adapters in `lib/verify/*` with `mode(): "live" | "simulated"`. Without `YOUTUBE_API_KEY`, YouTube is `simulated`; TikTok/IG/FB are always `simulated`. `simulatedViews()` fabricates view curves. The **sweep** (`lib/verify/sweep.ts` `runSweep`, cron `app/api/cron/sweep`) auto‑baselines, polls, and **auto‑settles on window end** via `settleOne(sub, lockedViews, nowIso)`.
- **Accounts:** `ConnectedAccount.status ∈ {active, revoked}`, `proof ∈ {oauth, simulated}`. `connectVettedPage` (`app/onboarding/actions.ts`) makes an account `active` **instantly** — no approval gate.
- **Admin patterns to mirror:** applications (list + detail + `decideApplication`), fraud (list + `releaseHold`/`upholdHold`), payouts (`markPaid` with a text input). Nav is configured in `components/app/app-shell.tsx` `RAIL.admin`. Every admin server action calls `requireAdmin()` first.

---

## 2. The manual‑verification model (design)

Introduce a third verification mode: **`manual`**, and make it the default whenever there's no live API.

**Core rule:** if `adapter.mode() === "manual"`, the app **never fetches or fabricates a view count.** Baselines aren't taken, the sweep skips the clip, and settlement happens **only** through the admin "Clip verification" action with an admin‑entered number.

- `mode()` union becomes `"live" | "simulated" | "manual"`.
  - YouTube: `live` if `YOUTUBE_API_KEY`/`VERIFY_MODE_YOUTUBE=live`, else **`manual`** (was `simulated`).
  - TikTok/IG/FB: **`manual`** by default; `simulated` only if `VERIFY_MODE_<P>=simulated` is set explicitly (kept for tests/opt‑in dev).
- `simulatedViews()` and the simulated adapters stay in the tree (unit tests use them) but are no longer a default path.

### Account verification (manual)
- `ConnectedAccount.status` → `"pending" | "active" | "revoked"`; `proof` → adds `"manual"`; add optional `verifiedAt?`, `verifiedBy?`.
- `connectVettedPage` creates accounts `status:"pending"`, `proof:"manual"` (was instant `active`/`simulated`). Live YouTube OAuth connect stays `oauth`/`active`.
- Submit is already gated on `account.status === "active"`, so **pending accounts can't submit** — the gate is automatic.
- Admin **/admin/accounts** lists pending accounts → Approve (`active`, stamp `verifiedAt/By`) / Reject (`revoked`).
- Connections page shows a "Pending review" chip for pending accounts.

### Clip view‑count verification (manual)
- `submitClip`, when `adapter.mode() === "manual"`: skip the baseline `fetchStats`, create the submission at `baseline/latest/counted = 0`, `status:"tracking"` (= "submitted, awaiting review").
- Sweep (`runSweep`) **skips manual‑mode submissions** in the baseline/poll/settle steps (filter `getAdapter(s.platform).mode() !== "manual"`). Manual clips are never auto‑settled. Campaign lifecycle (active→settling→completed, refunds) is unchanged, so a campaign only completes once the admin has settled/rejected its manual clips.
- Admin **/admin/clips** lists `status:"tracking"` submissions (open link to count views by hand) → enter the counted views → **Approve** settles via `settleSubmissionManually(id, views)` (a thin exported wrapper over `settleOne`) → **Reject** sets `status:"rejected"` + reason.
- The admin‑entered `lockedViews` flows through the existing money/XP path unchanged; the clipper's clip UI already reads `lockedViews ?? countedViews`.

---

## 3. Execution — Phase 1: strip demo + backend cutover (code)

1. **`lib/db/store.ts`** — replace `seed()` body with an empty‑DB factory: `{profiles:[], applications:[], applicationPages:[], connectedAccounts:[], campaigns:[], submissions:[], viewSnapshots:[], xpEvents:[], ledger:[], payoutBatches:[], fraudFlags:[], sweepLocks:[], version:4}`. Remove seed‑only helpers (`daysFromNow`, `hoursAgo`, `simulatedViews` import) if unused. Keep all CRUD + `load`/`save`. Fix the stale "V3/version 3" header comment.
2. **`app/login/page.tsx`** — delete the `DEMOS` array, the "Local demo identities" panel, the "Stub mode… Google is stubbed" note, and the six `signInAs*` imports. Keep "Continue with Google".
3. **`app/login/actions.ts`** — delete `signInAsSeed` + the six `signInAs*` exports. In `signInWithGoogle`'s stub branch, drop the `getProfile("usr_clipper")` shortcut and always `ensureGoogleUser("you@gmail.com","You")` (fresh applicant → `/apply`).
4. **Remove dev testing routes:** delete `app/dev-login/route.ts`, `app/dev-submit/route.ts`, `app/dev-sweep/route.ts`.
5. **`.env`** — remove `KLIPR_FORCE_STUB=1` (+ its comment). Add `KLIPR_FORCE_STUB=1` to `.env.local` (git‑ignored) so **local dev stays stub** while deployed prod uses real Supabase. Document `KLIPR_DEV_ADMIN_EMAIL` (below) in `.env.example`.
6. **Dev admin bootstrap (stub only):** in `lib/auth/session.ts` `ensureGoogleUser`, when `!hasSupabase` and the new user's email === `process.env.KLIPR_DEV_ADMIN_EMAIL`, create them `role:"admin", access:"active"`. Off by default; the only way to reach admin in an empty stub. (Prod admins are set in Supabase.)
7. **`supabase/migrations/0001_init.sql`** — remove the "Seed campaigns" INSERT (cmp_aila/north/pulse/orbit).

## 4. Execution — Phase 2: manual admin verification (code)

8. **Types** — `lib/db/types.ts`: `ConnectedAccount.status` add `"pending"`; `proof` add `"manual"`; add `verifiedAt?`, `verifiedBy?`.
9. **Verify mode** — `lib/verify/types.ts` widen `mode()` to include `"manual"`. `lib/verify/others.ts` `envMode` → `"manual"` default (`"simulated"` only if explicitly set). `lib/verify/youtube.ts` `mode()` → `"manual"` fallback instead of `"simulated"`. Manual adapter `verifyOwnership` returns `"owned"` for active accounts.
10. **Facade** — add `updateConnectedAccount(id, patch)` to `lib/db/index.ts` + `lib/db/store.ts` + `lib/db/supabase-impl.ts` (mirrors `updateSubmission`).
11. **Settlement wrapper** — export `settleSubmissionManually(submissionId, lockedViews, nowIso?)` from `lib/verify/sweep.ts` that loads the sub via `getSubmission` and delegates to `settleOne`.
12. **`app/onboarding/actions.ts`** `connectVettedPage` → create `status:"pending"`, `proof:"manual"`.
13. **`app/(app)/campaigns/[id]/actions.ts`** `submitClip` → manual‑mode branch: skip baseline fetch, create `tracking` at 0.
14. **`lib/verify/sweep.ts`** `runSweep` → filter out `mode()==="manual"` submissions in baseline/poll/settle steps.
15. **Admin — accounts:** `app/admin/accounts/page.tsx` (list pending accounts, with clipper + page/application context) + `app/admin/accounts/actions.ts` (`approveAccount`, `rejectAccount`, each `requireAdmin()`). Mirror the applications queue/detail pattern.
16. **Admin — clips:** `app/admin/clips/page.tsx` (list `tracking` submissions with post link, campaign, clipper, view‑count input) + `app/admin/clips/actions.ts` (`settleClip` via `settleSubmissionManually`, `rejectClip`). Mirror payouts' `MarkPaidForm` input pattern.
17. **Nav + home tiles** — add `{href:"/admin/accounts", label:"Accounts", icon:"users"}` and `{href:"/admin/clips", label:"Clips", icon:"graph"}` to `RAIL.admin` in `components/app/app-shell.tsx`; add pending‑accounts and clips‑to‑verify count tiles to `app/admin/page.tsx`.
18. **Copy** — update `components/app/submit-sheet.tsx` ("views verify automatically" → "your clip goes to review; verified views are counted by our team"), the connections page pending chip, and the clip detail "tracking" copy to reflect manual review.
19. **Supabase migration `0006_manual_verification.sql`** — allow `connected_accounts.status = 'pending'` and `proof = 'manual'` (adjust CHECK/enum), add `verified_at timestamptz`, `verified_by text`. Update `lib/db/supabase-impl.ts` row mapping for the new fields.

## 5. Phase 3 — user setup checklist (delivered as `SETUP-GOOGLE-AUTH.md`)

I can't create your Google OAuth app or run SQL on your Supabase (the service‑role key isn't SQL access). Steps for you:
1. **Apply migrations** `0001`–`0006` (Supabase SQL editor or `supabase db push`).
2. **Google OAuth:** create an OAuth client in Google Cloud Console; add redirect `https://<project-ref>.supabase.co/auth/v1/callback`; in Supabase → Auth → Providers → Google, paste client id/secret; set Auth → URL config Site URL + redirect to your site.
3. **Env:** confirm `.env` has the Supabase trio + `NEXT_PUBLIC_SITE_URL`, `TOKEN_KEY`, `CRON_SECRET`; ensure `KLIPR_FORCE_STUB` is **not** set in prod.
4. **Make yourself admin:** after first Google sign‑in, set your `profiles.role = 'admin'`, `access = 'active'` in Supabase.
5. Deploy.

---

## 6. Testing plan

- Typecheck (`tsc --noEmit`) after each phase; run existing unit tests (`lib/verify/*.test.ts`).
- Drive the app in **stub mode** (empty seed) with `KLIPR_DEV_ADMIN_EMAIL` set, exercising the real flow end‑to‑end: sign in (fresh) → apply → (admin) approve application → connect account → **(admin) approve account** → submit clip → **(admin) enter view count + settle** → verify earnings/XP land on the clipper and wallet. Screenshot each admin surface.
- Confirm login page shows **only** "Continue with Google" (no demo panel), and campaigns/home are empty (no demo data).

## 7. Risks / rollback

- **Migrations not yet applied:** with `KLIPR_FORCE_STUB` removed, local dev would hit a Supabase without the new columns → we keep force‑stub in `.env.local` so dev is unaffected until you apply migrations.
- **Empty stub has no admin:** solved by `KLIPR_DEV_ADMIN_EMAIL` (dev‑only).
- **Rollback:** re‑adding `KLIPR_FORCE_STUB=1` restores the previous stub behavior; the demo seed is in git history if ever needed.
