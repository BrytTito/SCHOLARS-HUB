<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2563eb,50:3b82f6,100:1e3a8a&height=210&section=header&text=Scholars%20Hub&fontSize=76&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Weekly%20interactive%20study%20groups%20for%20Maths%20121%20%C2%B7%20Maths%20123%20%C2%B7%20Stats%20111&descAlignY=58&descSize=18" width="100%" alt="Scholars Hub" />

<a href="https://github.com/BrytTito/SCHOLARS-HUB">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=21&pause=1200&color=2563EB&center=true&vCenter=true&width=780&lines=Register+with+your+student+ID;Pick+1%E2%80%933+courses+%E2%86%92+GH%E2%82%B510+each+per+week;Broadcast+notices+and+run+polls;Build+your+own+weekly+timetable" alt="Typing SVG" />
</a>

<br/>

<a href="https://github.com/BrytTito/SCHOLARS-HUB/actions/workflows/ci.yml"><img src="https://github.com/BrytTito/SCHOLARS-HUB/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
<a href="https://github.com/BrytTito/SCHOLARS-HUB/releases"><img src="https://img.shields.io/github/v/release/BrytTito/SCHOLARS-HUB?style=flat-square&color=2563eb" alt="Release" /></a>
<img src="https://img.shields.io/github/last-commit/BrytTito/SCHOLARS-HUB?style=flat-square&color=3b82f6" alt="Last commit" />
<img src="https://img.shields.io/github/license/BrytTito/SCHOLARS-HUB?style=flat-square&color=1e3a8a" alt="License" />

<br/><br/>

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,vercel,nodejs,git&theme=light" alt="Tech stack" />

</div>

<br/>

<div align="center">

### 🎓 Register → 💸 See your weekly price → 📣 Join the channels → 🗓️ Plan your week

</div>

---

## ✨ What it does

<table>
<tr>
<td width="50%" valign="top">

### 📝 Registration
Students sign up with their **student ID, full name and school**, then choose **1–3 courses** from:

| Course | Code | Weekly price |
| :--- | :---: | ---: |
| Maths 121 | `MATH121` | **GH₵10.00** |
| Maths 123 | `MATH123` | **GH₵10.00** |
| Stats 111 | `STAT111` | **GH₵10.00** |

The **weekly total updates live** as courses are ticked — 2 courses = `GH₵20.00`, 3 = `GH₵30.00`.

</td>
<td width="50%" valign="top">

### 📣 Channels & polls
Every student can create a **broadcast channel**.
Only the owner publishes — exactly like a Telegram channel.

- 📢 Notices with author + timestamp
- 📊 Polls with 2–6 options
- ✅ One vote per student, changeable anytime
- 📈 Live counts and percentages

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🗓️ Personal timetable
Each student builds a **Mon–Sun calendar** of meeting days:

- Course, day, start and end time
- Optional venue
- Delete any entry in one click
- Enforced `end > start` at the database level

</td>
<td width="50%" valign="top">

### 🔐 Real accounts, real security
- Student ID doubles as the login name
- Postgres **row-level security on all 8 tables**
- A 4th course is rejected by the database, not just the UI
- Students can never read another student's timetable

</td>
</tr>
</table>

---

## 📸 Screens

<div align="center">

<table>
<tr>
<td align="center" width="50%">
<img src="docs/screenshots/dashboard.jpeg" width="100%" alt="Student dashboard" />
<br/><sub><b>Dashboard</b> — courses, weekly total, timetable, channels</sub>
</td>
<td align="center" width="50%">
<img src="docs/screenshots/channel-poll.jpeg" width="100%" alt="Channel with poll" />
<br/><sub><b>Channel</b> — broadcast form, notice and live poll results</sub>
</td>
</tr>
</table>

</div>

---

## 🧠 How it fits together

```mermaid
flowchart LR
    A[🎓 Student] -->|student ID + password| B[Supabase Auth]
    B --> C[profiles]
    C --> D[enrollments<br/>max 3 rows]
    D --> E[💸 weekly price<br/>count × GH₵10]
    C --> F[channels<br/>owner only]
    F --> G[posts<br/>notice or poll]
    G --> H[poll_options]
    G --> I[poll_votes<br/>1 per student]
    C --> J[timetable_entries]

    style A fill:#dbeafe,stroke:#2563eb
    style B fill:#e0f2fe,stroke:#0284c7
    style E fill:#fef3c7,stroke:#f59e0b
    style F fill:#ede9fe,stroke:#7c3aed
    style J fill:#dcfce7,stroke:#16a34a
```

<details>
<summary><b>Database schema (click to expand)</b></summary>

```sql
courses            (code PK, title, short_title, weekly_price)
profiles           (id PK → auth.users, student_id UNIQUE, full_name, school)
enrollments        (profile_id, course_code)            -- PK(profile_id, course_code)
channels           (id, name, description, owner_id → profiles)
posts              (id, channel_id, author_id, kind ∈ {notice, poll}, body)
poll_options       (id, post_id, label, position)
poll_votes         (post_id, voter_id, option_id)        -- PK(post_id, voter_id)
timetable_entries  (id, profile_id, course_code, day_of_week, start_time, end_time, location)
```

Security highlights:

- `enrollments` INSERT policy refuses a 4th row: `(select count(*) … ) < 3`
- Only a channel owner may `INSERT` into `posts` for that channel
- Only a poll's author may add its `poll_options`
- Votes upsert on `(post_id, voter_id)`, so changing your mind works
- RLS enabled on every table, with `auth.uid()` checks throughout

</details>

---

## 🚀 Quick start

<table>
<tr><td><b>1 · Supabase</b></td></tr>
<tr><td>

Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard), open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and run it.

</td></tr>
<tr><td><b>2 · Turn off email confirmation</b></td></tr>
<tr><td>

**Authentication → Sign In / Providers → Email → Confirm email = OFF**, then save.

> Student IDs have no inbox, so the app derives an internal address such as
> `10987654@students.scholarshub.app`. Never leave confirmation on — signups
> would create the user but never a session.

</td></tr>
<tr><td><b>3 · Environment</b></td></tr>
<tr><td>

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

</td></tr>
<tr><td><b>4 · Run</b></td></tr>
<tr><td>

```bash
npm install
npm run dev      # http://localhost:3000
```

</td></tr>
</table>

| Script | Does |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the build |
| `npm run typegen` | Generate Next.js route types |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

---

## 🌳 Branches & releases

| Branch | Purpose |
| :--- | :--- |
| `main` | Production-ready code, tagged on every release |
| `develop` | Integration branch for the next release |
| `feature/*` | Short-lived work branches, merged into `develop` |
| `fix/*` | Bug fixes |

```bash
git checkout develop
git checkout -b feature/my-change
# ...work, commit...
git checkout develop && git merge --no-ff feature/my-change
git checkout main && git merge --ff-only develop
git tag -a v1.1.0 -m "v1.1.0" && git push origin main --tags
```

### Releases

| Tag | Date | Highlights |
| :--- | :--- | :--- |
| [`v1.0.0`](https://github.com/BrytTito/SCHOLARS-HUB/releases/tag/v1.0.0) | 14 Nov 2026 | First release — registration + pricing, channels with polls, personal timetable, RLS, CI |

---

## ☁️ Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBrytTito%2FSCHOLARS-HUB&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

1. Import the repo into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. In Supabase → **Authentication → URL Configuration**, add your Vercel domain.

---

## 🗺️ Roadmap

### Shipped in v1.0.0

- [x] Student ID registration with live weekly pricing
- [x] Broadcast channels, notices and polls with live results
- [x] Personal Mon–Sun timetable
- [x] Row-level security + CI

### Next

- [ ] Change / re-select courses after registration, and edit your profile
- [ ] Privacy notice, terms and a privacy-aware data model — the app stores student IDs and emails
- [ ] WhatsApp-style member chat inside channels (membership, replies, unread, realtime)
- [ ] Admin dashboard listing all registrations and weekly revenue
- [ ] Mobile payments (MoMo) for weekly renewals and expiring-subscription reminders
- [ ] Tests and a test job in CI — there are currently none, so nothing guards a payment change

### Full plan

**[`docs/ROADMAP.md`](docs/ROADMAP.md)** holds the detailed, code-grounded plan: 16 gaps found in
the current code, eight phases with acceptance criteria, the schema additions each phase needs,
six decisions to make before starting, and a suggested first week. Read it before opening a PR
on any of the items above.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1e3a8a,50:3b82f6,100:2563eb&height=120&section=footer" width="100%" alt="footer" />

<sub>Built with Next.js · React · TypeScript · Tailwind CSS · Supabase · shadcn/ui</sub>

<br/>

<a href="https://github.com/BrytTito/SCHOLARS-HUB/issues">🐛 Report a bug</a> ·
<a href="https://github.com/BrytTito/SCHOLARS-HUB/issues">💡 Request a feature</a> ·
<a href="https://github.com/BrytTito/SCHOLARS-HUB">⭐ Star the repo</a>

</div>
