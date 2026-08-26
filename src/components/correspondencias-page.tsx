'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Inbox,
  Clock,
  LogOut,
  Calendar,
  FileText,
  AlertTriangle,
  Mail,
  Package,
  File,
  BookOpen,
  PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import {
  type RegistroCorrespondencias,
} from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';
import CorrespondenciaDetailModal from './correspondencia-detail-modal';
import { toast } from 'sonner';

type StatusFilter = 'pendente' | 'retirado' | 'todos';
type TipoFilter = 'todos' | 'Carta' | 'Pacote' | 'Encomenda' | 'Documento' | 'Revista' | 'Outro';

const tipoIcons: Record<string, React.ElementType> = {
  Carta: Mail,
  Pacote: Package,
  Encomenda: PackageCheck,
  Documento: File,
  Revista: BookOpen,
  Outro: Inbox,
};

export default function CorrespondenciasPage() {
  const { registrosFluxo, addRegistroFluxo, registrarSaida, user, pessoas, empresas, departamentos } = useAppStore();

  // Filter state
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendente');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');

  // Registration modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    data: format(new Date(), 'dd/MM/yyyy'),
    horarioEntrada: format(new Date(), 'HH:mm'),
    porteiro: user?.nome || '',
  });

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroCorrespondencias | null>(null);
  const [detalhesSaida, setDetalhesSaida] = useState('');
  const [ocorrenciaSaida, setOcorrenciaSaida] = useState('');
  const [quemRetirou, setQuemRetirou] = useState('');

  // Get only correspondencias records
  const correspondencias = useMemo(() => {
    return registrosFluxo.filter(
      (r): r is RegistroCorrespondencias => r.categoria === 'correspondencias'
    );
  }, [registrosFluxo]);

  // Filtered records
  const filteredRegistros = useMemo(() => {
    return correspondencias.filter((r) => {
      // Status filter
      const isRetirado = r.horarioSaida !== '';
      if (statusFilter === 'pendente' && isRetirado) return false;
      if (statusFilter === 'retirado' && !isRetirado) return false;

      // Tipo filter
      if (tipoFilter !== 'todos' && r.tipo !== tipoFilter) return false;

      // Search filter
      if (busca) {
        const search = busca.toLowerCase();
        const fields = [r.destinatario, r.remetente, r.tipo, r.departamento, r.quemRetirou, r.porteiro];
        return fields.some((v) => v.toLowerCase().includes(search));
      }
      return true;
    });
  }, [correspondencias, busca, statusFilter, tipoFilter]);

  // Stats
  const stats = useMemo(() => {
    const pendentes = correspondencias.filter((r) => !r.horarioSaida).length;
    const retirados = correspondencias.filter((r) => r.horarioSaida).length;
    const total = correspondencias.length;
    return { pendentes, retirados, total };
  }, [correspondencias]);

  // Autocomplete suggestions
  const nameSuggestions = useMemo(() => {
    const map = new Map<string, { sublabel: string }>();
    pessoas.filter((f) => !f.inativo).forEach((f) => {
      if (!map.has(f.nome)) {
        map.set(f.nome, { sublabel: `${f.cargo} — ${f.departamento}` });
      }
    });
    correspondencias.forEach((r) => {
      if (r.destinatario && !map.has(r.destinatario)) {
        map.set(r.destinatario, { sublabel: r.departamento || '' });
      }
    });
    return Array.from(map.entries()).map(([label, { sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      data: { name: label } as unknown as Record<string, string>,
    }));
  }, [pessoas, correspondencias]);

  const remetenteSuggestions = useMemo(() => {
    const map = new Map<string, { sublabel: string }>();
    empresas.forEach((e) => {
      if (!map.has(e.nome)) {
        map.set(e.nome, { sublabel: e.cnpj || '' });
      }
    });
    correspondencias.forEach((r) => {
      if (r.remetente && !map.has(r.remetente)) {
        map.set(r.remetente, { sublabel: '' });
      }
    });
    return Array.from(map.entries()).map(([label, { sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      data: { company: label } as unknown as Record<string, string>,
    }));
  }, [empresas, correspondencias]);

  // Handlers
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = () => {
    setFormData({
      data: format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: format(new Date(), 'HH:mm'),
      porteiro: user?.nome || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.destinatario) {
      toast.error('Preencha o destinatário');
      return;
    }

    const id = `fl_${Date.now()}`;
    const registro: RegistroCorrespondencias = {
      id,
      categoria: 'correspondencias',
      destinatario: formData.destinatario,
      remetente: formData.remetente || '',
      tipo: formData.tipo || '',
      departamento: formData.departamento || '',
      horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
      horarioSaida: '',
      quemRetirou: '',
      porteiro: formData.porteiro || user?.nome || '',
      data: formData.data || format(new Date(), 'dd/MM/yyyy'),
    };

    addRegistroFluxo(registro);
    toast.success('Correspondência registrada com sucesso!');
    setModalOpen(false);
  };

  const handleOpenDetail = (r: RegistroCorrespondencias) => {
    setSelectedRegistro(r);
    setDetalhesSaida(r.detalhes || '');
    setOcorrenciaSaida(r.ocorrencia || '');
    setQuemRetirou(r.quemRetirou || '');
    setDetailModalOpen(true);
  };

  const handleRegistrarRetirada = () => {
    if (!selectedRegistro) return;
    registrarSaida(selectedRegistro.id, detalhesSaida, ocorrenciaSaida, undefined, undefined, undefined, undefined, undefined, quemRetirou);
    toast.success('Retirada registrada com sucesso!');
    setDetailModalOpen(false);
    setSelectedRegistro(null);
    setDetalhesSaida('');
    setOcorrenciaSaida('');
    setQuemRetirou('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Header section */}
      <div className="p-4 md:p-6 pb-0 space-y-3">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendentes}</p>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pendentes</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.retirados}</p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Retirados</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs font-medium text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar destinatário, remetente, tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Filters row */}
        <div className="flex gap-2">
          {/* Tipo filter */}
          <Select
            value={tipoFilter}
            onValueChange={(v) => setTipoFilter(v as TipoFilter)}
          >
            <SelectTrigger className="h-9 text-sm bg-muted/50 border-0 flex-1">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Carta">Carta</SelectItem>
              <SelectItem value="Pacote">Pacote</SelectItem>
              <SelectItem value="Encomenda">Encomenda</SelectItem>
              <SelectItem value="Documento">Documento</SelectItem>
              <SelectItem value="Revista">Revista</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger
              value="pendente"
              className="text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              Pendentes
            </TabsTrigger>
            <TabsTrigger
              value="retirado"
              className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Retirados
            </TabsTrigger>
            <TabsTrigger
              value="todos"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content area - card list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pt-3 pb-28">
        {filteredRegistros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium mb-1">
              {statusFilter === 'pendente'
                ? 'Nenhuma correspondência pendente'
                : statusFilter === 'retirado'
                ? 'Nenhuma correspondência retirada'
                : 'Nenhuma correspondência encontrada'}
            </p>
            <p className="text-sm text-muted-foreground/70">
              Toque em Registrar para adicionar uma correspondência.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRegistros.map((r) => {
              const isRetirado = r.horarioSaida !== '';
              const TipoIcon = tipoIcons[r.tipo] || Inbox;

              return (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  onClick={() => handleOpenDetail(r)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-muted shrink-0">
                        <TipoIcon className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base truncate">{r.destinatario}</h3>
                          {isRetirado ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                              Retirado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          {r.tipo && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Tipo:</span> {r.tipo}
                            </p>
                          )}
                          {r.remetente && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Remetente:</span> {r.remetente}
                            </p>
                          )}
                          {r.departamento && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Depto:</span> {r.departamento}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {r.data}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {r.horarioEntrada}
                          </span>
                          {isRetirado && (
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <LogOut className="h-4 w-4" />
                              {r.horarioSaida}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom register button */}
      <div data-desktop-action-bar className="fixed bottom-16 left-0 right-0 z-30 pt-3 pb-7 px-4 md:px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <Button
          onClick={handleOpenModal}
          className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Registrar Correspondência
        </Button>
      </div>

      {/* Registration Modal */}
      <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Nova Correspondência
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Destinatário *</Label>
              <AutocompleteInput
                value={formData.destinatario || ''}
                onChange={(v) => updateField('destinatario', v)}
                onSelect={(s) => {
                  if (s.data?.name) updateField('destinatario', s.data.name as string);
                }}
                suggestions={nameSuggestions}
                placeholder="Nome de quem vai receber"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remetente</Label>
              <AutocompleteInput
                value={formData.remetente || ''}
                onChange={(v) => updateField('remetente', v)}
                onSelect={(s) => {
                  if (s.data?.company) updateField('remetente', s.data.company as string);
                }}
                suggestions={remetenteSuggestions}
                placeholder="Quem enviou a correspondência"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(v) => updateField('tipo', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carta">Carta</SelectItem>
                  <SelectItem value="Pacote">Pacote</SelectItem>
                  <SelectItem value="Encomenda">Encomenda</SelectItem>
                  <SelectItem value="Documento">Documento</SelectItem>
                  <SelectItem value="Revista">Revista</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Departamento</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.id} value={dep.nome}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label>Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-3 pt-0 sm:gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared detail modal — also used by Fluxo for Correspondências */}
      <CorrespondenciaDetailModal
        open={detailModalOpen}
        onOpenChange={(open) => {
          setDetailModalOpen(open);
          if (!open) {
            setSelectedRegistro(null);
            setDetalhesSaida('');
            setOcorrenciaSaida('');
            setQuemRetirou('');
          }
        }}
        registro={selectedRegistro}
        nameSuggestions={nameSuggestions}
        quemRetirou={quemRetirou}
        onQuemRetirouChange={setQuemRetirou}
        detalhesSaida={detalhesSaida}
        onDetalhesSaidaChange={setDetalhesSaida}
        ocorrenciaSaida={ocorrenciaSaida}
        onOcorrenciaSaidaChange={setOcorrenciaSaida}
        onRegistrarRetirada={handleRegistrarRetirada}
      />
    </motion.div>
  );
}
