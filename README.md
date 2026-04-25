# Study Companion

A Next.js study helper that converts assignment prompts into a guided plan using OpenAI.

## What it does

- sign-in and sign-up gated access
- free users get a limited number of assignment uploads
- premium users get unlimited uploads and saved assignment tracking
- Stripe checkout for real premium upgrades
- OpenAI-powered task breakdowns with student-friendly hints

## Features

- React UI in `app/page.js`
- App Router auth guard via `middleware.js`
- PostgreSQL + Prisma database backend (Supabase)
- Stripe checkout integration for premium account upgrades
- Saved assignments stored per user
- OpenAI `gpt-4o-mini` breakdown generation

## Tech Stack

- Next.js 16.2.4
- React 19.2.4
- Prisma + PostgreSQL (Supabase)
- Stripe payments
- Tailwind CSS v4
- OpenAI Node SDK

## Local Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/<your-username>/study-companion.git
   cd study-companion
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create an `.env.local` file with the values from `.env`.

4. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

5. Push the schema to the database. For Supabase, use the **direct connection** (port `5432`) when running migrations:

   ```bash
   # Temporarily switch DATABASE_URL to port 5432 for this command
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npx prisma db push
   ```

   The app runtime continues using the pooler URL (port `6543`) for normal queries.

6. Start the dev server:

   ```bash
   npm run dev
   ```

7. Open the app:

   ```
   http://localhost:3000
   ```

## Environment Variables

Create `.env.local` at the project root with:

```env
# Supabase — use the connection pooler (port 6543) for app queries
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `.env.local` and `.env` are ignored by Git. The `.env` file in this repo is a commented template only.

## Database

This project uses Prisma with **PostgreSQL via Supabase**.

- schema: `prisma/schema.prisma`
- user accounts, sessions, and assignments are stored in the database
- `DATABASE_URL` should point to Supabase's **connection pooler** (port `6543`) for normal app queries
- For Prisma migrations (`npx prisma db push`), use the **direct connection** (port `5432`) or the migration will hang
- SSL certificate verification is handled automatically in `lib/prisma.js` for cloud-hosted databases

## Deploying to Vercel

1. Push your code to GitHub.
2. Import the repository in the [Vercel Dashboard](https://vercel.com).
3. Add all environment variables listed above in **Project Settings → Environment Variables**.
4. For `DATABASE_URL`, use the **connection pooler** string from Supabase (port `6543`).
5. Run `npx prisma db push` locally against the **direct connection** (port `5432`) to set up the database before deploying.
6. Deploy. Vercel will run `prisma generate` automatically via the `postinstall` script.

> After changing the schema, run `npx prisma db push` locally against the direct connection, then redeploy.

## Payment Flow

- Users start checkout from the app
- Stripe creates a checkout session
- After successful payment, the webhook updates the user to premium
- Premium users gain unlimited uploads and saved assignment tracking

## Usage

- Sign up or log in
- Enter an assignment prompt
- Click `Break it down ↗`
- Free users can use a limited number of uploads
- Premium users can save assignment results

## GitHub Push Instructions

1. Add files:

   ```bash
   git add .
   ```

2. Commit changes:

   ```bash
   git commit -m "Configure for Vercel + Supabase deployment"
   ```

3. Push to GitHub:

   ```bash
   git push origin main
   ```
