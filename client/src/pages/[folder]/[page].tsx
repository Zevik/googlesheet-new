import React, { useEffect } from 'react';
import { useRoute } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import ContentBlock from '@/components/ContentBlock';
import useGoogleSheets from '@/hooks/useGoogleSheets';
import { Card, CardContent } from '@/components/ui/card';

const FolderPage: React.FC = () => {
  const [match, params] = useRoute<{ folder: string; page: string }>('/:folder/:page');
  const { 
    getFolderBySlug, 
    getPageBySlug, 
    getPageContent, 
    isLoading, 
    hasError, 
    errors 
  } = useGoogleSheets();
  
  const folderSlug = params?.folder || '';
  const pageSlug = params?.page || '';
  
  const folder = getFolderBySlug(folderSlug);
  const page = getPageBySlug(pageSlug);
  
  const [content, setContent] = React.useState<any[]>([]);
  const [contentLoading, setContentLoading] = React.useState<boolean>(true);
  
  useEffect(() => {
    if (page) {
      setContentLoading(true);
      getPageContent(page.id)
        .then(pageContent => {
          setContent(pageContent);
          setContentLoading(false);
        })
        .catch(error => {
          console.error('Error fetching page content:', error);
          setContentLoading(false);
        });
    }
  }, [page]);
  
  // Set page title and meta description for SEO
  useEffect(() => {
    if (page) {
      document.title = page.seo_title || page.page_name;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', page.meta_description || '');
    }
  }, [page]);

  if (isLoading || contentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-6" />
        <Skeleton className="h-48 w-full rounded-lg mb-4" />
        <Skeleton className="h-32 w-full rounded-lg mb-4" />
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

  if (!match || !folder || !page) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-warning mr-2">warning</span>
            <h2 className="text-xl font-medium text-neutral-800">עמוד לא נמצא</h2>
          </div>
          <div className="text-sm text-neutral-500">
            <p>לא ניתן למצוא את העמוד המבוקש. ייתכן שהעמוד הוסר או שהקישור שגוי.</p>
            <div className="flex mt-4">
              <a 
                href="/" 
                className="text-primary hover:underline flex items-center"
              >
                <span className="material-icons text-sm mr-1">home</span>
                חזור לעמוד הראשי
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">{page.page_name}</h1>
        <p className="text-neutral-500">{page.meta_description}</p>
      </div>

      <div className="space-y-8">
        {content.map(block => (
          <ContentBlock key={block.id} block={block} />
        ))}

        {content.length === 0 && (
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <span className="material-icons text-neutral-400 mr-2">info</span>
                <h2 className="text-xl font-medium text-neutral-800">אין תוכן לעמוד זה</h2>
              </div>
              <p className="text-sm text-neutral-500">
                לא נמצא תוכן פעיל לעמוד זה בגיליון Google Sheets.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FolderPage;
