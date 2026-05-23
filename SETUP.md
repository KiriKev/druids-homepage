# Setup — Email delivery for the brief modal

When a visitor submits the brief form on the Druids homepage, the
form POSTs to `/api/brief` (a Vercel Serverless Function). That
function sends the brief as an email to **kgermin@tuta.io** via
[Resend](https://resend.com).

Both services have free tiers that cover this site comfortably:

| | Vercel Hobby (free) | Resend free |
|---|---|---|
| Cost | €0 | €0 |
| Limits | 100k function invocations / month | 3,000 emails / month · 100 / day |
| Setup time | Already deployed | ~3 minutes |

## One-time setup

### 1. Create a Resend account + API key
1. Go to **https://resend.com** and sign up (email + password, or GitHub OAuth).
2. Once in the dashboard → **API Keys** → **Create API Key**.
3. Name it `druids-homepage`. Permission: **Sending access** is fine. Copy the key (starts with `re_…`).

### 2. Add the key to Vercel
1. Open the Vercel dashboard → your project → **Settings → Environment Variables**.
2. Add a new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** the `re_…` key you just copied
   - **Environments:** check **Production**, **Preview**, **Development** (all three)
3. Click **Save**.

### 3. Redeploy
Vercel applies new env vars on the next deploy. Either:
- Push any commit (even a no-op), or
- In the dashboard → **Deployments** → kebab on the latest one → **Redeploy**.

Done. Submit the form on the live site and check **kgermin@tuta.io** within a minute.

## Where the email comes from

The function sends from `Druids Brief <onboarding@resend.dev>` —
Resend's shared subdomain that works without any DNS setup.
Replies to the email route directly back to the visitor's address
(if they entered one) via the `Reply-To` header.

### Optional: send from your own domain
If you later want emails to come from `brief@druids.com` (or
whatever domain you set up):

1. In Resend → **Domains** → **Add Domain** → enter your domain.
2. Add the DNS records they show you (SPF, DKIM, DMARC) at your domain registrar.
3. Wait for verification (usually a few minutes).
4. Open `api/brief.js` and change the `from:` line to
   `'Druids Brief <brief@yourdomain.com>'`.
5. Push the change.

## Local development

`vercel dev` runs serverless functions locally:

```bash
npx vercel link        # one time, links this folder to your Vercel project
npx vercel env pull    # pulls RESEND_API_KEY into a local .env.local
npx vercel dev         # serves the static site + /api/brief on http://localhost:3000
```

If you just want to view the static site locally without testing
the form, the existing `npx http-server` setup is fine — the form
will fall back to a `mailto:` link if `/api/brief` returns an error.

## What lands in the inbox

```
From:    Druids Brief <onboarding@resend.dev>
Reply-To: <visitor's email if provided>
Subject: Druids brief — Animations

Service: Animations
What kind of animation?: Brand film
Approximate length: 1 – 3 minutes
Budget: €300 – €1,000
Email: client@example.com
X / Telegram: @clienthandle
Language: de

Description:
We need a 90-second brand film for our Q1 launch.
The product is a B2B SaaS for…
```

Plain text first, then the same content as HTML — readable in
Tutanota and any other client.

## Anti-spam

A hidden honeypot field (`website`) sits in the form. Real users
never see it; bots filling every field will trip it and their
submission is silently dropped (the API returns `200 OK` so the
bot thinks it succeeded). No CAPTCHA needed for this volume.
