# Study Companion

Study Companion is a Next.js 16 web app that turns assignment prompts into guided study plans. Students can sign in, submit coursework prompts, and get structured help powered by OpenAI without receiving full completed work.

## Features

- Email/password authentication with server-side session cookies
- OpenAI-powered assignment breakdowns with anti-cheating guardrails
- Free-tier upload limits with premium unlocks
- Lemon Squeezy checkout for premium access
- Saved assignments for premium users
- Prisma ORM connected to Supabase Postgres
- Vercel-ready App Router deployment

## Tech Stack

- Next.js 16.2.4
- React 19.2.4
- Prisma
- Supabase Postgres
- Lemon Squeezy
- OpenAI Node SDK
- Tailwind CSS v4

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` using `.env.example`.

3. Generate the Prisma client:

   ```bash
   npx prisma generate
   ```

4. Push the schema to your Supabase database:

   ```bash
   npx prisma db push
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## Environment Variables

Use the following variables in `.env.local` and in Vercel:

```env
OPENAI_API_KEY=your_openai_api_key

DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_VARIANT_ID=your_variant_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Setup

1. Create a Supabase project.
2. Open `Project Settings -> Database`.
3. Copy the pooled connection string into `DATABASE_URL`.
4. Copy the direct connection string into `DIRECT_URL`.
5. Run `npx prisma db push`.

The Prisma schema is in [prisma/schema.prisma](/c:/Users/johnp/OneDrive/Desktop/study-companion-master2/prisma/schema.prisma).

## Lemon Squeezy Setup

1. Create a product and variant in Lemon Squeezy.
2. Generate a Lemon Squeezy API key.
3. Add `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, and `LEMON_SQUEEZY_VARIANT_ID`.
4. Create a webhook pointed at:

   ```text
   https://your-domain.com/api/webhooks/lemonsqueezy
   ```

5. Copy the signing secret into `LEMON_SQUEEZY_WEBHOOK_SECRET`.
6. Successful purchases redirect users to `/payment/success`, and the webhook upgrades their account.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables from `.env.local`.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel production domain, for example `https://study-companion.vercel.app`.
5. Deploy.
6. Update the Lemon Squeezy webhook URL to the production domain after the first deploy if needed.

## Verification

Run these before shipping:

```bash
npx prisma generate
npm run lint
npm run build
```

## Project Notes

- [proxy.js](/c:/Users/johnp/OneDrive/Desktop/study-companion-master2/proxy.js) handles protected route redirects for Next.js 16.
- [app/api/billing/checkout/route.js](/c:/Users/johnp/OneDrive/Desktop/study-companion-master2/app/api/billing/checkout/route.js) creates Lemon Squeezy checkout sessions.
- [app/api/webhooks/lemonsqueezy/route.js](/c:/Users/johnp/OneDrive/Desktop/study-companion-master2/app/api/webhooks/lemonsqueezy/route.js) verifies webhook signatures and upgrades premium users.
