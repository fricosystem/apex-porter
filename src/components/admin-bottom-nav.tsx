'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Footprints,
  Users,
  MapPin,
  X,
  Menu,
  Mail,
  AlertTriangle,
  ClipboardCheck,
  Eye,
  Siren,
  Car,
  UserCheck,
  Building2,
  Building,
  FileText,
  Phone,
  Bell,
  ShieldBan,
  Search,
  Settings,
  Briefcase,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

export type AdminTab = 'painel' | 'rondas' | 'usuarios' | 'postos' | 'cargos';

interface NavItem {
  page: any;
  label: string;
  icon: React.ElementType;
}

const SECONDARY_NAV: NavItem[] = [
  { page: 'cargos', label: 'Cargos', icon: Briefcase },
  { page: 'cadastros', label: 'Cadastros', icon: Users },
  { page: 'avisos', label: 'Avisos', icon: Bell },
  { page: 'lista-negra', label: 'Lista Negra', icon: ShieldBan },
  { page: 'achados-perdidos', label: 'Achados e Perdidos', icon: Search },
  { page: 'checklist-turno', label: 'Plantão', icon: ClipboardCheck },
  { page: 'protocolos-emergencia', label: 'Emergência', icon: Siren },
  { page: 'configuracoes', label: 'Configurações', icon: Settings },
];

interface AdminBottomNavProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminBottomNav({ currentTab, onTabChange }: AdminBottomNavProps) {
  const { setCurrentPage } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNavClick = (page: any) => {
    if (page === 'cargos') {
      onTabChange('cargos');
    } else {
      setCurrentPage(page);
    }
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
                      item.page === 'cargos' && currentTab === 'cargos'
                        ? 'text-primary bg-primary/10'
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-popover border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {/* Usuários */}
          <button
            onClick={() => onTabChange('usuarios')}
            className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
              currentTab === 'usuarios'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {currentTab === 'usuarios' && (
              <motion.div
                layoutId="adminActiveTab"
                className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">Colaboradores</span>
          </button>

          {/* Postos */}
          <button
            onClick={() => onTabChange('postos')}
            className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
              currentTab === 'postos'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {currentTab === 'postos' && (
              <motion.div
                layoutId="adminActiveTab"
                className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <MapPin className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">Postos</span>
          </button>

          {/* Dashboard (Center prominent button) */}
          <button
            onClick={() => onTabChange('painel')}
            className="flex flex-col items-center justify-center min-w-0 flex-1 -mt-5 transition-transform active:scale-95"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                currentTab === 'painel'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <span className={`text-[10px] font-semibold leading-tight mt-1 ${
              currentTab === 'painel' ? 'text-emerald-600' : 'text-muted-foreground'
            }`}>
              Dashboard
            </span>
          </button>

          {/* Rondas */}
          <button
            onClick={() => onTabChange('rondas')}
            className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
              currentTab === 'rondas'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {currentTab === 'rondas' && (
              <motion.div
                layoutId="adminActiveTab"
                className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Footprints className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">Rondas</span>
          </button>

          {/* Mais */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors ${
              moreOpen
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
