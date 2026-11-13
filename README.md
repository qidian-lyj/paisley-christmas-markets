# Paisley Christmas Markets — proof of concept

COMP10020 Internet Technologies · Coursework 2 · proof-of-concept site

A German-style Christmas market web app for the fictional "Paisley Christmas
Markets" group. Visitors browse the market programme and stallholders; traders
register and apply online; administrators review applications and maintain the
site. The design follows a **generic pattern** — swap the theme and seed data
and the same app serves any seasonal market (summer fair, food festival, etc.).

## Tech stack

| Layer     | Choice                     | Why                                                        |
| --------- | -------------------------- | ---------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router) + TypeScript | Server rendering for public pages, one codebase for UI + logic |
| Styling   | Tailwind CSS v4            | Fast, consistent visual system                             |
| Database  | Supabase (PostgreSQL)      | Free managed Postgres with Row Level Security              |
| Auth      | Supabase Auth              | Email/password login, trader vs admin roles                |
| Hosting   | Vercel (planned)           | Free tier, GitHub push-to-deploy, built-in analytics       |

## PoC features

- **Public**: market info on the home page, events programme, approved trader
  directory grouped by category.
- **Traders**: register / log in, submit a stall application (validated and
  stored in PostgreSQL), track its status on the account page.
- **Admin**: review pending applications, approve (auto-publishes a stall
  listing) or decline, publish/hide/remove stalls, add and delete programme
  events.
- **Security**: all data access goes through Postgres Row Level Security
  policies (see `supabase/schema.sql`) — applicants can only read their own
  data, only admins can review, and role changes are locked down with a
  database trigger. This doubles as the GDPR story for the report.

## Getting started

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) (free plan) and create a new
project.

### 2. Create the schema

Open **SQL Editor** in the Supabase dashboard, paste the contents of
[`supabase/schema.sql`](./supabase/schema.sql) and run it. This creates all
tables, Row Level Security policies, a signup trigger and seed data (a market,
events, stalls and two demo applications).

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Run

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

### 5. Create the admin account

1. Register an account through the app (e.g. `admin@example.com`).
2. Promote it in the Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

3. Log in again — the Admin link appears in the header.

> Tip for the demo: under **Authentication → Sign In / Providers**, turn off
> **Confirm email** while developing so signups log in immediately. Turn it
> back on before the final deployed version (and mention it in the GDPR
> section of the report).

### 6. Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel, import the repo and add the two `NEXT_PUBLIC_*` variables.
3. Deploy. Add the Vercel domain to **Authentication → URL Configuration**
   in Supabase so login works on the deployed site.

## Project structure

```
app/
  page.tsx              # home — market info, trader call-to-action
  events/page.tsx       # programme (public)
  traders/page.tsx      # approved stall directory (public)
  apply/                # trader application form + server action
  login/ register/      # auth screens
  account/page.tsx      # trader's own applications + status
  admin/                # layout guard + applications / stalls / events
components/             # header, footer, form, badges
lib/
  supabase/             # browser client, server client, proxy session helper
  types.ts              # shared TypeScript types
  auth-actions.ts       # sign in / sign up / sign out server actions
proxy.ts                # Next.js proxy: refreshes Supabase sessions, guards /account
supabase/schema.sql     # full database schema + RLS + seed data
docs/image-credits.md   # author + licence for every stall photo (Wikimedia Commons)
docs/report-outline.md  # map from the report sections to code in this repo
```

## Team

Group submission — see the report cover for member names and contribution
split.
