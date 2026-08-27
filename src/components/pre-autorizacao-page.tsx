'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Inbox, Clock, Calendar, UserCheck, User, ShieldCheck, XCircle, Clock4, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import {
  type PreAutorizacao, type StatusPreAutorizacao,
} from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';
import { formatCpfRg } from '@/lib/utils';
import { toast } from 'sonner';
import { extractUnifiedRecords } from './registro-modal';
import { isPreAutorizacaoPendente } from '@/lib/pre-autorizacao-utils';

// Reuse the same unified data structure and helpers from registro-modal.tsx
interface UnifiedSuggestionData {
  name: string;
  company: string;
  doc: string;
  plate: string;
  department: string;
  origin?: string;
}

// Custom mapToFormFields for Pre-Autorizacao fields
function mapToFormFieldsPreAutorizacao(data: UnifiedSuggestionData): Record<string, string> {
  const mapped: Record<string, string> = {};
  if (data.name) mapped.visitanteNome = data.name;
  if (data.company) mapped.visitanteEmpresa = data.company;
  if (data.doc) mapped.visitanteDoc = data.doc;
  if (data.department) mapped.departamento = data.department;
  return mapped;
}

// Extract from existing pre-autorizacoes
function extractUnifiedFromPreAutorizacao(pa: PreAutorizacao): UnifiedSuggestionData {
  return {
    name: pa.visitanteNome,
    company: pa.visitanteEmpresa,
    doc: pa.visitanteDoc,
    plate: '',
    department: pa.departamento,
    origin: 'historico',
  };
}

// Merge function (same as registro-modal)
function mergeUnified(existing: UnifiedSuggestionData, incoming: UnifiedSuggestionData): UnifiedSuggestionData {
  return {
    name: existing.name || incoming.name,
    company: existing.company || incoming.company,
    doc: existing.doc || incoming.doc,
    plate: existing.plate || incoming.plate,
    department: existing.department || incoming.department,
    origin: existing.origin || incoming.origin,
  };
}

type StatusFilter = 'pendentes' | 'concluidos' | 'cancelados';

const statusIcons: Record<StatusPreAutorizacao, React.ElementType> = {
  agendado: Clock4,
  confirmado: CheckCircle2,
  cancelado: XCircle,
  expirado: Clock4,
};

const statusColors: Record<StatusPreAutorizacao, string> = {
  agendado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expirado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusLabels: Record<StatusPreAutorizacao, string> = {
  agendado: 'Agendado',
  confirmado: 'Concluído',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
};

export default function PreAutorizacaoPage() {
  const { preAutorizacoes, addPreAutorizacao, cancelarPreAutorizacao, confirmarChegadaPreAutorizacao, user, pessoas, empresas, departamentos, ramais, registrosFluxo } = useAppStore();

  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendentes');

  // Modal registro
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Modal detalhe
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<PreAutorizacao | null>(null);
  const [confirmarChegadaOpen, setConfirmarChegadaOpen] = useState(false);
  const [preAutorizacaoParaConfirmar, setPreAutorizacaoParaConfirmar] = useState<PreAutorizacao | null>(null);

  // Filtered
  const filtered = useMemo(() => {
    return preAutorizacoes.filter(pa => {
      if (statusFilter === 'pendentes' && !isPreAutorizacaoPendente(pa)) return false;
      if (statusFilter === 'concluidos' && pa.status !== 'confirmado') return false;
      if (statusFilter === 'cancelados' && pa.status !== 'cancelado') return false;
      if (busca) {
        const s = busca.toLowerCase();
        return [pa.visitanteNome, pa.visitanteEmpresa, pa.departamento, pa.autorizadoPor, pa.motivo, pa.criadoPor]
          .some(f => f?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [preAutorizacoes, busca, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    agendados: preAutorizacoes.filter(p => p.status === 'agendado').length,
    confirmados: preAutorizacoes.filter(p => p.status === 'confirmado').length,
    cancelados: preAutorizacoes.filter(p => p.status === 'cancelado').length,
    expirados: preAutorizacoes.filter(p => p.status === 'expirado').length,
  }), [preAutorizacoes]);

  // Sugestões (mesma logica unificada do Novo Registro)
  const nameSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — PRIMARY source
    pessoas.filter((f) => !f.inativo).forEach((f) => {
      if (!map.has(f.nome)) {
        map.set(f.nome, {
          data: {
            name: f.nome,
            company: f.empresa || '',
            doc: f.rgCpf || '',
            plate: f.placa || '',
            department: f.departamento || '',
            origin: 'cadastro',
          },
          sublabel: [f.tipo, f.empresa, f.cargo, f.departamento].filter(Boolean).join(' — ') || f.rgCpf || '',
        });
      }
    });

    // From ramais
    ramais.forEach((r) => {
      if (!map.has(r.nome)) {
        map.set(r.nome, {
          data: { name: r.nome, company: '', doc: '', plate: '', department: r.departamento },
          sublabel: `${r.departamento} — Ramal ${r.ramal}`,
        });
      }
    });

    // From previous fluxo records — includes nested and individualised companions
    registrosFluxo
      .filter((r) => !r.inativo)
      .flatMap(extractUnifiedRecords)
      .forEach((unified) => {
        const key = unified.name;
        if (!key) return;
        if (map.has(key)) {
          const existing = map.get(key)!;
          map.set(key, { data: mergeUnified(existing.data, unified), sublabel: existing.sublabel || unified.company });
        } else {
          const sublabel = unified.company || unified.department || '';
          map.set(key, { data: { ...unified, origin: 'historico' }, sublabel });
        }
      });

    // From previous pre-autorizacoes
    preAutorizacoes.forEach((pa) => {
      const unified = extractUnifiedFromPreAutorizacao(pa);
      const key = unified.name;
      if (!key) return;
      if (map.has(key)) {
        const existing = map.get(key)!;
        map.set(key, { data: mergeUnified(existing.data, unified), sublabel: existing.sublabel || unified.company });
      } else {
        const sublabel = unified.company || unified.department || '';
        map.set(key, { data: { ...unified, origin: 'historico' }, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: data.origin as 'cadastro' | 'historico' | undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, ramais, registrosFluxo, preAutorizacoes]);

  const empresaSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();
    empresas.forEach((e) => {
      if (!map.has(e.nome)) {
        map.set(e.nome, {
          data: { name: '', company: e.nome, doc: '', plate: '', department: '', origin: 'cadastro' },
          sublabel: e.cnpj || '',
        });
      }
    });
    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: data.origin as 'cadastro' | 'historico' | undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [empresas]);

  const autorizadores = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();
    pessoas.filter(f => !f.inativo && ['Supervisor', 'Gerente', 'Diretor', 'Coordenador'].some(c => f.cargo.includes(c)))
      .forEach(f => {
        if (!map.has(f.nome)) {
          map.set(f.nome, {
            data: { name: f.nome, company: f.empresa || '', doc: f.rgCpf || '', plate: f.placa || '', department: f.departamento || '', origin: 'cadastro' },
            sublabel: [f.cargo, f.departamento].filter(Boolean).join(' — '),
          });
        }
      });
    if (!map.size) {
      pessoas.filter(f => !f.inativo).forEach(f => {
        if (!map.has(f.nome)) {
          map.set(f.nome, {
            data: { name: f.nome, company: f.empresa || '', doc: f.rgCpf || '', plate: f.placa || '', department: f.departamento || '', origin: 'cadastro' },
            sublabel: [f.cargo, f.departamento].filter(Boolean).join(' — '),
          });
        }
      });
    }
    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: data.origin as 'cadastro' | 'historico' | undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas]);

  const updateField = (f: string, v: string) => setFormData(prev => ({ ...prev, [f]: v }));

  const handleAutoSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    const mapped = mapToFormFieldsPreAutorizacao(unified);
    setFormData(prev => ({ ...prev, ...mapped }));
  };

  const handleEmpresaSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    if (unified.company) {
      setFormData(prev => ({ ...prev, visitanteEmpresa: unified.company }));
    }
  };

  const handleAutorizadorSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    if (unified.name) {
      setFormData(prev => ({ ...prev, autorizadoPor: unified.name }));
    }
  };

  const handleOpenModal = () => { setFormData({}); setModalOpen(true); };

  const handleSubmit = () => {
    if (!formData.visitanteNome || !formData.autorizadoPor || !formData.dataPrevista) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const pa: PreAutorizacao = {
      id: `pa_${Date.now()}`,
      visitanteNome: formData.visitanteNome,
      visitanteDoc: formData.visitanteDoc || '',
      visitanteEmpresa: formData.visitanteEmpresa || '',
      departamento: formData.departamento || '',
      autorizadoPor: formData.autorizadoPor,
      motivo: formData.motivo || '',
      dataPrevista: formData.dataPrevista,
      horarioPrevisto: formData.horarioPrevisto || '',
      status: 'agendado',
      criadoPor: user?.nome || '',
    };
    addPreAutorizacao(pa);
    toast.success('Pré-autorização cadastrada!');
    setModalOpen(false);
  };

  const handleConfirmar = (pa: PreAutorizacao) => {
    setPreAutorizacaoParaConfirmar(pa);
    setDetailOpen(false);
    setConfirmarChegadaOpen(true);
  };

  const confirmarChegada = () => {
    if (!preAutorizacaoParaConfirmar) return;
    confirmarChegadaPreAutorizacao(preAutorizacaoParaConfirmar.id);
    toast.success('Chegada confirmada e entrada registrada no Fluxo!');
    setConfirmarChegadaOpen(false);
    setPreAutorizacaoParaConfirmar(null);
    setSelected(null);
  };

  const handleCancelar = (id: string) => {
    cancelarPreAutorizacao(id);
    toast.success('Pré-autorização cancelada');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="p-4 md:p-6 pb-0 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.agendados}</p>
            <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300">Agendados</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.confirmados}</p>
            <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Concluídos</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.cancelados}</p>
            <p className="text-[10px] font-medium text-red-700 dark:text-red-300">Cancelados</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{stats.expirados}</p>
            <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Expirados</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar visitante, empresa, departamento..." value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1" />
        </div>

        {/* Status tabs */}
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <TabsList className="grid h-10 w-full grid-cols-3">
            <TabsTrigger value="pendentes" className="text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-white">Pendentes</TabsTrigger>
            <TabsTrigger value="concluidos" className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Concluídos</TabsTrigger>
            <TabsTrigger value="cancelados" className="text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pt-3 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium mb-1">
              {statusFilter === 'pendentes'
                ? 'Nenhuma pré-autorização pendente'
                : statusFilter === 'concluidos'
                  ? 'Nenhuma pré-autorização concluída'
                  : statusFilter === 'cancelados'
                    ? 'Nenhuma pré-autorização cancelada'
                    : 'Nenhuma pré-autorização encontrada'}
            </p>
            <p className="text-sm text-muted-foreground/70">Toque em Nova para agendar uma visita.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(pa => {
              const StatusIcon = statusIcons[pa.status];
              return (
                <Card key={pa.id} className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  onClick={() => { setSelected(pa); setDetailOpen(true); }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-muted shrink-0">
                        <StatusIcon className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base truncate">{pa.visitanteNome}</h3>
                          <Badge className={statusColors[pa.status] + ' text-xs'}>{statusLabels[pa.status]}</Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {pa.visitanteEmpresa && <p className="text-sm text-muted-foreground"><span className="font-medium">Empresa:</span> {pa.visitanteEmpresa}</p>}
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Depto:</span> {pa.departamento}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Autorizado Por:</span> {pa.autorizadoPor}</p>
                          {pa.criadoPor && <p className="text-sm text-muted-foreground"><span className="font-medium">Criado Por:</span> {pa.criadoPor}</p>}
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{pa.dataPrevista}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{pa.horarioPrevisto}</span>
                        </div>
                        {pa.status === 'agendado' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              onClick={e => { e.stopPropagation(); handleConfirmar(pa); }}>
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />Confirmar Chegada
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 text-xs"
                              onClick={e => { e.stopPropagation(); handleCancelar(pa.id); }}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão */}
      <div data-desktop-action-bar className="fixed bottom-16 left-0 right-0 z-30 pt-3 pb-7 px-4 md:px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <Button onClick={handleOpenModal} className="w-full h-13 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold shadow-lg">
          <Plus className="h-5 w-5 mr-2" />Nova Pré-Autorização
        </Button>
      </div>

      {/* Modal Registro */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              Nova Pré-Autorização
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label>Nome do Visitante *</Label>
                <AutocompleteInput
                  value={formData.visitanteNome || ''}
                  onChange={v => updateField('visitanteNome', v)}
                  onSelect={s => handleAutoSelect(s.data || {})}
                  suggestions={nameSuggestions}
                  placeholder="Nome completo"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>RG/CPF</Label>
                <Input
                  className="h-11"
                  value={formData.visitanteDoc || ''}
                  onChange={e => updateField('visitanteDoc', formatCpfRg(e.target.value))}
                  placeholder="00.000.000-0"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <AutocompleteInput
                  value={formData.visitanteEmpresa || ''}
                  onChange={v => updateField('visitanteEmpresa', v)}
                  onSelect={s => handleEmpresaSelect(s.data || {})}
                  suggestions={empresaSuggestions}
                  placeholder="Empresa do visitante"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Select
                  value={formData.departamento || ''}
                  onValueChange={v => updateField('departamento', v)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map(d => (
                      <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Autorizado Por *</Label>
                <AutocompleteInput
                  value={formData.autorizadoPor || ''}
                  onChange={v => updateField('autorizadoPor', v)}
                  onSelect={s => handleAutorizadorSelect(s.data || {})}
                  suggestions={autorizadores}
                  placeholder="Nome de quem autorizou"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Textarea
                  value={formData.motivo || ''}
                  onChange={e => updateField('motivo', e.target.value)}
                  placeholder="Motivo da visita"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Data Prevista *</Label>
                <Input
                  className="h-11"
                  type="date"
                  value={formData.dataPrevista || ''}
                  onChange={e => updateField('dataPrevista', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Horário Previsto</Label>
                <Input
                  className="h-11"
                  type="time"
                  value={formData.horarioPrevisto || ''}
                  onChange={e => updateField('horarioPrevisto', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-3 pt-0 sm:gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          {/* Modal de confirmação de chegada */}
      <Dialog
        open={confirmarChegadaOpen}
        onOpenChange={(open) => {
          setConfirmarChegadaOpen(open);
          if (!open) setPreAutorizacaoParaConfirmar(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Confirmar chegada
            </DialogTitle>
          </DialogHeader>
          {preAutorizacaoParaConfirmar && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Deseja confirmar a chegada de {preAutorizacaoParaConfirmar.visitanteNome}?
                </p>
                <div className="mt-3 space-y-1 text-sm text-emerald-800/80 dark:text-emerald-100/80">
                  <p><span className="font-medium">RG/CPF:</span> {preAutorizacaoParaConfirmar.visitanteDoc || 'Não informado'}</p>
                  <p><span className="font-medium">Empresa:</span> {preAutorizacaoParaConfirmar.visitanteEmpresa || 'Não informada'}</p>
                  <p><span className="font-medium">Visita prevista:</span> {preAutorizacaoParaConfirmar.dataPrevista} às {preAutorizacaoParaConfirmar.horarioPrevisto || 'horário não informado'}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ao confirmar, será criado um registro de entrada em <strong>Fluxo &gt; Em aberto</strong>. A saída deverá ser registrada posteriormente pelo processo normal do Fluxo.
              </p>
              <DialogFooter className="mt-4 gap-3 pt-0 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmarChegadaOpen(false);
                    setPreAutorizacaoParaConfirmar(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={confirmarChegada}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Confirmar chegada
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={detailOpen} onOpenChange={v => { if (!v) { setDetailOpen(false); setSelected(null); } }}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-amber-600" />Detalhes da Pré-Autorização</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-center"><Badge className={statusColors[selected.status] + ' text-sm px-4 py-1'}>{statusLabels[selected.status]}</Badge></div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                {[
                  { l: 'Visitante', v: selected.visitanteNome },
                  { l: 'RG/CPF', v: selected.visitanteDoc },
                  { l: 'Empresa', v: selected.visitanteEmpresa },
                  { l: 'Departamento', v: selected.departamento },
                  { l: 'Autorizado Por', v: selected.autorizadoPor },
                  { l: 'Criado Por', v: selected.criadoPor },
                  { l: 'Motivo', v: selected.motivo },
                  { l: 'Data Prevista', v: selected.dataPrevista },
                  { l: 'Horário Previsto', v: selected.horarioPrevisto },
                  ...(selected.dataConfirmacao ? [{ l: 'Data Confirmação', v: selected.dataConfirmacao }] : []),
                  ...(selected.porteiro ? [{ l: 'Porteiro', v: selected.porteiro }] : []),
                ].map(f => (
                  <div key={f.l} className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">{f.l}</span>
                    <span className="text-sm text-foreground text-right">{f.v || '-'}</span>
                  </div>
                ))}
              </div>
              {selected.status === 'agendado' && (
                <div className="flex gap-2">
                  <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => { handleConfirmar(selected); setDetailOpen(false); setSelected(null); }}>
                    <ShieldCheck className="h-5 w-5 mr-2" />Confirmar Chegada
                  </Button>
                  <Button variant="outline" className="h-12 text-red-600 border-red-200" onClick={() => { handleCancelar(selected.id); setDetailOpen(false); setSelected(null); }}>
                    <XCircle className="h-5 w-5 mr-2" />Cancelar
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
