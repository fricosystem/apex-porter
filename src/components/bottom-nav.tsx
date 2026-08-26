'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/lib/data';
import PendingBadge from './pending-badge';
import { getPendingCounts, sumPendingCounts } from '@/lib/pending-counts';
import {
  CENTER_NAV,
  LEFT_NAV,
  RIGHT_NAV,
  SECONDARY_NAV,
} from './navigation-config';

export default function BottomNav() {
  const {
    currentPage,
    setCurrentPage,
    user,
    registrosFluxo,
    veiculos,
    preAutorizacoes,
    ocorrencias,
    rondas,
    checklists,
    inspecoes,
    avisos,
    listaNegra,
    achadosPerdidos,
    lembretes,
    registrosChaves,
  } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const userPermissions = user?.permissoes || [];

  const pendingCounts = useMemo(
    () => getPendingCounts({
      user,
      registrosFluxo,
      veiculos,
      preAutorizacoes,
      ocorrencias,
      rondas,
      checklists,
      inspecoes,
      avisos,
      listaNegra,
      achadosPerdidos,
      lembretes,
      registrosChaves,
    }),
    [
      user,
      registrosFluxo,
      veiculos,
      preAutorizacoes,
      ocorrencias,
      rondas,
      checklists,
      inspecoes,
      avisos,
      listaNegra,
      achadosPerdidos,
      lembretes,
      registrosChaves,
    ],
  );

  const isActive = (page: PageType) => currentPage === page;

  // Check if page is allowed
  const isPageAllowed = (page: PageType) => {
    // If user is inactive, don't allow anything
    if (!user?.ativo) return false;
    // Pages that are always allowed: login and perfil
    if (page === 'login' || page === 'perfil') return true;
    // Allow full access to DESENVOLVEDOR and DIRETOR
    const userCargo = (user?.cargo || '').toUpperCase();
    if (userCargo === 'DESENVOLVEDOR' || userCargo === 'DIRETOR') return true;
    // Otherwise check permissions
    return userPermissions.includes(page);
  };

  // Filter nav items to only show allowed pages
  const filteredLeftNav = LEFT_NAV.filter(item => isPageAllowed(item.page));
  const filteredCenterNav = isPageAllowed(CENTER_NAV.page) ? CENTER_NAV : null;
  const filteredRightNav = RIGHT_NAV.filter(item => isPageAllowed(item.page));
  const filteredSecondaryNav = SECONDARY_NAV.filter(item => isPageAllowed(item.page));
  const morePendingCount = sumPendingCounts(
    pendingCounts,
    filteredSecondaryNav.map((item) => item.page),
  );

  const handleNavClick = (page: PageType) => {
    if (isPageAllowed(page)) {
      setCurrentPage(page);
      setMoreOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for more menu */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Secondary nav popup */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-2"
          >
            <div className="bg-popover border border-border rounded-2xl shadow-xl p-3 max-w-md mx-auto">
              <div className="grid grid-cols-4 gap-2">
                {filteredSecondaryNav.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNavClick(item.page)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      isActive(item.page)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="relative inline-flex">
                      <item.icon className="h-5 w-5" />
                      <PendingBadge count={pendingCounts[item.page]} label={`pendências em ${item.label}`} />
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-popover border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {/* Left items */}
          {filteredLeftNav.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
                isActive(item.page)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive(item.page) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative inline-flex">
                <item.icon className="h-5 w-5" />
                <PendingBadge count={pendingCounts[item.page]} label={`pendências em ${item.label}`} />
              </span>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}

          {/* Center prominent button — Fluxo (only if allowed) */}
          {filteredCenterNav && (
            <button
              onClick={() => handleNavClick(filteredCenterNav.page)}
              className="flex flex-col items-center justify-center min-w-0 flex-1 -mt-5 transition-transform active:scale-95"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                  isActive(filteredCenterNav.page)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                <span className="relative inline-flex">
                  <filteredCenterNav.icon className="h-7 w-7" />
                  <PendingBadge count={pendingCounts[filteredCenterNav.page]} label="pendências em Fluxo" />
                </span>
              </div>
              <span className={`text-[10px] font-semibold leading-tight mt-1 ${
                isActive(filteredCenterNav.page) ? 'text-emerald-600' : 'text-muted-foreground'
              }`}>
                {filteredCenterNav.label}
              </span>
            </button>
          )}

          {/* Right items */}
          {filteredRightNav.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
                isActive(item.page)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive(item.page) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative inline-flex">
                <item.icon className="h-5 w-5" />
                <PendingBadge count={pendingCounts[item.page]} label={`pendências em ${item.label}`} />
              </span>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}

          {/* Mais button (only if there are secondary nav items) */}
          {filteredSecondaryNav.length > 0 && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
                moreOpen || filteredSecondaryNav.some((item) => isActive(item.page))
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative inline-flex">
                {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <PendingBadge count={morePendingCount} label="pendências nas opções Mais" />
              </span>
              <span className="text-[10px] font-medium leading-tight">Mais</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
