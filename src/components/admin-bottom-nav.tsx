'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Footprints,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

export type AdminTab = 'painel' | 'rondas';

interface AdminBottomNavProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminBottomNav({ currentTab, onTabChange }: AdminBottomNavProps) {
  const { setCurrentPage } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-popover border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {/* Painel Geral (Home Admin) */}
        <button
          onClick={() => onTabChange('painel')}
          className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
            currentTab === 'painel'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {currentTab === 'painel' && (
            <motion.div
              layoutId="adminActiveTab"
              className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">Painel</span>
        </button>

        {/* Rondas (Center prominent button or regular) */}
        <button
          onClick={() => onTabChange('rondas')}
          className="flex flex-col items-center justify-center min-w-0 flex-1 -mt-5 transition-transform active:scale-95"
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              currentTab === 'rondas'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            <Footprints className="h-7 w-7" />
          </div>
          <span className={`text-[10px] font-semibold leading-tight mt-1 ${
            currentTab === 'rondas' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}>
            Rondas
          </span>
        </button>

        {/* Voltar ao App Principal */}
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">Sair</span>
        </button>
      </div>
    </nav>
  );
}
