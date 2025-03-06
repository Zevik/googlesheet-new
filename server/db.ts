import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// קבלת מחרוזת החיבור למסד הנתונים מהסביבה
const connectionString = process.env.DATABASE_URL;

// יצירת חיבור למסד הנתונים
const sql = connectionString ? neon(connectionString) : null;

// יצירת מופע של Drizzle עם הסכמה
export const db = sql ? drizzle(sql, { schema }) : null;

// פונקציה לבדיקת חיבור למסד הנתונים
export const testConnection = async () => {
  if (!db) {
    throw new Error('Database connection not initialized. Make sure DATABASE_URL is set.');
  }
  
  try {
    // ניסיון לבצע שאילתה פשוטה
    const result = await sql`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}; 