import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// טעינת משתני סביבה מקובץ .env אם קיים
dotenv.config();

export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
} satisfies Config;
