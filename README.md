# JLabs: Basic Assessment Exam

## Tech Stack

Next.js 15 • React 19 • TailwindCSS • Neon PostgreSQL • Better Auth • Leaflet

## Setup

1. **Install:**
   ```bash
   cd exam
   pnpm install
   ```

2. **Create `.env`:**
   ```env
   DATABASE_URL=your_neon_database_url
   BETTER_AUTH_SECRET=your_secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Seed database:**
   ```bash
   npx tsx src/db/seed.ts
   ```
   Test user: `test@example.com` / `password123`

4. **Run:**
   ```bash
   pnpm run dev
   ```