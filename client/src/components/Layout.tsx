import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/lib/googleSheetsUtils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings
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
        
        <Footer footerText={settings?.find(s => s.key === 'footerText')?.value || '© כל הזכויות שמורות'} />
      </div>
    </div>
  );
};

export default Layout;
