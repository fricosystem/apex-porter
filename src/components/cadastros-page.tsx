'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ShieldOff,
  Trash2,
  Search,
  Users,
  UserPlus,
  Briefcase,
  Truck,
  HeadphonesIcon,
  Package,
  Edit2,
  X,
  Check,
  Filter,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Ticket,
  Shield,
  ShieldCheck,
  DoorOpen,
  Recycle,
  CalendarClock,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { getTipoPessoaLabel, getTipoPessoaOptions, normalizeTipoPessoa, CATEGORIAS_FLUXO, type TipoPessoa, type Pessoa } from '@/lib/data';
import { toast } from 'sonner';
import AutocompleteInput from './autocomplete-input';
import { PESSOAS_INICIAIS, REGISTROS_FLUXO_INICIAIS } from '@/lib/seed-data';
import { formatCpfRg, formatPhone } from '@/lib/utils';
import { expandRegistroIndividualmente } from '@/lib/registro-individualizacao';

const TIPO_ICONS: Partial<Record<TipoPessoa, React.ReactNode>> = {
  Porteiro: <DoorOpen className="h-3.5 w-3.5" />,
  Vigia: <Shield className="h-3.5 w-3.5" />,
  Vigilante: <ShieldCheck className="h-3.5 w-3.5" />,
  Prestador: <HeadphonesIcon className="h-3.5 w-3.5" />,
  Entregador: <Package className="h-3.5 w-3.5" />,
  Colaborador: <Briefcase className="h-3.5 w-3.5" />,
  Coletor: <Recycle className="h-3.5 w-3.5" />,
  Esporadico: <CalendarClock className="h-3.5 w-3.5" />,
  // Tipos legados (cadastros antigos)
  Visitante: <Users className="h-3.5 w-3.5" />,
  Motorista: <Truck className="h-3.5 w-3.5" />,
  Outro: <UserPlus className="h-3.5 w-3.5" />,
};

const TIPO_COLORS: Partial<Record<TipoPessoa, string>> = {
  Porteiro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Vigia: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Vigilante: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Prestador: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Entregador: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Colaborador: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Coletor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Esporadico: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  // Tipos legados
  Visitante: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Motorista: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Outro: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

interface FormState {
  nome: string;
  tipo: TipoPessoa;
  empresa: string;
  departamento: string;
  cargo: string;
  rgCpf: string;
  placa: string;
  telefone: string;
  email: string;
  ticket: string;
}

const EMPTY_FORM: FormState = {
  nome: '',
  tipo: 'Colaborador',
  empresa: '',
  departamento: '',
  cargo: '',
  rgCpf: '',
  placa: '',
  telefone: '',
  email: '',
  ticket: '',
};

export default function CadastrosPage() {
  const { pessoas, addPessoa, removePessoa, updatePessoa, departamentos, empresas, registrosFluxo, tiposPessoa } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoPessoa | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  const [filterDepartamento, setFilterDepartamento] = useState<string>('todos');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPessoa, setDetailsPessoa] = useState<Pessoa | null>(null);
  const [showMoreVisits, setShowMoreVisits] = useState(false);
  const [visitPeriodInicio, setVisitPeriodInicio] = useState('');
  const [visitPeriodFim, setVisitPeriodFim] = useState('');
  const allTipoOptions = useMemo(() => getTipoPessoaOptions(tiposPessoa), [tiposPessoa]);
  const tipoOptions = useMemo(
    () => allTipoOptions.filter((tipo) => tipo.ativo),
    [allTipoOptions],
  );
  const tipoFormOptions = useMemo(
    () => allTipoOptions.filter((tipo) => tipo.ativo || tipo.value === form.tipo),
    [allTipoOptions, form.tipo],
  );

  // ── Paginação infinita (20 itens por vez) ──
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filterKey = `${search}|${filterTipo}|${filterStatus}|${filterDepartamento}|${filterEmpresa}`;
  const filterKeyRef = useRef(filterKey);

  // ── Unified suggestions ──
  const { nameSuggestions, empresaSuggestions, rgCpfSuggestions } = useMemo(() => {
    const namesMap = new Map<string, { label: string; sublabel?: string; data: any }>();
    const empresasMap = new Map<string, { label: string; sublabel?: string; data: any }>();
    const rgCpfMap = new Map<string, { label: string; sublabel?: string; data: any }>();

    // 0. Fallback from seed data (PESSOAS_INICIAIS)
    (PESSOAS_INICIAIS || []).forEach((p) => {
      const u = {
        name: p.nome || '',
        tipo: p.tipo || 'Colaborador',
        company: p.empresa || '',
        department: p.departamento || '',
        doc: p.rgCpf || '',
        plate: p.placa || '',
        phone: p.telefone || '',
        email: p.email || '',
      };

      if (u.name && !namesMap.has(u.name)) {
        namesMap.set(u.name, {
          label: u.name,
          sublabel: [u.tipo, u.company, u.department].filter(Boolean).join(' — '),
          data: u,
        });
      }

      if (u.company && !empresasMap.has(u.company)) {
        empresasMap.set(u.company, {
          label: u.company,
          sublabel: 'Empresa',
          data: u,
        });
      }

      if (u.doc && !rgCpfMap.has(u.doc)) {
        rgCpfMap.set(u.doc, {
          label: u.doc,
          sublabel: u.name,
          data: u,
        });
      }
    });

    // 1. From active pessoas database
    (pessoas || []).forEach((p) => {
      const u = {
        name: p.nome || '',
        tipo: p.tipo || 'Colaborador',
        company: p.empresa || '',
        department: p.departamento || '',
        doc: p.rgCpf || '',
        plate: p.placa || '',
        phone: p.telefone || '',
        email: p.email || '',
      };

      if (u.name) {
        namesMap.set(u.name, {
          label: u.name,
          sublabel: [u.tipo, u.company, u.department].filter(Boolean).join(' — '),
          data: u,
        });
      }

      if (u.company) {
        empresasMap.set(u.company, {
          label: u.company,
          sublabel: 'Empresa cadastrada',
          data: u,
        });
      }

      if (u.doc) {
        rgCpfMap.set(u.doc, {
          label: u.doc,
          sublabel: u.name,
          data: u,
        });
      }
    });

    // 2. From historical flow records (registrosFluxo)
    (registrosFluxo || [])
      .filter((r) => !r.inativo)
      .flatMap(expandRegistroIndividualmente)
      .forEach((r) => {
      let name = '';
      let doc = '';
      let company = '';
      let department = '';
      let plate = '';

      switch (r.categoria) {
        case 'entregas1':
          name = r.nome;
          company = r.empresa;
          doc = r.rgCpf;
          break;
        case 'visitantes':
        case 'prestadores':
          name = (r as any).nome || '';
          company = (r as any).empresa || '';
          department = r.departamento;
          doc = r.rgCpf;
          break;
        case 'pesagem':
          company = r.empresa;
          plate = r.placa;
          name = r.motorista;
          break;
        case 'entregas2':
          name = r.motorista;
          doc = r.cpfRg;
          company = r.empresa;
          department = r.departamento;
          break;
        case 'coleta':
          doc = r.rgCpf;
          plate = r.placa;
          company = r.empresa;
          name = r.motorista;
          break;
        case 'movimentacao':
          name = r.nomeColaborador;
          doc = r.rgCpf;
          break;
        case 'correspondencias':
          name = r.destinatario;
          company = r.remetente;
          department = r.departamento;
          break;
        case 'pesagem_apara':
          name = (r as any).condutor || '';
          plate = (r as any).veiculo || '';
          break;
        case 'pesagem_tinta':
          name = (r as any).condutor || '';
          plate = (r as any).veiculo || '';
          break;
      }

      if (!name) return;

      const u = {
        name,
        tipo: r.categoria === 'visitantes' ? 'Visitante' : r.categoria === 'prestadores' ? 'Prestador' : 'Outro',
        company,
        department,
        doc,
        plate,
        phone: '',
        email: '',
      };

      if (!namesMap.has(name)) {
        namesMap.set(name, {
          label: name,
          sublabel: [u.tipo, u.company, department].filter(Boolean).join(' — '),
          data: u,
        });
      } else {
        const existing = namesMap.get(name)!;
        existing.data = {
          ...u,
          ...existing.data,
          company: existing.data.company || company,
          department: existing.data.department || department,
          doc: existing.data.doc || doc,
          plate: existing.data.plate || plate,
        };
      }

      if (company) {
        empresasMap.set(company, {
          label: company,
          sublabel: name,
          data: u,
        });
      }

      if (doc) {
        rgCpfMap.set(doc, {
          label: doc,
          sublabel: name,
          data: u,
        });
      }
    });

    return {
      nameSuggestions: Array.from(namesMap.values()),
      empresaSuggestions: Array.from(empresasMap.values()),
      rgCpfSuggestions: Array.from(rgCpfMap.values()),
    };
  }, [pessoas, registrosFluxo]);

  const handleAutoSelect = (suggestionData: any) => {
    if (!suggestionData) return;
    setForm((prev) => ({
      ...prev,
      nome: suggestionData.name || prev.nome,
      tipo: (suggestionData.tipo as TipoPessoa) || prev.tipo,
      empresa: suggestionData.company || prev.empresa,
      departamento: suggestionData.department || prev.departamento,
      rgCpf: suggestionData.doc || prev.rgCpf,
      placa: suggestionData.plate || prev.placa,
      telefone: suggestionData.phone || prev.telefone,
      email: suggestionData.email || prev.email,
    }));
  };

  // Filtered list
  const filteredPessoas = useMemo(() => {
    let list = pessoas;
    
    if (filterStatus === 'ativos') list = list.filter((p) => !p.inativo);
    if (filterStatus === 'inativos') list = list.filter((p) => p.inativo);
    
    if (filterTipo !== 'todos') {
      // Normaliza para comparar tipos legados (ex: Motorista → Coletor)
      list = list.filter((p) => normalizeTipoPessoa(p.tipo) === filterTipo);
    }
    if (filterDepartamento !== 'todos') {
      list = list.filter((p) => p.departamento === filterDepartamento);
    }
    if (filterEmpresa !== 'todos') {
      list = list.filter((p) => p.empresa === filterEmpresa);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.empresa.toLowerCase().includes(q) ||
          p.rgCpf.toLowerCase().includes(q) ||
          p.departamento.toLowerCase().includes(q) ||
          p.cargo.toLowerCase().includes(q) ||
          p.placa.toLowerCase().includes(q)
      );
    }
    
    // Ordenar A-Z pelo nome
    list = [...list].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    
    return list;
  }, [pessoas, search, filterTipo, filterStatus, filterDepartamento, filterEmpresa]);

  // Reinicia a paginação quando os filtros ou a busca mudam
  useEffect(() => {
    filterKeyRef.current = filterKey;
    const t = setTimeout(() => {
      setVisibleCount(PAGE_SIZE);
      setIsLoadingMore(false);
    }, 0);
    return () => clearTimeout(t);
  }, [filterKey]);

  const visiblePessoas = useMemo(() => filteredPessoas.slice(0, visibleCount), [filteredPessoas, visibleCount]);
  const hasMore = visibleCount < filteredPessoas.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const keyAtStart = filterKeyRef.current;
    setIsLoadingMore(true);
    setTimeout(() => {
      if (filterKeyRef.current !== keyAtStart) {
        setIsLoadingMore(false);
        return;
      }
      setVisibleCount((c) => c + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 400);
  }, [isLoadingMore, hasMore]);

  // Observa o sentinela no fim da lista para carregar mais itens
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '250px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, hasMore]);

  const openNewDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (pessoa: Pessoa) => {
    setEditingId(pessoa.id);
    setForm({
      nome: pessoa.nome,
      tipo: pessoa.tipo || 'Colaborador',
      empresa: pessoa.empresa || '',
      departamento: pessoa.departamento || '',
      cargo: pessoa.cargo || '',
      rgCpf: pessoa.rgCpf || '',
      placa: pessoa.placa || '',
      telefone: pessoa.telefone || '',
      email: pessoa.email || '',
      ticket: pessoa.ticket || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!form.empresa.trim()) {
      toast.error('Empresa é obrigatória');
      return;
    }
    if (!form.departamento.trim()) {
      toast.error('Departamento é obrigatório');
      return;
    }
    if (!form.rgCpf.trim()) {
      toast.error('RG / CPF é obrigatório');
      return;
    }

    if (editingId) {
      updatePessoa({
        id: editingId,
        nome: form.nome.trim().toUpperCase(),
        tipo: form.tipo,
        empresa: form.empresa.trim().toUpperCase(),
        departamento: form.departamento.trim().toUpperCase(),
        cargo: form.cargo.trim().toUpperCase(),
        rgCpf: form.rgCpf.trim(),
        placa: form.placa.trim().toUpperCase(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        ticket: form.ticket.trim().toUpperCase() || undefined,
      });
      toast.success('Pessoa atualizada!');
    } else {
      addPessoa({
        id: `pes_${Date.now()}`,
        nome: form.nome.trim().toUpperCase(),
        tipo: form.tipo,
        empresa: form.empresa.trim().toUpperCase(),
        departamento: form.departamento.trim().toUpperCase(),
        cargo: form.cargo.trim().toUpperCase(),
        rgCpf: form.rgCpf.trim(),
        placa: form.placa.trim().toUpperCase(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        ticket: form.ticket.trim().toUpperCase() || undefined,
      });
      toast.success('Pessoa cadastrada!');
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const updateForm = (field: keyof FormState, value: string) => {
    const normalizedValue = ['nome', 'empresa', 'departamento', 'cargo', 'ticket'].includes(field)
      ? value.toUpperCase()
      : value;
    setForm((prev) => ({ ...prev, [field]: normalizedValue }));
  };

  // Summary counts
  const countByTipo = useMemo(() => {
    const list = pessoas.filter(p => !p.inativo);
    const counts: Record<string, number> = { total: list.length };
    list.forEach((p) => {
      const tipo = normalizeTipoPessoa(p.tipo);
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return counts;
  }, [pessoas]);

  // ── Visitas da pessoa (qualquer tipo de categoria, com filtro de período) ──
  const parseDataVisita = useCallback((d?: string): Date | null => {
    if (!d) return null;
    const parts = d.includes('-') ? d.split('-').map(Number) : d.split('/').map(Number);
    if (parts.length !== 3) return null;
    const [a, b, c] = parts;
    const ano = d.includes('-') ? a : c;
    const mes = b - 1;
    const dia = d.includes('-') ? c : a;
    if (Number.isNaN(ano) || Number.isNaN(mes) || Number.isNaN(dia)) return null;
    return new Date(ano, mes, dia);
  }, []);

  const personVisits = useMemo(() => {
    if (!detailsPessoa) return [];
    const nome = detailsPessoa.nome.trim().toLowerCase();
    let lista = registrosFluxo
      .filter((r) => !r.inativo)
      .flatMap(expandRegistroIndividualmente)
      .filter((r) => {
        const campos = [
          (r as any).nome,
          (r as any).motorista,
          (r as any).motoristaNome,
          (r as any).visitanteNome,
          (r as any).nomeColaborador,
          (r as any).destinatario,
          (r as any).condutor,
        ];
        return campos.some((f) => typeof f === 'string' && f && f.trim().toLowerCase() === nome);
      });

    if (visitPeriodInicio || visitPeriodFim) {
      const inicio = visitPeriodInicio ? parseDataVisita(visitPeriodInicio) : null;
      const fim = visitPeriodFim ? parseDataVisita(visitPeriodFim) : null;
      lista = lista.filter((r) => {
        const d = parseDataVisita('data' in r ? (r as any).data : (r as any).dataPrevista);
        if (!d) return false;
        if (inicio && d < inicio) return false;
        if (fim) {
          const fimInclusivo = new Date(fim);
          fimInclusivo.setDate(fimInclusivo.getDate() + 1);
          if (d >= fimInclusivo) return false;
        }
        return true;
      });
    }

    return lista.sort((a, b) => {
      const da = 'data' in a ? (a as any).data : ((a as any).dataPrevista || '');
      const ha = a.horarioEntrada || '';
      const db = 'data' in b ? (b as any).data : ((b as any).dataPrevista || '');
      const hb = b.horarioEntrada || '';
      if (da !== db) return da > db ? -1 : 1;
      return ha > hb ? -1 : 1;
    });
  }, [detailsPessoa, registrosFluxo, visitPeriodInicio, visitPeriodFim, parseDataVisita]);

  // ── Estatísticas e gráficos das visitas ──
  const CHART_COLORS = ['#3b82f6', '#06b6d4', '#14b8a6', '#f59e0b', '#10b981', '#6366f1', '#f97316', '#8b5cf6', '#f43f5e', '#0ea5e9'];

  const categoriaMaisFrequente = useMemo(() => {
    const counts: Record<string, number> = {};
    personVisits.forEach((v) => { counts[v.categoria] = (counts[v.categoria] || 0) + 1; });
    let best: string | null = null;
    let bestCount = 0;
    Object.entries(counts).forEach(([c, n]) => { if (n > bestCount) { best = c; bestCount = n; } });
    if (!best) return null;
    return { label: CATEGORIAS_FLUXO.find((x) => x.value === best)?.label || best, count: bestCount };
  }, [personVisits]);

  const horarioMaisFrequente = useMemo(() => {
    const counts: Record<number, number> = {};
    personVisits.forEach((v) => {
      const h = v.horarioEntrada ? Number(v.horarioEntrada.split(':')[0]) : -1;
      if (h >= 0 && h <= 23) counts[h] = (counts[h] || 0) + 1;
    });
    let best = -1;
    let bestCount = 0;
    Object.entries(counts).forEach(([h, c]) => { if (c > bestCount) { best = Number(h); bestCount = c; } });
    if (best === -1) return null;
    return { hora: `${best.toString().padStart(2, '0')}:00`, count: bestCount };
  }, [personVisits]);

  const totalHorasEmpresa = useMemo(() => {
    let minutos = 0;
    personVisits.forEach((v) => {
      if (v.horarioEntrada && v.horarioSaida) {
        const [h1, m1] = v.horarioEntrada.split(':').map(Number);
        const [h2, m2] = v.horarioSaida.split(':').map(Number);
        let diff = h2 * 60 + m2 - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        minutos += diff;
      }
    });
    return `${Math.floor(minutos / 60)}h ${(minutos % 60).toString().padStart(2, '0')}min`;
  }, [personVisits]);

  const visitasPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {};
    personVisits.forEach((v) => {
      const label = CATEGORIAS_FLUXO.find((c) => c.value === v.categoria)?.label || v.categoria;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [personVisits]);

  const visitasPorHora = useMemo(() => {
    const counts: Record<number, number> = {};
    personVisits.forEach((v) => {
      const h = v.horarioEntrada ? Number(v.horarioEntrada.split(':')[0]) : -1;
      if (h >= 0 && h <= 23) counts[h] = (counts[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, h) => ({
      hora: `${h.toString().padStart(2, '0')}h`,
      visitas: counts[h] || 0,
    }));
  }, [personVisits]);

  const pesoDiferencaVisitas = useMemo(() => {
    return personVisits
      .filter((v) => v.categoria === 'pesagem' || v.categoria === 'coleta' || v.categoria === 'entregas2')
      .slice(0, 12)
      .map((v, i) => {
        const entrada = Number((v as any).pesoEntrada ?? 0);
        const saida = Number((v as any).pesoSaida ?? 0);
        return { nome: `#${i + 1}`, Entrada: entrada, Saída: saida };
      });
  }, [personVisits]);

  const observacoesVisitas = useMemo(() => {
    return personVisits
      .map((v) => ({
        data: 'data' in v ? (v as any).data : ((v as any).dataPrevista || ''),
        horario: v.horarioEntrada || '',
        categoria: v.categoria,
        texto: String((v as any).observacao || (v as any).detalhes || (v as any).ocorrencia || '').trim(),
      }))
      .filter((o) => o.texto)
      .sort((a, b) => (b.data > a.data ? 1 : -1));
  }, [personVisits]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Cadastro de Pessoas
          </h2>
          <p className="text-sm text-muted-foreground">
            {countByTipo.total} pessoa{countByTipo.total !== 1 ? 's' : ''} cadastrada{countByTipo.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={openNewDialog}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Nova Pessoa
        </Button>
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTipo('todos')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterTipo === 'todos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todos ({countByTipo.total})
        </button>
        {tipoOptions.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterTipo(t.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterTipo === t.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {TIPO_ICONS[t.value] || <Users className="h-3.5 w-3.5" />}
            {t.label} ({countByTipo[t.value] || 0})
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa, RG/CPF, placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-10"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Limpar pesquisa"
                className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-muted' : ''}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 border rounded-lg mt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos</SelectItem>
                      <SelectItem value="inativos">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Departamento</Label>
                  <Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {[...departamentos]
                        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                        .map(d => (
                          <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Empresa</Label>
                  <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {[...empresas]
                        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                        .map(e => (
                          <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* People list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredPessoas.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search || filterTipo !== 'todos'
                  ? 'Nenhuma pessoa encontrada com os filtros aplicados'
                  : 'Nenhuma pessoa cadastrada ainda'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewDialog}
                className="mt-3"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Cadastrar Pessoa
              </Button>
            </motion.div>
          )}

          {visiblePessoas.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={`overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors ${p.inativo ? 'opacity-60 grayscale-[0.5]' : ''}`}
                onClick={() => { setDetailsPessoa(p); setShowMoreVisits(false); setVisitPeriodInicio(''); setVisitPeriodFim(''); setDetailsOpen(true); }}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Type indicator stripe */}
                    <div className={`w-1.5 shrink-0 ${TIPO_STRIPE_COLORS[p.tipo] || 'bg-gray-400'}`} />
                    <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-medium truncate text-base uppercase">{p.nome}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border">
                            {getTipoPessoaLabel(p.tipo, allTipoOptions)}
                          </span>
                          {p.inativo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-col gap-1">
                          {p.empresa && <p className="truncate"><span className="font-semibold text-foreground">Empresa:</span> {p.empresa}</p>}
                          {p.departamento && <p className="truncate"><span className="font-semibold text-foreground">Departamento:</span> {p.departamento}</p>}
                          {p.cargo && <p className="truncate"><span className="font-semibold text-foreground">Cargo:</span> {p.cargo}</p>}
                          {p.rgCpf && <p className="truncate"><span className="font-semibold text-foreground">Documento:</span> {p.rgCpf}</p>}
                          {p.placa && <p className="truncate"><span className="font-semibold text-foreground">Placa:</span> {p.placa}</p>}
                          {p.telefone && <p className="truncate"><span className="font-semibold text-foreground">Telefone:</span> {p.telefone}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald/10"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(p); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40"
                          disabled={p.inativo}
                          title={p.inativo ? 'Pessoa já inativada' : 'Inativar pessoa'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!p.inativo) {
                              removePessoa(p.id);
                              toast.success('Pessoa inativada e preservada para auditoria');
                            }
                          }}
                        >
                          <ShieldOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Skeleton ao carregar mais itens */}
        {isLoadingMore && (
          <div className="space-y-2" aria-label="Carregando mais registros">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`skel-${i}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <Skeleton className="w-1.5 shrink-0 rounded-none" />
                    <div className="flex-1 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex items-center gap-1 px-3 shrink-0">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sentinela de scroll: quando entra na tela, carrega mais 20 */}
        {hasMore && !isLoadingMore && (
          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
        )}
        {!hasMore && filteredPessoas.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Fim da lista — {filteredPessoas.length} registro{filteredPessoas.length !== 1 ? 's' : ''} exibido{filteredPessoas.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Detalhes da Pessoa
            </DialogTitle>
          </DialogHeader>

          {detailsPessoa && (
            <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${TIPO_COLORS[detailsPessoa.tipo] || 'bg-muted text-muted-foreground'}`}>
                    {TIPO_ICONS[detailsPessoa.tipo] || <Users className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{detailsPessoa.nome}</h3>
                    <p className="text-sm text-muted-foreground">{detailsPessoa.cargo || getTipoPessoaLabel(detailsPessoa.tipo, allTipoOptions)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="text-sm font-medium">{detailsPessoa.empresa || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Departamento</p>
                    <p className="text-sm font-medium">{detailsPessoa.departamento || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">RG/CPF</p>
                    <p className="text-sm font-medium">{detailsPessoa.rgCpf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">{detailsPessoa.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data Cadastro</p>
                    <p className="text-sm font-medium">
                      {detailsPessoa.dataCadastro ? (
                        <>
                          {format(new Date(detailsPessoa.dataCadastro), 'dd/MM/yyyy')}
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            ({formatDistanceToNow(new Date(detailsPessoa.dataCadastro), { locale: ptBR, addSuffix: true })})
                          </span>
                        </>
                      ) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={detailsPessoa.inativo ? "border-red-200 text-red-600" : "border-emerald-200 text-emerald-600"}>
                      {detailsPessoa.inativo ? "Inativo" : "Ativo"}
                    </Badge>
                  </div>
                </div>

                {/* Ticket */}
                <div className="pt-3 border-t border-border/40">
                  {detailsPessoa.ticket ? (
                    <div className="flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ticket</p>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{detailsPessoa.ticket}</p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const pessoaAtualizada = { ...detailsPessoa, ticket: undefined };
                          updatePessoa(pessoaAtualizada);
                          setDetailsPessoa(pessoaAtualizada);
                          toast.success('Ticket removido com sucesso!');
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ticket</p>
                          <p className="text-sm text-muted-foreground">Nenhum ticket cadastrado</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtro de período e estatísticas */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Período de</Label>
                    <Input
                      type="date"
                      value={visitPeriodInicio}
                      onChange={(e) => setVisitPeriodInicio(e.target.value)}
                      className="h-9 text-sm bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Período até</Label>
                    <Input
                      type="date"
                      value={visitPeriodFim}
                      onChange={(e) => setVisitPeriodFim(e.target.value)}
                      className="h-9 text-sm bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total de visitas</p>
                    <p className="text-lg font-bold">{personVisits.length}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tempo total na empresa</p>
                    <p className="text-lg font-bold">{totalHorasEmpresa}</p>
                  </div>
                  {categoriaMaisFrequente && (
                    <div className="rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Categoria mais frequente</p>
                      <p className="text-sm font-bold leading-tight">{categoriaMaisFrequente.label} <span className="text-muted-foreground font-medium">({categoriaMaisFrequente.count})</span></p>
                    </div>
                  )}
                  {horarioMaisFrequente && (
                    <div className="rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Horário que mais visitou</p>
                      <p className="text-lg font-bold">{horarioMaisFrequente.hora} <span className="text-sm text-muted-foreground font-medium">({horarioMaisFrequente.count})</span></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráficos */}
              {personVisits.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Análise de Visitas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Visitas por Categoria</p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={visitasPorCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                              {visitasPorCategoria.map((entry, index) => (
                                <Cell key={`cat-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Visitas por Hora do Dia</p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={visitasPorHora}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="hora" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} interval={1} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={24} />
                            <Tooltip />
                            <Bar dataKey="visitas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Diferença de peso (pesagem/coleta/entregas) */}
                  {pesoDiferencaVisitas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Diferença de Peso (Entrada × Saída)</p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pesoDiferencaVisitas}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="nome" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={40} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="Entrada" fill="#10b981" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Saída" fill="#f97316" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Observações registradas */}
              {observacoesVisitas.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Observações Registradas ({observacoesVisitas.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {observacoesVisitas.map((o, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg border text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          {o.data}{o.horario ? ` às ${o.horario}` : ''} • {CATEGORIAS_FLUXO.find((c) => c.value === o.categoria)?.label || o.categoria}
                        </p>
                        <p className="text-sm">{o.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visitas */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Histórico de Visitas ({personVisits.length})
                </h4>
                
                {personVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">
                    Nenhum registro encontrado.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {personVisits.slice(0, showMoreVisits ? 25 : 5).map((v) => (
                      <div key={v.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg border text-sm">
                        <div>
                          <p className="font-medium">
                            {'data' in v ? (v as any).data : ('dataPrevista' in v ? (v as any).dataPrevista : '')}
                            <span className="text-muted-foreground ml-2 font-normal">{v.horarioEntrada}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {CATEGORIAS_FLUXO.find((c) => c.value === v.categoria)?.label || v.categoria} • {(v as any).departamento || '-'}
                          </p>
                        </div>
                        {v.horarioSaida && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                            Saída: {v.horarioSaida}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {personVisits.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowMoreVisits(!showMoreVisits)}
                  >
                    {showMoreVisits ? (
                      <>Ver menos <ChevronUp className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>Ver mais {Math.min(personVisits.length - 5, 20)} visitas <ChevronDown className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4 gap-3 pt-0 sm:gap-3">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
            {detailsPessoa && (
               <Button 
                 onClick={() => {
                   setDetailsOpen(false);
                   openEditDialog(detailsPessoa);
                 }}
                 className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
               >
                 <Edit2 className="h-4 w-4 mr-2" />
                 Editar
               </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Editar Pessoa
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  Nova Pessoa
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome completo *</Label>
              <AutocompleteInput
                value={form.nome}
                onChange={(v) => updateForm('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data)}
                suggestions={nameSuggestions}
                placeholder="Nome da pessoa"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => updateForm('tipo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoFormOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        {TIPO_ICONS[t.value] || <Users className="h-3.5 w-3.5" />}
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Empresa *</Label>
              <Select
                value={form.empresa}
                onValueChange={(v) => updateForm('empresa', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {[...empresas]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((emp) => (
                      <SelectItem key={emp.id || emp.nome} value={emp.nome}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Departamento *</Label>
              <Select
                value={form.departamento}
                onValueChange={(v) => updateForm('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((dep) => (
                      <SelectItem key={dep.id || dep.nome} value={dep.nome}>
                        {dep.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Selecione acima o departamento correspondente
              </p>
            </div>

            {/* RG/CPF */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">RG / CPF *</Label>
              <AutocompleteInput
                value={form.rgCpf}
                onChange={(v) => updateForm('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data)}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>

            {/* Placa */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Placa do Veículo</Label>
              <Input
                placeholder="ABC-1D23"
                value={form.placa}
                onChange={(e) => updateForm('placa', e.target.value.toUpperCase())}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => updateForm('telefone', formatPhone(e.target.value))}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
              />
            </div>

            {/* Ticket */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ticket</Label>
              <Input
                placeholder="DDMNX (ex: 03101)"
                value={form.ticket}
                onChange={(e) => updateForm('ticket', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-3 pt-0 sm:gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {editingId ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

const TIPO_STRIPE_COLORS: Partial<Record<TipoPessoa, string>> = {
  Porteiro: 'bg-blue-500',
  Vigia: 'bg-cyan-500',
  Vigilante: 'bg-teal-500',
  Prestador: 'bg-amber-500',
  Entregador: 'bg-emerald-500',
  Colaborador: 'bg-indigo-500',
  Coletor: 'bg-orange-500',
  Esporadico: 'bg-gray-500',
  // Tipos legados
  Visitante: 'bg-purple-500',
  Motorista: 'bg-orange-500',
  Outro: 'bg-gray-500',
};
