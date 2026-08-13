'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus, Search, Inbox, Clock, Calendar, Car, LogOut, Truck, User, Building2, Users, AlertTriangle,
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
  OPCOES_VAGAS, OPCOES_CORES_VEICULO, OPCOES_DEPARTAMENTOS,
  type RegistroVeiculo, type TipoVeiculo,
} from '@/lib/data';
import AutocompleteInput from './autocomplete-input';
import { toast } from 'sonner';

type StatusFilter = 'estacionado' | 'saiu' | 'todos';

const tipoIcons: Record<TipoVeiculo, React.ElementType> = {
  Visitante: User,
  Prestador: Building2,
  Entregador: Truck,
  Colaborador: Users,
};

export default function VeiculosPage() {
  const { veiculos, addVeiculo, registrarSaidaVeiculo, user, pessoas, empresas, listaNegra } = useAppStore();

  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('estacionado');
  const [tipoFilter, setTipoFilter] = useState<TipoVeiculo | 'todos'>('todos');

  // Modal registro
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    data: format(new Date(), 'dd/MM/yyyy'),
    horarioEntrada: format(new Date(), 'HH:mm'),
    porteiro: user?.nome || '',
  });

  // Modal saída
  const [saidaModalOpen, setSaidaModalOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<RegistroVeiculo | null>(null);
  const [obsSaida, setObsSaida] = useState('');

  // Modal detalhes
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailVeiculo, setDetailVeiculo] = useState<RegistroVeiculo | null>(null);

  // Check lista negra
  const placaAlerta = useMemo(() => {
    const placasNegras = new Set(listaNegra.filter(e => e.status === 'ativo').map(e => e.nome));
    return veiculos.filter(v => placasNegras.has(v.placa) || placasNegras.has(v.motoristaNome));
  }, [veiculos, listaNegra]);

  // Filtered
  const filtered = useMemo(() => {
    return veiculos.filter((v) => {
      const saiu = v.horarioSaida !== '';
      if (statusFilter === 'estacionado' && saiu) return false;
      if (statusFilter === 'saiu' && !saiu) return false;
      if (tipoFilter !== 'todos' && v.tipo !== tipoFilter) return false;
      if (busca) {
        const s = busca.toLowerCase();
        return [v.placa, v.modelo, v.cor, v.motoristaNome, v.empresa, v.vaga]
          .some(f => f.toLowerCase().includes(s));
      }
      return true;
    });
  }, [veiculos, busca, statusFilter, tipoFilter]);

  // Stats
  const stats = useMemo(() => ({
    estacionados: veiculos.filter(v => !v.horarioSaida).length,
    saidas: veiculos.filter(v => v.horarioSaida).length,
    total: veiculos.length,
  }), [veiculos]);

  // Sugestões
  const nameSuggestions = useMemo(() => {
    const set = new Map<string, Record<string, string>>();
    pessoas.filter(f => !f.inativo).forEach(f => set.set(f.nome, { name: f.nome }));
    veiculos.forEach(v => { if (v.motoristaNome) set.set(v.motoristaNome, { name: v.motoristaNome }); });
    return Array.from(set.entries()).map(([label, data]) => ({ label, data, sublabel: undefined }));
  }, [pessoas, veiculos]);

  const placaSuggestions = useMemo(() => {
    const set = new Map<string, Record<string, string>>();
    veiculos.forEach(v => { if (v.placa) set.set(v.placa, { name: v.motoristaNome || '' }); });
    return Array.from(set.entries()).map(([label, data]) => ({ label, data, sublabel: undefined }));
  }, [veiculos]);

  const empresaSuggestions = useMemo(() => {
    const set = new Map<string, Record<string, string>>();
    empresas.forEach(e => set.set(e.nome, { company: e.nome }));
    return Array.from(set.entries()).map(([label, data]) => ({ label, data, sublabel: undefined }));
  }, [empresas]);

  const updateField = (f: string, v: string) => setFormData(prev => ({ ...prev, [f]: v }));

  const handleOpenModal = () => {
    setFormData({
      data: format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: format(new Date(), 'HH:mm'),
      porteiro: user?.nome || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.placa || !formData.modelo) {
      toast.error('Preencha placa e modelo');
      return;
    }
    const registro: RegistroVeiculo = {
      id: `vei_${Date.now()}`,
      placa: (formData.placa || '').toUpperCase(),
      modelo: formData.modelo || '',
      cor: formData.cor || '',
      tipo: (formData.tipo || 'Visitante') as TipoVeiculo,
      motoristaNome: formData.motoristaNome || '',
      motoristaDoc: formData.motoristaDoc || '',
      empresa: formData.empresa || '',
      vaga: formData.vaga || '',
      data: formData.data || format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
      horarioSaida: '',
      observacoes: formData.observacoes || '',
      porteiro: formData.porteiro || user?.nome || '',
    };
    addVeiculo(registro);
    toast.success('Veículo registrado com sucesso!');
    setModalOpen(false);
  };

  const handleSaida = () => {
    if (!selectedVeiculo) return;
    registrarSaidaVeiculo(selectedVeiculo.id, obsSaida);
    toast.success('Saída do veículo registrada!');
    setSaidaModalOpen(false);
    setSelectedVeiculo(null);
    setObsSaida('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="p-4 md:p-6 pb-0 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.estacionados}</p>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Estacionados</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.saidas}</p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Saíram</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs font-medium text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Alerta lista negra */}
        {placaAlerta.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Alerta Lista Negra</p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {placaAlerta.length} veículo(s) com motorista/placa na Lista Negra
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar placa, modelo, motorista..." value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1" />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={tipoFilter} onValueChange={v => setTipoFilter(v as TipoVeiculo | 'todos')}>
            <SelectTrigger className="h-9 text-sm bg-muted/50 border-0 flex-1">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Visitante">Visitante</SelectItem>
              <SelectItem value="Prestador">Prestador</SelectItem>
              <SelectItem value="Entregador">Entregador</SelectItem>
              <SelectItem value="Colaborador">Colaborador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status tabs */}
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="estacionado" className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">Estacionados</TabsTrigger>
            <TabsTrigger value="saiu" className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Saíram</TabsTrigger>
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
            <p className="text-lg font-medium mb-1">Nenhum veículo encontrado</p>
            <p className="text-sm text-muted-foreground/70">Toque em Registrar para adicionar um veículo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(v => {
              const saiu = v.horarioSaida !== '';
              const TipoIcon = tipoIcons[v.tipo] || Car;
              const alerta = placaAlerta.some(a => a.id === v.id);
              return (
                <Card key={v.id} className={`cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98] ${alerta ? 'border-red-300 dark:border-red-700' : ''}`}
                  onClick={() => { setDetailVeiculo(v); setDetailOpen(true); }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${alerta ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'}`}>
                        <TipoIcon className={`h-7 w-7 ${alerta ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base">{v.placa}</h3>
                          {alerta && <Badge className="bg-red-100 text-red-700 text-xs">Lista Negra</Badge>}
                          {saiu ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Saiu</Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">Estacionado</Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Modelo:</span> {v.modelo} — {v.cor}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Motorista:</span> {v.motoristaNome}</p>
                          {v.empresa && <p className="text-sm text-muted-foreground"><span className="font-medium">Empresa:</span> {v.empresa}</p>}
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Vaga:</span> {v.vaga || '-'}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{v.data}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{v.horarioEntrada}</span>
                          {saiu && <span className="flex items-center gap-1.5 text-emerald-600"><LogOut className="h-4 w-4" />{v.horarioSaida}</span>}
                        </div>
                        {!saiu && (
                          <Button size="sm" className="mt-3 h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                            onClick={e => { e.stopPropagation(); setSelectedVeiculo(v); setObsSaida(''); setSaidaModalOpen(true); }}>
                            <LogOut className="h-3.5 w-3.5 mr-1" />Registrar Saída
                          </Button>
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

      {/* Botão Registrar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 p-4 md:px-6 pb-3 bg-background/80 backdrop-blur-md border-t border-border/50">
        <Button onClick={handleOpenModal} className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-lg">
          <Plus className="h-5 w-5 mr-2" />Registrar Veículo
        </Button>
      </div>

      {/* Modal Registro */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" />Novo Veículo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2"><Label>Placa *</Label><AutocompleteInput value={formData.placa || ''} onChange={v => updateField('placa', v.toUpperCase())} onSelect={s => { if (s.data?.name) updateField('motoristaNome', s.data.name as string); }} suggestions={placaSuggestions} placeholder="ABC-1D23" /></div>
            <div className="space-y-2"><Label>Modelo *</Label><Input value={formData.modelo || ''} onChange={e => updateField('modelo', e.target.value)} placeholder="Ex: Toyota Corolla" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Cor</Label><Select value={formData.cor || ''} onValueChange={v => updateField('cor', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{OPCOES_CORES_VEICULO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Tipo</Label><Select value={formData.tipo || 'Visitante'} onValueChange={v => updateField('tipo', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['Visitante','Prestador','Entregador','Colaborador'] as TipoVeiculo[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Motorista</Label><AutocompleteInput value={formData.motoristaNome || ''} onChange={v => updateField('motoristaNome', v)} onSelect={s => { if (s.data?.name) updateField('motoristaNome', s.data.name as string); }} suggestions={nameSuggestions} placeholder="Nome do motorista" /></div>
            <div className="space-y-2"><Label>RG/CPF Motorista</Label><Input value={formData.motoristaDoc || ''} onChange={e => updateField('motoristaDoc', e.target.value)} placeholder="00.000.000-0" /></div>
            <div className="space-y-2"><Label>Empresa</Label><AutocompleteInput value={formData.empresa || ''} onChange={v => updateField('empresa', v)} onSelect={s => { if (s.data?.company) updateField('empresa', s.data.company as string); }} suggestions={empresaSuggestions} placeholder="Empresa" /></div>
            <div className="space-y-2"><Label>Vaga</Label><Select value={formData.vaga || ''} onValueChange={v => updateField('vaga', v)}><SelectTrigger><SelectValue placeholder="Selecione a vaga" /></SelectTrigger><SelectContent>{OPCOES_VAGAS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Horário Entrada</Label><Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Porteiro</Label><Input value={formData.porteiro || user?.nome || ''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Data</Label><Input value={formData.data || ''} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={formData.observacoes || ''} onChange={e => updateField('observacoes', e.target.value)} placeholder="Observações..." rows={2} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Saída */}
      <Dialog open={saidaModalOpen} onOpenChange={v => { if (!v) { setSaidaModalOpen(false); setSelectedVeiculo(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Saída do Veículo</DialogTitle></DialogHeader>
          {selectedVeiculo && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between"><span className="text-sm font-medium text-muted-foreground">Placa</span><span className="text-sm font-bold">{selectedVeiculo.placa}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-muted-foreground">Modelo</span><span className="text-sm">{selectedVeiculo.modelo} — {selectedVeiculo.cor}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-muted-foreground">Motorista</span><span className="text-sm">{selectedVeiculo.motoristaNome}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-muted-foreground">Vaga</span><span className="text-sm">{selectedVeiculo.vaga}</span></div>
              </div>
              <div className="space-y-2"><Label>Observações da Saída</Label><Textarea value={obsSaida} onChange={e => setObsSaida(e.target.value)} placeholder="Informações adicionais..." rows={3} /></div>
              <Button onClick={handleSaida} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold"><LogOut className="h-5 w-5 mr-2" />Confirmar Saída</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={detailOpen} onOpenChange={v => { if (!v) { setDetailOpen(false); setDetailVeiculo(null); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" />Detalhes do Veículo</DialogTitle></DialogHeader>
          {detailVeiculo && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
              {[
                { l: 'Placa', v: detailVeiculo.placa },
                { l: 'Modelo', v: `${detailVeiculo.modelo} — ${detailVeiculo.cor}` },
                { l: 'Tipo', v: detailVeiculo.tipo },
                { l: 'Motorista', v: detailVeiculo.motoristaNome },
                { l: 'RG/CPF', v: detailVeiculo.motoristaDoc },
                { l: 'Empresa', v: detailVeiculo.empresa },
                { l: 'Vaga', v: detailVeiculo.vaga },
                { l: 'Data', v: detailVeiculo.data },
                { l: 'Horário Entrada', v: detailVeiculo.horarioEntrada },
                ...(detailVeiculo.horarioSaida ? [{ l: 'Horário Saída', v: detailVeiculo.horarioSaida }] : []),
                { l: 'Porteiro', v: detailVeiculo.porteiro },
                ...(detailVeiculo.observacoes ? [{ l: 'Observações', v: detailVeiculo.observacoes }] : []),
              ].map(f => (
                <div key={f.l} className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">{f.l}</span>
                  <span className="text-sm text-foreground text-right">{f.v || '-'}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
