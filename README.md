# AI Architecture Awards 2026

A submission platform for the AI Architecture Awards — built with React, Vite, Supabase, Stripe, and Claude.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Auth & Database:** Supabase (Auth, Postgres, Storage)
- **Payments:** Stripe Checkout
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`)
- **Email:** Nodemailer (SMTP)
- **3D:** Three.js + React Three Fiber
- **Deployment:** Vercel

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the env example and fill in your keys:
   ```
   cp .env.example .env
   ```
   Required:
   - `VITE_SUPABASE_URL` — from your Supabase project settings
   - `VITE_SUPABASE_ANON_KEY` — from your Supabase project settings
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
   - `STRIPE_SECRET_KEY` — from Stripe Dashboard (optional, simulated in dev)
   - `SMTP_*` — SMTP credentials for email (optional)

3. Run the app:
   ```
   npm run dev
   ```

## Deployment

Deploy to Vercel — all API routes in `/api` are automatically served as serverless functions.
