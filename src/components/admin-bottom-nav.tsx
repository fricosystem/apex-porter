'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Footprints,
  LogOut,
  Users,
  MapPin,
  EllipsisVertical,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AdminTab = 'painel' | 'rondas' | 'usuarios' | 'postos';

interface AdminBottomNavProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminBottomNav({ currentTab, onTabChange }: AdminBottomNavProps) {
  const { setCurrentPage } = useAppStore();
  const [showMoreModal, setShowMoreModal] = useState(false);

  return (
    <>
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
            <span className="text-[10px] font-medium leading-tight">Usuários</span>
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
            onClick={() => setShowMoreModal(true)}
            className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors text-muted-foreground hover:text-foreground"
          >
            <EllipsisVertical className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mais Modal */}
      <Dialog open={showMoreModal} onOpenChange={setShowMoreModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Opções de Gestão</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('cadastros');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>Cadastros</span>
            </button>
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('avisos');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <span>Avisos</span>
            </button>
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('lista-negra');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Footprints className="h-5 w-5 text-muted-foreground" />
              <span>Lista Negra</span>
            </button>
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('achados-perdidos');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>Achados e Perdidos</span>
            </button>
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('checklist-turno');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <span>Checklist de Turno</span>
            </button>
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('protocolos-emergencia');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Footprints className="h-5 w-5 text-muted-foreground" />
              <span>Protocolos de Emergência</span>
            </button>
            <button
              onClick={() => {
                setShowMoreModal(false);
                setCurrentPage('configuracoes');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>Configurações</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
