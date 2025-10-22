import 'dotenv/config'

const config = {
  schema: './src/db/schema/auth-schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
}

export default config
