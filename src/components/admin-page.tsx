'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AdminBottomNav, { AdminTab } from './admin-bottom-nav';
import { AdminPainelTab } from './admin/admin-painel-tab';
import { AdminRondasTab } from './admin/admin-rondas-tab';
import { AdminUsuariosTab } from './admin/admin-usuarios-tab';
import { AdminCargosTab } from './admin/admin-cargos-tab';
import { AdminTiposPessoaTab } from './admin/admin-tipos-pessoa-tab';
import { AdminPostosTab } from './admin/admin-postos-tab';
import { useViewport } from '@/hooks/use-viewport';
import { useAppStore } from '@/lib/store';

/**
 * AdminPage — roteador slim da área administrativa.
 * Cada aba é um componente independente localizado em src/components/admin/.
 */
export default function AdminPage() {
  const currentTab = useAppStore((state) => state.adminTab);
  const setCurrentTab = useAppStore((state) => state.setAdminTab);
  const { isDesktop } = useViewport();

  return (
    <div className="h-full flex flex-col bg-background relative pb-16 xl:pb-0">
      <div className="flex-1 overflow-y-auto" id="admin-scroll-root">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 xl:p-6"
          >
            {currentTab === 'painel'   && <AdminPainelTab />}
            {currentTab === 'rondas'   && <AdminRondasTab />}
            {currentTab === 'usuarios' && <AdminUsuariosTab />}
            {currentTab === 'postos'   && <AdminPostosTab />}
            {currentTab === 'cargos'   && <AdminCargosTab />}
            {currentTab === 'tipos-pessoa' && <AdminTiposPessoaTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {!isDesktop && <AdminBottomNav currentTab={currentTab} onTabChange={setCurrentTab} />}
    </div>
  );
}
