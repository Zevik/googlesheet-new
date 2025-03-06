import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// טעינת משתני סביבה מקובץ .env אם קיים
dotenv.config();

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
});
