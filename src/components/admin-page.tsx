'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Map as MapIcon } from 'lucide-react';
import AdminBottomNav, { AdminTab } from './admin-bottom-nav';
import { useAppStore } from '@/lib/store';
import { ModalNovaRota } from './modais-rota';

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
            {currentTab === 'painel' && <AdminPainelTab />}
            {currentTab === 'rondas' && <AdminRondasTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AdminBottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

function AdminPainelTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Painel de Administração</h2>
      <p className="text-muted-foreground text-sm">
        Bem-vindo à área administrativa. Selecione uma opção no menu abaixo.
      </p>
    </div>
  );
}

function AdminRondasTab() {
  const { rotasGeoreferenciadas } = useAppStore();
  const [showNovaRota, setShowNovaRota] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Rotas de Ronda</h2>
        <button
          onClick={() => setShowNovaRota(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Rota
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {rotasGeoreferenciadas.map((rota) => (
          <div key={rota.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-medium text-sm">{rota.nome}</span>
                <p className="text-xs text-muted-foreground">{rota.pontos.length} pontos cadastrados</p>
              </div>
            </div>
            {/* O botão de excluir foi removido conforme solicitado na Fase 1 */}
          </div>
        ))}

        {rotasGeoreferenciadas.length === 0 && (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <MapIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhuma rota cadastrada.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNovaRota && (
          <ModalNovaRota onClose={() => setShowNovaRota(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
