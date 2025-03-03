import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { fetchMainMenu, fetchPages, refreshData } from '@/lib/googleSheetsUtils';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [location] = useLocation();
  const pathParts = location.split('/').filter(Boolean);
  const folderSlug = pathParts[0];
  const pageSlug = pathParts[1];

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['main_menu'],
    queryFn: fetchMainMenu
  });

  // Fetch pages
  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: fetchPages
  });

  // Find current folder and page
  const currentFolder = menuItems.find(folder => folder.slug === folderSlug);
  const currentPage = pages.find(page => page.slug === pageSlug);

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <header className="bg-white shadow z-20 sticky top-0">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button 
            className="md:hidden ml-4 text-neutral-500" 
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
          
          <nav className="text-sm breadcrumbs hidden sm:block">
            <ol className="flex items-center">
              <li className="flex items-center">
                <a href="/" className="text-neutral-500 hover:text-primary">ראשי</a>
                {(currentFolder || currentPage) && (
                  <span className="material-icons text-neutral-300 mx-1 text-sm">chevron_left</span>
                )}
              </li>
              
              {currentFolder && (
                <li className="flex items-center">
                  <a 
                    href={`/${currentFolder.slug}`} 
                    className="text-neutral-500 hover:text-primary"
                  >
                    {currentFolder.folder_name}
                  </a>
                  {currentPage && (
                    <span className="material-icons text-neutral-300 mx-1 text-sm">chevron_left</span>
                  )}
                </li>
              )}
              
              {currentPage && (
                <li>
                  <span className="font-medium text-primary">{currentPage.page_name}</span>
                </li>
              )}
            </ol>
          </nav>
        </div>
        
        <div className="flex items-center">
          {/* כפתור רענון הוסתר 
          <button 
            className="p-2 rounded-full hover:bg-neutral-50 ml-2"
            onClick={handleRefresh}
          >
            <span className="material-icons text-neutral-500">refresh</span>
          </button>
          */}
          {/* כפתור עזרה והאווטר הוסתרו 
          <button className="p-2 rounded-full hover:bg-neutral-50 ml-2">
            <span className="material-icons text-neutral-500">help_outline</span>
          </button>
          <div className="relative">
            <button className="flex items-center p-1 rounded-full hover:bg-neutral-50">
              <img 
                src="https://i.pravatar.cc/40?img=68" 
                alt="User Avatar" 
                className="w-8 h-8 rounded-full" 
              />
            </button>
          </div>
          */}
        </div>
      </div>
    </header>
  );
};

export default Header;
