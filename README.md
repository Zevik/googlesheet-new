# אתר מבוסס Google Sheets

מערכת לניהול אתרים מרובים המבוססים על גיליונות Google Sheets.

## דרישות מערכת

- Node.js 18 ומעלה
- מסד נתונים PostgreSQL (ניתן להשתמש ב-Neon, Supabase, Railway או Render)

## התקנה מקומית

1. התקן את התלויות:
```bash
npm install
```

2. צור קובץ `.env` בתיקיית הפרויקט והוסף את מחרוזת החיבור למסד הנתונים:
```
DATABASE_URL=postgresql://username:password@hostname/database
```

3. צור את הטבלאות במסד הנתונים:
```bash
npm run db:push
```

4. הפעל את השרת המקומי:
```bash
npm run dev
```

## פריסה בנטליפיי

1. צור חשבון ב-[Neon](https://neon.tech/) והקם מסד נתונים PostgreSQL.

2. העתק את מחרוזת החיבור למסד הנתונים.

3. בנטליפיי, הוסף משתנה סביבה:
   - Key: `DATABASE_URL`
   - Value: מחרוזת החיבור שקיבלת מ-Neon

4. פרוס את האתר בנטליפיי:
```bash
git push
```

## שימוש במערכת

1. גש לכתובת `/admin` באתר שלך כדי להיכנס לממשק הניהול.
2. צור אתר חדש עם מזהה ייחודי, שם, תיאור וכתובת גיליון Google Sheets.
3. לאחר יצירת האתר, תוכל לגשת אליו בכתובת `/sites/{siteId}`.

## מבנה הפרויקט

- `client/src` - קוד צד לקוח (React)
- `server` - קוד צד שרת (Express)
- `shared` - קוד משותף (סכמות, טיפוסים)
- `drizzle` - קבצי מיגרציה למסד הנתונים 