import React from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMainMenu, fetchPages, fetchSettings } from '@/lib/googleSheetsUtils';

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
    queryFn: () => fetchMainMenu()
  });

  // Fetch pages
  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: () => fetchPages()
  });
  
  // Fetch settings
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchSettings()
  });

  // Find current folder and page
  const currentFolder = menuItems.find(folder => folder.slug === folderSlug);
  const currentPage = pages.find(page => page.slug === pageSlug);

  const queryClient = useQueryClient();
  
  const handleRefresh = () => {
    // רענון כל המידע מהשרת
    queryClient.invalidateQueries({ queryKey: ['main_menu'] });
    queryClient.invalidateQueries({ queryKey: ['pages'] });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    queryClient.invalidateQueries({ queryKey: ['content'] });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };

  // Find site settings
  const siteName = settings.find((s: any) => s.key === 'siteName')?.value;
  const logo = settings.find((s: any) => s.key === 'logo')?.value;

  return (
    <header className="bg-gradient-to-l from-blue-600 to-blue-500 shadow-md z-20 sticky top-0 text-white w-full">
      {/* לוגו ושם האתר */}
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center">
          {logo && (
            <img src={logo} alt={siteName || 'לוגו האתר'} className="h-10 w-auto ml-3" />
          )}
          {siteName && (
            <h1 className="text-xl font-bold text-white">{siteName}</h1>
          )}
        </div>
        
        <div className="flex items-center">
          {/* כפתור עריכת מקור נתונים */}
          <button
            className="flex items-center text-white hover:bg-blue-700 p-2 rounded transition-colors ml-3"
            onClick={handleRefresh}
            aria-label="עריכת גיליון נתונים"
          >
            <span className="material-icons ml-1">edit_note</span>
            <span className="hidden md:inline">ערוך גיליון נתונים</span>
          </button>
        </div>
      </div>
      
      {/* תפריט ניווט */}
      <div className="border-t border-blue-400 bg-blue-600">
        <div className="flex items-center px-6 py-2 max-w-7xl mx-auto">
          <button 
            className="md:hidden ml-4 text-white hover:bg-blue-700 p-1 rounded transition-colors" 
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
          
          <nav className="text-sm breadcrumbs">
            <ol className="flex items-center">
              <li className="flex items-center">
                <a href="/" className="text-white hover:text-blue-100">ראשי</a>
                {(currentFolder || currentPage) && (
                  <span className="material-icons text-blue-200 mx-1 text-sm">chevron_left</span>
                )}
              </li>
              
              {currentFolder && (
                <li className="flex items-center">
                  <a 
                    href={`/${currentFolder.slug}`} 
                    className="text-white hover:text-blue-100"
                  >
                    {currentFolder.folder_name}
                  </a>
                  {currentPage && (
                    <span className="material-icons text-blue-200 mx-1 text-sm">chevron_left</span>
                  )}
                </li>
              )}
              
              {currentPage && (
                <li>
                  <span className="font-medium text-white">{currentPage.page_name}</span>
                </li>
              )}
            </ol>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
