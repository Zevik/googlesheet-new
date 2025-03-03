import { 
  MainMenuItem, 
  Page, 
  ContentBlock, 
  Setting, 
  Template,
  GoogleSheetsResponse
} from './types';
import { queryClient } from './queryClient';

// Google Sheet ID from the requirements
const SHEET_ID = '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';

// Generic function to fetch data from Google Sheets
export const fetchFromGoogleSheets = async (sheetName: string): Promise<any[]> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(url);
    const text = await response.text();
    
    // Extract the JSON part from the response
    const jsonText = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)?.[1];
    
    if (!jsonText) {
      throw new Error('Failed to extract JSON data from Google Sheets response');
    }
    
    const json: GoogleSheetsResponse = JSON.parse(jsonText);
    
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
  return data.map(item => ({
    id: String(item.id),
    page_id: String(item.page_id),
    content_type: item.content_type,
    display_order: Number(item.display_order),
    content: item.content,
    description: item.description,
    title: item.title,
    active: item.active
  }));
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

// Get content for a specific page
export const getPageContent = async (pageId: string): Promise<ContentBlock[]> => {
  const allContent = await fetchContent();
  return allContent
    .filter(block => block.page_id === pageId && block.active === 'yes')
    .sort((a, b) => a.display_order - b.display_order);
};
