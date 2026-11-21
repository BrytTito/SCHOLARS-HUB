# Scholars Hub — What's left to build

This is the working plan for taking Scholars Hub from **v1.0.0** (registration + pricing +
broadcast channels + polls + personal timetable) to the product described in the README:
a weekly study-group service that students pay for and that an admin can operate.

Every item below is grounded in the current code, not in guesswork. Where an item exists
because something is *missing*, the evidence column says what is missing and where.

Status key: `⬜ todo` · `🟨 in progress` · `✅ done`

---

## 1. Where the app stands

| Area | State at v1.0.0 | Notes |
| :--- | :--- | :--- |
| Student registration | ✅ works | Student ID + full name + school + 1–3 courses, live price total |
| Weekly pricing | ✅ works | `GH¢10` per course per week, computed in `lib/courses.ts` |
| Accounts | ✅ works (email + password) | Supabase Auth, SSR cookies via `@supabase/ssr` |
| Channels | ✅ works (broadcast only) | Anyone signed in can create a channel and become its owner |
| Posts + polls | ✅ works | Notices and polls, one vote per student, live tallies |
| Personal timetable | ✅ works | Mon–Sun grid, add/delete meetings |
| Row-level security | ✅ works | 8 tables, policies in `supabase/schema.sql` |
| CI | 🟨 partial | Typegen, typecheck, lint, build — **no tests** |
| Payments | ⬜ not started | Price is calculated but never collected |
| Admin / revenue | ⬜ not started | No role, no dashboard, no way to see sign-ups |
| Chat | ⬜ not started | Channels are one-way broadcasts |

---

## 2. Gaps found in the code

| # | Gap | Evidence |
| :--- | :--- | :--- |
| 1 | **No tests at all** — not one unit, integration or end-to-end test. | `package.json` has no `test` script; no `tests/`, no `vitest.config.ts`, no `playwright.config.ts`. CI only runs `typegen → typecheck → lint → build`. |
| 2 | **No input validation library.** Every action validates by hand with `if` statements and `String(formData.get(...))`. Fine at 2 actions, fragile at 10. | `app/actions/channels.ts`, `app/actions/timetable.ts` |
| 3 | **No loading, error or not-found UI.** Any thrown error renders Next.js's default screen; a slow query shows a blank page. | No `app/loading.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` |
| 4 | **Courses cannot be changed after registration.** Enrolments are insert-only from the sign-up form. A student who adds Maths 123 must re-register. | `components/sign-up-form.tsx`, `app/dashboard/page.tsx` (read-only enrolments) |
| 5 | **No profile editing and no password reset.** | No `app/profile`, no `resetPasswordForEmail` call anywhere |
| 6 | **No pagination on channel posts.** The channel page loads every post in one query. | `app/channels/[id]/page.tsx` — no `.range()` |
| 7 | **No realtime.** Poll results only update on `revalidatePath`, i.e. after a navigation or submit. No `.channel(...)`/`.subscribe(...)` in the codebase. | repo-wide grep: zero matches |
| 8 | **Channels have no membership model.** "Join" does not exist; every signed-in student sees every channel. There is no member count, no leave, no mute. | `channels` table has only `owner_id`; no `channel_members` table |
| 9 | **No chat.** Posts are author-only writes; there is no member reply path. | `posts` policies: `"Channel owners publish posts"`, `"Authors delete their posts"` |
| 10 | **No roles and no admin surface.** Zero references to `admin`, `role` or `is_admin` in the app, the lib or the schema. | repo-wide grep: zero matches |
| 11 | **No revenue data.** `enrollments` stores courses, never a payment; there is no `payments`/`subscriptions` table, so "weekly revenue" cannot be computed. | `supabase/schema.sql` |
| 12 | **No rate limiting.** Server actions can be called in a loop; a poll can be voted on, a post created, or a channel spammed continuously. | no middleware guard in `proxy.ts` |
| 13 | **No seed script.** `supabase/schema.sql` seeds the 3 courses and nothing else; a fresh dev database has no students, channels or posts to demo with. | `supabase/schema.sql` |
| 14 | **No migrations directory.** `schema.sql` must be pasted into the SQL editor by hand, so schema changes are not reviewable or replayable. | only `supabase/schema.sql` exists |
| 15 | **No observability.** No error reporting, no analytics, no structured logging; a production bug is invisible. | no Sentry/logging dependency |
| 16 | **No accessibility or performance budget.** Motion now honours `prefers-reduced-motion` in both CSS and JS, but there are no documented contrast checks and no Lighthouse gate. | `app/globals.css`, `components/motion/blur-fade.tsx` |

---

## 3. Roadmap

Ordered by dependency, not by appeal. Each phase is shippable on its own; do not start the
next until the previous one meets its **done when**.

### Phase 1 — Foundations (1–2 days)

> Goal: make every later phase cheap. Nothing here is user-visible, and that is the point.

- [ ] ⬜ Add Vitest + Testing Library + `npm test`, and a `test` job in `.github/workflows/ci.yml`.
- [ ] ⬜ Write the first tests: `lib/courses.ts` (`weeklyTotal`, `formatMoney`, `isCourseCode`), `lib/student-id.ts`, and `lib/relations.ts` (`firstRelation`).
- [ ] ⬜ Add Zod and a shared `lib/validation.ts`; replace the hand-rolled checks in `app/actions/*.ts`. Return `{ error }` from a `safeParse` result instead of a chain of `if`s.
- [ ] ⬜ Turn `supabase/schema.sql` into numbered migrations (`supabase/migrations/0001_init.sql`, `0002_…`) and document `supabase db push` in the README.
- [ ] ⬜ Add `scripts/seed.ts` (or `supabase/seed.sql`): 1 admin, ~20 students, 3 channels, 10 posts, 2 polls, timetables — enough to demo every screen.
- [ ] ⬜ Add `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` and route-level skeletons for `/dashboard` and `/channels/[id]`.
- [ ] ⬜ Add rate limiting in `proxy.ts` (Upstash Redis, or a Postgres table if you want to stay inside Supabase) — e.g. 10 writes/minute/user.

**Done when:** `npm test` passes with ≥ 30 assertions, CI is green including tests, `supabase db reset` reproduces the database from migrations + seed, and a forced error shows your `error.tsx` rather than a stack trace.

### Phase 2 — Close the registration loop (2–3 days)

> Goal: a student can correct their own account without emailing you.

- [ ] ⬜ `app/profile/page.tsx` + `app/actions/profile.ts`: edit full name, school, student ID.
- [ ] ⬜ **Change courses** after registration: a `syncEnrollments(courseCodes)` action that diffs the selection (insert missing, delete removed, reject > 3) and recomputes the weekly total.
- [ ] ⬜ Guard the invariant in SQL: a trigger rejecting a 4th enrolment for one profile.
- [ ] ⬜ Prevent duplicate student IDs properly — `profiles_student_id_idx` is a plain index, not `unique`.
- [ ] ⬜ Password reset: `POST /auth/forgot-password` → `resetPasswordForEmail` → `/auth/update-password` callback page.
- [ ] ⬜ Email confirmation resend link on `app/auth/sign-up-success/page.tsx`.

**Done when:** a student can change from 2 courses to 3, see the price go GH¢20 → GH¢30, sign out, reset their password, and sign back in — all without touching the database.

### Phase 3 — Channels become a community (4–6 days)

> Goal: the "WhatsApp-style" part of the pitch. Today channels are a noticeboard.

- [ ] ⬜ `channel_members` table (`channel_id`, `profile_id`, `role` ∈ {owner, member}, `joined_at`, `muted_until`) + RLS.
- [ ] ⬜ Join / leave / mute actions; show member count on `/channels`.
- [ ] ⬜ Restrict channel reads to members (this is a deliberate **breaking change** to the current "everyone reads everything" policy — decide before you ship).
- [ ] ⬜ Member messages: allow `kind = 'message'` posts from members, keep `notice` owner-only. Different bubble styling for owner vs member.
- [ ] ⬜ Cursor pagination on `/channels/[id]`: 30 posts per page, "load older" using `created_at` + `id`.
- [ ] ⬜ Supabase Realtime subscription on `posts` and `poll_votes` for the open channel; optimistic vote UI with rollback on error.
- [ ] ⬜ Unread state — `last_read_at` on `channel_members`, badge in `site-header`.
- [ ] ⬜ Edit/delete own message; owner can remove any message (moderation).

**Done when:** two students in two browsers see each other's message appear without a refresh, can scroll past 100 messages in pages, and cannot read a channel they have not joined.

### Phase 4 — Money (3–5 days)

> Goal: the price stops being a label and becomes revenue. **This is the highest-risk phase — do it after Phase 3 stabilises.**

- [ ] ⬜ `payments` table: `id`, `profile_id`, `amount`, `currency` (GHS), `provider`, `provider_ref`, `weeks`, `status` ∈ {pending, success, failed}, `paid_at`, `raw_payload jsonb`.
- [ ] ⬜ `subscriptions`: `profile_id`, `current_period_start`, `current_period_end`, `status`. One row per student — the field the whole product depends on.
- [ ] ⬜ Choose a provider: **Paystack** (supports MTN MoMo in Ghana, hosted checkout, webhooks) or **Hubtel**. Do not integrate MoMo directly with MTN; use an aggregator.
- [ ] ⬜ Checkout initiation server action → provider redirect → webhook handler verifying `x-paystack-signature` with the raw body (**not** parsed JSON).
- [ ] ⬜ Webhook must be idempotent (unique `provider_ref`) and must be the only place a subscription is extended.
- [ ] ⬜ `requireActiveSubscription()` guard on `/channels` and `/dashboard`; an expired student sees a paywall, not a blank page.
- [ ] ⬜ "Renew" button showing weeks × GH¢10, plus a `pending` state while the student is in the provider's page.
- [ ] ⬜ Receipts: email on success (Resend), and a `/dashboard` billing history table.
- [ ] ⬜ Grace period + reminder emails at 3 days and 0 days before expiry.

**Done when:** a test-mode MTN MoMo payment extends the subscription by exactly one week, replaying the same webhook changes nothing, and an expired account is blocked from channels but can still pay.

### Phase 5 — Admin dashboard (2–3 days)

> Goal: you can run the service without opening the Supabase SQL editor — the explicit ask in the README.

- [ ] ⬜ Add `role` to `profiles` (`student` | `admin`) with a `is_admin()` SQL helper used by RLS. Never trust a client-side check.
- [ ] ⬜ `/admin` (guarded in `proxy.ts` *and* re-checked in the page): totals for students, active subscriptions, weekly revenue, expiring-this-week.
- [ ] ⬜ Registrations table: search by student ID / name, filter by course, sort by sign-up date, CSV export.
- [ ] ⬜ Revenue view by week and by course; chart of the last 8 weeks.
- [ ] ⬜ Manual actions: mark paid (with a reason, audited), extend a subscription, deactivate a student.
- [ ] ⬜ Channel moderation: list all channels, delete a post, transfer ownership.
- [ ] ⬜ `audit_log` table for every admin mutation (`actor_id`, `action`, `target`, `payload`, `created_at`).

**Done when:** a non-admin who types `/admin` gets a 404/redirect — verified by a test — and weekly revenue shown by the dashboard equals the sum of successful payments for that week.

### Phase 6 — Notifications (1–2 days)

- [ ] ⬜ Email via Resend: welcome, payment receipt, subscription expiring, timetable change.
- [ ] ⬜ Transactional templates in `emails/` (React Email) so they are versioned, not pasted into a provider UI.
- [ ] ⬜ Optional: WhatsApp Cloud API or SMS for students who do not read email — this is how the target audience actually behaves.
- [ ] ⬜ `notification_preferences` so a student can opt out of everything except payment mail.

**Done when:** a payment produces exactly one receipt email, retries do not duplicate it, and unsubscribed students receive nothing but receipts.

### Phase 7 — Experience and operations (2–3 days)

- [ ] ⬜ Accessibility pass: landmarks, one `h1` per page, visible focus rings, keyboard-only channel creation, contrast ≥ 4.5:1, `aria-live` on poll results.
- [ ] ⬜ Mobile review at 360 px — the timetable grid is the likely casualty.
- [ ] ⬜ PWA manifest + service worker so the timetable works offline (genuinely useful during a lecture).
- [ ] ⬜ Empty states everywhere (no channels yet, no posts yet, no timetable yet).
- [ ] ⬜ Privacy page, terms page, and "export / delete my data" — the app stores student IDs and emails, which is personal data under Ghana's Data Protection Act.
- [ ] ⬜ Sentry (or equivalent) + structured logs on server actions; alert on webhook failures.
- [ ] ⬜ `/api/health` endpoint for uptime monitoring.
- [ ] ⬜ `next/image` audit and a Lighthouse budget (≥ 90 performance / accessibility on mobile).

**Done when:** a student on a mid-range Android phone can register, pay and read their timetable without a layout break, and a failed webhook is visible in Sentry within a minute.

### Phase 8 — Release engineering (1–2 days)

- [ ] ⬜ Playwright: 3 end-to-end paths — register → dashboard; create channel → post → vote; pay (test mode) → subscription active.
- [ ] ⬜ CI matrix: `test` + `e2e` against a local Supabase (`supabase start` in the workflow), then build.
- [ ] ⬜ Staging deploy from `develop`, production from `main`, both on Railway with separate Supabase projects.
- [ ] ⬜ Document the release ritual already implied by the README: `feature/* → develop → main → tag`.
- [ ] ⬜ `CONTRIBUTING.md`, `.env.example` completed for the new provider keys, and a `docs/` runbook for "a payment did not extend a subscription".

**Done when:** merging to `develop` deploys staging automatically, and the three e2e paths are green on every PR.

---

## 4. Schema additions (sketch)

```sql
-- Phase 2
alter table public.profiles add constraint profiles_student_id_key unique (student_id);

-- Phase 3
create table public.channel_members (
  channel_id uuid not null references public.channels(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  last_read_at timestamptz,
  muted_until timestamptz,
  joined_at timestamptz not null default now(),
  primary key (channel_id, profile_id)
);

-- Phase 4
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'GHS',
  provider text not null,
  provider_ref text not null unique,        -- webhook idempotency
  weeks int not null check (weeks between 1 and 52),
  status text not null default 'pending'
    check (status in ('pending','success','failed')),
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'inactive'
    check (status in ('inactive','active','expired')),
  current_period_start timestamptz,
  current_period_end timestamptz
);

-- Phase 5
alter table public.profiles
  add column role text not null default 'student'
  check (role in ('student','admin'));

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target text,
  payload jsonb,
  created_at timestamptz not null default now()
);
```

Rules that have bitten every project that skipped them:

1. Money is `numeric`, never `float`.
2. The webhook is the only writer of `subscriptions`; the client never sets its own expiry.
3. Every policy that matters is tested from a *second* account, not only from the owner's.

---

## 5. Decisions needed before starting

| # | Decision | Why it blocks work |
| :--- | :--- | :--- |
| 1 | **Paystack or Hubtel?** | Phase 4 cannot start; they differ in webhook shape, fees and MoMo support. |
| 2 | **Do non-members read channels?** | Phase 3 changes an existing policy; retrofitting membership later means migrating data. |
| 3 | **Is the admin a real role, or just a hard-coded email?** | A hard-coded email is 30 minutes but does not survive a second admin. |
| 4 | **Free tier or paid from day one?** | Determines whether the paywall guards `/channels` (paid) or only `/dashboard` (freemium). |
| 5 | **Who owns the deployed Supabase project?** | Migrations and backups need a named owner before real payments exist. |
| 6 | **Is the timetable per week recurring, or dated?** | Recurring is what exists; exams and holidays require dated overrides. |

---

## 6. Definition of done (whole product)

- [ ] A new student registers, pays by MoMo, and joins a channel in under three minutes on a phone.
- [ ] A student can change courses, edit their profile and reset their password unaided.
- [ ] Channels carry two-way messages, paginate, and update live.
- [ ] An admin can see sign-ups, weekly revenue, expiries and moderate content.
- [ ] Every subscription change is traceable to one provider reference.
- [ ] `npm test` and the three e2e paths run in CI on every PR.
- [ ] A failed payment is diagnosable from the logs without reading the database by hand.

---

## 7. Suggested first week

| Day | Work |
| :--- | :--- |
| 1 | Phase 1: Vitest + first tests + Zod; migrations split; CI `test` job. |
| 2 | Phase 1: seed script, `loading`/`error`/`not-found`, rate limiting. |
| 3 | Phase 2: profile page + `syncEnrollments` + unique student ID. |
| 4 | Phase 2: password reset, enrolment trigger, tests for both. |
| 5 | Phase 3: `channel_members` migration + join/leave + membership-aware RLS. |

Phase 4 (money) should not begin until Phase 1 is green in CI — a payment bug found
without tests is a payment bug found by a customer.
