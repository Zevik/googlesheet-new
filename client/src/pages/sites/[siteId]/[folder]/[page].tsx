import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import ContentBlock from '@/components/ContentBlock';
import useGoogleSheets from '@/hooks/useGoogleSheets';
import useSites from '@/hooks/useSites';
import { Card, CardContent } from '@/components/ui/card';

const SiteContentPage: React.FC = () => {
  const params = useParams<{ siteId: string; folder: string; page: string }>();
  const [location] = useLocation();
  
  const siteId = params?.siteId;
  const folderSlug = params?.folder;
  const pageSlug = params?.page;
  
  // קבלת פרטי האתר
  const { getSite } = useSites();
  const { data: site, isLoading: isSiteLoading } = getSite(siteId);
  
  // קבלת נתוני הגיליון
  const { 
    getFolderBySlug, 
    getPageBySlug, 
    getPageContent, 
    content: allContent,
    isLoading, 
    hasError, 
    errors,
    getSetting,
    updateSheetUrl
  } = useGoogleSheets(siteId);
  
  // עדכון ה-URL של הגיליון כאשר האתר נטען
  useEffect(() => {
    if (site?.sheetUrl) {
      updateSheetUrl(site.sheetUrl);
    }
  }, [site, updateSheetUrl]);
  
  // קבל את הגדרות הסגנון כדי שנוכל להשתמש בהן בהמשך
  const headingColor = getSetting('headingColor') || '#333333';
  const contentSpacing = getSetting('contentSpacing') || '24px';
  const pageWidth = getSetting('pageWidth') || '80%';
  
  // גלילה לראש העמוד כשמשתנה ה-URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
  
  const folder = getFolderBySlug(folderSlug);
  const page = getPageBySlug(pageSlug);
  
  // במקום להשתמש ב-state, נחשב את התוכן ישירות מהשאילתות
  // זה מונע עדכון אינסופי
  const content = React.useMemo(() => {
    if (page && page.id) {
      // המרה ל-string במקרה שה-ID מגיע כמספר מה-API
      const pageIdStr = String(page.id);
      
      // השתמש בפונקציה שכבר מטפלת בכל ההמרות והנורמליזציה
      const filteredContent = getPageContent(pageIdStr);
      
      // אם לא נמצא תוכן וזהו אחד מהעמודים שיודעים שיש להם בעיה, נייצר תוכן זמני
      if (filteredContent.length === 0) {
        console.warn(`No content found for page ID: ${pageIdStr}`);
      }
      
      return filteredContent;
    }
    return [];
  }, [page, getPageContent]);
  
  if (isSiteLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  
  if (!site) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-error mr-2">error</span>
            <h2 className="text-xl font-medium text-neutral-800">האתר לא נמצא</h2>
          </div>
          <div className="text-sm text-neutral-500">
            <p>האתר המבוקש לא נמצא. אנא בדוק את הכתובת ונסה שוב.</p>
          </div>
        </CardContent>
      </Card>
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
  
  if (!folder || !page) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-error mr-2">error</span>
            <h2 className="text-xl font-medium text-neutral-800">העמוד לא נמצא</h2>
          </div>
          <div className="text-sm text-neutral-500">
            <p>העמוד המבוקש לא נמצא. אנא בדוק את הכתובת ונסה שוב.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // עדכון כותרת הדף
  useEffect(() => {
    if (page && site) {
      document.title = `${page.page_name} | ${site.name}`;
    }
  }, [page, site]);
  
  return (
    <div className="space-y-8" style={{ maxWidth: pageWidth, margin: '0 auto' }}>
      <div className="flex items-center space-x-2 mb-2">
        <a href={`/sites/${siteId}`} className="text-primary hover:underline">
          {site.name}
        </a>
        <span className="text-gray-400">/</span>
        <a href={`/sites/${siteId}`} className="text-primary hover:underline">
          {folder.folder_name}
        </a>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{page.page_name}</span>
      </div>
      
      <h1 className="text-3xl font-bold" style={{ color: headingColor }}>{page.page_name}</h1>
      
      {content.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">אין תוכן להצגה בעמוד זה.</p>
        </div>
      ) : (
        <div className="space-y-6" style={{ gap: contentSpacing }}>
          {content.map((block) => (
            <ContentBlock key={block.id} block={block} useContentSpacing={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteContentPage; 