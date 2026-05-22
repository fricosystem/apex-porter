'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus, Siren, Flame, Droplets, ShieldAlert, Bomb, Heart,
  DoorOpen, ZapOff, Phone, Trash2, Inbox, Clock, CheckCircle2,
  AlertTriangle, Save, ListOrdered, Users, FileText, AlertCircle,
  ChevronDown, ChevronUp, X,
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
  TIPOS_EMERGENCIA,
  type ProtocoloEmergencia,
  type EtapaProtocolo,
  type ContatoEmergencia,
  type AtivacaoProtocolo,
  type TipoEmergencia,
} from '@/lib/data';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/utils';

// Map icon names to actual Lucide icon components
const ICON_MAP: Record<string, React.ElementType> = {
  'flame': Flame,
  'droplets': Droplets,
  'shield-alert': ShieldAlert,
  'bomb': Bomb,
  'heart': Heart,
  'door-open': DoorOpen,
  'zap-off': ZapOff,
};

const tipoColors: Record<TipoEmergencia, string> = {
  incendio: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  inundacao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  invasao: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  ameaca_bomba: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  acidente: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  evacuacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  corte_energia: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
};

export default function ProtocolosEmergenciaPage() {
  const { protocolos, addProtocolo, updateProtocolo, removeProtocolo, ativacoes, addAtivacao, user } = useAppStore();

  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [showAtivacoes, setShowAtivacoes] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ProtocoloEmergencia | null>(null);
  const [detailTab, setDetailTab] = useState<'etapas' | 'contatos' | 'info'>('etapas');

  // New protocol dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTipo, setNewTipo] = useState<TipoEmergencia>('incendio');
  const [newTitulo, setNewTitulo] = useState('');
  const [newDescricao, setNewDescricao] = useState('');
  const [newEtapas, setNewEtapas] = useState<{ descricao: string }[]>([{ descricao: '' }]);
  const [newContatos, setNewContatos] = useState<{ nome: string; funcao: string; telefone: string; tipo: 'interno' | 'externo' }[]>([
    { nome: '', funcao: '', telefone: '', tipo: 'interno' },
  ]);
  const [newObs, setNewObs] = useState('');

  // Activate protocol dialog
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [activateObs, setActivateObs] = useState('');

  // Stats
  const stats = useMemo(() => ({
    total: protocolos.length,
    ativos: protocolos.filter(p => p.ativo).length,
    inativos: protocolos.filter(p => !p.ativo).length,
    ativacoes: ativacoes.length,
  }), [protocolos, ativacoes]);

  // Filtered
  const filtered = useMemo(() => {
    return protocolos.filter(p => {
      if (tipoFilter !== 'todos' && p.tipo !== tipoFilter) return false;
      return true;
    });
  }, [protocolos, tipoFilter]);

  // Recent activations
  const recentAtivacoes = useMemo(() => {
    return [...ativacoes].sort((a, b) => {
      const dateA = new Date(`${a.data}T${a.horario}`).getTime();
      const dateB = new Date(`${b.data}T${b.horario}`).getTime();
      return dateB - dateA;
    }).slice(0, 10);
  }, [ativacoes]);

  // Handle open detail
  const handleOpenDetail = (p: ProtocoloEmergencia) => {
    setSelected(p);
    setDetailTab('etapas');
    setDetailOpen(true);
  };

  // Handle open activate dialog
  const handleOpenActivate = (p: ProtocoloEmergencia) => {
    setSelected(p);
    setActivateObs('');
    setActivateDialogOpen(true);
  };

  // Handle activate protocol
  const handleActivate = () => {
    if (!selected) return;
    const now = new Date();
    const ativacao: AtivacaoProtocolo = {
      id: `ativ_${Date.now()}`,
      protocoloId: selected.id,
      data: format(now, 'yyyy-MM-dd'),
      horario: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      acionadoPor: user?.nome || 'Porteiro',
      observacao: activateObs.trim(),
    };
    addAtivacao(ativacao);
    toast.success(`Protocolo "${selected.titulo}" ativado!`);
    setActivateDialogOpen(false);
  };

  // New protocol handlers
  const handleAddEtapa = () => {
    setNewEtapas(prev => [...prev, { descricao: '' }]);
  };

  const handleRemoveEtapa = (idx: number) => {
    setNewEtapas(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEtapaChange = (idx: number, descricao: string) => {
    setNewEtapas(prev => prev.map((e, i) => i === idx ? { descricao } : e));
  };

  const handleAddContato = () => {
    setNewContatos(prev => [...prev, { nome: '', funcao: '', telefone: '', tipo: 'interno' }]);
  };

  const handleRemoveContato = (idx: number) => {
    setNewContatos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleContatoChange = (idx: number, field: string, value: string) => {
    setNewContatos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleCreateProtocol = () => {
    if (!newTitulo.trim()) {
      toast.error('Informe o título do protocolo');
      return;
    }
    if (!newDescricao.trim()) {
      toast.error('Informe a descrição do protocolo');
      return;
    }
    const validEtapas = newEtapas.filter(e => e.descricao.trim());
    if (validEtapas.length === 0) {
      toast.error('Adicione ao menos uma etapa ao protocolo');
      return;
    }

    const pId = `prot_${Date.now()}`;
    const newProtocol: ProtocoloEmergencia = {
      id: pId,
      tipo: newTipo,
      titulo: newTitulo.trim(),
      descricao: newDescricao.trim(),
      etapas: validEtapas.map((e, idx) => ({
        id: `${pId}_et${idx}`,
        ordem: idx + 1,
        descricao: e.descricao.trim(),
      })),
      contatos: newContatos.filter(c => c.nome.trim() && c.telefone.trim()).map((c, idx) => ({
        id: `${pId}_ct${idx}`,
        nome: c.nome.trim(),
        funcao: c.funcao.trim(),
        telefone: c.telefone.trim(),
        tipo: c.tipo,
      })),
      observacoes: newObs.trim(),
      ativo: true,
    };

    addProtocolo(newProtocol);
    toast.success('Protocolo de emergência criado!');
    setNewDialogOpen(false);
    resetNewForm();
  };

  const resetNewForm = () => {
    setNewTipo('incendio');
    setNewTitulo('');
    setNewDescricao('');
    setNewEtapas([{ descricao: '' }]);
    setNewContatos([{ nome: '', funcao: '', telefone: '', tipo: 'interno' }]);
    setNewObs('');
  };

  // Toggle protocol active
  const handleToggleAtivo = (p: ProtocoloEmergencia) => {
    updateProtocolo({ ...p, ativo: !p.ativo });
    toast.success(p.ativo ? 'Protocolo desativado' : 'Protocolo ativado');
  };

  // Delete
  const handleDelete = (id: string) => {
    removeProtocolo(id);
    toast.success('Protocolo removido');
    if (selected?.id === id) {
      setDetailOpen(false);
      setSelected(null);
    }
  };

  // Get protocolo title for ativacao
  const getProtocoloTitle = (protId: string) => {
    const p = protocolos.find(pr => pr.id === protId);
    return p?.titulo || 'Protocolo removido';
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
            <Siren className="h-6 w-6 text-red-500" />
            Protocolos de Emergência
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Procedimentos de emergência</p>
        </div>
        <Button
          onClick={() => { resetNewForm(); setNewDialogOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Protocolo
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: stats.total, bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300' },
          { label: 'Ativos', value: stats.ativos, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Inativos', value: stats.inativos, bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-500 dark:text-slate-500' },
          { label: 'Ativações', value: stats.ativacoes, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
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

      {/* Quick access emergency buttons */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Acesso Rápido — Emergências</p>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS_EMERGENCIA.map(tipo => {
            const Icon = ICON_MAP[tipo.icon] || AlertTriangle;
            const matchingProtocol = protocolos.find(p => p.tipo === tipo.value && p.ativo);
            return (
              <button
                key={tipo.value}
                onClick={() => matchingProtocol ? handleOpenActivate(matchingProtocol) : setTipoFilter(tipo.value)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all active:scale-95 ${
                  matchingProtocol
                    ? `${tipoColors[tipo.value]} border-current/20`
                    : 'bg-muted/50 border-border/50 text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-semibold leading-tight text-center">{tipo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + Ativações toggle */}
      <div className="flex gap-2">
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="flex-1 bg-muted/50 border-0 h-10">
            <SelectValue placeholder="Tipo de emergência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            {TIPOS_EMERGENCIA.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showAtivacoes ? 'default' : 'outline'}
          size="sm"
          className={`h-10 ${showAtivacoes ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
          onClick={() => setShowAtivacoes(!showAtivacoes)}
        >
          <Clock className="h-4 w-4 mr-1.5" />
          Ativações
        </Button>
      </div>

      {/* Ativações list */}
      <AnimatePresence>
        {showAtivacoes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-3">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-red-500" />
                  Histórico de Ativações
                </h3>
                {recentAtivacoes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma ativação registrada</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {recentAtivacoes.map(ativ => (
                      <div key={ativ.id} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2.5">
                        <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                          <Siren className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{getProtocoloTitle(ativ.protocoloId)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateDisplay(ativ.data)} às {ativ.horario} — por {ativ.acionadoPor}
                          </p>
                          {ativ.observacao && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5">{ativ.observacao}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protocol cards list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <p className="text-lg font-medium mb-1">Nenhum protocolo encontrado</p>
          <p className="text-sm text-muted-foreground/70">Toque em Novo Protocolo para criar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((prot, idx) => {
            const tipoInfo = TIPOS_EMERGENCIA.find(t => t.value === prot.tipo);
            const Icon = ICON_MAP[tipoInfo?.icon || ''] || AlertTriangle;
            const protAtivacoes = ativacoes.filter(a => a.protocoloId === prot.id);

            return (
              <motion.div
                key={prot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98] overflow-hidden"
                  onClick={() => handleOpenDetail(prot)}
                >
                  <CardContent className="p-0">
                    {/* Color accent bar */}
                    <div className={`h-1 ${prot.tipo === 'incendio' ? 'bg-red-500' : prot.tipo === 'inundacao' ? 'bg-blue-500' : prot.tipo === 'invasao' ? 'bg-orange-500' : prot.tipo === 'ameaca_bomba' ? 'bg-purple-500' : prot.tipo === 'acidente' ? 'bg-rose-500' : prot.tipo === 'evacuacao' ? 'bg-amber-500' : 'bg-yellow-500'}`} />
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${tipoColors[prot.tipo]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{prot.titulo}</span>
                            {!prot.ativo && (
                              <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 text-[10px] px-2 py-0.5">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prot.descricao}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ListOrdered className="h-3 w-3" />{prot.etapas.length} etapas
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />{prot.contatos.length} contatos
                            </span>
                            {protAtivacoes.length > 0 && (
                              <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <Siren className="h-3 w-3" />{protAtivacoes.length} ativações
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          {prot.ativo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenActivate(prot);
                              }}
                            >
                              <Siren className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(prot.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={v => { if (!v) { setDetailOpen(false); setSelected(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-red-500" />
              {selected?.titulo || 'Protocolo'}
            </DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const tipoInfo = TIPOS_EMERGENCIA.find(t => t.value === selected.tipo);
            const Icon = ICON_MAP[tipoInfo?.icon || ''] || AlertTriangle;
            return (
              <div className="space-y-4">
                {/* Type badge */}
                <div className="flex justify-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${tipoColors[selected.tipo]}`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{tipoInfo?.label || selected.tipo}</span>
                    {!selected.ativo && (
                      <Badge className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-[10px] ml-1">Inativo</Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-foreground">{selected.descricao}</p>
                  {selected.observacoes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">Obs: {selected.observacoes}</p>
                  )}
                </div>

                {/* Tab selector */}
                <div className="flex border-b border-border">
                  {[
                    { key: 'etapas' as const, label: 'Etapas', icon: ListOrdered },
                    { key: 'contatos' as const, label: 'Contatos', icon: Users },
                    { key: 'info' as const, label: 'Info', icon: FileText },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDetailTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                        detailTab === tab.key
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {detailTab === 'etapas' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <ListOrdered className="h-4 w-4 text-emerald-600" />
                      Passo a Passo ({selected.etapas.length} etapas)
                    </h3>
                    <div className="space-y-2">
                      {selected.etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, idx) => (
                        <div key={etapa.id} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{idx + 1}</span>
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg p-3">
                            <p className="text-sm text-foreground">{etapa.descricao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailTab === 'contatos' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      Contatos de Emergência ({selected.contatos.length})
                    </h3>
                    {selected.contatos.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">Nenhum contato cadastrado</p>
                    ) : (
                      <div className="space-y-2">
                        {selected.contatos.map(contato => (
                          <div key={contato.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                            <div className={`p-2 rounded-lg ${contato.tipo === 'interno' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                              <Phone className={`h-4 w-4 ${contato.tipo === 'interno' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{contato.nome}</p>
                              <p className="text-xs text-muted-foreground">{contato.funcao}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-mono font-semibold text-foreground">{contato.telefone}</p>
                              <Badge className={`${contato.tipo === 'interno' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'} text-[9px] px-1.5 py-0.5`}>
                                {contato.tipo === 'interno' ? 'Interno' : 'Externo'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'info' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Informações
                    </h3>
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tipo</span>
                        <span className="text-sm font-medium text-foreground">{tipoInfo?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="text-sm font-medium text-foreground">{selected.ativo ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Etapas</span>
                        <span className="text-sm font-medium text-foreground">{selected.etapas.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Contatos</span>
                        <span className="text-sm font-medium text-foreground">{selected.contatos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Ativações</span>
                        <span className="text-sm font-medium text-foreground">{ativacoes.filter(a => a.protocoloId === selected.id).length}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-10"
                        onClick={() => handleToggleAtivo(selected)}
                      >
                        {selected.ativo ? 'Desativar' : 'Ativar'} Protocolo
                      </Button>
                      <Button
                        className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => { setDetailOpen(false); handleOpenActivate(selected); }}
                        disabled={!selected.ativo}
                      >
                        <Siren className="h-4 w-4 mr-1.5" />
                        Acionar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Activate Protocol Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={v => { if (!v) setActivateDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Siren className="h-5 w-5" />
              Ativar Protocolo de Emergência
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">{selected.titulo}</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">{selected.descricao}</p>
              </div>
              <div className="space-y-2">
                <Label>Acionado por</Label>
                <Input value={user?.nome || 'Porteiro'} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea
                  value={activateObs}
                  onChange={e => setActivateObs(e.target.value)}
                  placeholder="Descreva a situação de emergência..."
                  rows={3}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setActivateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleActivate} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                  <Siren className="h-4 w-4 mr-1.5" />
                  Confirmar Ativação
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Protocol Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={v => { if (!v) setNewDialogOpen(false); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-red-500" />
              Novo Protocolo de Emergência
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Emergência *</Label>
              <Select value={newTipo} onValueChange={v => setNewTipo(v as TipoEmergencia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EMERGENCIA.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newTitulo}
                onChange={e => setNewTitulo(e.target.value)}
                placeholder="Ex: Protocolo de Incêndio — Edifício Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                value={newDescricao}
                onChange={e => setNewDescricao(e.target.value)}
                placeholder="Descrição do protocolo e quando deve ser acionado..."
                rows={3}
              />
            </div>

            {/* Etapas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Etapas</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddEtapa}>
                  <Plus className="h-3 w-3 mr-1" /> Etapa
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {newEtapas.map((etapa, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                    <Input
                      value={etapa.descricao}
                      onChange={e => handleEtapaChange(idx, e.target.value)}
                      placeholder="Descreva a etapa..."
                      className="flex-1 h-8 text-xs"
                    />
                    {newEtapas.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={() => handleRemoveEtapa(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contatos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Contatos de Emergência</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddContato}>
                  <Plus className="h-3 w-3 mr-1" /> Contato
                </Button>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                {newContatos.map((contato, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-2.5 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={contato.nome}
                        onChange={e => handleContatoChange(idx, 'nome', e.target.value)}
                        placeholder="Nome"
                        className="flex-1 h-8 text-xs"
                      />
                      <Select
                        value={contato.tipo}
                        onValueChange={v => handleContatoChange(idx, 'tipo', v)}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interno">Interno</SelectItem>
                          <SelectItem value="externo">Externo</SelectItem>
                        </SelectContent>
                      </Select>
                      {newContatos.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                          onClick={() => handleRemoveContato(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={contato.funcao}
                        onChange={e => handleContatoChange(idx, 'funcao', e.target.value)}
                        placeholder="Função"
                        className="flex-1 h-8 text-xs"
                      />
                      <Input
                        value={contato.telefone}
                        onChange={e => handleContatoChange(idx, 'telefone', formatPhone(e.target.value))}
                        placeholder="Telefone"
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newObs}
                onChange={e => setNewObs(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProtocol} className="bg-emerald-600 hover:bg-emerald-700 text-white">Criar Protocolo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
