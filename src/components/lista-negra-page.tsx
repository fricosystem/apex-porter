'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ShieldBan, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AutocompleteInput from './autocomplete-input';
import { PESSOAS_INICIAIS, REGISTROS_FLUXO_INICIAIS } from '@/lib/seed-data';

export default function ListaNegraPage() {
  const { listaNegra, addListaNegra, removeListaNegra, updateListaNegra, pessoas, empresas, registrosFluxo } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [motivo, setMotivo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  // ── Unified suggestions ──
  const { nameSuggestions, empresaSuggestions } = useMemo(() => {
    const namesMap = new Map<string, { label: string; sublabel?: string; data: any }>();
    const empresasMap = new Map<string, { label: string; sublabel?: string; data: any }>();

    // 1. Fallback from seed data
    (PESSOAS_INICIAIS || []).forEach((p) => {
      const u = { name: p.nome, company: p.empresa || '' };
      if (u.name) namesMap.set(u.name, { label: u.name, sublabel: p.tipo, data: u });
      if (u.company) empresasMap.set(u.company, { label: u.company, sublabel: 'Empresa', data: u });
    });

    // 2. From active database
    (pessoas || []).filter((p) => !p.inativo).forEach((p) => {
      const u = { name: p.nome, company: p.empresa || '' };
      if (u.name) namesMap.set(u.name, { label: u.name, sublabel: p.tipo, data: u });
      if (u.company) empresasMap.set(u.company, { label: u.company, sublabel: 'Empresa cadastrada', data: u });
    });

    // 3. From historical flow records
    (registrosFluxo || []).forEach((r) => {
      let name = '';
      let company = '';
      if (r.categoria === 'visitantes' || r.categoria === 'prestadores') {
        name = (r as any).nome || '';
        company = (r as any).empresa || '';
      } else if (r.categoria === 'entregas1') {
        name = r.nome;
        company = r.empresa;
      }
      if (name) namesMap.set(name, { label: name, sublabel: 'Registro histórico', data: { name, company } });
      if (company) empresasMap.set(company, { label: company, sublabel: 'Registro histórico', data: { name, company } });
    });

    return {
      nameSuggestions: Array.from(namesMap.values()),
      empresaSuggestions: Array.from(empresasMap.values()),
    };
  }, [pessoas, empresas, registrosFluxo]);

  const handleAdd = () => {
    if (!nome || !motivo) {
      toast.error('Preencha nome e motivo');
      return;
    }
    addListaNegra({
      id: `ln_${Date.now()}`,
      nome,
      motivo,
      data: format(new Date(), 'yyyy-MM-dd'),
      status,
      empresa: empresa || undefined,
    });
    toast.success('Entrada adicionada à lista negra!');
    setNome('');
    setMotivo('');
    setEmpresa('');
    setStatus('ativo');
    setDialogOpen(false);
  };

  const toggleStatus = (id: string, currentStatus: 'ativo' | 'inativo') => {
    const entry = listaNegra.find((e) => e.id === id);
    if (entry) {
      updateListaNegra({ ...entry, status: currentStatus === 'ativo' ? 'inativo' : 'ativo' });
      toast.success('Status atualizado');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Lista Negra</h2>
          <p className="text-sm text-muted-foreground">
            Pessoas e empresas restritas
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
        <p className="text-xs text-red-700 dark:text-red-300">
          Pessoas nesta lista devem ser impedidas de entrar no recinto. Verifique sempre antes de autorizar acessos.
        </p>
      </div>

      {/* List */}
      <div className="space-y-3">
        {listaNegra.map((entry) => (
          <Card
            key={entry.id}
            className={entry.status === 'ativo' ? 'border-red-200 dark:border-red-900/50' : 'opacity-60'}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 mt-0.5">
                    <ShieldBan className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{entry.nome}</h3>
                      <Badge
                        className={
                          entry.status === 'ativo'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        {entry.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {entry.empresa && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Empresa: {entry.empresa}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {entry.motivo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrado em: {format(new Date(entry.data), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleStatus(entry.id, entry.status)}
                  >
                    {entry.status === 'ativo' ? 'Desativar' : 'Reativar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      removeListaNegra(entry.id);
                      toast.success('Entrada removida');
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Entrada na Lista Negra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <AutocompleteInput
                placeholder="Nome da pessoa ou empresa"
                value={nome}
                onChange={setNome}
                onSelect={(s) => {
                  if (s.data?.name) setNome(s.data.name);
                  if (s.data?.company) setEmpresa(s.data.company);
                }}
                suggestions={nameSuggestions}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <AutocompleteInput
                placeholder="Nome da empresa (opcional)"
                value={empresa}
                onChange={setEmpresa}
                suggestions={empresaSuggestions}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                placeholder="Descreva o motivo da restrição..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={status === 'ativo' ? 'default' : 'outline'}
                  size="sm"
                  className={status === 'ativo' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setStatus('ativo')}
                >
                  Ativo
                </Button>
                <Button
                  type="button"
                  variant={status === 'inativo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('inativo')}
                >
                  Inativo
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
