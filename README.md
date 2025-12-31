# 2026 Vision Board

A beautiful, minimalist goal tracker for your 2026 aspirations. Built with Next.js 14, Tailwind CSS, Framer Motion, and Supabase.

## Features

- Aesthetic minimalist design with paper texture background
- Drag and drop Bento Grid layout
- Google and Email authentication
- Monochrome confetti celebration on goal completion
- Handwritten font for goal titles
- Fully responsive design

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **Backend/Auth:** Supabase

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication > Providers
4. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy to Vercel:

```bash
vercel
```

Remember to add your environment variables in Vercel's project settings.

## License

MIT
