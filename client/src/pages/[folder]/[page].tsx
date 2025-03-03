import React, { useEffect } from 'react';
import { useRoute, Link } from 'wouter';
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
    content: allContent,
    isLoading, 
    hasError, 
    errors 
  } = useGoogleSheets();
  
  const folderSlug = params?.folder || '';
  const pageSlug = params?.page || '';
  
  const folder = getFolderBySlug(folderSlug);
  const page = getPageBySlug(pageSlug);
  
  // Instead of using state, compute the content directly from the queries
  // This eliminates the infinite update
  const content = React.useMemo(() => {
    if (page && page.id) {
      // Debug the page ID
      console.log('Looking for content for page ID:', page.id);
      
      // Convert page.id to a string in case it comes as a number from the API
      const pageIdStr = String(page.id);
      
      // Log all page IDs and active status in the content for debugging
      console.log('All content page_ids:', 
        allContent.map(block => block.page_id).join(', '));
        
      // לבדוק את מבנה הנתונים המלא
      console.log('Data structure sample:', 
        allContent.length > 0 ? JSON.stringify(allContent[0], null, 2) : 'No content');
      
      // תחילה מנסים למצוא תוכן לפי מזהה עמוד
      // הוספת יותר לוגים לצורך דיבוג
      const filteredContent = allContent
        .filter(block => {
          // המרת שני המזהים למספרים לצורך השוואה מדויקת
          const blockPageId = Number(block.page_id);
          const currentPageId = Number(pageIdStr);
          
          // בדיקה האם התוכן פעיל ומתאים למזהה העמוד 
          // תיקון לערכי active חסרים - נחשיב כל ערך חסר כפעיל
          let isActive = true;  // ברירת מחדל - פעיל
          
          if (block.active !== undefined && block.active !== null) {
            // אם יש ערך, מבדוק שהוא 'yes' או 'כן' (לא תלוי באותיות גדולות/קטנות)
            isActive = block.active.toLowerCase() === 'yes' || block.active.toLowerCase() === 'כן';
          }
          
          const isMatch = blockPageId === currentPageId && isActive;
          
          if (blockPageId === currentPageId) {
            console.log('Found matching page_id:', blockPageId, 'Active:', block.active, 'Match:', isMatch);
          }
          
          return isMatch;
        })
        .sort((a, b) => a.display_order - b.display_order);
      
      console.log('Found content items:', filteredContent.length);
      
      // אם לא נמצא תוכן וזהו אחד מהעמודים שיודעים שיש להם בעיה, נייצר תוכן זמני
      if (filteredContent.length === 0) {
        // עמודים עם בעיות ידועות
        if (pageIdStr === '10' || pageIdStr === '11' || pageIdStr === '12' || 
            pageIdStr === '14' || pageIdStr === '15' || pageIdStr === '16' || 
            pageIdStr === '17' || pageIdStr === '18' || pageIdStr === '19') {
          
          console.log(`Creating placeholder content for page ID ${pageIdStr}`);
          
          // תוכן זמני עבור עמוד חסר
          return [
            {
              id: `placeholder-${pageIdStr}-1`,
              page_id: pageIdStr,
              content_type: 'title',
              display_order: 1,
              content: `${page.page_name} - תוכן בתהליך בנייה`,
              description: 'כותרת ראשית',
              title: '',
              active: 'yes'
            },
            {
              id: `placeholder-${pageIdStr}-2`,
              page_id: pageIdStr,
              content_type: 'text',
              display_order: 2,
              content: 'עמוד זה נמצא בתהליך בנייה. התוכן יתמלא בקרוב מגיליון הנתונים של גוגל.',
              description: '',
              title: '',
              active: 'yes'
            },
            {
              id: `placeholder-${pageIdStr}-3`,
              page_id: pageIdStr,
              content_type: 'image',
              display_order: 3,
              content: 'https://via.placeholder.com/800x400?text=תוכן+בהכנה',
              description: 'תמונה זמנית',
              title: '',
              active: 'yes'
            }
          ];
        }
      }
      
      return filteredContent;
    }
    return [];
  }, [page, allContent]);
  
  const contentLoading = isLoading;
  
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
              <Link 
                href="/" 
                className="text-primary hover:underline flex items-center"
              >
                <span className="material-icons text-sm mr-1">home</span>
                חזור לעמוד הראשי
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // בדיקה מקיפה יותר לכפילות כותרות
  const shouldHideTitleHeader = () => {
    // אם אין תוכן, אין סיבה להסתיר את כותרת העמוד
    if (content.length === 0) return false;
    
    // בדוק אם הבלוק הראשון הוא כותרת
    const firstBlock = content[0];
    const isFirstBlockTitle = firstBlock.content_type.toLowerCase() === 'title';
    
    if (!isFirstBlockTitle) return false;
    
    // בדוק אם יש כפילות בתוכן הכותרת
    const pageTitleLower = page.page_name.toLowerCase().trim();
    
    // קבל את תוכן הכותרת מהבלוק הראשון (בין אם בפורמט הישן עם h1: או בפורמט החדש)
    let firstBlockTitle = '';
    
    // אם יש heading_level (פורמט חדש), הכותרת נמצאת בשדה title ללא ציון רמה
    if (firstBlock.heading_level) {
      firstBlockTitle = (firstBlock.title || firstBlock.content || '').toLowerCase().trim();
    } 
    // אם אין heading_level (פורמט ישן), ייתכן שהכותרת עם ציון רמה כמו "h1: כותרת"
    else if (firstBlock.title) {
      const headingMatch = firstBlock.title.match(/^h[1-6]:\s*(.+)$/i);
      if (headingMatch) {
        firstBlockTitle = headingMatch[1].toLowerCase().trim();
      } else {
        firstBlockTitle = firstBlock.title.toLowerCase().trim();
      }
    }
    // אם אין title אבל יש content, בדוק גם אותו
    else if (firstBlock.content) {
      const headingMatch = firstBlock.content.match(/^h[1-6]:\s*(.+)$/i);
      if (headingMatch) {
        firstBlockTitle = headingMatch[1].toLowerCase().trim();
      } else {
        firstBlockTitle = firstBlock.content.toLowerCase().trim();
      }
    }
    
    // בדוק אם יש התאמה בין כותרת העמוד לכותרת הבלוק הראשון
    return firstBlockTitle === pageTitleLower || 
           // גם אם הכותרות לא זהות לגמרי, אבל הבלוק הראשון הוא כותרת ברמה 1, עדיף להראות אותו
           ((firstBlock.heading_level === 'h1' || firstBlock.heading_level === '1') && isFirstBlockTitle);
  };
  
  // בדיקה אם צריך להציג את כותרת העמוד או לא
  const hasH1TitleAsFirstBlock = shouldHideTitleHeader();

  // אם יש כותרת h1 כבלוק הראשון, לא נציג את כותרת הדף (למניעת כפילות)
  return (
    <div>
      {!hasH1TitleAsFirstBlock && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">{page.page_name}</h1>
          <p className="text-neutral-500">{page.meta_description}</p>
        </div>
      )}

      <div className="space-y-8">
        {content.map(block => (
          <ContentBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
};

export default FolderPage;
