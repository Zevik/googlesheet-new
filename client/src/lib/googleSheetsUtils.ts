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
  
  // Manual parsing for the specific format of the settings sheet
  const settings: Setting[] = [];

  // Special handling for the first row which contains the key-value columns
  if (data.length > 0) {
    try {
      // Get column names from the first row (first column might have the keys list)
      const firstRow = data[0];
      const firstColKey = Object.keys(firstRow)[0]; // First column name
      const firstColValue = firstRow[firstColKey]; // Get the content of first column
      
      // Check if the column contains a space-separated list of keys
      if (typeof firstColValue === 'string' && firstColValue.includes('siteName')) {
        // This is the special format where keys are in column labels
        const keysList = firstColValue.split(' ');
        
        // If the first element is 'key', remove it
        const keysWithoutPrefix = keysList[0] === 'key' ? keysList.slice(1) : keysList;
        
        // Get the second column's content (containing values)
        const secondColKey = Object.keys(firstRow)[1]; // Second column name
        const secondColValue = firstRow[secondColKey]; // Get content of second column
        
        if (typeof secondColValue === 'string') {
          // Split values by spaces, but handling the first 'value' prefix
          const valuesList = secondColValue.split(' ');
          const valuesWithoutPrefix = valuesList[0] === 'value' ? valuesList.slice(1) : valuesList;
          
          // Create setting objects for each key-value pair
          keysWithoutPrefix.forEach((key, index) => {
            if (index < valuesWithoutPrefix.length) {
              settings.push({
                key: key.trim(),
                value: valuesWithoutPrefix[index].trim()
              });
            }
          });
        }
      }
      
      // Add any other regular rows that have key-value format (like 'address')
      data.forEach(row => {
        const entries = Object.entries(row);
        if (entries.length >= 2) {
          const firstCol = String(entries[0][1]).trim();
          const secondCol = String(entries[1][1]).trim();
          
          // Check if this is a standard key-value setting row
          if (firstCol && !firstCol.includes(' ') && firstCol !== 'key' && secondCol !== 'value') {
            settings.push({ key: firstCol, value: secondCol });
          }
        }
      });
    } catch (error) {
      console.error('Error parsing settings sheet:', error);
    }
  }
  
  // Fallback to standard processing if no settings were extracted
  if (settings.length === 0) {
    return data.map(item => ({
      key: item.key || '',
      value: item.value || ''
    }));
  }
  
  // Remove duplicate settings
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
