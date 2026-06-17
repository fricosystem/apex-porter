'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
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

type StatusFilter = 'agendado' | 'confirmado' | 'todos';

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
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
};

export default function PreAutorizacaoPage() {
  const { preAutorizacoes, addPreAutorizacao, updatePreAutorizacao, cancelarPreAutorizacao, user, pessoas, empresas, departamentos, ramais, registrosFluxo } = useAppStore();

  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('agendado');

  // Modal registro
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Modal detalhe
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<PreAutorizacao | null>(null);

  // Filtered
  const filtered = useMemo(() => {
    return preAutorizacoes.filter(pa => {
      if (statusFilter === 'agendado' && pa.status !== 'agendado' && pa.status !== 'confirmado') return false;
      if (statusFilter === 'confirmado' && pa.status !== 'confirmado') return false;
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

    // From previous fluxo records
    registrosFluxo.forEach((r) => {
      // Replicate extractUnifiedFromRecord from registro-modal.tsx
      const extractFromFluxo = (r: any): UnifiedSuggestionData => {
        const data: UnifiedSuggestionData = { name: '', company: '', doc: '', plate: '', department: '' };
        switch (r.categoria) {
          case 'entregas1':
            data.name = r.nome; data.company = r.empresa; data.doc = r.rgCpf; break;
          case 'visitantes':
          case 'prestadores':
            data.name = (r as any).nome || r.nomeEmpresa; data.company = (r as any).empresa || ''; data.department = r.departamento; data.doc = r.rgCpf; break;
          case 'pesagem':
            data.company = r.empresa; data.plate = r.placa; data.name = r.motorista; data.doc = (r as any).rgCpf || ''; break;
          case 'entregas2':
            data.name = r.motorista; data.doc = r.cpfRg; data.company = r.empresa; data.department = r.departamento; data.plate = r.placa; break;
          case 'coleta':
            data.doc = r.rgCpf; data.plate = r.placa; data.company = r.empresa; data.name = r.motorista; break;
          case 'movimentacao':
            data.name = r.nomeColaborador; data.doc = r.rgCpf; break;
          case 'correspondencias':
            data.name = r.destinatario; data.company = r.remetente; data.department = r.departamento; break;
        }
        return data;
      };
      const unified = extractFromFluxo(r);
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
    updatePreAutorizacao({
      ...pa,
      status: 'confirmado',
      dataConfirmacao: format(new Date(), 'dd/MM/yyyy'),
      porteiro: user?.nome || '',
    });
    toast.success('Chegada confirmada!');
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
            <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Confirmados</p>
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
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="agendado" className="text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-white">Pendentes</TabsTrigger>
            <TabsTrigger value="confirmado" className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Confirmados</TabsTrigger>
            <TabsTrigger value="todos" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos</TabsTrigger>
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
            <p className="text-lg font-medium mb-1">Nenhuma pré-autorização encontrada</p>
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
      <div className="fixed bottom-16 left-0 right-0 z-30 pt-3 pb-7 px-4 md:px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <Button onClick={handleOpenModal} className="w-full h-13 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold shadow-lg">
          <Plus className="h-5 w-5 mr-2" />Nova Pré-Autorização
        </Button>
      </div>

      {/* Modal Registro */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-amber-600" />Nova Pré-Autorização</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2"><Label>Nome do Visitante *</Label><AutocompleteInput value={formData.visitanteNome || ''} onChange={v => updateField('visitanteNome', v)} onSelect={s => handleAutoSelect(s.data || {})} suggestions={nameSuggestions} placeholder="Nome completo" /></div>
            <div className="space-y-2"><Label>RG/CPF</Label><Input value={formData.visitanteDoc || ''} onChange={e => updateField('visitanteDoc', formatCpfRg(e.target.value))} placeholder="00.000.000-0" /></div>
            <div className="space-y-2"><Label>Empresa</Label><AutocompleteInput value={formData.visitanteEmpresa || ''} onChange={v => updateField('visitanteEmpresa', v)} onSelect={s => handleEmpresaSelect(s.data || {})} suggestions={empresaSuggestions} placeholder="Empresa do visitante" /></div>
            <div className="space-y-2"><Label>Departamento</Label><Select value={formData.departamento || ''} onValueChange={v => updateField('departamento', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Autorizado Por *</Label><AutocompleteInput value={formData.autorizadoPor || ''} onChange={v => updateField('autorizadoPor', v)} onSelect={s => handleAutorizadorSelect(s.data || {})} suggestions={autorizadores} placeholder="Nome de quem autorizou" /></div>
            <div className="space-y-2"><Label>Motivo</Label><Textarea value={formData.motivo || ''} onChange={e => updateField('motivo', e.target.value)} placeholder="Motivo da visita" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Data Prevista *</Label><Input type="date" value={formData.dataPrevista || ''} onChange={e => updateField('dataPrevista', e.target.value)} /></div>
              <div className="space-y-2"><Label>Horário Previsto</Label><Input type="time" value={formData.horarioPrevisto || ''} onChange={e => updateField('horarioPrevisto', e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">Salvar</Button>
          </DialogFooter>
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
