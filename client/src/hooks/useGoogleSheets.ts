import { useQuery } from '@tanstack/react-query';
import { 
  fetchMainMenu, 
  fetchPages, 
  fetchContent, 
  fetchSettings, 
  fetchTemplates 
} from '@/lib/googleSheetsUtils';
import { MainMenuItem, Page, ContentBlock, Setting, Template } from '@/lib/types';

// Hook to fetch and access all Google Sheets data
export const useGoogleSheets = () => {
  // Fetch main menu
  const { data: mainMenu = [], isLoading: isMenuLoading, error: menuError } = useQuery({
    queryKey: ['main_menu'],
    queryFn: fetchMainMenu
  });

  // Fetch pages
  const { data: pages = [], isLoading: isPagesLoading, error: pagesError } = useQuery({
    queryKey: ['pages'],
    queryFn: fetchPages
  });

  // Fetch content
  const { data: content = [], isLoading: isContentLoading, error: contentError } = useQuery({
    queryKey: ['content'],
    queryFn: fetchContent
  });

  // Fetch settings
  const { data: settings = [], isLoading: isSettingsLoading, error: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings
  });

  // Fetch templates
  const { data: templates = [], isLoading: isTemplatesLoading, error: templatesError } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates
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
    isLoading,
    hasError,
    errors
  };
};

export default useGoogleSheets;
