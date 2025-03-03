import React, { useState, useEffect } from 'react';
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
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // הטיפול בהסתרה והצגה של ההדר בעת גלילה
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        // גלילה למטה - הסתרת ההדר
        setVisible(false);
      } else {
        // גלילה למעלה - הצגת ההדר
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
  const currentFolder = menuItems.find((folder: any) => folder.slug === folderSlug);
  const currentPage = pages.find((page: any) => page.slug === pageSlug);

  const queryClient = useQueryClient();
  
  const handleRefresh = () => {
    // רענון כל המידע מהשרת
    queryClient.invalidateQueries({ queryKey: ['main_menu'] });
    queryClient.invalidateQueries({ queryKey: ['pages'] });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    queryClient.invalidateQueries({ queryKey: ['content'] });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };

  // פתיחת גוגל שיטס בלשונית חדשה
  const openGoogleSheets = () => {
    const sheetsUrl = "https://docs.google.com/spreadsheets/d/1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI";
    window.open(sheetsUrl, '_blank');
  };

  // Find site settings
  const siteName = settings.find((s: any) => s.key === 'siteName')?.value;
  const logo = settings.find((s: any) => s.key === 'logo')?.value;

  return (
    <header 
      className={`bg-gradient-to-l from-blue-600 to-blue-500 shadow-md z-20 sticky top-0 text-white w-full transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        {/* צד ימין: לוגו, שם האתר וכפתור הבורגר למובייל */}
        <div className="flex items-center">
          <button 
            className="md:hidden ml-3 text-white hover:bg-blue-700 p-1 rounded transition-colors" 
            onClick={toggleSidebar}
            aria-label="פתח תפריט"
          >
            <span className="material-icons">menu</span>
          </button>
          
          {logo && (
            <img src={logo} alt={siteName || 'לוגו האתר'} className="h-8 w-auto ml-3" />
          )}
          {siteName && (
            <h1 className="text-xl font-bold text-white">{siteName}</h1>
          )}
        </div>
        
        {/* צד שמאל: ניווט ואייקונים */}
        <div className="flex items-center">
          {/* ניווט */}
          <nav className="text-sm breadcrumbs mr-4">
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
          
          {/* אייקונים */}
          <div className="flex space-x-1">
            {/* אייקון 1: קישור לגיליון גוגל */}
            <button
              className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors"
              onClick={openGoogleSheets}
              aria-label="פתח גיליון גוגל"
            >
              <span className="material-icons">table_chart</span>
            </button>
            
            {/* אייקון 2: החלפת מקור הנתונים */}
            <button
              className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors"
              onClick={handleRefresh}
              aria-label="החלף מקור נתונים"
            >
              <span className="material-icons">sync</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
