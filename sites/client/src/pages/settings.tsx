import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import useGoogleSheets from '@/hooks/useGoogleSheets';
import { setCurrentSheetUrl } from '@/lib/googleSheetsUtils';

const Settings: React.FC = () => {
  const { getSetting, isLoading, hasError, errors, refreshData } = useGoogleSheets();
  const { toast } = useToast();
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [, setLocation] = useLocation();

  // הגדר את הערך ההתחלתי של ה-URL מ-localStorage ישירות
  useEffect(() => {
    // קריאה ישירות מ-localStorage ולא דרך ההגדרות (settings)
    const savedUrl = localStorage.getItem('sheetsURL');
    if (savedUrl) {
      setSheetUrl(savedUrl);
      console.log('Loaded sheet URL from localStorage:', savedUrl);
    } else {
      // אם אין URL שמור, שים URL ברירת מחדל
      const defaultUrl = 'https://docs.google.com/spreadsheets/d/1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI/edit';
      setSheetUrl(defaultUrl);
      console.log('No saved URL found, using default:', defaultUrl);
    }
  }, []);

  // חלץ את מזהה הגיליון מ-URL
  const extractSheetId = (url: string): string | null => {
    const regex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // שמור URL מקומית ובמערכת
  const saveSheetUrl = async () => {
    // וודא שזה URL תקין של גוגל שיטס
    const sheetId = extractSheetId(sheetUrl);
    
    if (!sheetId) {
      toast({
        title: "שגיאה",
        description: "כתובת לא תקינה של גיליון Google Sheets",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // יצירת קישור נקי מפרמטרים מיותרים
      const cleanUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      
      // שמור את ה-URL בספריית googleSheetsUtils (שכבר שומרת גם ב-localStorage)
      setCurrentSheetUrl(cleanUrl);
      
      toast({
        title: "נשמר בהצלחה",
        description: "כתובת גיליון הנתונים עודכנה. מרענן נתונים...",
      });

      // רענן את הנתונים מהמקור החדש
      if (refreshData) {
        await refreshData(cleanUrl);
      }
      
      // רענון מיידי והנחתה חזרה לדף הבית
      // גלישה ישירה במקום setTimeout
      window.location.href = '/?reload=' + new Date().getTime(); // רענון מלא כדי לוודא שהשינויים חלים
    } catch (error) {
      console.error("Error saving sheet URL:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת כתובת הגיליון",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-error mr-2">error</span>
            <h2 className="text-xl font-medium text-neutral-800">שגיאה בטעינת נתונים</h2>
          </div>
          <div className="text-sm text-neutral-500">
            <p>חלה שגיאה בעת טעינת נתונים מגוגל שיטס. אנא נסה שוב מאוחר יותר.</p>
            <pre className="bg-neutral-50 p-2 rounded mt-2 text-xs overflow-x-auto">
              {errors.map(error => error?.message).join('\n')}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">הגדרות מקור נתונים</CardTitle>
          <CardDescription>
            הזן את כתובת גיליון Google Sheets ממנו יוצגו הנתונים באתר
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="sheetUrl" className="block text-sm font-medium text-neutral-700 mb-1">
                כתובת גיליון הנתונים
              </label>
              <Input
                id="sheetUrl"
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full"
              />
              <p className="mt-2 text-sm text-neutral-500">
                העתק את הכתובת המלאה של גיליון הנתונים מדפדפן האינטרנט שלך
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded">
              <h3 className="text-lg font-medium text-blue-800 mb-2">הנחיות ומידע</h3>
              <ul className="list-disc list-inside space-y-2 text-blue-700">
                <li>הגיליון חייב להיות משותף לצפייה (לפחות למי שיש את הקישור)</li>
                <li>ודא שבגיליון קיימים כל 5 הלשוניות הדרושות: main_menu, pages, content, settings, templates</li>
                <li>כל לשונית חייבת לכלול את כל השדות הנדרשים בשורת הכותרת</li>
                <li>שינוי הגיליון יגרום לרענון מיידי של הנתונים באתר</li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
          >
            ביטול
          </Button>
          
          <Button
            onClick={saveSheetUrl}
            disabled={isSaving || !sheetUrl}
          >
            {isSaving ? (
              <>
                <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                שומר...
              </>
            ) : 'שמור והחל'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings;