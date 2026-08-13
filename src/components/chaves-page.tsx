'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  KeyRound,
  Inbox,
  Clock,
  Calendar,
  User,
  LogIn,
  LogOut,
  X,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { type RegistroChave, type Pessoa } from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';
import { format } from 'date-fns';
import { toast } from 'sonner';

type StatusFilter = 'aberto' | 'finalizado';

function getSecondaryFields(r: RegistroChave): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [
    { label: 'Chave', value: r.chave },
    { label: 'Retirada', value: r.horarioRetirada },
  ];
  if (r.porteiroRetirada) fields.push({ label: 'Retirada por', value: r.porteiroRetirada });
  if (r.horarioDevolucao) {
    fields.push({ label: 'Devolução', value: r.horarioDevolucao });
  }
  if (r.porteiroDevolucao) fields.push({ label: 'Devolução por', value: r.porteiroDevolucao });
  return fields;
}

function getAllFields(r: RegistroChave): { label: string; value: string }[] {
  return [
    { label: 'Nome', value: r.nome },
    { label: 'Chave', value: r.chave },
    { label: 'Data', value: r.data },
    { label: 'Horário de Retirada', value: r.horarioRetirada },
    { label: 'Horário de Devolução', value: r.horarioDevolucao || '-' },
    { label: 'Porteiro (Retirada)', value: r.porteiroRetirada || '-' },
    { label: 'Porteiro (Devolução)', value: r.porteiroDevolucao || '-' },
  ];
}

interface ChavesModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: { nome?: string; chave?: string };
  modo: 'retirada' | 'devolucao';
}

function ChavesModal({ open, onClose, prefill, modo }: ChavesModalProps) {
  const { registrosChaves, addRegistroChave, registrarDevolucaoChave, pessoas, ramais, user } = useAppStore();
  const isRetirada = modo === 'retirada';
  const [formData, setFormData] = useState<Record<string, string>>({ nome: '', chave: '' });

  useEffect(() => {
    if (open) {
      setFormData({
        nome: prefill?.nome || '',
        chave: prefill?.chave || '',
      });
    }
  }, [open, prefill]);

  const nomeSuggestions = useMemo(() => {
    const map = new Map<string, { data: Record<string, string>; sublabel: string }>();

    pessoas.filter((p: Pessoa) => !p.inativo).forEach((p) => {
      if (!map.has(p.nome)) {
        map.set(p.nome, {
          data: { name: p.nome, doc: p.rgCpf || '', department: p.departamento || '', company: p.empresa || '' },
          sublabel: [p.tipo, p.empresa, p.departamento].filter(Boolean).join(' — ') || p.rgCpf || '',
        });
      }
    });

    ramais.forEach((r) => {
      if (!map.has(r.nome)) {
        map.set(r.nome, {
          data: { name: r.nome, department: r.departamento || '' },
          sublabel: r.departamento ? `${r.departamento} — Ramal ${r.ramal}` : `Ramal ${r.ramal}`,
        });
      }
    });

    registrosChaves.forEach((r) => {
      if (!r.nome) return;
      if (map.has(r.nome)) {
        const existing = map.get(r.nome)!;
        map.set(r.nome, {
          data: { ...existing.data, name: r.nome },
          sublabel: existing.sublabel || r.chave,
        });
      } else {
        map.set(r.nome, {
          data: { name: r.nome },
          sublabel: r.chave,
        });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: 'historico' as 'historico',
      data,
    }));
  }, [pessoas, ramais, registrosChaves]);

  const chaveSuggestions = useMemo(() => {
    const map = new Map<string, { data: Record<string, string>; sublabel: string }>();
    registrosChaves.forEach((r) => {
      if (!r.chave) return;
      if (!map.has(r.chave)) {
        map.set(r.chave, {
          data: { chave: r.chave, name: r.nome },
          sublabel: r.nome || '',
        });
      }
    });
    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: 'historico' as 'historico',
      data,
    }));
  }, [registrosChaves]);

  const handleSelectNome = (s: AutocompleteSuggestion) => {
    const d = s.data || {};
    if (d.chave) {
      setFormData((prev) => ({ ...prev, nome: s.label, chave: prev.chave || d.chave || '' }));
    } else {
      setFormData((prev) => ({ ...prev, nome: s.label }));
    }
  };

  const handleSelectChave = (s: AutocompleteSuggestion) => {
    const d = s.data || {};
    setFormData((prev) => ({
      ...prev,
      chave: s.label,
      nome: prev.nome || d.name || '',
    }));
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const nome = formData.nome?.trim();
    const chave = formData.chave?.trim();
    if (!nome) {
      toast.error('Preencha o nome');
      return;
    }
    if (!chave) {
      toast.error('Preencha a chave');
      return;
    }

    if (isRetirada) {
      const registro: RegistroChave = {
        id: `chave_${Date.now()}`,
        nome,
        chave,
        data: format(new Date(), 'dd/MM/yyyy'),
        horarioRetirada: format(new Date(), 'HH:mm'),
        horarioDevolucao: '',
        porteiroRetirada: user?.nome || '',
      };
      addRegistroChave(registro);
      toast.success('Retirada registrada com sucesso!');
    } else {
      const aberto = registrosChaves.find(
        (r) =>
          !r.horarioDevolucao &&
          r.nome.trim().toLowerCase() === nome.toLowerCase() &&
          r.chave.trim().toLowerCase() === chave.toLowerCase()
      );
      if (!aberto) {
        toast.error('Nenhuma retirada em aberto encontrada para este nome e chave.');
        return;
      }
      registrarDevolucaoChave(aberto.id);
      toast.success('Devolução registrada com sucesso!');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            {isRetirada ? (
              <LogIn className="h-5 w-5 text-emerald-600" />
            ) : (
              <LogOut className="h-5 w-5 text-amber-600" />
            )}
            {isRetirada ? 'Nova Retirada' : 'Registrar Devolução de Chave'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base">Nome *</Label>
            <AutocompleteInput
              value={formData.nome || ''}
              onChange={(v) => updateField('nome', v)}
              onSelect={handleSelectNome}
              suggestions={nomeSuggestions}
              placeholder="Nome da pessoa"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">Chave *</Label>
            <AutocompleteInput
              value={formData.chave || ''}
              onChange={(v) => updateField('chave', v)}
              onSelect={handleSelectChave}
              suggestions={chaveSuggestions}
              placeholder="Ex: SALA 101, PORTARIA"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">
              {isRetirada ? 'Horário de Retirada' : 'Horário de Devolução'}
            </Label>
            <Input
              value={isRetirada ? format(new Date(), 'HH:mm') : format(new Date(), 'HH:mm')}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className={isRetirada ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {isRetirada ? <LogIn className="h-4 w-4 mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ChavesPage() {
  const { registrosChaves, user } = useAppStore();
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('aberto');
  const [isLoading, setIsLoading] = useState(true);
  const [retiradaOpen, setRetiradaOpen] = useState(false);
  const [devolucaoOpen, setDevolucaoOpen] = useState(false);
  const [devolucaoPrefill, setDevolucaoPrefill] = useState<{ nome?: string; chave?: string } | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroChave | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    if (registrosChaves.length > 0) {
      setIsLoading(false);
    }
    return () => clearTimeout(timer);
  }, [registrosChaves.length]);

  const filteredRegistros = useMemo(() => {
    let result = registrosChaves.filter((r) => {
      const hasDevolucao = r.horarioDevolucao !== '';
      if (statusFilter === 'aberto' && hasDevolucao) return false;
      if (statusFilter === 'finalizado' && !hasDevolucao) return false;
      if (busca) {
        const search = busca.toLowerCase();
        const fields = Object.values(r).filter((v) => typeof v === 'string');
        return fields.some((v) => v.toLowerCase().includes(search));
      }
      return true;
    });

    result.sort((a, b) => {
      try {
        const [diaA, mesA, anoA] = a.data.split('/');
        const [horaA, minA] = a.horarioRetirada.split(':');
        const dateA = new Date(Number(anoA), Number(mesA) - 1, Number(diaA), Number(horaA) || 0, Number(minA) || 0).getTime();

        const [diaB, mesB, anoB] = b.data.split('/');
        const [horaB, minB] = b.horarioRetirada.split(':');
        const dateB = new Date(Number(anoB), Number(mesB) - 1, Number(diaB), Number(horaB) || 0, Number(minB) || 0).getTime();
        return dateB - dateA;
      } catch (e) {
        return 0;
      }
    });

    return result;
  }, [registrosChaves, busca, statusFilter]);

  const COLS = 2;
  const virtualRows = useMemo(() => {
    const rows: RegistroChave[][] = [];
    for (let i = 0; i < filteredRegistros.length; i += COLS) {
      rows.push(filteredRegistros.slice(i, i + COLS));
    }
    return rows;
  }, [filteredRegistros]);

  const rowVirtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 200, []),
    overscan: 3,
  });

  const handleOpenDetail = (r: RegistroChave) => {
    setSelectedRegistro(r);
    setDetailOpen(true);
  };

  const handleDevolver = (r?: RegistroChave) => {
    if (r) {
      setDevolucaoPrefill({ nome: r.nome, chave: r.chave });
    } else {
      setDevolucaoPrefill(undefined);
    }
    setDevolucaoOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Top section */}
      <div className="p-4 md:p-6 pb-0 space-y-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, chave..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList className="w-full grid grid-cols-2 h-10">
            <TabsTrigger
              value="aberto"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Em aberto
            </TabsTrigger>
            <TabsTrigger
              value="finalizado"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Finalizados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content area */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pt-3 pb-44"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="opacity-60 border-dashed">
                <CardContent className="p-3.5 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRegistros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <KeyRound className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium mb-1">
              {statusFilter === 'aberto'
                ? 'Nenhuma chave retirada em aberto'
                : 'Nenhuma devolução registrada'}
            </p>
            <p className="text-sm text-muted-foreground/70">
              Toque em Registrar Retirada para começar.
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowItems = virtualRows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '1rem',
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rowItems.map((r) => {
                      const hasDevolucao = r.horarioDevolucao !== '';
                      return (
                        <Card
                          key={r.id}
                          className="cursor-pointer transition-colors active:scale-[0.98] hover:bg-muted/50"
                          onClick={() => handleOpenDetail(r)}
                        >
                          <CardContent className="p-3.5">
                            <div className="flex items-center gap-2 flex-wrap mb-2.5">
                              <Badge variant="secondary" className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
                                <KeyRound className="h-3 w-3" />
                                Controle de Chaves
                              </Badge>
                              {hasDevolucao ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-1.5 py-0">
                                  Devolvida
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs px-1.5 py-0">
                                  Pendente
                                </Badge>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-bold text-lg truncate">{r.nome}</h3>
                              <div className="mt-1 space-y-0.5">
                                {getSecondaryFields(r).map((field) => (
                                  <p key={field.label} className="text-base leading-snug text-muted-foreground">
                                    <span className="font-medium">{field.label}:</span> {field.value || '-'}
                                  </p>
                                ))}
                              </div>

                              <div className="flex flex-nowrap items-center gap-x-1.5 sm:gap-x-3 mt-2.5 pt-2 border-t border-border/40 text-xs sm:text-sm md:text-base text-muted-foreground overflow-x-auto scrollbar-none">
                                <span className="flex items-center gap-1 shrink-0">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {r.data}
                                </span>
                                {r.horarioRetirada && (
                                  <span className="flex items-center gap-1 shrink-0">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Retirada às: {r.horarioRetirada}
                                  </span>
                                )}
                                {hasDevolucao && (
                                  <span className="flex items-center gap-1 shrink-0 text-emerald-600 dark:text-emerald-400">
                                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Devolução às: {r.horarioDevolucao}
                                  </span>
                                )}
                              </div>

                              {!hasDevolucao && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3 w-full border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDevolver(r);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1.5" />
                                  Registrar Devolução
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-16 left-0 right-0 z-30 pt-3 pb-7 px-4 md:px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-13 border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-base font-semibold"
            onClick={() => handleDevolver()}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Devolução
          </Button>
          <Button
            className="h-13 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-lg"
            onClick={() => setRetiradaOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Retirada
          </Button>
        </div>
      </div>

      <ChavesModal
        open={retiradaOpen}
        onClose={() => setRetiradaOpen(false)}
        modo="retirada"
      />

      <ChavesModal
        open={devolucaoOpen}
        onClose={() => { setDevolucaoOpen(false); setDevolucaoPrefill(undefined); }}
        prefill={devolucaoPrefill}
        modo="devolucao"
      />

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={(v) => { if (!v) { setDetailOpen(false); setSelectedRegistro(null); } }}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <KeyRound className="h-5 w-5 text-emerald-600" />
              <span className="flex-1">Detalhes da Retirada</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRegistro && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                {getAllFields(selectedRegistro).map((field) => (
                  <div key={field.label} className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">{field.label}</span>
                    <span className="text-sm text-foreground text-right">{field.value || '-'}</span>
                  </div>
                ))}
              </div>

              {!selectedRegistro.horarioDevolucao && (
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    setDetailOpen(false);
                    handleDevolver(selectedRegistro);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Registrar Devolução
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
