# Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **API Keys**: Gather all required API keys

## Step 1: Set Up Supabase

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the migration from `supabase/migrations/001_initial.sql`
4. Copy your Supabase URL and anon key from Settings > API

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

## Step 3: Configure Environment Variables

### Supabase Variables (Auto-synced via Integration)

If you've installed the Vercel integration in your Supabase project, the following variables are automatically synced:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You can verify these in Vercel dashboard > Settings > Environment Variables.

### Third-Party API Keys (Add Manually in Vercel)

Go to your Vercel project > Settings > Environment Variables and add these manually:

```
LINEAR_API_KEY=your_linear_api_key
HUBSPOT_API_KEY=your_hubspot_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Where to get these keys:**
- **LINEAR_API_KEY**: Linear → Settings → API → Create Personal API Key
- **HUBSPOT_API_KEY**: HubSpot → Settings → Integrations → Private Apps → Create a private app
- **ANTHROPIC_API_KEY**: Anthropic Console → API Keys → Create Key

**Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit API keys to your repository
- Use Vercel's environment variable encryption
- Set the appropriate environment scope (Production, Preview, Development) for each variable

## Step 4: Deploy

1. After adding environment variables, trigger a new deployment
2. Wait for the build to complete
3. Visit your deployment URL

## Step 5: Test Deployment

1. Visit your deployed site
2. Test the report page: `/report`
3. Create a test board at `/admin`
4. View the board at `/view/[boardId]`

## Troubleshooting

### Build Errors

- Check that all environment variables are set
- Verify Node.js version (should be 18+)
- Check build logs in Vercel dashboard

### Runtime Errors

- Check browser console for client-side errors
- Check Vercel function logs for API route errors
- Verify all API keys are correct

### Database Errors

- Ensure Supabase migration was run successfully
- Check Supabase connection from Vercel
- Verify RLS (Row Level Security) policies if using them

## Post-Deployment

1. Set up a custom domain (optional)
2. Configure Supabase RLS policies if needed
3. Set up monitoring/error tracking
4. Configure backup strategy for Supabase

