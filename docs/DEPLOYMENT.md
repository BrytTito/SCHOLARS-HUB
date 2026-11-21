# Deploying Scholars Hub on Railway

The app is one Next.js 16 service. Everything stateful lives in Supabase;
Railway only builds the app and serves it. There are no cron jobs, queues,
workers or server-side secrets.

- **Host**: [Railway](https://railway.com) — a single service, no persistent
  volume, no Dockerfile needed.
- **Database and auth**: Supabase (Postgres + GoTrue + row-level security).
- **Production branch**: `main`. Deploys from `main` are the live site.
- **Config files**: [`railway.json`](../railway.json), `.nvmrc`, and
  [`app/api/health/route.ts`](../app/api/health/route.ts).

Time from a clean repo to a working site: **about 20 minutes**, most of it in
the Supabase dashboard.

---

## 1. What you need before starting

| Item | Where it comes from |
|---|---|
| Supabase project URL | Supabase → Project Settings → API |
| Supabase **publishable** key (older projects: **anon** key) | Same page |
| Railway account with the GitHub repo connected | railway.com |
| The public URL of the service | Railway generates one; you can add a custom domain later |

> The publishable/anon key is **public by design** — it ships in the browser
> bundle. Access control comes from row-level security, not from hiding the key.
> Never put the **service role** key in this project or in Railway: nothing here
> needs it, and it bypasses every policy.

---

## 2. Supabase, once per project

### 2.1 Apply the schema

Open **SQL Editor**, paste all of
[`supabase/schema.sql`](../supabase/schema.sql) and run it. The script is
idempotent: tables use `if not exists`, policies are dropped before being
recreated, and the courses are seeded with `on conflict do nothing`.

Expected result: eight tables (`courses`, `profiles`, `enrollments`, `channels`,
`posts`, `poll_options`, `poll_votes`, `timetable_entries`), RLS enabled on all
of them, and three rows in `courses`:

| code | title |
|---|---|
| `MATH121` | Mathematics 121 |
| `MATH123` | Mathematics 123 |
| `STAT111` | Statistics 111 |

### 2.2 Keep email confirmation **off**

Authentication → Sign In / Providers → Email → **Confirm email: off**.

This is a hard requirement today. Registration creates the `profiles` row from
the browser *after* `signUp()` returns a session. With confirmation on,
`signUp` returns no session, the student is sent to `/auth/sign-up-success`, and
when they click the emailed link there is no `/auth/confirm` route to exchange
the token. They end up signed in but with **no profile**, so the dashboard says
"Your student profile is incomplete".

Turning confirmation on is a code change, not a setting: add
`app/auth/confirm/route.ts` (verify the OTP, then create the profile and
enrolments from user metadata) and a test for it. Tracked in
[`ROADMAP.md`](ROADMAP.md).

### 2.3 Tell Supabase where the app lives

Authentication → URL Configuration:

| Field | Value |
|---|---|
| **Site URL** | `https://<your-service>.up.railway.app` (or your custom domain) |
| **Redirect URLs** | `https://<your-service>.up.railway.app/**` |

Add a second entry if you use a custom domain. Local development needs no entry
while confirmations are off, but `http://localhost:3000/**` is harmless and
useful the day password reset lands.

---

## 3. Railway, once per repo

### 3.1 Create the service

1. Railway → **New Project** → **Deploy from GitHub repo** → `BrytTito/SCHOLARS-HUB`.
2. If asked for a branch, choose `main`.
3. Railway starts a build immediately. It will fail on the first attempt if the
   variables from 3.2 are not set yet — that is expected; set them and redeploy.

[`railway.json`](../railway.json) tells Railway to install with `npm ci`, build
with `npm run build`, start with `npm run start`, and health-check
`/api/health` with a 120s timeout. Node 22 comes from `.nvmrc`, and
`package.json` requires `>=20.9`.

### 3.2 Variables

Service → **Variables** → add:

| Name | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable (or anon) key | yes |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-service>.up.railway.app` | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | no, alternative name only |

Notes that matter operationally:

- **`NEXT_PUBLIC_*` values are baked into the browser bundle at build time.**
  Railway supplies service variables to the build, so set them **before** the
  first successful build. Changing one later requires a redeploy, not just a
  restart.
- Set **one** of the two key names, not both. The code accepts the publishable
  key first, then the anon key.
- `NEXT_PUBLIC_SITE_URL` drives canonical URLs and social preview images
  (`metadataBase` in `app/layout.tsx`). Without it the app falls back to
  Railway's `RAILWAY_PUBLIC_DOMAIN`, then to `http://localhost:3000` — which
  would make shared links point at localhost.
- Railway injects `PORT`; `next start` reads it, so do not hard-code a port.
- No other variables are read. There is no service-role key anywhere.

### 3.3 Expose it

Service → **Settings → Networking → Generate Domain**. Put that URL into
`NEXT_PUBLIC_SITE_URL` and into Supabase's Site URL, then redeploy once so the
build picks up the value.

For a custom domain: **Settings → Networking → Custom Domain**, add the CNAME
your DNS provider shows, wait for the certificate, then update
`NEXT_PUBLIC_SITE_URL` **and** Supabase's Site URL to the custom domain and
redeploy.

### 3.4 Choose a region

Service → **Settings → Region**. `EU West` is the closest region to Ghana among
Railway's options; pick it before students start using the app, because moving a
service later means recreating it.

---

## 4. First deploy: check these, in order

Run this once in a private browser window. Each line has an observable pass
condition; if one fails, stop — the next is usually a knock-on.

| # | Do | Pass when |
|---|---|---|
| 1 | Open `/api/health` | `200` with `{"status":"ok","database":"ok","configured":true,...}` |
| 2 | `curl -I https://<domain>` | `200`, and headers include `x-frame-options: DENY` and `x-content-type-options: nosniff` |
| 3 | Visit `/` | Landing page renders; "Register now" and the GH₵10.00 price note visible |
| 4 | Open `/auth/sign-up` | The form appears — **not** the "Connect Supabase to continue" card |
| 5 | Register a throwaway student (1 course) | Redirect to `/dashboard`; name, student ID, school and `GH₵10.00` |
| 6 | Log out, sign back in | `/dashboard` again, same enrolment |
| 7 | Create a channel; post a notice and a poll | Both appear at the top of the channel |
| 8 | Add a timetable meeting | Row appears under the correct day |
| 9 | Sign in as a **second** student | Cannot see or edit the first student's timetable; channels are readable |
| 10 | Browser console on `/dashboard` | No errors, and no "Your project's URL and API key are required" |
| 11 | Supabase → Table editor | One `profiles` row per signup, matching `enrollments`, no orphans |
| 12 | Share the link in a chat app | Preview title and image resolve (proves `NEXT_PUBLIC_SITE_URL`) |

Housekeeping after step 5: delete the throwaway user (Supabase → Authentication
→ Users) **and** its `profiles` row — the cascade removes enrolments and
timetable entries. Delete the `TEST26001` account from local development too if
it is still there.

---

## 5. Day-2 operations

| Task | How |
|---|---|
| **Roll back a bad deploy** | Service → **Deployments** → open the last good one → **Redeploy**. No rebuild, a minute or so. |
| **Change a variable** | Variables → edit → Railway redeploys the service. `NEXT_PUBLIC_*` changes only take effect after that rebuild finishes. |
| **Read an error** | Service → **Deployments → Build logs** for compile failures, **Logs** for runtime. Client-side errors are not collected anywhere yet — see limits. |
| **Restart** | Service → ⋯ → **Restart**. The health check gates traffic during startup. |
| **Check database health** | `/api/health` → `database` is `ok`, `unreachable` or `not-configured`. |
| **Pause signups** | Supabase → Authentication → Sign In / Providers → Email → disable. The form then shows an error instead of a white screen. |
| **Database backup** | Supabase → Database → Backups. Check the retention on your plan before relying on it. |
| **PR previews** | Railway can spin an environment per pull request (plan-dependent). If you enable it, point previews at a **separate** Supabase project — otherwise every PR can create real students. |

A deploy never touches data. Migrations are still hand-run SQL, so a code
rollback can leave the schema ahead of the code — read the migrations item in
the roadmap before changing `schema.sql` on a live database.

`/api/health` deliberately returns `200` even when Supabase is unreachable:
restarting the container cannot fix a database outage, and a failing health
check would make Railway replace a perfectly good deployment. Read the
`database` field, not just the status code.

---

## 6. Known limits, before you invite real students

These are in [`ROADMAP.md`](ROADMAP.md) with acceptance criteria; this is the
production-relevant short version.

| Limit | Consequence today |
|---|---|
| **No rate limiting** | Server actions can be called in a loop; polls, posts and channels can be spammed by anyone with an account. |
| **No password reset** | A student who forgets their password cannot recover the account without an admin recreating it. |
| **No error reporting** | A client-side failure is invisible unless the student reports it. Only server logs exist. |
| **No tests** | Nothing guards a pricing or payment change. `lib/courses.ts` is the file to protect first. |
| **No privacy notice or terms** | The app stores student IDs, names, schools and emails — personal data. Needed before real users. |
| **No admin surface** | Registrations and revenue can only be counted in the Supabase SQL editor. |
| **Placeholder credentials in CI** | CI builds with dummy values; it proves the code compiles, not that it can reach your database. Section 4 is the real check. |
| **Single instance assumption** | Nothing caches in memory today, so one Railway replica is correct. If you ever scale horizontally, sessions stay fine (cookies in Supabase) but any future in-memory rate limiting would not. |

---

## 7. Reproduce the deploy locally

Run exactly what Railway runs:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
PORT=3000 npm run start     # PowerShell: $env:PORT=3000; npm run start
```

`.env.local` needs the same values as Railway's variables. Then walk through
section 4 against `http://localhost:3000` — same code path, same headers, minus
TLS and the proxy.

If the build fails on `next/font/google` (Geist) with a network error, Google
Fonts was unreachable from the builder. Retry the build; if it persists, the
font needs self-hosting, which is a code change.
