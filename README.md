# Hayati: private matchmaking for San Diego's Arab and Chaldean community

Members fill out a private questionnaire. Only your team can see profiles. The AI suggests compatible pairs, and a person approves every introduction.

## What's inside

| Part | Where |
|---|---|
| Site name, contact email, tagline | `src/lib/config.ts` |
| Every questionnaire question | `src/lib/questionnaire.ts` |
| Dealbreaker rules and AI matching | `src/lib/matching.ts` |
| Database and security rules | `supabase/schema.sql` |
| Member pages | `src/app/` (`page.tsx`, `signup`, `login`, `questionnaire`, `dashboard`) |
| Team (admin) pages | `src/app/admin/` |
| Privacy Policy and Terms (drafts, need lawyer review) | `src/app/privacy`, `src/app/terms` |

## How matching works

1. **Dealbreakers first (free, instant).** Gender, both people's age ranges, faith requirements, children plans, smoking, drinking, previous marriage, background preference, distance. Checked in both directions.
2. **Quick score.** Compares values, faith practice, timeline, personality and interests to pick the 8 most promising people.
3. **AI review.** Claude reads both questionnaires and returns a score, a short summary, strengths and concerns. **Names, emails, phone numbers, exact birthdates and "notes for the matchmaker" are never sent to the AI.**
4. **You decide.** Every suggestion lands as "suggested." You approve, reject, contact, introduce, and track it.

---

## Setup, step by step (about 45 minutes, no coding)

### 1. Supabase (database and logins)
1. Go to **supabase.com** and sign in with your business Gmail. Click **New project**.
2. Name it `hayati`, choose a strong database password (save it somewhere safe), and pick region **West US**.
3. When it finishes, open **SQL Editor** in the left menu, click **New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**. You should see "Success."
4. Go to **Project Settings > API** and copy two values: the **Project URL** and the **anon public** key.

### 2. Anthropic (the AI)
1. Go to **console.anthropic.com**, sign in, and add **$5** of credit under Billing.
2. Go to **API Keys**, click **Create key**, and copy it. **Treat this like a password.** Never post it or put it in the code.

### 3. Put the code on GitHub and deploy
1. Create a free account at **github.com** and a new **private** repository called `hayati`.
2. Upload this project to it (or send your username to Claude and it can push the code for you).
3. Go to **vercel.com**, sign in with GitHub, click **Add New > Project**, and pick the `hayati` repo.
4. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
   - `ANTHROPIC_API_KEY` = your Anthropic key
5. Click **Deploy**. In about two minutes you get a link like `hayati.vercel.app`.
6. Back in Supabase, go to **Authentication > URL Configuration**. Set **Site URL** to that link and add `https://YOUR-LINK/auth/callback` under **Redirect URLs**.

> Vercel's free plan is for non-commercial use. It's fine while you build and test. Before you charge members or launch publicly, upgrade to Vercel Pro (about $20/month) or move hosting to Cloudflare.

### 4. Make yourself the admin
1. Open your site, click **Apply**, and sign up with your own email. Confirm the email.
2. In Supabase **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Refresh the site. You'll see **Admin** in the top menu. Repeat for any partner on your team.

### 5. Connect your domain (when you buy it)
In Vercel: **Project > Settings > Domains > Add** `meethayati.com`, then follow the DNS instructions it shows in Namecheap. Update the Supabase Site URL and Redirect URL to the new domain.

### 6. Test before launch
Sign up 4 to 6 test accounts (friends or extra emails) with different answers, submit their questionnaires, then open one in **Admin** and click **Find matches with AI**.

---

## Common changes

- **Rename the site:** edit `name` in `src/lib/config.ts`.
- **Add or edit a question:** edit `src/lib/questionnaire.ts`. Never change a question's `id` after launch; change its `label` instead.
- **Member can't edit after submitting:** that's on purpose. On their admin page, click "Unlock questionnaire."

## Before you launch publicly

- [ ] Lawyer reviews the Privacy Policy and Terms (you hold faith and background data, which California treats as sensitive)
- [ ] Set up a custom email sender in Supabase so signup emails come from your domain (the built-in sender is rate limited)
- [ ] Upgrade hosting off the free hobby plan
- [ ] Supabase Pro ($25/month) for daily backups and so the project never pauses

## Running it on your own computer (optional)
Install Node.js 20+, copy `.env.example` to `.env.local` and fill it in, then run `npm install` and `npm run dev`, and open http://localhost:3000.
