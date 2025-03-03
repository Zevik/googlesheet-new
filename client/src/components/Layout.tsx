import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  
  // עדכון הסטייט כשיש שינוי בגודל המסך
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);
  
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettingsForQuery
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
        
        <Footer footerText={settings.find((s: { key: string, value: string }) => s.key === 'footerText')?.value || '© כל הזכויות שמורות'} />
      </div>
    </div>
  );
};

export default Layout;
