
import React from 'react';
import Navbar from './Navbar';
import { Toaster } from '@/components/ui/toaster';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-inventory-gray">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default PageLayout;
