'use client';

import type { ReactNode } from 'react';
import { useViewport } from '@/hooks/use-viewport';
import { useAppStore } from '@/lib/store';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AppHeader from './app-header';
import BottomNav from './bottom-nav';
import DesktopSidebar from './desktop-sidebar';

export default function ResponsiveShell({ children }: { children: ReactNode }) {
  const { isDesktop } = useViewport();
  const currentPage = useAppStore((state) => state.currentPage);

  if (isDesktop) {
    return (
      <SidebarProvider defaultOpen className="min-h-full">
        <DesktopSidebar />
        <SidebarInset className="desktop-shell min-h-full min-w-0 overflow-hidden bg-background">
          <AppHeader mode="desktop" />
          <main className="min-h-0 flex-1 overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-hidden">
        {children}
      </main>
      {currentPage !== 'admin' && <BottomNav />}
    </div>
  );
}
