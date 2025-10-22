import { defineConfig } from "drizzle-kit";
import 'dotenv/config'

export default defineConfig({
  dialect: 'postgresql', // 'mysql' | 'sqlite' | 'turso'
  schema: './src/db/schema/auth-schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
