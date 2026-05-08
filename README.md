# Trip.ly

AI trip planner — flights to 150 countries, nearby places, jeep road trips.

## Stack
Next.js 15 · Tailwind · Supabase (auth + DB) · Anthropic Claude · Google Maps · Vercel

## Setup

1. `npm install`
2. Copy `.env.local.example` → `.env.local` and fill keys
3. Run `supabase/schema.sql` in Supabase SQL editor
4. `npm run dev`

## Env vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (e.g. https://tripmly.vercel.app)

## Deploy
`vercel --prod`
