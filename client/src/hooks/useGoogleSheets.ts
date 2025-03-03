import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMainMenu, 
  fetchPages, 
  fetchContent, 
  fetchSettings, 
  fetchTemplates,
  refreshData 
} from '@/lib/googleSheetsUtils';
import { MainMenuItem, Page, ContentBlock, Setting, Template } from '@/lib/types';
import { useEffect, useState } from 'react';

// Hook to fetch and access all Google Sheets data
export const useGoogleSheets = () => {
  const queryClient = useQueryClient();
  const [customSheetUrl, setCustomSheetUrl] = useState<string | null>(null);
  
  // Load custom sheet URL from localStorage on initial render
  useEffect(() => {
    const storedUrl = localStorage.getItem('sheetsURL');
    if (storedUrl) {
      setCustomSheetUrl(storedUrl);
    }
  }, []);
  
  // Fetch main menu
  const { data: mainMenu = [], isLoading: isMenuLoading, error: menuError } = useQuery({
    queryKey: ['main_menu', customSheetUrl],
    queryFn: () => fetchMainMenu(customSheetUrl)
  });

  // Fetch pages
  const { data: pages = [], isLoading: isPagesLoading, error: pagesError } = useQuery({
    queryKey: ['pages', customSheetUrl],
    queryFn: () => fetchPages(customSheetUrl)
  });

  // Fetch content
  const { data: content = [], isLoading: isContentLoading, error: contentError } = useQuery({
    queryKey: ['content', customSheetUrl],
    queryFn: () => fetchContent(customSheetUrl)
  });

  // Fetch settings
  const { data: settings = [], isLoading: isSettingsLoading, error: settingsError } = useQuery({
    queryKey: ['settings', customSheetUrl],
    queryFn: () => fetchSettings(customSheetUrl)
  });

  // Fetch templates
  const { data: templates = [], isLoading: isTemplatesLoading, error: templatesError } = useQuery({
    queryKey: ['templates', customSheetUrl],
    queryFn: () => fetchTemplates(customSheetUrl)
  });

  // Filter menu items by active status and sort by display order
  const activeMenuItems = mainMenu
    .filter((item: MainMenuItem) => item.active === 'yes')
    .sort((a: MainMenuItem, b: MainMenuItem) => a.display_order - b.display_order);

  // Get page content by page ID
  const getPageContent = (pageId: string): ContentBlock[] => {
    return content
      .filter((block: ContentBlock) => block.page_id === pageId && block.active === 'yes')
      .sort((a: ContentBlock, b: ContentBlock) => a.display_order - b.display_order);
  };

  // Get a setting by key
  const getSetting = (key: string): string | undefined => {
    const setting = settings.find((s: Setting) => s.key === key);
    return setting?.value;
  };

  // Get folder pages
  const getFolderPages = (folderId: string): Page[] => {
    return pages
      .filter((page: Page) => page.folder_id === folderId && page.active === 'yes')
      .sort((a: Page, b: Page) => a.display_order - b.display_order);
  };

  // Get page by slug
  const getPageBySlug = (slug: string): Page | undefined => {
    return pages.find((page: Page) => page.slug === slug && page.active === 'yes');
  };

  // Get folder by slug
  const getFolderBySlug = (slug: string): MainMenuItem | undefined => {
    return mainMenu.find((folder: MainMenuItem) => folder.slug === slug && folder.active === 'yes');
  };

  // Get template by ID
  const getTemplateById = (id: string): Template | undefined => {
    return templates.find((template: Template) => template.id === id);
  };

  // Combined loading state
  const isLoading = isMenuLoading || isPagesLoading || isContentLoading || isSettingsLoading || isTemplatesLoading;

  // Combined error state
  const errors = [menuError, pagesError, contentError, settingsError, templatesError].filter(Boolean);
  const hasError = errors.length > 0;
  
  // Function to refresh all data with new sheet URL
  const refreshWithNewSheetUrl = async (newUrl: string | null = null) => {
    if (newUrl !== null) {
      localStorage.setItem('sheetsURL', newUrl);
      setCustomSheetUrl(newUrl);
    }
    
    await refreshData();
    
    // Invalidate all queries to force refetch with new URL
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['main_menu'] }),
      queryClient.invalidateQueries({ queryKey: ['pages'] }),
      queryClient.invalidateQueries({ queryKey: ['content'] }),
      queryClient.invalidateQueries({ queryKey: ['settings'] }),
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    ]);
  };

  return {
    mainMenu: activeMenuItems,
    pages,
    content,
    settings,
    templates,
    getPageContent,
    getSetting,
    getFolderPages,
    getPageBySlug,
    getFolderBySlug,
    getTemplateById,
    refreshData: refreshWithNewSheetUrl,
    currentSheetUrl: customSheetUrl,
    isLoading,
    hasError,
    errors
  };
};

export default useGoogleSheets;
