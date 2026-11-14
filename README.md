# Scholars Hub

A registration and study-group platform for students taking **Maths 121**,
**Maths 123** and **Stats 111**.

Students register with their student ID, school and name, pick **1–3 courses**
(GH₵10 per course **per week**, totalled live), then get a dashboard with
broadcast channels (notices **and** polls) and a personal weekly timetable.

---

## Features

| Area | What it does |
| --- | --- |
| **Registration** | Student ID, full name, school, 1–3 courses, password. Student ID doubles as the login name. |
| **Pricing** | Every course is GH₵10/week; the weekly total is summed live while selecting and stored with the enrolment. |
| **Channels** | Any student can create a channel. Only the owner broadcasts notices, exactly like a Telegram channel. |
| **Polls** | Channel owners publish 2–6 option polls; every student gets one vote and can change it. Live counts and percentages. |
| **Timetable** | Each student builds a personal Mon–Sun timetable of meeting days, times and venues. |
| **Auth + data** | Supabase Auth (email/password under the hood) and Postgres with row-level security on every table. |

## Stack

All open source:

- [Next.js](https://github.com/vercel/next.js) 16 (App Router, Server Actions)
- [React](https://github.com/facebook/react) 19
- [TypeScript](https://github.com/microsoft/TypeScript)
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) + [shadcn/ui](https://github.com/shadcn-ui/ui) components
- [lucide-react](https://github.com/lucide-icons/lucide) icons
- [Supabase](https://github.com/supabase/supabase) (`supabase-js` + `@supabase/ssr`) for Postgres, Auth and RLS

The project started from the official Next.js + Supabase starter
([`vercel/next.js/examples/with-supabase`](https://github.com/vercel/next.js/tree/canary/examples/with-supabase))
and was adapted to Scholars Hub.

---

## 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project (free tier is fine).
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and run it.
   It creates the tables, seed courses and all row-level-security policies.

## 2. Turn off email confirmation

Students sign in with a student ID, so the app derives an internal address like
`10987654@students.scholarshub.app`. No mail can ever reach it, so confirmations
must be disabled:

**Authentication → Sign In / Providers → Email →** switch **Confirm email** off.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API Keys**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Older projects: use the "anon public" key instead, it is also supported.
```

## 4. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, register a student, and you are in.

Useful scripts:

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # run the production build
npm run typecheck  # TypeScript, no emit
npm run lint       # ESLint
```

---

## Project layout

```
app/
  page.tsx                  landing page + pricing
  auth/login                sign in (student ID + password)
  auth/sign-up              registration (courses + live weekly total)
  dashboard/                profile, courses, weekly price, timetable
  channels/                 channel list + create channel
  channels/[id]/            notices, polls and voting
  actions/channels.ts       server actions: channel/post/vote/delete
  actions/timetable.ts      server actions: add/remove meeting
components/                 forms, header, timetable grid, poll block, ui/
lib/courses.ts              course catalogue, price rules, day/time helpers
lib/student-id.ts           student ID -> internal email mapping
lib/supabase/               browser client, server client, session proxy
supabase/schema.sql         full database schema + RLS policies
```

## Data model

```
profiles (id -> auth.users, student_id unique, full_name, school)
enrollments (profile_id, course_code)          -- max 3, enforced by trigger
courses (code, title, short_title, weekly_price)
channels (id, name, description, owner_id)
posts (id, channel_id, author_id, kind: notice|poll, body)
poll_options (id, post_id, label, position)
poll_votes (post_id, voter_id, option_id)      -- one vote per student per poll
timetable_entries (profile_id, course_code, day_of_week, start_time, end_time, location)
```

Security notes:

- The enrolment `INSERT` policy rejects a 4th course in pure SQL, and the form
  only offers three.
- Only a channel's owner can insert posts in it, and only a post's author can add
  its poll options.
- Votes are unique per `(post_id, voter_id)`; changing a vote is an upsert.
- Row-level security is enabled on every table; students can never read another
  student's enrolments or timetable.

## Deploy

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new) (or any Node host).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as
   environment variables.
4. In Supabase **Authentication → URL Configuration**, add your deployment URL
   to *Site URL* and *Redirect URLs*.

## Licence

MIT — see [LICENSE](LICENSE).
