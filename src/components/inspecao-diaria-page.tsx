'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus, Eye, Clock, CheckCircle2, AlertCircle, AlertTriangle,
  Trash2, Inbox, Calendar, Clock4, Save, ShieldCheck, XCircle,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import {
  ITENS_INSPECAO_PADRAO,
  type InspecaoDiaria,
  type ItemInspecao,
  type StatusInspecao,
  type StatusItemInspecao,
} from '@/lib/data';
import { toast } from 'sonner';

type StatusFilter = 'todos' | StatusInspecao;
type TurnoFilter = 'todos' | 'diurno' | 'noturno';

const statusColors: Record<StatusInspecao, string> = {
  em_andamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  concluida: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  aprovada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const statusLabels: Record<StatusInspecao, string> = {
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  aprovada: 'Aprovada',
};

const statusIcons: Record<StatusInspecao, React.ElementType> = {
  em_andamento: Clock,
  concluida: AlertCircle,
  aprovada: CheckCircle2,
};

const itemStatusColors: Record<StatusItemInspecao, string> = {
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  nao_conforme: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  inoperante: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
};

const itemStatusLabels: Record<StatusItemInspecao, string> = {
  ok: 'OK',
  nao_conforme: 'Não Conforme',
  inoperante: 'Inoperante',
};

const itemStatusIcons: Record<StatusItemInspecao, React.ElementType> = {
  ok: CheckCircle2,
  nao_conforme: AlertTriangle,
  inoperante: XCircle,
};

const turnoLabels: Record<string, string> = {
  diurno: 'Diurno',
  noturno: 'Noturno',
};

export default function InspecaoDiariaPage() {
  const { inspecoes, addInspecao, updateInspecao, removeInspecao, user } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [turnoFilter, setTurnoFilter] = useState<TurnoFilter>('todos');

  // New inspection dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTurno, setNewTurno] = useState<'diurno' | 'noturno'>('diurno');
  const [newSupervisor, setNewSupervisor] = useState('');

  // Detail / fill dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<InspecaoDiaria | null>(null);
  const [editItens, setEditItens] = useState<ItemInspecao[]>([]);
  const [editObsGerais, setEditObsGerais] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Stats
  const stats = useMemo(() => ({
    total: inspecoes.length,
    emAndamento: inspecoes.filter(i => i.status === 'em_andamento').length,
    concluidas: inspecoes.filter(i => i.status === 'concluida').length,
    aprovadas: inspecoes.filter(i => i.status === 'aprovada').length,
  }), [inspecoes]);

  // Filtered list
  const filtered = useMemo(() => {
    return inspecoes.filter(insp => {
      if (statusFilter !== 'todos' && insp.status !== statusFilter) return false;
      if (turnoFilter !== 'todos' && insp.turno !== turnoFilter) return false;
      return true;
    });
  }, [inspecoes, statusFilter, turnoFilter]);

  // Helper: count items by status
  const countByStatus = (itens: ItemInspecao[], status: StatusItemInspecao) =>
    itens.filter(i => i.status === status).length;

  const countInspected = (itens: ItemInspecao[]) =>
    itens.filter(i => i.status !== 'ok' || i.observacao).length;

  // Toggle expanded item
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // Open new inspection dialog
  const handleOpenNew = () => {
    setNewTurno('diurno');
    setNewSupervisor('');
    setNewDialogOpen(true);
  };

  // Create new inspection
  const handleCreate = () => {
    if (!newSupervisor.trim()) {
      toast.error('Informe o nome do supervisor responsável');
      return;
    }

    const now = new Date();
    const inspId = `insp_${Date.now()}`;
    const newInspecao: InspecaoDiaria = {
      id: inspId,
      data: format(now, 'yyyy-MM-dd'),
      turno: newTurno,
      itens: ITENS_INSPECAO_PADRAO.map((item, idx) => ({
        id: `${inspId}_it${idx}`,
        inspecaoId: inspId,
        item,
        status: 'ok' as StatusItemInspecao,
        observacao: '',
        acaoCorretiva: '',
      })),
      observacoesGerais: '',
      porteiro: user?.nome || 'Porteiro',
      supervisor: newSupervisor.trim(),
      status: 'em_andamento',
    };

    addInspecao(newInspecao);
    toast.success('Inspeção diária criada!');
    setNewDialogOpen(false);
  };

  // Open detail dialog
  const handleOpenDetail = (insp: InspecaoDiaria) => {
    setSelected(insp);
    setEditItens(insp.itens.map(i => ({ ...i })));
    setEditObsGerais(insp.observacoesGerais);
    setExpandedItems(new Set());
    setDetailOpen(true);
  };

  // Update item status
  const handleItemStatusChange = (itemId: string, status: StatusItemInspecao) => {
    setEditItens(prev => prev.map(i =>
      i.id === itemId ? { ...i, status } : i
    ));
  };

  // Update item observation
  const handleItemObs = (itemId: string, obs: string) => {
    setEditItens(prev => prev.map(i =>
      i.id === itemId ? { ...i, observacao: obs } : i
    ));
  };

  // Update item corrective action
  const handleItemAcao = (itemId: string, acao: string) => {
    setEditItens(prev => prev.map(i =>
      i.id === itemId ? { ...i, acaoCorretiva: acao } : i
    ));
  };

  // Save changes
  const handleSaveChanges = () => {
    if (!selected) return;
    const updated: InspecaoDiaria = {
      ...selected,
      itens: editItens,
      observacoesGerais: editObsGerais,
    };
    updateInspecao(updated);
    setSelected(updated);
    toast.success('Alterações salvas!');
  };

  // Concluir inspeção
  const handleConcluir = () => {
    if (!selected) return;
    const updated: InspecaoDiaria = {
      ...selected,
      itens: editItens,
      observacoesGerais: editObsGerais,
      status: 'concluida',
    };
    updateInspecao(updated);
    setSelected(updated);
    toast.success('Inspeção concluída! Aguardando aprovação do supervisor.');
    setDetailOpen(false);
  };

  // Aprovar inspeção
  const handleAprovar = () => {
    if (!selected) return;
    const now = new Date();
    const updated: InspecaoDiaria = {
      ...selected,
      itens: editItens,
      observacoesGerais: editObsGerais,
      status: 'aprovada',
      dataAprovacao: format(now, 'yyyy-MM-dd HH:mm'),
    };
    updateInspecao(updated);
    setSelected(updated);
    toast.success('Inspeção aprovada pelo supervisor!');
    setDetailOpen(false);
  };

  // Delete
  const handleDelete = (id: string) => {
    removeInspecao(id);
    toast.success('Inspeção removida');
    if (selected?.id === id) {
      setDetailOpen(false);
      setSelected(null);
    }
  };

  // Format date
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
            <Eye className="h-6 w-6 text-emerald-600" />
            Inspeção Diária
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Verificação de equipamentos e instalações</p>
        </div>
        <Button
          onClick={handleOpenNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Inspeção
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: stats.total, bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300' },
          { label: 'Em Andamento', value: stats.emAndamento, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
          { label: 'Concluídas', value: stats.concluidas, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
          { label: 'Aprovadas', value: stats.aprovadas, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`${stat.bg} rounded-xl p-2.5 text-center`}
          >
            <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-[10px] font-medium text-muted-foreground leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="flex-1 bg-muted/50 border-0 h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={turnoFilter} onValueChange={v => setTurnoFilter(v as TurnoFilter)}>
          <SelectTrigger className="flex-1 bg-muted/50 border-0 h-10">
            <SelectValue placeholder="Turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Turnos</SelectItem>
            <SelectItem value="diurno">Diurno</SelectItem>
            <SelectItem value="noturno">Noturno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inspection cards list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <p className="text-lg font-medium mb-1">Nenhuma inspeção encontrada</p>
          <p className="text-sm text-muted-foreground/70">Toque em Nova Inspeção para iniciar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insp, idx) => {
            const okCount = countByStatus(insp.itens, 'ok');
            const naoConfCount = countByStatus(insp.itens, 'nao_conforme');
            const inopCount = countByStatus(insp.itens, 'inoperante');
            const totalItens = insp.itens.length;
            const progressPct = totalItens > 0 ? (okCount / totalItens) * 100 : 0;
            const StatusIcon = statusIcons[insp.status];

            return (
              <motion.div
                key={insp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  onClick={() => handleOpenDetail(insp)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-muted shrink-0">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {formatDateDisplay(insp.data)}
                          </span>
                          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5">
                            {turnoLabels[insp.turno]}
                          </Badge>
                          <Badge className={statusColors[insp.status] + ' text-[10px] px-2 py-0.5'}>
                            {statusLabels[insp.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          Porteiro: <span className="font-medium">{insp.porteiro}</span>
                          {insp.dataAprovacao && (
                            <span className="ml-2 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              Aprovada em {insp.dataAprovacao}
                            </span>
                          )}
                        </p>
                        {/* Item status summary */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{okCount} OK</span>
                          {naoConfCount > 0 && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{naoConfCount} Não Conforme</span>
                          )}
                          {inopCount > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{inopCount} Inoperante</span>
                          )}
                        </div>
                        {/* Progress */}
                        <div className="mt-2">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                          handleDelete(insp.id);
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

      {/* New Inspection Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={v => { if (!v) setNewDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              Nova Inspeção Diária
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Turno *</Label>
              <Select value={newTurno} onValueChange={v => setNewTurno(v as 'diurno' | 'noturno')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diurno">Diurno</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Porteiro Responsável</Label>
              <Input
                value={user?.nome || 'Porteiro'}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Preenchido automaticamente</p>
            </div>
            <div className="space-y-2">
              <Label>Supervisor *</Label>
              <Input
                value={newSupervisor}
                onChange={e => setNewSupervisor(e.target.value)}
                placeholder="Nome do supervisor responsável"
              />
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">
                Ao criar, será gerada uma inspeção com {ITENS_INSPECAO_PADRAO.length} itens padrão para verificação de equipamentos, instalações e sistemas de segurança.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">Criar Inspeção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Fill Dialog */}
      <Dialog open={detailOpen} onOpenChange={v => { if (!v) { setDetailOpen(false); setSelected(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              Detalhes da Inspeção
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
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Turno</span>
                  <span className="text-sm text-foreground font-medium">{turnoLabels[selected.turno]}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Porteiro</span>
                  <span className="text-sm text-foreground font-medium">{selected.porteiro}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Supervisor</span>
                  <span className="text-sm text-foreground font-medium">{selected.supervisor}</span>
                </div>
                {selected.dataAprovacao && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">Aprovação</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />{selected.dataAprovacao}
                    </span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="flex items-center gap-2">
                {(['ok', 'nao_conforme', 'inoperante'] as StatusItemInspecao[]).map(status => {
                  const count = countByStatus(selected.status === 'em_andamento' ? editItens : selected.itens, status);
                  const Icon = itemStatusIcons[status];
                  return (
                    <div key={status} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${itemStatusColors[status]}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{count}</span>
                      <span className="text-[10px]">{itemStatusLabels[status]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Interactive items list (em_andamento) or read-only */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Itens da Inspeção ({selected.itens.length} itens)</h3>
                <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5 rounded-xl border border-border/50 p-2">
                  {(selected.status === 'em_andamento' ? editItens : selected.itens).map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    const ItemIcon = itemStatusIcons[item.status];
                    const isEditable = selected.status === 'em_andamento';

                    return (
                      <div key={item.id} className="rounded-lg border border-border/50 overflow-hidden">
                        {/* Item header */}
                        <div
                          className={`flex items-center gap-2.5 p-2.5 transition-colors ${
                            isEditable ? 'cursor-pointer hover:bg-muted/50' : ''
                          }`}
                          onClick={() => isEditable && toggleExpanded(item.id)}
                        >
                          <div className={`p-1 rounded-md ${itemStatusColors[item.status]}`}>
                            <ItemIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className={`text-sm flex-1 leading-snug ${
                            item.status === 'ok' ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {item.item}
                          </span>
                          {isEditable && (
                            isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <Badge className={`${itemStatusColors[item.status]} text-[10px] px-1.5 py-0.5`}>
                            {itemStatusLabels[item.status]}
                          </Badge>
                        </div>

                        {/* Expanded content - editable */}
                        {isEditable && isExpanded && (
                          <div className="px-3 pb-3 pt-0 space-y-2.5 border-t border-border/30">
                            <div className="space-y-1.5 pt-2">
                              <Label className="text-xs font-medium text-muted-foreground">Status do Item</Label>
                              <div className="flex gap-2">
                                {(['ok', 'nao_conforme', 'inoperante'] as StatusItemInspecao[]).map(status => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleItemStatusChange(item.id, status)}
                                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                                      item.status === status
                                        ? itemStatusColors[status]
                                        : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                    }`}
                                  >
                                    {itemStatusLabels[status]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {(item.status === 'nao_conforme' || item.status === 'inoperante') && (
                              <>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Observação</Label>
                                  <Textarea
                                    value={item.observacao}
                                    onChange={e => handleItemObs(item.id, e.target.value)}
                                    placeholder="Descreva o problema encontrado..."
                                    rows={2}
                                    className="text-xs"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Ação Corretiva</Label>
                                  <Textarea
                                    value={item.acaoCorretiva}
                                    onChange={e => handleItemAcao(item.id, e.target.value)}
                                    placeholder="Ação corretiva necessária..."
                                    rows={2}
                                    className="text-xs"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Read-only expanded for non-editable items */}
                        {!isEditable && (item.observacao || item.acaoCorretiva) && (
                          <div className="px-3 pb-2 border-t border-border/30">
                            {item.observacao && (
                              <p className="text-xs text-muted-foreground pt-2">
                                <span className="font-medium">Obs:</span> {item.observacao}
                              </p>
                            )}
                            {item.acaoCorretiva && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Ação:</span> {item.acaoCorretiva}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observações gerais */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Observações Gerais</Label>
                {selected.status === 'em_andamento' ? (
                  <Textarea
                    value={editObsGerais}
                    onChange={e => setEditObsGerais(e.target.value)}
                    placeholder="Observações adicionais sobre a inspeção..."
                    rows={2}
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 min-h-[2.5rem]">
                    {selected.observacoesGerais || <span className="text-muted-foreground italic">Nenhuma</span>}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {selected.status === 'em_andamento' && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleConcluir}
                    className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Concluir Inspeção
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveChanges}
                    className="w-full h-10 font-medium"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              )}

              {selected.status === 'concluida' && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleAprovar}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base"
                  >
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Aprovar Inspeção (Supervisor)
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
