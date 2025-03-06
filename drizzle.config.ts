import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// טעינת משתני סביבה מקובץ .env אם קיים
dotenv.config();

// קבלת מחרוזת החיבור למסד הנתונים מהסביבה או שימוש בפרמטרים נפרדים
const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: connectionString
    ? { connectionString }
    : {
        // פרמטרים נפרדים למקרה שאין מחרוזת חיבור
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
});
