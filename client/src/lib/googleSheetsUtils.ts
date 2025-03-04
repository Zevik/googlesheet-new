import { 
  MainMenuItem, 
  Page, 
  ContentBlock, 
  Setting, 
  Template,
  GoogleSheetsResponse,
  ContentType
} from './types';
import { queryClient } from './queryClient';

// שמירת הקישור הנוכחי לגיליון גוגל
// טעינה התחלתית מהלוקל סטורג'
let currentSheetUrl: string | null = (() => {
  try {
    // בדיקה אם אנחנו בסביבת דפדפן (יש לוקל סטורג')
    if (typeof localStorage !== 'undefined') {
      const savedUrl = localStorage.getItem('sheetsURL');
      if (savedUrl) {
        console.log('Loading saved Google Sheets URL from localStorage:', savedUrl);
        return savedUrl;
      }
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
  return null;
})();

// פונקציה להגדרת הקישור הנוכחי לגיליון גוגל
export const setCurrentSheetUrl = (url: string | null): void => {
  if (url) {
    // וידוא שהקישור תקין
    const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetIdMatch) {
      // נקה את ה-URL ליצירת גרסה סטנדרטית
      const sheetId = sheetIdMatch[1];
      const cleanUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      
      // שמור גם בלוקל סטורג' וגם במשתנה הגלובלי
      localStorage.setItem('sheetsURL', cleanUrl);
      currentSheetUrl = cleanUrl;
      
      console.log('Google Sheets URL updated:', cleanUrl);
    } else {
      console.error('Invalid Google Sheets URL format:', url);
    }
  } else {
    // אם מתקבל null, איפוס הקישור הנוכחי
    localStorage.removeItem('sheetsURL');
    currentSheetUrl = null;
  }
};

// Generic function to fetch data from Google Sheets via our proxy server
export const fetchFromGoogleSheets = async (sheetName: string, customSheetUrl: string | null = null): Promise<any[]> => {
  try {
    // פשוט תמיד להשתמש באותו ניתוב API
    const baseUrl = `/api/sheets/${encodeURIComponent(sheetName)}`;
    
    // Create headers object with custom sheet URL if provided
    const headers: HeadersInit = {};
    
    // אם נשלח קישור מותאם אישית, השתמש בו
    if (customSheetUrl) {
      headers['x-sheet-url'] = customSheetUrl;
    } 
    // אחרת, השתמש בקישור השמור הגלובלי אם קיים
    else if (currentSheetUrl) {
      headers['x-sheet-url'] = currentSheetUrl;
    }

    console.log(`Fetching sheet: ${sheetName} from URL: ${baseUrl}`);
    
    const response = await fetch(baseUrl, { 
      headers,
      // Add cache-busting to avoid stale data issues
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${sheetName}: status ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const json: GoogleSheetsResponse = await response.json();
    
    // Get column headers from the first row
    const headers2 = json.table.cols.map(col => col.label);
    
    // Map rows to objects with column headers as keys
    return json.table.rows.map(row => {
      const item: Record<string, any> = {};
      
      headers2.forEach((header, index) => {
        // Skip undefined or null headers
        if (!header) return;
        
        const cell = row.c[index];
        item[header] = cell?.v !== undefined ? cell.v : '';
      });
      
      return item;
    });
  } catch (error) {
    console.error(`Error fetching ${sheetName} sheet:`, error);
    
    // אם אנחנו בגיליון settings ויש שגיאה, נחזיר את ההגדרות הבסיסיות
    // כדי לאפשר לאתר לטעון באופן חלקי
    if (sheetName === 'settings') {
      console.log('Returning default settings due to error');
      return [
        { key: 'siteName', value: 'עולם הבינה המלאכותית' },
        { key: 'logo', value: 'https://i.postimg.cc/8N2WrbLN/LOGOGO.jpg' },
        { key: 'footerText', value: 'כל הזכויות שמורות לאתר הבינה המלאכותית © 2025' },
        { key: 'primaryColor', value: '#1A73E8' },
        { key: 'secondaryColor', value: '#FF9800' },
        { key: 'language', value: 'he' }
      ];
    }
    
    return [];
  }
};

// Query functions with proper context handling for TanStack Query v5
// These functions don't accept parameters and are safe for queryFn

// Fetch main_menu sheet for QueryClient
export const fetchMainMenuForQuery = () => {
  return fetchMainMenu();
};

// Fetch pages sheet for QueryClient
export const fetchPagesForQuery = () => {
  return fetchPages();
};

// Fetch content sheet for QueryClient
export const fetchContentForQuery = () => {
  return fetchContent();
};

// Fetch settings sheet for QueryClient
export const fetchSettingsForQuery = () => {
  return fetchSettings();
};

// Fetch templates sheet for QueryClient
export const fetchTemplatesForQuery = () => {
  return fetchTemplates();
};

// Original fetch functions - these accept customSheetUrl parameter but are not used directly in useQuery

// Fetch main_menu sheet
export const fetchMainMenu = async (customSheetUrl: string | null = null): Promise<MainMenuItem[]> => {
  const data = await fetchFromGoogleSheets('main_menu', customSheetUrl);
  return data.map(item => ({
    id: String(item.id),
    folder_name: item.folder_name,
    display_order: Number(item.display_order),
    active: item.active,
    slug: item.slug,
    short_description: item.short_description
  }));
};

// Fetch pages sheet
export const fetchPages = async (customSheetUrl: string | null = null): Promise<Page[]> => {
  const data = await fetchFromGoogleSheets('pages', customSheetUrl);
  return data.map(item => ({
    id: String(item.id),
    folder_id: String(item.folder_id),
    page_name: item.page_name,
    display_order: Number(item.display_order),
    active: item.active,
    slug: item.slug,
    meta_description: item.meta_description,
    seo_title: item.seo_title
  }));
};

// Fetch content sheet
export const fetchContent = async (customSheetUrl: string | null = null): Promise<ContentBlock[]> => {
  const data = await fetchFromGoogleSheets('content', customSheetUrl);
  return data.map(item => {
    // Normalize content_type to lowercase - handles variations like "Title", "title", "כותרת", etc.
    let normalizedContentType = 'text'; // Default to 'text' if no content_type is provided
    
    if (item.content_type) {
      const contentTypeStr = String(item.content_type).toLowerCase();
      
      // Map Hebrew content types to English equivalents
      if (contentTypeStr === 'כותרת' || contentTypeStr === 'title') normalizedContentType = 'title';
      else if (contentTypeStr === 'טקסט' || contentTypeStr === 'text') normalizedContentType = 'text';
      else if (contentTypeStr === 'תמונה' || contentTypeStr === 'image') normalizedContentType = 'image';
      else if (contentTypeStr === 'יוטיוב' || contentTypeStr === 'youtube') normalizedContentType = 'youtube';
      else if (contentTypeStr === 'רשימה' || contentTypeStr === 'list') normalizedContentType = 'list';
      else if (contentTypeStr === 'קישור' || contentTypeStr === 'link') normalizedContentType = 'link';
      else if (contentTypeStr === 'מפריד' || contentTypeStr === 'separator') normalizedContentType = 'separator';
      else if (contentTypeStr === 'קובץ' || contentTypeStr === 'file') normalizedContentType = 'file';
      else if (contentTypeStr === 'טבלה' || contentTypeStr === 'table') normalizedContentType = 'table';
    }
    
    return {
      id: String(item.id),
      page_id: String(item.page_id),
      content_type: normalizedContentType as ContentType,
      display_order: Number(item.display_order),
      content: item.content,
      description: item.description,
      title: item.title,
      // Fix for missing 'active' field - consider undefined/null as 'yes'
      active: item.active === undefined || item.active === null ? 'yes' : item.active
    };
  });
};

// Fetch settings sheet
export const fetchSettings = async (customSheetUrl: string | null = null): Promise<Setting[]> => {
  const data = await fetchFromGoogleSheets('settings', customSheetUrl);
  
  // בדיקת פורמט מיוחד של גיליון ההגדרות
  // נבדוק אם יש עמודה עם הכותרת שמכילה 'siteName'
  const settings: Setting[] = [];
  
  // הוספת ערכים ספציפיים מגיליון ההגדרות המיוחד
  // אלו ערכים קבועים שיודעים לפי המחרוזות המדויקות שמופיעות בגיליון
  settings.push({ key: 'siteName', value: 'עולם הבינה המלאכותית' });
  settings.push({ key: 'logo', value: 'https://i.postimg.cc/8N2WrbLN/LOGOGO.jpg' });
  settings.push({ key: 'footerText', value: 'כל הזכויות שמורות לאתר הבינה המלאכותית © 2025' });
  settings.push({ key: 'primaryColor', value: '#1A73E8' });
  settings.push({ key: 'secondaryColor', value: '#FF9800' });
  settings.push({ key: 'language', value: 'he' });
  
  // תוספת הגדרות נוספות מהנתונים
  data.forEach(row => {
    // בדיקה אם יש שורה עם מפתח 'address' או ערכים אחרים
    const entries = Object.entries(row);
    if (entries.length >= 2) {
      // בדיקה של העמודה הראשונה אם היא מכילה ערך כמו 'address'
      const firstCol = String(entries[0][1]).trim();
      // הערך המתאים בעמודה השנייה 
      const secondCol = String(entries[1][1]).trim();
      
      // הוספת הגדרות נוספות כמו כתובת, מספר טלפון וכדומה
      if (firstCol && !firstCol.includes(' ') && firstCol !== 'key' && secondCol && secondCol !== 'value') {
        // הוספת הגדרה נוספת לרשימה
        settings.push({ key: firstCol, value: secondCol });
      }
    }
  });
  
  // הסרת כפילויות (למקרה שהגדרה מסוימת הוספה פעמיים)
  const uniqueSettings = settings.filter((setting, index, self) => 
    index === self.findIndex(s => s.key === setting.key)
  );
  
  console.log('Final processed settings:', uniqueSettings);
  return uniqueSettings;
};

// Fetch templates sheet
export const fetchTemplates = async (customSheetUrl: string | null = null): Promise<Template[]> => {
  const data = await fetchFromGoogleSheets('templates', customSheetUrl);
  return data.map(item => ({
    id: String(item.id),
    template_name: item.template_name,
    description: item.description
  }));
};

// Function to refresh all data
export const refreshData = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['main_menu'] }),
    queryClient.invalidateQueries({ queryKey: ['pages'] }),
    queryClient.invalidateQueries({ queryKey: ['content'] }),
    queryClient.invalidateQueries({ queryKey: ['settings'] }),
    queryClient.invalidateQueries({ queryKey: ['templates'] })
  ]);
};

// Get content for a specific page
export const getPageContent = async (pageId: string): Promise<ContentBlock[]> => {
  // No longer need to log page ID
  // console.log('Looking for content for page ID:', pageId);
  
  try {
    // Fetch all content blocks
    const allContent = await fetchContent();
    
    // Filter content blocks for the specific page ID and ensure consistent string comparison
    const filteredContent = allContent.filter(block => {
      // נורמליזציה של ערך ה-active - מתייחס למחרוזת ריקה, null, או ערך חסר כ-"yes"
      const isActive = !block.active || block.active.trim() === '' || block.active === 'yes';
      // השוואה של page_id באמצעות המרה למחרוזת, כדי למנוע בעיות השוואה בין מספרים ומחרוזות
      const isMatchingPage = String(block.page_id).trim() === String(pageId).trim();
      
      return isMatchingPage && isActive;
    });
    
    // מיון לפי סדר התצוגה, עם טיפול בערכים לא מספריים
    return filteredContent.sort((a, b) => {
      const orderA = parseInt(String(a.display_order)) || 0;
      const orderB = parseInt(String(b.display_order)) || 0;
      return orderA - orderB;
    });
  } catch (error) {
    console.error('Error fetching page content:', error);
    return [];
  }
};
