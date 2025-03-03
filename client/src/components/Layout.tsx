import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useQuery } from '@tanstack/react-query';
import { fetchSettingsForQuery } from '@/lib/googleSheetsUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Setting } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettingsForQuery
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* כותרת עליונה עם תפריט */}
      <Header isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
        
        <Footer footerText={settings.find((s: { key: string, value: string }) => s.key === 'footerText')?.value || '© כל הזכויות שמורות'} />
      </div>
    </div>
  );
};

export default Layout;
