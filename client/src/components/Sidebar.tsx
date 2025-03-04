import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { fetchMainMenuForQuery, fetchPagesForQuery, fetchSettingsForQuery } from '@/lib/googleSheetsUtils';
import { MainMenuItem, Page, Setting } from '@/lib/types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [location] = useLocation();
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch main menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['main_menu'],
    queryFn: fetchMainMenuForQuery
  });

  // Fetch pages data
  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: fetchPagesForQuery
  });

  // Fetch settings
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettingsForQuery
  });

  // Get site name from settings
  const siteName = settings.find((s: { key: string, value: string }) => s.key === 'siteName')?.value || 'אתר מבוסס גוגלשיטס';
  const logoUrl = settings.find((s: { key: string, value: string }) => s.key === 'logo')?.value || 'https://via.placeholder.com/40x40';

  // Filter active menu items and sort by display order
  const activeMenuItems = menuItems
    .filter((item: MainMenuItem) => item.active === 'yes')
    .sort((a: MainMenuItem, b: MainMenuItem) => a.display_order - b.display_order);

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Filter pages by folder id and active status
  const getFolderPages = (folderId: string) => {
    return pages
      .filter((page: Page) => page.folder_id === folderId && page.active === 'yes')
      .sort((a: Page, b: Page) => a.display_order - b.display_order);
  };

  // Filter items based on search term
  const filteredMenuItems = searchTerm 
    ? activeMenuItems.filter((item: MainMenuItem) => 
        item.folder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFolderPages(item.id).some((page: Page) => 
          page.page_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : activeMenuItems;

  // Check if a page is currently active
  const isPageActive = (folder: MainMenuItem, page: Page) => {
    return location === `/${folder.slug}/${page.slug}`;
  };

  // Check if any page in the folder is active using location directly
  const isFolderActive = (folder: MainMenuItem) => {
    // Check if the current location starts with folder.slug
    return location.startsWith(`/${folder.slug}/`);
  };

  // Set initial expanded state for the active folder
  React.useEffect(() => {
    // Loop through folders once to find active
    for (const folder of activeMenuItems) {
      if (location.startsWith(`/${folder.slug}/`)) {
        setExpandedFolders(prev => ({
          ...prev,
          [folder.id]: true
        }));
        break;
      }
    }
  }, [location, activeMenuItems.length]);

  return (
    <aside className={`fixed md:relative z-30 bg-white shadow-lg md:shadow-none w-64 md:w-72 h-screen flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center">
          <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded" />
          <h1 className="text-xl font-bold mr-2 text-primary">{siteName}</h1>
        </div>
        <button 
          className="md:hidden text-neutral-500" 
          onClick={toggleSidebar}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="relative mb-4">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="material-icons text-neutral-300">search</span>
          </span>
          <input 
            type="text" 
            className="block w-full pr-10 border border-neutral-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" 
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <nav>
          {/* הסתרת כותרת הקטגוריות מהתצוגה */}
          
          {/* בית - קישור ראשי לדף הבית */}
          <Link 
            href="/"
            className={`flex items-center p-2 rounded-md mb-2 ${
              location === '/' 
                ? 'bg-primary/10 hover:bg-primary/15 text-primary font-medium' 
                : 'hover:bg-neutral-50 text-neutral-500'
            }`}
            onClick={() => {
              // סגור את התפריט במובייל אחרי לחיצה על קישור
              if (window.innerWidth < 768) {
                toggleSidebar();
              }
            }}
          >
            <span className={`material-icons text-sm ml-2 ${location === '/' ? 'text-primary' : 'text-neutral-300'}`}>
              home
            </span>
            <span>דף הבית</span>
          </Link>
          
          {/* תפריט תיקיות - מציג קטגוריות ללא כפילויות */}
          {filteredMenuItems
            // מזהה קטגוריות ייחודיות לפי שם התיקייה
            .filter((folder: MainMenuItem, index: number, self: MainMenuItem[]) => 
              // מסנן קטגוריות כפולות על פי שם התיקייה
              index === self.findIndex((f: MainMenuItem) => f.folder_name === folder.folder_name) &&
              // מסנן גם תיקיות מיוחדות שמופיעות כפתורים נפרדים
              folder.folder_name !== 'דף הבית' && 
              folder.folder_name !== 'בית' &&
              folder.folder_name !== 'צור קשר' && 
              folder.folder_name !== 'Contact'
            ) 
            .map((folder: MainMenuItem) => {
              const folderPages = getFolderPages(folder.id);
              const isActive = isFolderActive(folder);
              const isExpanded = expandedFolders[folder.id];
              
              return (
                <div className="mb-4" key={folder.id}>
                  {/* בדיקה אם יש רק דף אחד בתיקייה, אם כן - הצג קישור ישיר */}
                  {folderPages.length === 1 ? (
                    <Link 
                      href={`/${folder.slug}/${folderPages[0].slug}`}
                      className={`flex items-center p-2 rounded-md mb-2 ${
                        isPageActive(folder, folderPages[0]) 
                          ? 'bg-primary/10 hover:bg-primary/15 text-primary font-medium' 
                          : 'hover:bg-neutral-50 text-neutral-500'
                      }`}
                      onClick={() => {
                        // סגור את התפריט במובייל אחרי לחיצה על קישור
                        if (window.innerWidth < 768) {
                          toggleSidebar();
                        }
                      }}
                    >
                      <span className="material-icons text-primary ml-2">folder</span>
                      <span className="font-medium">{folder.folder_name}</span>
                    </Link>
                  ) : (
                    /* אם יש יותר מדף אחד, הצג תפריט נפתח */
                    <>
                      <div 
                        className={`flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 cursor-pointer mb-2 ${isActive ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleFolder(folder.id)}
                      >
                        <div className="flex items-center">
                          <span className="material-icons text-primary ml-2">folder</span>
                          <span className="font-medium">{folder.folder_name}</span>
                        </div>
                        <span className={`material-icons text-neutral-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </div>
                      
                      <div className={`mr-5 pr-2 border-r-2 border-primary space-y-1 ${!isExpanded ? 'hidden' : ''}`}>
                        {folderPages.map((page: Page) => {
                          const isActive = isPageActive(folder, page);
                          
                          return (
                            <Link 
                              key={page.id}
                              href={`/${folder.slug}/${page.slug}`}
                              className={`flex items-center p-2 rounded-md ${
                                isActive 
                                  ? 'bg-primary/10 hover:bg-primary/15 text-primary font-medium' 
                                  : 'hover:bg-neutral-50 text-neutral-500'
                              }`}
                              onClick={() => {
                                // סגור את התפריט במובייל אחרי לחיצה על קישור
                                if (window.innerWidth < 768) {
                                  toggleSidebar();
                                }
                              }}
                            >
                              <span className={`material-icons text-sm ml-2 ${isActive ? 'text-primary' : 'text-neutral-300'}`}>
                                description
                              </span>
                              <span>{page.page_name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </nav>
        
        {/* חלק ההגדרות הוסר - אין צורך בו כרגע */}
      </div>
    </aside>
  );
};

export default Sidebar;
