'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileText,
  UserPlus,
  Mail,
  Car,
  UserCheck,
  Phone,
  Bell,
  ShieldBan,
  Search,
  Settings,
  Menu,
  X,
  AlertTriangle,
  Footprints,
  ClipboardCheck,
  Eye,
  Siren,
  Building2,
  Building,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/lib/data';

interface NavItem {
  page: PageType;
  label: string;
  icon: React.ElementType;
  primary?: boolean;
}

// Items to the left of the center button
const LEFT_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'lembretes', label: 'Lembretes', icon: Bell },
];

// Center (prominent) button
const CENTER_NAV: NavItem = { page: 'fluxo', label: 'Fluxo', icon: ArrowRightLeft, primary: true };

// Items to the right of the center button
const RIGHT_NAV: NavItem[] = [
  { page: 'cadastros', label: 'Cadastros', icon: UserPlus },
];

const SECONDARY_NAV: NavItem[] = [
  { page: 'correspondencias', label: 'Corresp.', icon: Mail },
  { page: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { page: 'ronda', label: 'Rondas', icon: Footprints },
  { page: 'checklist-turno', label: 'Plantão', icon: ClipboardCheck },
  { page: 'inspecao-diaria', label: 'Inspeção', icon: Eye },
  { page: 'protocolos-emergencia', label: 'Emergência', icon: Siren },
  { page: 'veiculos', label: 'Veículos', icon: Car },
  { page: 'pre-autorizacao', label: 'Pré-Autorização', icon: UserCheck },
  { page: 'departamentos', label: 'Departamentos', icon: Building2 },
  { page: 'empresas', label: 'Empresas', icon: Building },
  { page: 'relatorios', label: 'Relatórios', icon: FileText },
  { page: 'ramais', label: 'Ramais', icon: Phone },
  { page: 'avisos', label: 'Avisos', icon: Bell },
  { page: 'lista-negra', label: 'Lista Negra', icon: ShieldBan },
  { page: 'achados-perdidos', label: 'Achados e Perdidos', icon: Search },
  { page: 'configuracoes', label: 'Configurações', icon: Settings },
  { page: 'admin', label: 'Admin', icon: Shield },
];

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (page: PageType) => currentPage === page;

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    setMoreOpen(false);
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
                {SECONDARY_NAV.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNavClick(item.page)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      isActive(item.page)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
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
          {LEFT_NAV.map((item) => (
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
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}

          {/* Center prominent button — Fluxo */}
          <button
            onClick={() => handleNavClick(CENTER_NAV.page)}
            className="flex flex-col items-center justify-center min-w-0 flex-1 -mt-5 transition-transform active:scale-95"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                isActive(CENTER_NAV.page)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              <CENTER_NAV.icon className="h-7 w-7" />
            </div>
            <span className={`text-[10px] font-semibold leading-tight mt-1 ${
              isActive(CENTER_NAV.page) ? 'text-emerald-600' : 'text-muted-foreground'
            }`}>
              {CENTER_NAV.label}
            </span>
          </button>

          {/* Right items */}
          {RIGHT_NAV.map((item) => (
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
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}

          {/* Mais button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
              moreOpen || SECONDARY_NAV.some((item) => isActive(item.page))
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="text-[10px] font-medium leading-tight">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
