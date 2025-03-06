import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ContentBlock from '@/components/ContentBlock';
import useGoogleSheets from '@/hooks/useGoogleSheets';
import useSites from '@/hooks/useSites';

const SitePage: React.FC = () => {
  const params = useParams<{ siteId: string }>();
  const [location] = useLocation();
  const siteId = params?.siteId;
  
  // קבלת פרטי האתר
  const { getSite } = useSites();
  const { data: site, isLoading: isSiteLoading } = getSite(siteId);
  
  // קבלת נתוני הגיליון
  const { 
    mainMenu, 
    pages, 
    content, 
    getSetting,
    getFolderPages,
    isLoading, 
    hasError, 
    errors,
    updateSheetUrl
  } = useGoogleSheets(siteId);
  
  // עדכון ה-URL של הגיליון כאשר האתר נטען
  useEffect(() => {
    if (site?.sheetUrl) {
      updateSheetUrl(site.sheetUrl);
    }
  }, [site, updateSheetUrl]);
  
  // גלילה לראש העמוד כשמשתנה ה-URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // עדכון כותרת הדף
    if (site?.name) {
      document.title = site.name;
    }
  }, [location, site]);
  
  // קבל את הגדרות הסגנון כדי שנוכל להשתמש בהן בהמשך
  const headingColor = getSetting('headingColor') || '#333333';
  const contentSpacing = getSetting('contentSpacing') || '24px';
  const pageWidth = getSetting('pageWidth') || '80%';
  
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
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold" style={{ color: headingColor }}>{site.name}</h1>
      
      {site.description && (
        <p className="text-lg text-gray-600">{site.description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mainMenu.map(folder => {
          const folderPages = getFolderPages(folder.id);
          
          return (
            <Card key={folder.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start mb-2">
                  <span className="material-icons text-primary mr-2">folder</span>
                  <h3 className="text-xl font-medium text-neutral-800">{folder.folder_name}</h3>
                </div>
                <p className="text-neutral-500 mb-4">{folder.short_description}</p>
                
                {folderPages.length > 0 && (
                  <div className="mt-4">
                    <ul className="space-y-1">
                      {folderPages.slice(0, 3).map(page => (
                        <li key={page.id}>
                          <a 
                            href={`/sites/${siteId}/${folder.slug}/${page.slug}`}
                            className="text-primary hover:underline flex items-center"
                          >
                            <span className="material-icons text-sm mr-1">description</span>
                            {page.page_name}
                          </a>
                        </li>
                      ))}
                      {folderPages.length > 3 && (
                        <li className="text-neutral-500 text-sm">
                          ו־{folderPages.length - 3} עמודים נוספים...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SitePage; 