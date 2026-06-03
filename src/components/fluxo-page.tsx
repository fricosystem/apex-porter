'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, LogOut, Inbox, Clock, ArrowRightLeft, User, Building2, Truck, Scale, Package, Calendar, FileText, AlertTriangle, Users, Mail, TrendingUp, RotateCcw, X, SlidersHorizontal, PlusCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAppStore } from '@/lib/store';
import { CATEGORIAS_FLUXO, type CategoriaFluxo, type RegistroFluxo } from '@/lib/data';
import RegistroModal from './registro-modal';
import { toast } from 'sonner';

type StatusFilter = 'aberto' | 'finalizado' | 'todos';

const catIcons: Record<CategoriaFluxo, React.ElementType> = {
  entregas1: Package,
  visitantes: User,
  prestadores: Building2,
  pesagem: Scale,
  entregas2: Truck,
  coleta: ArrowRightLeft,
  movimentacao: Users,
  correspondencias: Mail,
};

function getMainField(r: RegistroFluxo): string {
  switch (r.categoria) {
    case 'entregas1': return r.nome;
    case 'visitantes': 
      return (r as any).nome || r.nomeEmpresa?.split(' / ')[0] || r.nomeEmpresa;
    case 'prestadores': 
      return (r as any).nome || r.nomeEmpresa?.split(' / ')[0] || r.nomeEmpresa;
    case 'pesagem': return r.motorista;
    case 'entregas2': return r.motorista;
    case 'coleta': return r.motorista;
    case 'movimentacao': return r.nomeColaborador;
    case 'correspondencias': return r.destinatario;
  }
}

function formatRgCpfField(doc?: string): { label: string; value: string } {
  if (!doc) return { label: 'RG/CPF', value: '-' };
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    return { label: 'CPF', value: digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') };
  } else if (digits.length > 0) {
    return { label: 'RG', value: digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') };
  }
  return { label: 'RG/CPF', value: doc };
}

function getSecondaryFields(r: RegistroFluxo): { label: string; value: string }[] {
  switch (r.categoria) {
    case 'entregas1':
      return [
        { label: 'Empresa', value: r.empresa },
        formatRgCpfField(r.rgCpf),
      ];
    case 'visitantes':
      return [
        { label: 'Empresa', value: (r as any).empresa || r.nomeEmpresa?.split(' / ')[1] || '' },
        { label: 'Departamento', value: r.departamento },
        formatRgCpfField(r.rgCpf),
      ];
    case 'prestadores':
      return [
        { label: 'Empresa', value: (r as any).empresa || r.nomeEmpresa?.split(' / ')[1] || '' },
        { label: 'Departamento', value: r.departamento },
        formatRgCpfField(r.rgCpf),
      ];
    case 'pesagem':
      return [
        { label: 'RG/CPF', value: (r as any).rgCpf || '-' },
        { label: 'Empresa', value: r.empresa },
        { label: 'Placa', value: r.placa },
        { label: 'Peso Entrada', value: `${r.pesoEntrada.toLocaleString('pt-BR')} kg` },
      ];
    case 'entregas2':
      return [
        { label: 'Empresa', value: r.empresa },
        { label: 'Departamento', value: r.departamento },
        formatRgCpfField(r.cpfRg),
      ];
    case 'coleta':
      return [
        { label: 'Empresa', value: r.empresa },
        { label: 'Placa', value: r.placa },
        formatRgCpfField(r.rgCpf),
      ];
    case 'movimentacao':
      return [
        formatRgCpfField(r.rgCpf),
        { label: 'Autorizado por', value: r.autorizadoPor },
        { label: 'Porteiro', value: r.porteiro },
      ];
    case 'correspondencias':
      return [
        { label: 'Tipo', value: r.tipo },
        { label: 'Remetente', value: r.remetente },
        { label: 'Departamento', value: r.departamento },
      ];
  }
}

function getAllFields(r: RegistroFluxo): { label: string; value: string }[] {
  const base: { label: string; value: string }[] = [];
  base.push({ label: 'Categoria', value: CATEGORIAS_FLUXO.find(c => c.value === r.categoria)?.label || r.categoria });
  base.push({ label: 'Data', value: r.data });
  base.push({ label: 'Horário de Entrada', value: r.horarioEntrada });

  switch (r.categoria) {
    case 'entregas1':
      base.push({ label: 'Nome', value: r.nome });
      base.push({ label: 'Empresa', value: r.empresa });
      base.push(formatRgCpfField(r.rgCpf));
      break;
    case 'visitantes':
      base.push({ label: 'Nome', value: (r as any).nome || r.nomeEmpresa.split(' / ')[0] || r.nomeEmpresa });
      base.push({ label: 'Empresa', value: (r as any).empresa || r.nomeEmpresa.split(' / ')[1] || '' });
      base.push({ label: 'Departamento', value: r.departamento });
      base.push(formatRgCpfField(r.rgCpf));
      break;
    case 'prestadores':
      base.push({ label: 'Nome', value: (r as any).nome || r.nomeEmpresa.split(' / ')[0] || r.nomeEmpresa });
      base.push({ label: 'Empresa', value: (r as any).empresa || r.nomeEmpresa.split(' / ')[1] || '' });
      base.push({ label: 'Departamento', value: r.departamento });
      base.push(formatRgCpfField(r.rgCpf));
      break;
    case 'pesagem':
      base.push({ label: 'Nome do Motorista', value: r.motorista });
      base.push(formatRgCpfField((r as any).rgCpf));
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'Placa', value: r.placa });
      base.push({ label: 'Peso Entrada', value: `${r.pesoEntrada.toLocaleString('pt-BR')} kg` });
      if (r.pesoSaida) base.push({ label: 'Peso Saída', value: `${r.pesoSaida.toLocaleString('pt-BR')} kg` });
      break;
    case 'entregas2':
      base.push({ label: 'Nome do Motorista', value: r.motorista });
      base.push(formatRgCpfField(r.cpfRg));
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'Departamento', value: r.departamento });
      if (r.placa) base.push({ label: 'Placa', value: r.placa });
      if (r.pesoEntrada) base.push({ label: 'Peso Entrada', value: `${r.pesoEntrada.toLocaleString('pt-BR')} kg` });
      if (r.pesoSaida) base.push({ label: 'Peso Saída', value: `${r.pesoSaida.toLocaleString('pt-BR')} kg` });
      break;
    case 'coleta':
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'Nome do Motorista', value: r.motorista });
      base.push({ label: 'Placa', value: r.placa });
      base.push(formatRgCpfField(r.rgCpf));
      if (r.pesoEntrada) base.push({ label: 'Peso Entrada', value: `${r.pesoEntrada.toLocaleString('pt-BR')} kg` });
      if (r.pesoSaida) base.push({ label: 'Peso Saída', value: `${r.pesoSaida.toLocaleString('pt-BR')} kg` });
      break;
    case 'movimentacao':
      base.push({ label: 'Nome do Colaborador', value: r.nomeColaborador });
      base.push(formatRgCpfField(r.rgCpf));
      base.push({ label: 'Movimentação', value: r.tipoMovimentacao === 'saindo' ? 'Saindo' : 'Entrando' });
      base.push({ label: 'Autorizado Por', value: r.autorizadoPor });
      base.push({ label: 'Porteiro', value: r.porteiro });
      break;
    case 'correspondencias':
      base.push({ label: 'Destinatário', value: r.destinatario });
      base.push({ label: 'Remetente', value: r.remetente });
      base.push({ label: 'Tipo', value: r.tipo });
      base.push({ label: 'Departamento', value: r.departamento });
      base.push({ label: 'Quem Retirou', value: r.quemRetirou });
      base.push({ label: 'Porteiro', value: r.porteiro });
      break;
  }

  if (r.horarioSaida) {
    base.push({ label: 'Horário de Saída', value: r.horarioSaida });
  }
  if (r.observacao) {
    base.push({ label: 'Observação', value: r.observacao });
  }
  if (r.detalhes) {
    base.push({ label: 'Detalhes', value: r.detalhes });
  }
  if (r.ocorrencia) {
    base.push({ label: 'Ocorrência', value: r.ocorrencia });
  }

  return base;
}

export default function FluxoPage() {
  const {
    categoriaAtiva,
    setCategoriaAtiva,
    registrosFluxo,
    rascunhosFluxo,
    registrarSaida,
    inativarRegistroFluxo,
    buscaFluxo,
    setBuscaFluxo,
    user,
    departamentos,
    empresas,
    addEmpresa,
    prefilledRegistroModal,
    clearPrefilledRegistroModal
  } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategoria, setModalCategoria] = useState<CategoriaFluxo>(
    categoriaAtiva === 'todos' ? 'visitantes' : categoriaAtiva
  );
  const [prefilledFormData, setPrefilledFormData] = useState<Record<string, string> | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('aberto');
  const [ordenacao, setOrdenacao] = useState<'mais_recentes' | 'mais_antigos'>('mais_recentes');

  // New Filters
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todos');
  const [filtroData, setFiltroData] = useState<string>('');

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = 
    categoriaAtiva !== 'todos' || 
    ordenacao !== 'mais_recentes' || 
    filtroDepartamento !== 'todos' || 
    filtroEmpresa !== 'todos' || 
    filtroData !== '';

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroFluxo | null>(null);
  const [detalhesSaida, setDetalhesSaida] = useState('');
  const [ocorrenciaSaida, setOcorrenciaSaida] = useState('');
  const [pesoSaidaInput, setPesoSaidaInput] = useState('');

  // Refacao auditavel states
  const [registroRefacao, setRegistroRefacao] = useState<RegistroFluxo | null>(null);
  const [isRefacao, setIsRefacao] = useState(false);
  const [confirmarRefacaoOpen, setConfirmarRefacaoOpen] = useState(false);
  const [registroParaConfirmar, setRegistroParaConfirmar] = useState<RegistroFluxo | null>(null);

  const [isRascunhoEditing, setIsRascunhoEditing] = useState(false);
  const [mensagemLiberacao, setMensagemLiberacao] = useState<string | null>(null);

  // Cadastrar Empresa quick modal
  const [cadastrarEmpresaOpen, setCadastrarEmpresaOpen] = useState(false);
  const [novaEmpresaNome, setNovaEmpresaNome] = useState('');
  const [cadastrandoEmpresa, setCadastrandoEmpresa] = useState(false);

  const handleCadastrarEmpresa = () => {
    const nome = novaEmpresaNome.trim();
    if (!nome) return;
    setCadastrandoEmpresa(true);
    const id = `emp_${Date.now()}`;
    addEmpresa({ id, nome });
    toast.success(`Empresa "${nome}" cadastrada com sucesso!`);
    setCadastrarEmpresaOpen(false);
    setNovaEmpresaNome('');
    setCadastrandoEmpresa(false);
  };

  const getEmpresaDoRegistro = (registro: RegistroFluxo): string => {
    if ((registro as any).empresa) return (registro as any).empresa;
    if ('nomeEmpresa' in registro) {
      const partes = (registro as any).nomeEmpresa?.split(' / ');
      return partes?.[1] || partes?.[0] || '';
    }
    return '';
  };

  const empresaExisteNaColecao = (nomeEmpresa: string): boolean => {
    if (!nomeEmpresa) return true;
    return empresas.some(
      (e) => e.nome.toLowerCase().trim() === nomeEmpresa.toLowerCase().trim()
    );
  };

  useEffect(() => {
    setCategoriaAtiva('todos');
  }, [setCategoriaAtiva]);

  useEffect(() => {
    if (prefilledRegistroModal) {
      setModalCategoria(prefilledRegistroModal.categoria);
      setPrefilledFormData(prefilledRegistroModal.formData || null);
      setModalOpen(true);
      clearPrefilledRegistroModal();
    }
  }, [prefilledRegistroModal, clearPrefilledRegistroModal]);

  useEffect(() => {
    if (statusFilter === 'finalizado') {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      setFiltroData(`${ano}-${mes}-${dia}`);
    }
  }, [statusFilter]);

  const departamentoOptions = useMemo(() => {
    const set = new Set<string>();
    departamentos.forEach((d) => set.add(d.nome));
    registrosFluxo.forEach((r) => {
      if ('departamento' in r && r.departamento) set.add(r.departamento);
    });
    return Array.from(set).sort();
  }, [departamentos, registrosFluxo]);

  const empresaOptions = useMemo(() => {
    const set = new Set<string>();
    empresas.forEach((e) => set.add(e.nome));
    registrosFluxo.forEach((r) => {
      if ('empresa' in r && r.empresa) set.add(r.empresa);
      if ('nomeEmpresa' in r && r.nomeEmpresa) {
        const partes = r.nomeEmpresa.split(' / ');
        if (partes[1]) set.add(partes[1]);
      }
    });
    return Array.from(set).sort();
  }, [empresas, registrosFluxo]);

  const filteredRegistros = useMemo(() => {
    let result = [...rascunhosFluxo, ...registrosFluxo].filter((r) => {
      if (categoriaAtiva !== 'todos' && r.categoria !== categoriaAtiva) return false;
      const hasSaida = 'horarioSaida' in r && r.horarioSaida !== '';
      if (statusFilter === 'aberto' && hasSaida) return false;
      if (statusFilter === 'finalizado' && !hasSaida) return false;
      if (buscaFluxo) {
        const search = buscaFluxo.toLowerCase();
        const fields = Object.values(r).filter((v) => typeof v === 'string');
        return fields.some((v) => v.toLowerCase().includes(search));
      }

      if (filtroDepartamento !== 'todos') {
        const d = ('departamento' in r) ? (r as any).departamento : '';
        if (d !== filtroDepartamento) return false;
      }
      if (filtroEmpresa !== 'todos') {
        const e = getEmpresaDoRegistro(r);
        if (e !== filtroEmpresa) return false;
      }
      if (filtroData) {
        const [ano, mes, dia] = filtroData.split('-');
        const formattedDate = `${dia}/${mes}/${ano}`;
        if (r.data !== formattedDate) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      try {
        const [diaA, mesA, anoA] = a.data.split('/');
        const [horaA, minA] = a.horarioEntrada.split(':');
        const dateA = new Date(Number(anoA), Number(mesA) - 1, Number(diaA), Number(horaA) || 0, Number(minA) || 0).getTime();

        const [diaB, mesB, anoB] = b.data.split('/');
        const [horaB, minB] = b.horarioEntrada.split(':');
        const dateB = new Date(Number(anoB), Number(mesB) - 1, Number(diaB), Number(horaB) || 0, Number(minB) || 0).getTime();

        if (ordenacao === 'mais_recentes') {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      } catch (e) {
        return 0;
      }
    });

    return result;
  }, [registrosFluxo, rascunhosFluxo, categoriaAtiva, buscaFluxo, statusFilter, ordenacao, filtroDepartamento, filtroEmpresa, filtroData]);

  const handleAddRegistro = () => {
    setRegistroRefacao(null);
    setIsRefacao(false);
    setIsRascunhoEditing(false);
    setModalCategoria(categoriaAtiva === 'todos' ? 'visitantes' : categoriaAtiva);
    setModalOpen(true);
  };

  const handleOpenDetail = (r: RegistroFluxo) => {
    if (r.isRascunho) {
      setRegistroRefacao(r);
      setIsRefacao(false);
      setIsRascunhoEditing(true);
      setModalCategoria(r.categoria);
      setModalOpen(true);
      return;
    }
    setSelectedRegistro(r);
    setDetalhesSaida(r.detalhes || '');
    setOcorrenciaSaida(r.ocorrencia || '');
    setPesoSaidaInput('');
    setDetailModalOpen(true);
  };

  const handleRegistrarSaida = () => {
    if (!selectedRegistro) return;
    const categoriaComPeso = selectedRegistro.categoria === 'pesagem' || selectedRegistro.categoria === 'coleta' || selectedRegistro.categoria === 'entregas2';
    const pesoSaida = categoriaComPeso
      ? parseFloat(pesoSaidaInput.replace(',', '.')) || 0
      : undefined;
    const porteiroSaida = user?.nome || undefined;
    registrarSaida(selectedRegistro.id, detalhesSaida, ocorrenciaSaida, pesoSaida, porteiroSaida);
    toast.success('Saída registrada com sucesso!');
    setDetailModalOpen(false);
    setSelectedRegistro(null);
    setDetalhesSaida('');
    setOcorrenciaSaida('');
    setPesoSaidaInput('');
  };

  const closeModals = () => {
    setModalOpen(false);
    setDetailModalOpen(false);
    setSelectedRegistro(null);
    setPesoSaidaInput('');
    setMensagemLiberacao(null);
  };

  const gerarMensagemLiberacao = (r: RegistroFluxo) => {
    let nome = (r as any).nome || (r as any).motorista || '';
    if (r.categoria === 'visitantes' || r.categoria === 'prestadores') {
       nome = (r as any).nome || (r as any).nomeEmpresa?.split(' / ')[0] || (r as any).nomeEmpresa || '';
    }
    const empresa = (r as any).empresa || (r as any).nomeEmpresa?.split(' / ')[1] || '';
    
    // extrair doc
    let doc = (r as any).rgCpf || (r as any).cpfRg || '';
    let docLabel = 'RG/CPF';
    let docValue = doc || '-';
    if (doc) {
      const digits = doc.replace(/\D/g, '');
      if (digits.length === 11) {
        docLabel = 'CPF';
        docValue = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (digits.length > 0) {
        docLabel = 'RG';
        docValue = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
    }
    
    let acao = 'uma visita';
    switch (r.categoria) {
      case 'coleta': acao = 'retirar a coleta'; break;
      case 'visitantes': acao = 'uma visita'; break;
      case 'prestadores': acao = 'uma prestação de serviço'; break;
      case 'entregas1':
      case 'entregas2': acao = 'uma entrega'; break;
      case 'pesagem': acao = 'uma pesagem'; break;
      case 'correspondencias': acao = 'uma entrega de correspondência'; break;
      default: acao = r.categoria;
    }
    
    return `O Sr. ${nome}, ${docLabel} ${docValue}, está aqui pela empresa ${empresa} para ${acao}. Podemos liberar?`;
  };

  const handleRefazer = (r: RegistroFluxo) => {
    setRegistroParaConfirmar(r);
    setConfirmarRefacaoOpen(true);
  };

  const confirmarRefazer = () => {
    if (!registroParaConfirmar) return;
    inativarRegistroFluxo(registroParaConfirmar.id, undefined, 'Substituído por nova versão corrigida (Refazer)');
    toast.info('Registro anterior inativado para refação.');
    setConfirmarRefacaoOpen(false);
    setDetailModalOpen(false);
    setSelectedRegistro(null);
    setRegistroRefacao(registroParaConfirmar);
    setIsRefacao(true);
    setModalCategoria(registroParaConfirmar.categoria);
    setModalOpen(true);
    setRegistroParaConfirmar(null);
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Top section: Search + Filter */}
      <div className="p-4 md:p-6 pb-0 space-y-3">
        {/* Search bar + Filter Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, placa, empresa..."
              value={buscaFluxo}
              onChange={(e) => setBuscaFluxo(e.target.value)}
              className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Button
            variant={showFilters || hasActiveFilters ? "secondary" : "outline"}
            className="relative h-11 w-11 shrink-0 p-0 border-0 bg-muted/50 hover:bg-muted"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className={`h-5 w-5 ${hasActiveFilters ? 'text-primary' : 'text-muted-foreground'}`} />
            {hasActiveFilters && !showFilters && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </Button>
        </div>

        {/* Expandable Filters Area */}
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Filters Row 1: Categoria + Ordenacao */}
            <div className="grid grid-cols-2 gap-2">
              {/* Category dropdown filter */}
              <Select
                value={categoriaAtiva}
                onValueChange={(v) => setCategoriaAtiva(v as CategoriaFluxo | 'todos')}
              >
                <SelectTrigger className="h-11 text-sm bg-muted/50 border-0 w-full truncate">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {CATEGORIAS_FLUXO.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort dropdown */}
              <Select
                value={ordenacao}
                onValueChange={(v) => setOrdenacao(v as 'mais_recentes' | 'mais_antigos')}
              >
                <SelectTrigger className="h-11 text-sm bg-muted/50 border-0 w-full truncate">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais_recentes">Mais recentes</SelectItem>
                  <SelectItem value="mais_antigos">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters Row 2: Departamento + Empresa */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                <SelectTrigger className="h-10 text-sm bg-muted/50 border-0 w-full truncate">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Deptos</SelectItem>
                  {departamentoOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                <SelectTrigger className="h-10 text-sm bg-muted/50 border-0 w-full truncate">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Empresas</SelectItem>
                  {empresaOptions.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Row 3: Data */}
            <div className="relative flex items-center">
              <Input 
                type="date" 
                value={filtroData} 
                onChange={(e) => setFiltroData(e.target.value)} 
                className="h-10 text-sm bg-muted/50 border-0 w-full pr-10"
              />
              {filtroData && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setFiltroData('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Status tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList className="w-full grid grid-cols-3 h-10">
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pt-3 pb-44">
        {filteredRegistros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium mb-1">
              {statusFilter === 'aberto'
                ? 'Nenhum registro em aberto'
                : statusFilter === 'finalizado'
                  ? 'Nenhum registro finalizado'
                  : 'Nenhum registro encontrado'}
            </p>
            <p className="text-sm text-muted-foreground/70">
              Toque em Registrar Entrada para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRegistros.map((r) => {
              const hasSaida = 'horarioSaida' in r && r.horarioSaida !== '';
              const mainField = getMainField(r);
              const secondaryFields = getSecondaryFields(r);
              const data = 'data' in r ? (r as any).data : '';
              const horarioEntrada = 'horarioEntrada' in r ? (r as any).horarioEntrada : '';
              const horarioSaida = 'horarioSaida' in r ? (r as any).horarioSaida : '';
              // PESAGEM DE CARGA extras
              const isPesagem = r.categoria === 'pesagem';
              const pesoEntrada = isPesagem ? (r as any).pesoEntrada ?? 0 : 0;
              const pesoSaidaVal = isPesagem ? (r as any).pesoSaida ?? 0 : 0;
              const resultadoDif = isPesagem ? (r as any).resultadoDiferenca ?? null : null;
              const porteiroEntrada = (r as any).porteiroEntrada || null;
              const porteiroSaidaVal = (r as any).porteiroSaida || null;
              const CardIcon = catIcons[r.categoria] || Package;

              const isInactive = r.inativo;
              const catLabel = CATEGORIAS_FLUXO.find(c => c.value === r.categoria)?.label || r.categoria;
              return (
                <Card
                  key={r.id}
                  className={`cursor-pointer transition-colors active:scale-[0.98] ${
                    r.isRascunho 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40' 
                      : isInactive 
                        ? 'opacity-60 bg-red-500/5 dark:bg-red-500/10 border-dashed border-red-500/30' 
                        : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleOpenDetail(r)}
                >
                  <CardContent className="p-3.5">
                    {/* Topo: badge de categoria + badges de status */}
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      <Badge variant="secondary" className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
                        <CardIcon className={`h-3 w-3 ${r.isRascunho ? 'text-red-500' : ''}`} />
                        {catLabel}
                      </Badge>
                      {r.isRascunho ? (
                        <Badge variant="outline" className="text-red-600 bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800 text-xs px-1.5 py-0">
                          Rascunho
                        </Badge>
                      ) : isInactive ? (
                        <Badge variant="outline" className="text-red-500 border-red-300 dark:border-red-800 text-xs px-1.5 py-0">
                          Inativo (Refeito)
                        </Badge>
                      ) : hasSaida ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-1.5 py-0">
                          Concluído
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs px-1.5 py-0">
                          Pendente
                        </Badge>
                      )}
                    </div>

                    {/* Conteúdo principal */}
                    <div className="min-w-0">
                      <h3 className={`font-bold text-lg truncate ${r.isRascunho ? 'text-red-700 dark:text-red-400' : ''}`}>{mainField}</h3>
                      <div className="mt-1 space-y-0.5">
                        {secondaryFields.map((field) => (
                          <p key={field.label} className="text-base leading-snug text-muted-foreground">
                            <span className="font-medium">{field.label}:</span> {field.value || '-'}
                          </p>
                        ))}
                      </div>

                      {/* PESAGEM DE CARGA — resultado em destaque nos finalizados */}
                      {isPesagem && hasSaida && resultadoDif !== null && (
                        <div className={`mt-2 rounded-xl px-3 py-2 border ${resultadoDif >= 0
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                          }`}>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            Resultado Pesagem
                          </p>
                          <p className={`text-2xl font-black ${resultadoDif >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {resultadoDif >= 0 ? '+' : ''}{resultadoDif.toLocaleString('pt-BR')} kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Entrada: {pesoEntrada.toLocaleString('pt-BR')} kg · Saída: {pesoSaidaVal.toLocaleString('pt-BR')} kg
                          </p>
                        </div>
                      )}

                      {/* Porteiros */}
                      {(porteiroEntrada || porteiroSaidaVal) && (
                        <div className="mt-1 space-y-0.5">
                          {porteiroEntrada === porteiroSaidaVal ? (
                            <p className="text-base leading-snug text-muted-foreground">
                              <span className="font-medium">PORTEIRO:</span> {porteiroEntrada}
                            </p>
                          ) : (
                            <>
                              {porteiroEntrada && (
                                <p className="text-base leading-snug text-muted-foreground">
                                  <span className="font-medium">ENTRADA:</span> {porteiroEntrada}
                                </p>
                              )}
                              {porteiroSaidaVal && (
                                <p className="text-base leading-snug text-muted-foreground">
                                  <span className="font-medium">SAÍDA:</span> {porteiroSaidaVal}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Rodapé: data e horários */}
                      <div className="flex flex-nowrap items-center gap-x-3 mt-2.5 pt-2 border-t border-border/40 text-sm text-muted-foreground overflow-x-auto scrollbar-none">
                        <span className="flex items-center gap-1.5 shrink-0">
                          <Calendar className="h-4 w-4" />
                          {data}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <Clock className="h-4 w-4" />
                          Entrou às: {horarioEntrada}
                        </span>
                        {hasSaida && (
                          <span className="flex items-center gap-1.5 shrink-0 text-emerald-600 dark:text-emerald-400">
                            <LogOut className="h-4 w-4" />
                            Saiu às: {horarioSaida}
                          </span>
                        )}
                      </div>
                      {/* Observação */}
                      {'observacao' in r && (r as any).observacao && (
                        <div className="mt-3 pt-2 border-t border-border/30">
                          <p className="text-base leading-snug">
                            <span className="font-medium text-muted-foreground">Observação:</span> <span className="text-foreground">{(r as any).observacao}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom register button - above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 z-30 pt-3 pb-7 px-4 md:px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <Button
          onClick={handleAddRegistro}
          className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Registrar Entrada
        </Button>
      </div>

      {/* Registro Modal */}
      <RegistroModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefilledFormData(null); }}
        categoriaInicial={modalCategoria}
        registroInicial={registroRefacao}
        isRefacao={isRefacao}
        isRascunho={isRascunhoEditing}
        prefilledFormData={prefilledFormData}
      />

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(v) => { if (!v) { setDetailModalOpen(false); setSelectedRegistro(null); setPesoSaidaInput(''); } }}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              {selectedRegistro && (() => {
                const RIcon = catIcons[selectedRegistro.categoria];
                return <RIcon className="h-5 w-5 text-emerald-600" />;
              })()}
              <span className="flex-1">Detalhes do Registro</span>
              
              {selectedRegistro && !selectedRegistro.inativo && (
                <button
                  type="button"
                  onClick={() => setMensagemLiberacao(gerarMensagemLiberacao(selectedRegistro))}
                  className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md text-emerald-600 transition-colors mr-14"
                  title="Gerar Mensagem de Liberação"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRegistro && (
            <div className="space-y-5">
              {selectedRegistro.inativo && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold uppercase tracking-wider text-[11px]">Registro Inativado / Versão Anterior</p>
                    <p>{selectedRegistro.motivoRefacao || 'Substituído por nova versão auditável'}</p>
                    {selectedRegistro.dataInativacao && (
                      <p className="text-[10px] text-muted-foreground">Inativado em {selectedRegistro.dataInativacao}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Entry Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-sm">Informações de Entrada</span>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                  {getAllFields(selectedRegistro).map((field) => {
                    const isEmpresaField = field.label === 'Empresa';
                    const empresaNome = isEmpresaField ? field.value : '';
                    const jaExiste = isEmpresaField ? empresaExisteNaColecao(empresaNome) : true;
                    return (
                      <div key={field.label} className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground shrink-0">{field.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-foreground text-right">{field.value || '-'}</span>
                          {isEmpresaField && field.value && !jaExiste && (
                            <button
                              onClick={() => {
                                setNovaEmpresaNome(field.value);
                                setCadastrarEmpresaOpen(true);
                              }}
                              className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                              title="Cadastrar empresa"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Only show detalhes/ocorrencia/saida if not yet finalized */}
              {!selectedRegistro.horarioSaida && !selectedRegistro.inativo && (
                <>
                  {/* Peso de Saída — PESAGEM DE CARGA, COLETA e ENTREGAS */}
                  {(selectedRegistro.categoria === 'pesagem' || selectedRegistro.categoria === 'coleta' || selectedRegistro.categoria === 'entregas2') && (() => {
                    const pesoEntrada = (selectedRegistro as any).pesoEntrada ?? 0;
                    const pesoSaidaNum = parseFloat(pesoSaidaInput.replace(',', '.')) || 0;
                    const diferenca = pesoSaidaNum - pesoEntrada;
                    const hasDiferenca = pesoSaidaInput.trim() !== '' && pesoSaidaNum > 0;
                    const hasPesoEntrada = pesoEntrada > 0;
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-emerald-500" />
                            Peso de Saída (kg)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Ex: 8500"
                            value={pesoSaidaInput}
                            onChange={(e) => setPesoSaidaInput(e.target.value)}
                            className="text-base"
                          />
                        </div>
                        {hasDiferenca && hasPesoEntrada && (
                          <div className={`rounded-2xl p-4 text-center border-2 ${diferenca >= 0
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-red-500/10 border-red-500/40'
                            }`}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Diferença (Saída − Entrada)
                            </p>
                            <p className={`text-4xl font-black tracking-tight ${diferenca >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                              {diferenca >= 0 ? '+' : ''}{diferenca.toLocaleString('pt-BR')} kg
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Entrada: {pesoEntrada.toLocaleString('pt-BR')} kg • Saída: {pesoSaidaNum.toLocaleString('pt-BR')} kg
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Detalhes field */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Detalhes
                    </Label>
                    <Textarea
                      placeholder="Informações adicionais sobre a visita..."
                      value={detalhesSaida}
                      onChange={(e) => setDetalhesSaida(e.target.value)}
                      rows={3}
                      className="text-base"
                    />
                  </div>

                  {/* Ocorrência field */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Ocorrência
                    </Label>
                    <Textarea
                      placeholder="Registrar ocorrência ou incidente..."
                      value={ocorrenciaSaida}
                      onChange={(e) => setOcorrenciaSaida(e.target.value)}
                      rows={3}
                      className="text-base"
                    />
                  </div>
                </>
              )}

              {/* If already has detalhes/ocorrencia and is finalized, show them read-only */}
              {selectedRegistro.horarioSaida && (selectedRegistro.detalhes || selectedRegistro.ocorrencia) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">Registros Adicionais</span>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                    {selectedRegistro.detalhes && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Detalhes</span>
                        <p className="text-sm text-foreground mt-0.5">{selectedRegistro.detalhes}</p>
                      </div>
                    )}
                    {selectedRegistro.ocorrencia && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Ocorrência</span>
                        <p className="text-sm text-foreground mt-0.5">{selectedRegistro.ocorrencia}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registrar Saída button - only if not yet finalized */}
              {!selectedRegistro.horarioSaida && !selectedRegistro.inativo && (
                <Button
                  onClick={handleRegistrarSaida}
                  className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Registrar Saída
                </Button>
              )}

              {/* Status badge if already finalized */}
              {selectedRegistro.horarioSaida && (
                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm px-3 py-1">
                    Saída registrada às {selectedRegistro.horarioSaida}
                  </Badge>
                </div>
              )}

              {!selectedRegistro.inativo && (
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Auditoria: O registro original não pode ser modificado. Para corrigir, crie uma nova versão auditável.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleRefazer(selectedRegistro)}
                    className="w-full h-11 border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refazer Registro (Corrigir Versão)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cadastrar Empresa Quick Modal */}
      <Dialog open={cadastrarEmpresaOpen} onOpenChange={(v) => { if (!v) { setCadastrarEmpresaOpen(false); setNovaEmpresaNome(''); } }}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Cadastrar Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Esta empresa não está cadastrada na coleção. Você pode editar o nome abaixo antes de cadastrar.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="nova-empresa-nome">Nome da Empresa</Label>
              <Input
                id="nova-empresa-nome"
                value={novaEmpresaNome}
                onChange={(e) => setNovaEmpresaNome(e.target.value)}
                placeholder="Nome da empresa..."
                className="text-base"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCadastrarEmpresa(); }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setCadastrarEmpresaOpen(false); setNovaEmpresaNome(''); }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCadastrarEmpresa}
              disabled={!novaEmpresaNome.trim() || cadastrandoEmpresa}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Mensagem Liberação */}
      <Dialog open={!!mensagemLiberacao} onOpenChange={(v) => { if (!v) setMensagemLiberacao(null); }}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-background rounded-lg border shadow-lg p-4"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogTitle className="text-sm font-medium mb-3">Mensagem de Liberação</DialogTitle>
            <div className="bg-muted p-2 rounded text-xs text-foreground whitespace-pre-wrap select-all">
              {mensagemLiberacao}
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => {
                  if (mensagemLiberacao) {
                    navigator.clipboard.writeText(mensagemLiberacao);
                    toast.success('Mensagem copiada!');
                    setMensagemLiberacao(null);
                  }
                }}
              >
                Copiar e Fechar
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute top-3 right-3 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-muted">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Modal de Confirmação para Refazer Registro */}
      <Dialog open={confirmarRefacaoOpen} onOpenChange={(v) => { if (!v) { setConfirmarRefacaoOpen(false); setRegistroParaConfirmar(null); } }}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-background rounded-lg border shadow-lg p-4"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogTitle className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Refazer Registro
            </DialogTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja refazer este registro? O registro original será inativado e você poderá criar uma nova versão corrigida.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setConfirmarRefacaoOpen(false); setRegistroParaConfirmar(null); }}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarRefazer}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute top-3 right-3 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-muted">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </motion.div>
  );
}
