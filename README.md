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
- SQLite + Prisma database backend
- Stripe checkout integration for premium account upgrades
- Saved assignments stored per user
- OpenAI `gpt-4o-mini` breakdown generation

## Tech Stack

- Next.js 16.2.4
- React 19.2.4
- Prisma + SQLite
- Stripe payments
- Tailwind CSS v4
- OpenAI Node SDK

## Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/<your-username>/study-companion.git
   cd study-companion
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create an `.env.local` file with the values below.

4. Generate Prisma client and initialize the database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open the app:

   ```
   http://localhost:3000
   ```

## Environment Variables

Create `.env.local` at the project root with:

```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=file:./dev.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `.env.local` and `.env` are ignored by Git.

## Database

This project uses Prisma with SQLite.

- schema: `prisma/schema.prisma`
- local database file: `dev.db`
- user accounts, sessions, and assignments are stored in the database

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
   git commit -m "Add Prisma database and Stripe payment flow"
   ```

3. Push to GitHub:

   ```bash
   git push origin main
   ```
