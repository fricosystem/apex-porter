'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus, ClipboardCheck, Clock, CheckCircle2, AlertCircle,
  ArrowRightLeft, Trash2, Inbox, Calendar, Clock4, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import {
  ITENS_CHECKLIST_PADRAO,
  type ChecklistTurno,
  type ItemChecklist,
  type StatusChecklist,
} from '@/lib/data';
import { toast } from 'sonner';

type StatusFilter = 'todos' | 'pendente' | 'concluido';

const statusColors: Record<StatusChecklist, string> = {
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  concluido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const statusLabels: Record<StatusChecklist, string> = {
  pendente: 'Pendente',
  concluido: 'Concluída',
};

const statusIcons: Record<StatusChecklist, React.ElementType> = {
  pendente: AlertCircle,
  concluido: CheckCircle2,
};

export default function ChecklistTurnoPage() {
  const { checklists, addChecklist, updateChecklist, removeChecklist, user, logout } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  // Rascunhos em localStorage
  const [rascunhos, setRascunhos] = useState<ChecklistTurno[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem('apex_porter_rascunhos_plantao');
    if (stored) {
      try { setRascunhos(JSON.parse(stored)); } catch {}
    }
  }, []);

  const saveRascunhosLS = (list: ChecklistTurno[]) => {
    setRascunhos(list);
    localStorage.setItem('apex_porter_rascunhos_plantao', JSON.stringify(list));
  };

  // Merge rascunhos and store checklists with strict deduplication
  const allChecklists = useMemo(() => {
    const seen = new Set<string>();
    const result: ChecklistTurno[] = [];

    for (const r of rascunhos) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        result.push(r);
      }
    }

    for (const ck of checklists) {
      if (!seen.has(ck.id)) {
        seen.add(ck.id);
        result.push(ck);
      }
    }

    return result;
  }, [rascunhos, checklists]);

  // New checklist dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [porteiroSaindo, setPorteiroSaindo] = useState('');
  const [porteiroEntrando, setPorteiroEntrando] = useState(user?.nome || '');

  // Detail / fill dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ChecklistTurno | null>(null);
  const [editItens, setEditItens] = useState<ItemChecklist[]>([]);
  const [editOcorrencias, setEditOcorrencias] = useState('');
  const [editCorrespondencias, setEditCorrespondencias] = useState('');
  const [editChaves, setEditChaves] = useState('');
  const [editObsGerais, setEditObsGerais] = useState('');

  // Stats
  const stats = useMemo(() => ({
    total: allChecklists.length,
    pendentes: allChecklists.filter(c => c.status === 'pendente').length,
    concluidas: allChecklists.filter(c => c.status === 'concluido').length,
  }), [allChecklists]);

  // Filtered list
  const filtered = useMemo(() => {
    return allChecklists.filter(ck => {
      if (statusFilter !== 'todos' && ck.status !== statusFilter) return false;
      return true;
    });
  }, [allChecklists, statusFilter]);

  // Helper: count checked items
  const countChecked = (itens: ItemChecklist[]) => itens.filter(i => i.checked).length;

  // Open new checklist dialog
  const handleOpenNew = () => {
    setPorteiroSaindo('');
    setPorteiroEntrando(user?.nome || '');
    setNewDialogOpen(true);
  };

  // Open detail dialog
  const handleOpenDetail = (ck: ChecklistTurno) => {
    setSelected(ck);
    setEditItens(ck.itens.map(i => ({ ...i })));
    setEditOcorrencias(ck.ocorrenciasRepassadas);
    setEditCorrespondencias(ck.correspondenciasPendentes);
    setEditChaves(ck.chavesPendentes);
    setEditObsGerais(ck.observacoesGerais);
    setDetailOpen(true);
  };

  // Create new checklist draft
  const handleCreate = () => {
    if (!porteiroSaindo.trim()) {
      toast.error('Informe o nome do porteiro que está saindo');
      return;
    }
    if (!porteiroEntrando.trim()) {
      toast.error('Informe o nome do porteiro que está entrando');
      return;
    }

    const now = new Date();
    const ckId = `ck_${Date.now()}`;
    const newChecklist: ChecklistTurno = {
      id: ckId,
      data: format(now, 'yyyy-MM-dd'),
      horarioPassagem: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      porteiroSaindo: porteiroSaindo.trim(),
      porteiroEntrando: porteiroEntrando.trim(),
      itens: ITENS_CHECKLIST_PADRAO.map((item, idx) => ({
        id: `${ckId}_it${idx}`,
        checklistId: ckId,
        item,
        checked: false,
        observacao: '',
      })),
      ocorrenciasRepassadas: '',
      correspondenciasPendentes: '',
      chavesPendentes: '',
      observacoesGerais: '',
      status: 'pendente',
    };

    const updatedRascunhos = [newChecklist, ...rascunhos];
    saveRascunhosLS(updatedRascunhos);

    toast.success('Rascunho da passagem iniciado!');
    setNewDialogOpen(false);
    handleOpenDetail(newChecklist);
  };

  // Toggle item check
  const handleToggleItem = (itemId: string) => {
    setEditItens(prev => prev.map(i =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    ));
  };

  // Update item observation
  const handleItemObs = (itemId: string, obs: string) => {
    setEditItens(prev => prev.map(i =>
      i.id === itemId ? { ...i, observacao: obs } : i
    ));
  };

  // Save draft locally
  const handleSalvarRascunho = () => {
    if (!selected) return;
    const updated: ChecklistTurno = {
      ...selected,
      itens: editItens,
      ocorrenciasRepassadas: editOcorrencias,
      correspondenciasPendentes: editCorrespondencias,
      chavesPendentes: editChaves,
      observacoesGerais: editObsGerais,
    };

    const updatedList = rascunhos.map(r => r.id === updated.id ? updated : r);
    if (!rascunhos.some(r => r.id === updated.id)) {
      updatedList.unshift(updated);
    }
    saveRascunhosLS(updatedList);
    setSelected(updated);
    toast.success('Rascunho salvo localmente!');
    setDetailOpen(false);
  };

  // Concluir passagem
  const handleConcluir = () => {
    if (!selected) return;

    const uncheckedItems = editItens.filter(i => !i.checked);
    if (uncheckedItems.length > 0) {
      toast.error(`${uncheckedItems.length} item(ns) não conferido(s). Verifique todos os itens antes de concluir.`);
      return;
    }

    const updated: ChecklistTurno = {
      ...selected,
      itens: editItens,
      ocorrenciasRepassadas: editOcorrencias,
      correspondenciasPendentes: editCorrespondencias,
      chavesPendentes: editChaves,
      observacoesGerais: editObsGerais,
      status: 'concluido',
    };

    addChecklist(updated);

    const remainingRascunhos = rascunhos.filter(r => r.id !== updated.id);
    saveRascunhosLS(remainingRascunhos);

    setSelected(updated);
    toast.success('Passagem de plantão concluída! Encerrando sessão...');
    setDetailOpen(false);
    logout();
  };

  // Delete
  const handleDelete = (id: string) => {
    if (rascunhos.some(r => r.id === id)) {
      const remaining = rascunhos.filter(r => r.id !== id);
      saveRascunhosLS(remaining);
      toast.success('Rascunho removido');
    } else {
      removeChecklist(id);
      toast.success('Passagem removida');
    }
    if (selected?.id === id) {
      setDetailOpen(false);
      setSelected(null);
    }
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    try {
      const parsed = new Date(dateStr + 'T00:00:00');
      return format(parsed, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-600" />
            Passagem de Plantão
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Checklist de turno</p>
        </div>
        <Button
          onClick={handleOpenNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Passagem
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center"
        >
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.total}</p>
          <p className="text-[11px] font-medium text-muted-foreground">Total de Passagens</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center"
        >
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendentes}</p>
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Pendentes</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center"
        >
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.concluidas}</p>
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Concluídas</p>
        </motion.div>
      </div>

      {/* Filter bar */}
      <div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full bg-muted/50 border-0 h-10">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checklist cards list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <p className="text-lg font-medium mb-1">Nenhuma passagem encontrada</p>
          <p className="text-sm text-muted-foreground/70">Toque em Nova Passagem para iniciar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ck, idx) => {
            const checkedCount = countChecked(ck.itens);
            const totalItens = ck.itens.length;
            const progressPct = totalItens > 0 ? (checkedCount / totalItens) * 100 : 0;
            const StatusIcon = statusIcons[ck.status];

            return (
              <motion.div
                key={ck.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  onClick={() => handleOpenDetail(ck)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-muted shrink-0">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {formatDateDisplay(ck.data)}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock4 className="h-3.5 w-3.5" />{ck.horarioPassagem}
                          </span>
                          <Badge className={statusColors[ck.status] + ' text-[10px] px-2 py-0.5'}>
                            {statusLabels[ck.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                          <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            <span className="font-medium">{ck.porteiroSaindo}</span>
                            <span className="mx-1">→</span>
                            <span className="font-medium">{ck.porteiroEntrando}</span>
                          </span>
                        </p>
                        {/* Progress */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {checkedCount}/{totalItens} itens conferidos
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(ck.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Checklist Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={v => { if (!v) setNewDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              Nova Passagem de Plantão
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Porteiro Saindo *</Label>
              <Input
                value={porteiroSaindo}
                onChange={e => setPorteiroSaindo(e.target.value)}
                placeholder="Nome do porteiro que está saindo"
              />
            </div>
            <div className="space-y-2">
              <Label>Porteiro Entrando *</Label>
              <Input
                value={porteiroEntrando}
                onChange={e => setPorteiroEntrando(e.target.value)}
                placeholder="Nome do porteiro que está entrando"
              />
            </div>
            <div className="space-y-2">
              <Label>Horário da Passagem</Label>
              <Input
                type="time"
                value={`${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Preenchido automaticamente com o horário atual</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">
                Ao criar, será gerado um checklist com {ITENS_CHECKLIST_PADRAO.length} itens padrão para conferência durante a passagem de plantão.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">Criar Passagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Fill Dialog */}
      <Dialog open={detailOpen} onOpenChange={v => { if (!v) { setDetailOpen(false); setSelected(null); } }}>
        <DialogContent className="sm:max-w-lg" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              Detalhes da Passagem
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex justify-center">
                <Badge className={`${statusColors[selected.status]} text-sm px-4 py-1`}>
                  {statusLabels[selected.status]}
                </Badge>
              </div>

              {/* Info block */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Data</span>
                  <span className="text-sm text-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />{formatDateDisplay(selected.data)}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Horário</span>
                  <span className="text-sm text-foreground flex items-center gap-1">
                    <Clock4 className="h-3.5 w-3.5" />{selected.horarioPassagem}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Saindo</span>
                  <span className="text-sm text-foreground font-medium">{selected.porteiroSaindo}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Entrando</span>
                  <span className="text-sm text-foreground font-medium">{selected.porteiroEntrando}</span>
                </div>
              </div>

              {/* Progress summary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso do Checklist</span>
                  <span className="text-sm text-muted-foreground">
                    {countChecked(selected.status === 'pendente' ? editItens : selected.itens)}/{selected.itens.length} itens
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${selected.itens.length > 0
                        ? (countChecked(selected.status === 'pendente' ? editItens : selected.itens) / selected.itens.length) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Interactive checklist (pendente) or read-only (concluido) */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Itens do Checklist</h3>
                <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1 rounded-xl border border-border/50 p-2">
                  {(selected.status === 'pendente' ? editItens : selected.itens).map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        {selected.status === 'pendente' ? (
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => handleToggleItem(item.id)}
                            className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                        ) : (
                          <Checkbox
                            checked={item.checked}
                            disabled
                            className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                        )}
                        <span className={`text-sm leading-snug ${item.checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {item.item}
                        </span>
                      </div>
                      {selected.status === 'pendente' && item.checked && (
                        <div className="pl-8 pr-2 pb-1">
                          <Input
                            value={item.observacao}
                            onChange={e => handleItemObs(item.id, e.target.value)}
                            placeholder="Observação (opcional)"
                            className="h-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
                          />
                        </div>
                      )}
                      {selected.status === 'concluido' && item.observacao && (
                        <div className="pl-8 pr-2 pb-1">
                          <p className="text-xs text-muted-foreground italic">Obs: {item.observacao}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Text areas */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Ocorrências Repassadas</Label>
                  {selected.status === 'pendente' ? (
                    <Textarea
                      value={editOcorrencias}
                      onChange={e => setEditOcorrencias(e.target.value)}
                      placeholder="Descreva as ocorrências repassadas..."
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 min-h-[2.5rem]">
                      {selected.ocorrenciasRepassadas || <span className="text-muted-foreground italic">Nenhuma</span>}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Correspondências Pendentes</Label>
                  {selected.status === 'pendente' ? (
                    <Textarea
                      value={editCorrespondencias}
                      onChange={e => setEditCorrespondencias(e.target.value)}
                      placeholder="Correspondências não retiradas..."
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 min-h-[2.5rem]">
                      {selected.correspondenciasPendentes || <span className="text-muted-foreground italic">Nenhuma</span>}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Chaves Pendentes</Label>
                  {selected.status === 'pendente' ? (
                    <Textarea
                      value={editChaves}
                      onChange={e => setEditChaves(e.target.value)}
                      placeholder="Chaves não devolvidas ou pendentes..."
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 min-h-[2.5rem]">
                      {selected.chavesPendentes || <span className="text-muted-foreground italic">Nenhuma</span>}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Observações Gerais</Label>
                  {selected.status === 'pendente' ? (
                    <Textarea
                      value={editObsGerais}
                      onChange={e => setEditObsGerais(e.target.value)}
                      placeholder="Observações adicionais..."
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 min-h-[2.5rem]">
                      {selected.observacoesGerais || <span className="text-muted-foreground italic">Nenhuma</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {selected.status === 'pendente' && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleConcluir}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Concluir Passagem
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSalvarRascunho}
                    className="w-full h-10 font-medium"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Rascunho
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
