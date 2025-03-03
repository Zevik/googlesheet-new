import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { fetchMainMenu, fetchPages, fetchSettings } from '@/lib/googleSheetsUtils';
import { MainMenuItem, Page } from '@/lib/types';

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
    queryFn: fetchMainMenu
  });

  // Fetch pages data
  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: fetchPages
  });

  // Fetch settings
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings
  });

  // Get site name from settings
  const siteName = settings.find(s => s.key === 'siteName')?.value || 'אתר מבוסס גוגלשיטס';
  const logoUrl = settings.find(s => s.key === 'logo')?.value || 'https://via.placeholder.com/40x40';

  // Filter active menu items and sort by display order
  const activeMenuItems = menuItems
    .filter(item => item.active === 'yes')
    .sort((a, b) => a.display_order - b.display_order);

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
      .filter(page => page.folder_id === folderId && page.active === 'yes')
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Filter items based on search term
  const filteredMenuItems = searchTerm 
    ? activeMenuItems.filter(item => 
        item.folder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFolderPages(item.id).some(page => 
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
    <aside className={`fixed md:relative z-30 bg-white shadow-lg md:shadow-none w-64 md:w-72 h-screen transition-all duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
      <div className="flex items-center justify-between p-4 border-b">
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
      
      <div className="p-4">
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
          <h2 className="text-sm uppercase font-bold text-neutral-400 mb-2">תפריט ראשי</h2>
          
          {/* בית - הוספנו קישור ראשי לדף הבית */}
          <Link 
            href="/"
            className={`flex items-center p-2 rounded-md mb-2 ${
              location === '/' 
                ? 'bg-primary/10 hover:bg-primary/15 text-primary font-medium' 
                : 'hover:bg-neutral-50 text-neutral-500'
            }`}
          >
            <span className={`material-icons text-sm ml-2 ${location === '/' ? 'text-primary' : 'text-neutral-300'}`}>
              home
            </span>
            <span>דף הבית</span>
          </Link>
          
          {/* תפריט תיקיות - מסנן כפילויות של "דף הבית" */}
          {filteredMenuItems
            // סינון של תיקיות "דף הבית" שכבר קיימות בתור קישור נפרד
            .filter(folder => folder.folder_name !== 'דף הבית') 
            .map((folder) => {
              const folderPages = getFolderPages(folder.id);
              const isActive = isFolderActive(folder);
              const isExpanded = expandedFolders[folder.id];
              
              return (
                <div className="mb-4" key={folder.id}>
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
                    {folderPages.map((page) => {
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
                        >
                          <span className={`material-icons text-sm ml-2 ${isActive ? 'text-primary' : 'text-neutral-300'}`}>
                            description
                          </span>
                          <span>{page.page_name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </nav>
        
        <div className="mt-8">
          <h2 className="text-sm uppercase font-bold text-neutral-400 mb-2">הגדרות</h2>
          <a href="#" className="flex items-center p-2 rounded-md hover:bg-neutral-50 text-neutral-500 mb-1">
            <span className="material-icons text-neutral-300 ml-2">settings</span>
            <span>הגדרות כלליות</span>
          </a>
          <a href="#" className="flex items-center p-2 rounded-md hover:bg-neutral-50 text-neutral-500">
            <span className="material-icons text-neutral-300 ml-2">design_services</span>
            <span>תבניות עמודים</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
