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

// Generic function to fetch data from Google Sheets via our proxy server
export const fetchFromGoogleSheets = async (sheetName: string): Promise<any[]> => {
  try {
    // Use our server-side proxy to avoid CORS issues
    const url = `/api/sheets/${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const json: GoogleSheetsResponse = await response.json();
    
    // Get column headers from the first row
    const headers = json.table.cols.map(col => col.label);
    
    // Map rows to objects with column headers as keys
    return json.table.rows.map(row => {
      const item: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        // Skip undefined or null headers
        if (!header) return;
        
        const cell = row.c[index];
        item[header] = cell?.v !== undefined ? cell.v : '';
      });
      
      return item;
    });
  } catch (error) {
    console.error(`Error fetching ${sheetName} sheet:`, error);
    return [];
  }
};

// Fetch main_menu sheet
export const fetchMainMenu = async (): Promise<MainMenuItem[]> => {
  const data = await fetchFromGoogleSheets('main_menu');
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
export const fetchPages = async (): Promise<Page[]> => {
  const data = await fetchFromGoogleSheets('pages');
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
export const fetchContent = async (): Promise<ContentBlock[]> => {
  const data = await fetchFromGoogleSheets('content');
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
    
    // For debugging
    console.log("Content type:", item.content_type, "Normalized:", normalizedContentType);
    
    return {
      id: String(item.id),
      page_id: String(item.page_id),
      content_type: normalizedContentType as ContentType,
      display_order: Number(item.display_order),
      content: item.content,
      description: item.description,
      title: item.title,
      active: item.active
    };
  });
};

// Fetch settings sheet
export const fetchSettings = async (): Promise<Setting[]> => {
  const data = await fetchFromGoogleSheets('settings');
  return data.map(item => ({
    key: item.key,
    value: item.value
  }));
};

// Fetch templates sheet
export const fetchTemplates = async (): Promise<Template[]> => {
  const data = await fetchFromGoogleSheets('templates');
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

// Helper function to create placeholder content for pages without content
const createPlaceholderContent = (pageId: string, pageName: string): ContentBlock[] => {
  // Only create placeholder for certain page IDs that we know are missing content
  if (pageId === '10') { // כלי יצירת תמונות
    return [
      {
        id: `placeholder-${pageId}-1`,
        page_id: pageId,
        content_type: 'title',
        display_order: 1,
        content: `כלי יצירת תמונות באמצעות בינה מלאכותית`,
        description: 'כותרת ראשית',
        title: '',
        active: 'yes'
      },
      {
        id: `placeholder-${pageId}-2`,
        page_id: pageId,
        content_type: 'text',
        display_order: 2,
        content: 'טכנולוגיות יצירת תמונות באמצעות בינה מלאכותית מאפשרות יצירת תוכן ויזואלי מרהיב על בסיס תיאור טקסטואלי. בדף זה נסקור את הכלים המובילים וכיצד ניתן להשתמש בהם ליצירת תמונות איכותיות.',
        description: '',
        title: '',
        active: 'yes'
      },
      {
        id: `placeholder-${pageId}-3`,
        page_id: pageId,
        content_type: 'list',
        display_order: 3,
        content: `הכלים הפופולריים ביותר ליצירת תמונות: DALL-E 3, המפותח על ידי OpenAI, המאפשר יצירת תמונות מפורטות ומדויקות מאוד; Midjourney, מחולל תמונות בעל יכולות אמנותיות מרשימות במיוחד; Stable Diffusion, פתרון קוד פתוח שניתן להתקנה ושימוש מקומי; Adobe Firefly, המתמקד ביצירת תמונות בטוחות לשימוש מסחרי; ו-Canva AI Image Generator, המשולב בפלטפורמת העיצוב הפופולרית.`,
        description: '',
        title: 'כלים מובילים בשוק',
        active: 'yes'
      },
      {
        id: `placeholder-${pageId}-4`,
        page_id: pageId,
        content_type: 'image',
        display_order: 4,
        content: 'https://example.com/ai-image-generation.jpg',
        description: 'דוגמה לתמונה שנוצרה באמצעות בינה מלאכותית',
        title: '',
        active: 'yes'
      }
    ];
  } else if (pageId === '11') { // כלים למפתחים
    return [
      {
        id: `placeholder-${pageId}-1`,
        page_id: pageId,
        content_type: 'title',
        display_order: 1,
        content: 'כלי בינה מלאכותית למפתחים',
        description: 'כותרת ראשית',
        title: '',
        active: 'yes'
      },
      {
        id: `placeholder-${pageId}-2`,
        page_id: pageId,
        content_type: 'text',
        display_order: 2,
        content: 'מגוון רחב של כלי AI זמינים למפתחים, מ-APIs של מודלי שפה גדולים ועד ספריות קוד פתוח לעיבוד תמונה, קול וטקסט. בדף זה נסקור את הכלים המובילים עבור מפתחים.',
        description: '',
        title: '',
        active: 'yes'
      }
    ];
  }
  
  // Return empty array for other missing pages
  return [];
};

// Get content for a specific page
export const getPageContent = async (pageId: string): Promise<ContentBlock[]> => {
  const allContent = await fetchContent();
  const filteredContent = allContent
    .filter(block => block.page_id === pageId && block.active === 'yes')
    .sort((a, b) => a.display_order - b.display_order);
  
  // If no content found, return placeholder content
  if (filteredContent.length === 0) {
    console.log(`No content found for page ID ${pageId}, creating placeholder content`);
    return createPlaceholderContent(pageId, '');
  }
  
  return filteredContent;
};
