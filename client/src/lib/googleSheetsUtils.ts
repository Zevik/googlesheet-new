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
export const fetchFromGoogleSheets = async (sheetName: string, customSheetUrl: string | null = null): Promise<any[]> => {
  try {
    // Use our server-side proxy to avoid CORS issues
    const url = `/api/sheets/${encodeURIComponent(sheetName)}`;
    
    // Create headers object with custom sheet URL if provided
    const headers: HeadersInit = {};
    if (customSheetUrl) {
      headers['x-sheet-url'] = customSheetUrl;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
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
    return [];
  }
};

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
export const fetchSettings = async (customSheetUrl: string | null = null): Promise<Setting[]> => {
  const data = await fetchFromGoogleSheets('settings', customSheetUrl);
  return data.map(item => ({
    key: item.key,
    value: item.value
  }));
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
  const allContent = await fetchContent();
  const filteredContent = allContent
    .filter(block => String(block.page_id) === String(pageId) && block.active === 'yes')
    .sort((a, b) => a.display_order - b.display_order);
  
  // השימוש בתוכן זמני עבר לקובץ [folder]/[page].tsx
  // כדי למנוע ניגודים עם הלוגיקה הקיימת כבר שם
  
  return filteredContent;
};
