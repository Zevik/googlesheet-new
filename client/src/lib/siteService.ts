import { SiteInfo, CreateSiteRequest, UpdateSiteRequest } from './types';

// פונקציה לקבלת כל האתרים
export const fetchSites = async (): Promise<SiteInfo[]> => {
  const response = await fetch('/api/sites');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sites');
  }
  return response.json();
};

// פונקציה לקבלת אתר לפי מזהה
export const fetchSiteById = async (siteId: string): Promise<SiteInfo> => {
  const response = await fetch(`/api/sites/${siteId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to fetch site: ${siteId}`);
  }
  return response.json();
};

// פונקציה ליצירת אתר חדש
export const createSite = async (site: CreateSiteRequest): Promise<SiteInfo> => {
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(site),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create site');
  }
  
  return response.json();
};

// פונקציה לעדכון אתר קיים
export const updateSite = async (siteId: string, site: UpdateSiteRequest): Promise<SiteInfo> => {
  const response = await fetch(`/api/sites/${siteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(site),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update site: ${siteId}`);
  }
  
  return response.json();
};

// פונקציה למחיקת אתר
export const deleteSite = async (siteId: string): Promise<void> => {
  const response = await fetch(`/api/sites/${siteId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete site: ${siteId}`);
  }
}; 