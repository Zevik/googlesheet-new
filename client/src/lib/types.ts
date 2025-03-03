// Type for main_menu sheet
export interface MainMenuItem {
  id: string;
  folder_name: string;
  display_order: number;
  active: string; // 'yes' or 'no'
  slug: string;
  short_description: string;
}

// Type for pages sheet
export interface Page {
  id: string;
  folder_id: string;
  page_name: string;
  display_order: number;
  active: string; // 'yes' or 'no'
  slug: string;
  meta_description: string;
  seo_title: string;
}

// Type for content sheet
export interface ContentBlock {
  id: string;
  page_id: string;
  content_type: ContentType;
  display_order: number;
  content: string;
  description: string;
  title: string;
  active: string; // 'yes' or 'no'
}

// Type for settings sheet
export interface Setting {
  key: string;
  value: string;
}

// Type for templates sheet
export interface Template {
  id: string;
  template_name: string;
  description: string;
}

// Content type enum - we standardize on English lowercase format internally
export type ContentType = 
  | 'text'
  | 'title'
  | 'image'
  | 'youtube'
  | 'link'
  | 'list'
  | 'table'
  | 'separator'
  | 'file';

// Type for the Google Sheets API response
export interface GoogleSheetsResponse {
  version: string;
  reqId: string;
  status: string;
  sig: string;
  table: {
    cols: {
      id: string;
      label: string;
      type: string;
    }[];
    rows: {
      c: {
        v: any;
        f?: string;
      }[];
    }[];
    parsedNumHeaders: number;
  };
}

// Type for breadcrumb navigation
export interface BreadcrumbItem {
  label: string;
  url: string;
  isActive?: boolean;
}

// Extended page type with content
export interface PageWithContent extends Page {
  content: ContentBlock[];
}
