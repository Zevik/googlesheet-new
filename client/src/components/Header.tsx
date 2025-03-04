import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMainMenu, 
  fetchPages, 
  fetchSettings, 
  setCurrentSheetUrl, 
  fetchMainMenuForQuery, 
  fetchPagesForQuery 
} from '@/lib/googleSheetsUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainMenuItem, Page } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMobileMenuOpen, toggleMobileMenu }) => {
  const [location] = useLocation();
  const pathParts = location.split('/').filter(Boolean);
  const folderSlug = pathParts[0];
  const pageSlug = pathParts[1];
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useIsMobile();
  
  // מצב פתיחת הדיאלוג של שינוי קישור גיליון
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);
  
  // קישור לגיליון גוגל הנוכחי
  const [sheetsUrl, setSheetsUrl] = useState("https://docs.google.com/spreadsheets/d/1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI");
  
  // טקסט זמני לקישור החדש
  const [newSheetsUrl, setNewSheetsUrl] = useState("");

  // הטיפול בהסתרה והצגה של ההדר בעת גלילה
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // גלילה למטה - הסתרת ההדר רק לאחר גלילה משמעותית
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
    queryFn: fetchMainMenuForQuery
  });

  // Fetch pages
  const { data: pages = [] } = useQuery({
    queryKey: ['pages'],
    queryFn: fetchPagesForQuery
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
    // חילוץ מזהה הגיליון מתוך הURL
    const extractSheetId = (url: string): string => {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : '1IvAFeW8EUKR_kdzX9mpU9PW9BrTDAjS7pC35Gzn2_dI';
    };
    
    const sheetId = extractSheetId(sheetsUrl);
    const fullUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    window.open(fullUrl, '_blank');
  };
  
  // פתיחת הדיאלוג לשינוי קישור הגיליון
  const openSheetDialog = () => {
    setNewSheetsUrl(sheetsUrl);
    setIsSheetDialogOpen(true);
  };
  
  // שמירת הקישור החדש
  const saveNewSheetUrl = () => {
    if (newSheetsUrl && newSheetsUrl.includes('docs.google.com/spreadsheets')) {
      // עדכון הקישור המקומי
      setSheetsUrl(newSheetsUrl);
      
      // שמירת הקישור החדש במערכת המרכזית
      setCurrentSheetUrl(newSheetsUrl);
      
      // סגירת החלון
      setIsSheetDialogOpen(false);
      
      // רענון הנתונים לאחר שינוי הקישור
      handleRefresh();
    }
  };

  // Find site settings
  const siteName = settings.find((s: any) => s.key === 'siteName')?.value;
  const logo = settings.find((s: any) => s.key === 'logo')?.value;

  // סינון וקבלת פריטי תפריט פעילים
  const activeMenuItems = menuItems
    .filter((item: MainMenuItem) => item.active === 'yes')
    .sort((a: MainMenuItem, b: MainMenuItem) => a.display_order - b.display_order);

  // תפריט להצגה רק בדסקטופ
  const renderDesktopMenu = () => {
    return (
      <nav className="hidden md:flex items-center justify-center mt-2 pb-2">
        <div className="flex space-x-1 space-x-reverse">
          {/* קישור לדף הבית */}
          <div className="relative px-1">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md text-white hover:bg-blue-600 transition-colors flex items-center ${
                location === '/' ? 'bg-blue-600 font-medium' : ''
              }`}
            >
              דף הבית
            </Link>
          </div>
          
          {/* מיפוי קטגוריות התפריט - רק עבור דסקטופ */}
          {activeMenuItems.map((folder: MainMenuItem) => {
            const folderPages = pages
              .filter((page: Page) => page.folder_id === folder.id && page.active === 'yes')
              .sort((a: Page, b: Page) => a.display_order - b.display_order);
            
            // אם אין דפים בקטגוריה, לא נציג אותה
            if (folderPages.length === 0) {
              return null;
            }
            
            // אם יש רק דף אחד בקטגוריה, נציג קישור ישיר
            if (folderPages.length === 1) {
              const page = folderPages[0];
              return (
                <div key={folder.id} className="relative px-1">
                  <Link 
                    href={`/${folder.slug}/${page.slug}`}
                    className={`px-3 py-2 rounded-md text-white hover:bg-blue-600 transition-colors flex items-center ${
                      location === `/${folder.slug}/${page.slug}` ? 'bg-blue-600 font-medium' : ''
                    }`}
                  >
                    {folder.folder_name}
                  </Link>
                </div>
              );
            }
            
            // אם יש יותר מדף אחד, נציג תפריט נפתח משופר
            const isActive = location.startsWith(`/${folder.slug}/`);
            return (
              <div key={folder.id} className="relative inline-block px-1">
                <div className="group">
                  <button
                    className={`px-3 py-2 rounded-md text-white hover:bg-blue-600 transition-colors flex items-center ${
                      isActive ? 'bg-blue-600 font-medium' : ''
                    }`}
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {folder.folder_name}
                    <span className="material-icons text-xs mr-1">expand_more</span>
                  </button>
                  
                  {/* תפריט נפתח עם hover שלא נסגר בטעות */}
                  <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 right-0 mt-0.5 z-50 min-w-[220px]">
                    {/* הוספת מרווח כדי למנוע סגירה */}
                    <div className="h-2"></div>
                    
                    <div className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                      {folderPages.map((page: Page) => (
                        <Link 
                          key={page.id}
                          href={`/${folder.slug}/${page.slug}`}
                          className={`block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                            location === `/${folder.slug}/${page.slug}` ? 'bg-blue-50 text-blue-600 font-medium' : ''
                          }`}
                        >
                          {page.page_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    );
  };

  // תפריט מובייל שנפתח
  const renderMobileMenu = () => {
    return (
      <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed top-0 right-0 w-3/4 h-full bg-white shadow-xl transition-transform duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50 overflow-y-auto`}>
          {/* כותרת התפריט */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              {logo && <img src={logo} alt={siteName || 'לוגו האתר'} className="h-8 w-auto ml-3" />}
              <h2 className="text-lg font-bold text-primary">{siteName}</h2>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={toggleMobileMenu}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          {/* תפריט ניווט */}
          <nav className="p-4">
            <Link 
              href="/"
              className={`block py-2 px-4 rounded-md mb-2 ${
                location === '/' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={toggleMobileMenu}
            >
              דף הבית
            </Link>
            
            {/* קטגוריות מובייל */}
            {activeMenuItems.map((folder: MainMenuItem) => {
              const folderPages = pages
                .filter((page: Page) => page.folder_id === folder.id && page.active === 'yes')
                .sort((a: Page, b: Page) => a.display_order - b.display_order);
              
              // אם אין דפים בקטגוריה, לא נציג אותה
              if (folderPages.length === 0) {
                return null;
              }
              
              // אם יש רק דף אחד בקטגוריה, נציג קישור ישיר
              if (folderPages.length === 1) {
                const page = folderPages[0];
                return (
                  <Link 
                    key={folder.id}
                    href={`/${folder.slug}/${page.slug}`}
                    className={`block py-2 px-4 rounded-md mb-2 ${
                      location === `/${folder.slug}/${page.slug}` ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    {folder.folder_name}
                  </Link>
                );
              }
              
              // אם יש יותר מדף אחד, נציג פריט מתרחב
              return (
                <div key={folder.id} className="mb-2">
                  <details className="group">
                    <summary className={`flex items-center justify-between py-2 px-4 rounded-md cursor-pointer ${
                      location.startsWith(`/${folder.slug}/`) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      <span>{folder.folder_name}</span>
                      <span className="material-icons text-gray-400 text-sm group-open:rotate-180 transition-transform">
                        expand_more
                      </span>
                    </summary>
                    <div className="pr-4 pl-2 mt-2 space-y-1 border-r-2 border-blue-100">
                      {folderPages.map((page: Page) => (
                        <Link 
                          key={page.id}
                          href={`/${folder.slug}/${page.slug}`}
                          className={`block py-2 px-4 rounded-md text-sm ${
                            location === `/${folder.slug}/${page.slug}` ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={toggleMobileMenu}
                        >
                          {page.page_name}
                        </Link>
                      ))}
                    </div>
                  </details>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    );
  };

  return (
    <>
      <header 
        className={`bg-gradient-to-l from-blue-600 to-blue-500 shadow-md z-30 sticky top-0 text-white w-full transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* חלק עליון */}
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          {/* צד ימין: לוגו ושם האתר */}
          <div className="flex items-center">
            <button 
              className="md:hidden ml-3 text-white hover:bg-blue-700 p-1 rounded transition-colors" 
              onClick={toggleMobileMenu}
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
          
          {/* צד שמאל: נתיב ניווט ואייקונים */}
          <div className="flex items-center">
            {/* נתיב ניווט */}
            <nav className="text-sm breadcrumbs hidden md:flex mr-4">
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
            
            {/* אייקון עריכה */}
            <div className="flex">
              {/* אייקון החלפת קישור לגיליון גוגל שיטס */}
              <button
                className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors"
                onClick={openSheetDialog}
                aria-label="שנה קישור לגיליון גוגל"
              >
                <span className="material-icons">edit</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* תפריט ראשי לדסקטופ */}
        {renderDesktopMenu()}
      </header>
      
      {/* תפריט מובייל */}
      {renderMobileMenu()}
      
      {/* דיאלוג החלפת קישור לגיליון */}
      <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>שינוי קישור לגיליון גוגל</DialogTitle>
            <DialogDescription>
              הזן את הקישור החדש לגיליון גוגל ממנו יוצגו הנתונים באתר.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <Input
              value={newSheetsUrl}
              onChange={(e) => setNewSheetsUrl(e.target.value)}
              placeholder="הכנס קישור לגיליון גוגל"
              className="w-full"
              dir="ltr"
            />
            
            <div className="text-xs text-neutral-500">
              הקישור צריך להיות בפורמט:
              <code className="block bg-neutral-100 p-2 mt-1 rounded text-xs overflow-x-auto">
                https://docs.google.com/spreadsheets/d/SHEET_ID/edit
              </code>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSheetDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={saveNewSheetUrl}>
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
