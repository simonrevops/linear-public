# Linear Public Portal

An internal tool for sharing Linear projects and roadmaps with internal stakeholders without requiring Linear seats. Similar to Lindie.app and Linear.gratis, but focused on internal use cases.

## Features

- **Property-based Board Views**: Group issues by properties for both rows and columns (like Linear's internal views)
- **Project Selection**: Automatically discover projects tagged with "public" label
- **Issue Reporting**: Chatbot interface for reporting issues with HubSpot team context
- **Comments**: Bidirectional comment sync with Linear
- **Real-time Updates**: Automatic polling and cache invalidation

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Deployment**: Vercel (Next.js) + Supabase Cloud
- **Integrations**: 
  - Linear API (GraphQL)
  - HubSpot API (REST)
  - Anthropic API (Claude for chatbot)

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Linear API key
- HubSpot API key (optional, for team lookup)
- Anthropic API key (for chatbot)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd linear-public
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Linear
LINEAR_API_KEY=your_linear_api_key

# HubSpot
HUBSPOT_API_KEY=your_hubspot_api_key

# Anthropic (for chatbot)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the migration: `supabase/migrations/001_initial.sql`
   - Or use Supabase CLI: `supabase db push`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Board

1. Visit `/admin` to create a new board
2. Configure row/column grouping properties
3. Select projects (or leave empty to include all "public" projects)
4. Optionally set a password for protection
5. Share the board link: `/view/[boardId]`

### Reporting Issues

1. Visit `/report`
2. Enter your email (will lookup team from HubSpot)
3. Chat with the RevOps assistant
4. Issues are automatically created in Linear with proper classification

### Viewing Boards

- Public boards: `/view/[boardId]`
- Password-protected boards will prompt for password
- Boards auto-refresh every 30 seconds

## Project Structure

```
linear-public/
├── app/
│   ├── (public)/
│   │   ├── view/[boardId]/    # Board view page
│   │   ├── report/             # Issue reporting chatbot
│   │   └── admin/              # Board configuration
│   ├── api/
│   │   ├── linear/             # Linear API routes
│   │   ├── chatbot/            # Chatbot API routes
│   │   └── auth/               # Authentication routes
│   └── layout.tsx
├── components/
│   ├── Board/                   # Board view components
│   ├── IssueCard/               # Issue card and comments
│   └── Chatbot/                 # Chatbot UI components
├── lib/
│   ├── linear/                  # Linear API client
│   ├── hubspot/                 # HubSpot API client
│   ├── chatbot/                 # Chatbot logic
│   └── supabase/                # Supabase client
└── supabase/
    └── migrations/              # Database migrations
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINEAR_API_KEY`
- `HUBSPOT_API_KEY`
- `ANTHROPIC_API_KEY`

## License

MIT
