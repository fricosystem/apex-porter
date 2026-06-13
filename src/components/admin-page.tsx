'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminBottomNav, { AdminTab } from './admin-bottom-nav';
import { AdminPainelTab } from './admin/admin-painel-tab';
import { AdminRondasTab } from './admin/admin-rondas-tab';
import { AdminUsuariosTab } from './admin/admin-usuarios-tab';
import { AdminCargosTab } from './admin/admin-cargos-tab';
import { AdminPostosTab } from './admin/admin-postos-tab';

/**
 * AdminPage — roteador slim da área administrativa.
 * Cada aba é um componente independente localizado em src/components/admin/.
 */
export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('painel');

  return (
    <div className="h-full flex flex-col bg-background relative pb-16">
      <div className="flex-1 overflow-y-auto" id="admin-scroll-root">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {currentTab === 'painel'   && <AdminPainelTab />}
            {currentTab === 'rondas'   && <AdminRondasTab />}
            {currentTab === 'usuarios' && <AdminUsuariosTab />}
            {currentTab === 'postos'   && <AdminPostosTab />}
            {currentTab === 'cargos'   && <AdminCargosTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AdminBottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
