'use client';

import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Car,
  AlertTriangle,
  ShieldBan,
  PackageSearch,
  CalendarCheck,
  Users,
  Filter,
  MousePointerClick,
  ClipboardCheck,
  ClipboardList,
  Bell,
  KeyRound,
  ShoppingBag,
  ShoppingBasket,
  FlaskConical,
  TestTube,
  Building2,
  Clock3,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { expandRegistroIndividualmente } from '@/lib/registro-individualizacao';
import { CATEGORIAS_FLUXO, TIPOS_OCORRENCIA, GRAVIDADES_OCORRENCIA } from '@/lib/data';
import { useIsMobile } from '@/hooks/use-mobile';
import { isPreAutorizacaoPendente } from '@/lib/pre-autorizacao-utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const AXIS_TICK_STYLE = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
};

const AXIS_TICK_STYLE_SMALL = {
  fill: 'var(--muted-foreground)',
  fontSize: 10,
};

const LEGEND_STYLE = {
  color: 'var(--foreground)',
  fontSize: 12,
  fontFamily: 'inherit',
};

const PESAGEM_CHART_COLORS = [
  '#60a5fa',
  '#fb7185',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#22d3ee',
  '#f472b6',
  '#a3e635',
  '#fb923c',
  '#818cf8',
];

type DashboardLineSeries = {
  key: string;
  name: string;
  color: string;
};

function parseDashboardTimestamp(dateValue: unknown, timeValue: unknown): number {
  const rawDate = String(dateValue || '');
  const dateParts = rawDate.includes('/') ? rawDate.split('/') : rawDate.split('-');
  const isoDate = rawDate.includes('/')
    ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    : rawDate;
  const timestamp = new Date(`${isoDate}T${String(timeValue || '00:00')}:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function abbreviateDashboardLabel(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length > 5 ? `${word.slice(0, 5)}..` : word))
    .join(' ');
}

// ── Custom Tooltip Component ──
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const mainColor = payload[0]?.color || payload[0]?.payload?.fill || '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))',
          borderRadius: 12,
          border: `1px solid ${mainColor}60`,
          boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${mainColor}30`,
          minWidth: 'fit-content',
          position: 'relative',
          backdropFilter: 'blur(8px)',
        }}
      >
        {label !== undefined && label !== '' && (
          <span
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 0.3,
              lineHeight: 1.3,
            }}
          >
            {label}
          </span>
        )}
        {payload.map((entry: any, idx: number) => {
          const itemColor = entry.color || entry.payload?.fill || '#10b981';
          return (
            <div
              key={`tooltip-item-${idx}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: itemColor,
                    boxShadow: `0 0 10px ${itemColor}80`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: `2px solid ${itemColor}40`,
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                  {entry.name}
                </span>
                <span style={{ color: itemColor, fontWeight: 400, fontSize: 15, lineHeight: 1.3 }}>
                  {entry.value !== undefined && entry.value !== null
                    ? typeof entry.value === 'number'
                      ? entry.value.toLocaleString('pt-BR')
                      : entry.value
                    : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  // No mobile o tooltip aparece ao tocar/clicar na barra ou fatia.
  // No desktop mantém o comportamento de passar o mouse por cima.
  const tooltipTrigger: 'hover' | 'click' = isMobile ? 'click' : 'hover';

  const {
    registrosFluxo,
    veiculos,
    ocorrencias,
    listaNegra,
    achadosPerdidos,
    preAutorizacoes,
    pessoas,
    avisos,
    registrosChaves,
    checklists,
    inspecoes,
    setCurrentPage,
  } = useAppStore();

  // Auto-clear loading state when data arrives or after a short timeout
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  type DateRange = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
  const [dateRange, setDateRange] = useState<DateRange>('hoje');
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { inicio, fim } = useMemo(() => {
    const hoje = new Date();
    let start: Date, end: Date;
    switch (dateRange) {
      case 'hoje': {
        start = new Date(hoje);
        start.setHours(0, 0, 0, 0);
        end = new Date(hoje);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'semana': {
        start = new Date(hoje);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date(hoje);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'mes': {
        start = new Date(hoje);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date(hoje);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'ano': {
        start = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      }
      case 'personalizado': {
        start = new Date(dataInicio + 'T00:00:00');
        if (isNaN(start.getTime())) start = new Date(0);
        end = new Date(dataFim + 'T23:59:59');
        if (isNaN(end.getTime())) end = new Date(hoje);
        break;
      }
      default: {
        start = new Date(hoje);
        start.setHours(0, 0, 0, 0);
        end = new Date(hoje);
        end.setHours(23, 59, 59, 999);
      }
    }
    return { inicio: start, fim: end };
  }, [dateRange, dataInicio, dataFim]);

  const isDateInRange = useMemo(() => {
    return (dateStr: string | undefined): boolean => {
      if (!dateStr) return false;
      let d: Date;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
          return false;
        }
      } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          return false;
        }
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return false;
      return d.getTime() >= inicio.getTime() && d.getTime() <= fim.getTime();
    };
  }, [inicio, fim]);

  // Registros de fluxo: aplicam o filtro de período E excluem os inativados (Refeito)
  const registrosFluxoFiltered = useMemo(
    () => registrosFluxo
      .filter((r) => !r.inativo && isDateInRange('data' in r ? (r as any).data : ''))
      .flatMap(expandRegistroIndividualmente),
    [registrosFluxo, isDateInRange]
  );

  // ── Pesagens de Apara e de Tinta/Solvente (a partir do mesmo fluxo enviado ao Firestore) ──
  const pesagensApara = useMemo(
    () => registrosFluxoFiltered.filter((r) => r.categoria === 'pesagem_apara'),
    [registrosFluxoFiltered]
  );
  const pesagensTinta = useMemo(
    () => registrosFluxoFiltered.filter((r) => r.categoria === 'pesagem_tinta'),
    [registrosFluxoFiltered]
  );
  const pesoTotalApara = useMemo(
    () => pesagensApara.reduce((acc, r) => acc + Number((r as any).pesoCarregado ?? 0), 0),
    [pesagensApara]
  );
  const pesoTotalTinta = useMemo(
    () => pesagensTinta.reduce((acc, r) => acc + Number((r as any).peso ?? 0), 0),
    [pesagensTinta]
  );
  const veiculosFiltered = useMemo(() => veiculos.filter((v) => isDateInRange(v.data)), [veiculos, isDateInRange]);
  const ocorrenciasFiltered = useMemo(() => ocorrencias.filter((o) => isDateInRange(o.data)), [ocorrencias, isDateInRange]);
  const listaNegraFiltered = useMemo(() => listaNegra.filter((l) => isDateInRange(l.data)), [listaNegra, isDateInRange]);
  const achadosFiltered = useMemo(() => achadosPerdidos.filter((a) => isDateInRange(a.data)), [achadosPerdidos, isDateInRange]);
  const preAuthFiltered = useMemo(() => preAutorizacoes.filter((p) => isDateInRange(p.dataPrevista)), [preAutorizacoes, isDateInRange]);
  const preAuthPendentes = useMemo(
    () => preAuthFiltered
      .filter(isPreAutorizacaoPendente)
      .sort((a, b) => {
        const getTime = (value: typeof a) => {
          const rawDate = String(value.dataPrevista || '');
          const parts = rawDate.includes('/') ? rawDate.split('/') : rawDate.split('-');
          const isoDate = rawDate.includes('/')
            ? `${parts[2]}-${parts[1]}-${parts[0]}`
            : rawDate;
          const time = value.horarioPrevisto || '23:59';
          return new Date(`${isoDate}T${time}:00`).getTime();
        };
        return getTime(a) - getTime(b);
      }),
    [preAuthFiltered],
  );
  const checklistsFiltered = useMemo(() => checklists.filter((c) => isDateInRange(c.data)), [checklists, isDateInRange]);
  const inspecoesFiltered = useMemo(() => inspecoes.filter((i) => isDateInRange(i.data)), [inspecoes, isDateInRange]);
  const avisosFiltered = useMemo(() => avisos.filter((a) => isDateInRange(a.data)), [avisos, isDateInRange]);
  // Pessoas cadastradas agora respeitam o filtro de período (por dataCadastro)
  const pessoasFiltered = useMemo(
    () => pessoas.filter((p) => !p.inativo && isDateInRange(p.dataCadastro)),
    [pessoas, isDateInRange]
  );

  const chavesPendentes = useMemo(() => {
    const timestamp = (registro: (typeof registrosChaves)[number]) => {
      const rawDate = String(registro.data || '');
      const dateParts = rawDate.includes('/')
        ? rawDate.split('/').map(Number)
        : rawDate.split('-').map(Number);
      const [hours = 0, minutes = 0] = String(registro.horarioRetirada || '00:00').split(':').map(Number);
      const [day, month, year] = rawDate.includes('/')
        ? dateParts
        : [dateParts[2], dateParts[1], dateParts[0]];
      return new Date(year || 0, (month || 1) - 1, day || 1, hours, minutes).getTime();
    };

    return registrosChaves
      .filter((registro) => !registro.horarioDevolucao)
      .sort((a, b) => timestamp(b) - timestamp(a));
  }, [registrosChaves]);

  // ── Computed KPIs ──
  const kpis = useMemo(() => {
    const fluxoAbertos = registrosFluxoFiltered.filter((r) => !r.horarioSaida).length;
    const fluxoFechados = registrosFluxoFiltered.filter((r) => !!r.horarioSaida).length;
    const veiculosEstacionados = veiculosFiltered.filter((v) => !v.horarioSaida).length;
    const veiculosTotal = veiculosFiltered.length;
    const ocorrenciasAbertas = ocorrenciasFiltered.filter((o) => o.status === 'aberta' || o.status === 'em_andamento').length;
    const ocorrenciasResolvidas = ocorrenciasFiltered.filter((o) => o.status === 'resolvida').length;
    const listaNegraAtiva = listaNegraFiltered.filter((l) => l.status === 'ativo').length;
    const achadosNaoDevolvidos = achadosFiltered.filter((a) => a.status !== 'devolvido').length;
    const achadosDevolvidos = achadosFiltered.filter((a) => a.status === 'devolvido').length;
    const preAuthPendentesCount = preAuthPendentes.length;
    const pessoasCadastradas = pessoasFiltered.length;
    const checklistsConcluidos = checklistsFiltered.filter((c) => c.status === 'concluido').length;
    const checklistsPendentes = checklistsFiltered.filter((c) => c.status !== 'concluido').length;
    const inspecoesRealizadas = inspecoesFiltered.length;
    const avisosAtivos = avisosFiltered.length;

    return [
      { title: 'Fluxo Aberto', value: fluxoAbertos, icon: ArrowDown, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { title: 'Fluxo Finalizado', value: fluxoFechados, icon: ArrowUp, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
      { title: 'Veículos no Local', value: veiculosEstacionados, icon: Car, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
      { title: 'Total de Veículos', value: veiculosTotal, icon: Car, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30' },
      { title: 'Ocorrências Abertas', value: ocorrenciasAbertas, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
      { title: 'Ocorrências Resolvidas', value: ocorrenciasResolvidas, icon: ClipboardCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
      { title: 'Lista Negra Ativa', value: listaNegraAtiva, icon: ShieldBan, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
      { title: 'Achados e Perdidos', value: achadosNaoDevolvidos, icon: PackageSearch, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
      { title: 'Itens Devolvidos', value: achadosDevolvidos, icon: PackageSearch, color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
      { title: 'Pré-Autorizações Pendentes', value: preAuthPendentesCount, icon: CalendarCheck, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
      { title: 'Pessoas Cadastradas', value: pessoasCadastradas, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
      { title: 'Checklists Concluídos', value: checklistsConcluidos, icon: ClipboardCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { title: 'Checklists Pendentes', value: checklistsPendentes, icon: ClipboardList, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
      { title: 'Pesagens de Apara', value: pesagensApara.length, icon: ShoppingBag, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
      { title: 'Peso Total Apara (kg)', value: pesoTotalApara, icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { title: 'Pesagens de Tinta/Solv.', value: pesagensTinta.length, icon: FlaskConical, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
      { title: 'Peso Total Tinta/Solv. (kg)', value: pesoTotalTinta, icon: FlaskConical, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { title: 'Inspeções Diárias', value: inspecoesRealizadas, icon: ClipboardCheck, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
      { title: 'Avisos Publicados', value: avisosAtivos, icon: Bell, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
    ];
  }, [registrosFluxoFiltered, veiculosFiltered, ocorrenciasFiltered, listaNegraFiltered, achadosFiltered, preAuthFiltered, preAuthPendentes, pessoasFiltered, checklistsFiltered, inspecoesFiltered, avisosFiltered, pesagensApara, pesagensTinta, pesoTotalApara, pesoTotalTinta]);

  // ── Real Data for Charts ──
  const entradasSaidasPorHora = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const data = hours.map((h) => ({ hora: h, entradas: 0, saidas: 0 }));

    registrosFluxoFiltered.forEach((r) => {
      if (r.horarioEntrada) {
        const h = r.horarioEntrada.split(':')[0] + ':00';
        const entry = data.find((d) => d.hora === h);
        if (entry) entry.entradas++;
      }
      if ('horarioSaida' in r && (r as any).horarioSaida) {
        const h = (r as any).horarioSaida.split(':')[0] + ':00';
        const entry = data.find((d) => d.hora === h);
        if (entry) entry.saidas++;
      }
    });

    const firstActiveIndex = data.findIndex((d) => d.entradas > 0 || d.saidas > 0);
    const lastActiveIndex = data.findLastIndex((d) => d.entradas > 0 || d.saidas > 0);

    if (firstActiveIndex === -1) return data.slice(6, 18);

    const start = Math.max(0, firstActiveIndex - 1);
    const end = Math.min(23, lastActiveIndex + 1);

    return data.slice(start, end + 1);
  }, [registrosFluxoFiltered]);

  // ── Movimentação acumulada (novo gráfico) ──
  const movimentacaoAcumulada = useMemo(() => {
    let acc = 0;
    return entradasSaidasPorHora.map((d) => {
      acc += d.entradas;
      return { hora: d.hora, entradas: d.entradas, acumulado: acc };
    });
  }, [entradasSaidasPorHora]);

  const tendenciaSemanal = useMemo(() => {
    const dataMap: Record<string, any> = {};
    const refDate = new Date(fim);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);
      const dataStr = d.toLocaleDateString('pt-BR');
      const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      dataMap[dataStr] = 0;
      dataMap[`${dataStr}_label`] = diaSemana;
    }

    registrosFluxo
      .filter((r) => !r.inativo)
      .flatMap(expandRegistroIndividualmente)
      .forEach((r) => {
        const data = 'data' in r ? (r as any).data : '';
        if (data && dataMap[data] !== undefined) {
          dataMap[data]++;
        }
      });

    return Object.keys(dataMap)
      .filter((k) => !k.includes('_label'))
      .map((k) => ({ dia: dataMap[`${k}_label`], data: k, movimentacoes: dataMap[k] }));
  }, [registrosFluxo, fim]);

  const fluxoPorPeriodo = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const data = hours.map((h) => ({ periodo: h, fluxo: 0 }));

    registrosFluxoFiltered.forEach((r) => {
      if (r.horarioEntrada) {
        const h = r.horarioEntrada.split(':')[0] + ':00';
        const entry = data.find((d) => d.periodo === h);
        if (entry) entry.fluxo++;
      }
    });

    return data;
  }, [registrosFluxoFiltered]);

  const checklistsPorStatus = useMemo(() => {
    const colors: Record<string, string> = { pendente: '#ef4444', em_andamento: '#f59e0b', concluido: '#10b981' };
    const labels: Record<string, string> = { pendente: 'Pendente', em_andamento: 'Em Andamento', concluido: 'Concluído' };
    const counts: Record<string, number> = {};
    checklistsFiltered.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({
      name: labels[status] || status,
      value: qtd,
      fill: colors[status] || '#6b7280',
    }));
  }, [checklistsFiltered]);

  // ── Fluxo por categoria (from real data) ──
  const fluxoPorCategoria = useMemo(() => {
    const counts: Record<string, { abertos: number; fechados: number }> = {};
    CATEGORIAS_FLUXO.forEach((c) => {
      counts[c.value] = { abertos: 0, fechados: 0 };
    });
    registrosFluxoFiltered.forEach((r) => {
      const cat = r.categoria;
      if (!counts[cat]) counts[cat] = { abertos: 0, fechados: 0 };
      if (r.horarioSaida) counts[cat].fechados++;
      else counts[cat].abertos++;
    });
    return CATEGORIAS_FLUXO.map((c) => ({
      categoria: abbreviateDashboardLabel(c.label),
      Abertos: counts[c.value]?.abertos || 0,
      Finalizados: counts[c.value]?.fechados || 0,
    }));
  }, [registrosFluxoFiltered]);

  // ── Ocorrências por tipo ──
  const ocorrenciasPorTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    TIPOS_OCORRENCIA.forEach((t) => {
      counts[t.value] = 0;
    });
    ocorrenciasFiltered.forEach((o) => {
      counts[o.tipo] = (counts[o.tipo] || 0) + 1;
    });
    return TIPOS_OCORRENCIA.map((t) => ({ tipo: t.label, qtd: counts[t.value] || 0 })).filter((d) => d.qtd > 0);
  }, [ocorrenciasFiltered]);

  // ── Ocorrências por gravidade ──
  const ocorrenciasPorGravidade = useMemo(() => {
    const colors: Record<string, string> = { leve: '#10b981', moderada: '#f59e0b', grave: '#f97316', critica: '#ef4444' };
    const counts: Record<string, number> = {};
    GRAVIDADES_OCORRENCIA.forEach((g) => {
      counts[g.value] = 0;
    });
    ocorrenciasFiltered.forEach((o) => {
      counts[o.gravidade] = (counts[o.gravidade] || 0) + 1;
    });
    return GRAVIDADES_OCORRENCIA.map((g) => ({ name: g.label, value: counts[g.value] || 0, fill: colors[g.value] })).filter((d) => d.value > 0);
  }, [ocorrenciasFiltered]);

  // ── Veículos por tipo ──
  const veiculosPorTipo = useMemo(() => {
    const colors: Record<string, string> = { Visitante: '#8b5cf6', Prestador: '#06b6d4', Entregador: '#10b981', Colaborador: '#3b82f6' };
    const counts: Record<string, number> = {};
    veiculosFiltered.forEach((v) => {
      counts[v.tipo] = (counts[v.tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([tipo, qtd]) => ({ name: tipo, value: qtd, fill: colors[tipo] || '#6b7280' }));
  }, [veiculosFiltered]);

  // ── Pessoas por tipo (tipos reais cadastrados na aba Fluxo, sem normalização) ──
  const pessoasPorTipo = useMemo(() => {
    const colors: Record<string, string> = {
      Porteiro: '#3b82f6',
      Vigia: '#06b6d4',
      Vigilante: '#14b8a6',
      Prestador: '#f59e0b',
      Entregador: '#10b981',
      Colaborador: '#6366f1',
      Coletor: '#f97316',
      Esporadico: '#8b5cf6',
      Visitante: '#f43f5e',
      Motorista: '#0ea5e9',
      Outro: '#a3a3a3',
    };
    const labels: Record<string, string> = {
      Porteiro: 'Porteiro',
      Vigia: 'Vigia',
      Vigilante: 'Vigilante',
      Prestador: 'Prestador de Serviços',
      Entregador: 'Entregador',
      Colaborador: 'Colaborador',
      Coletor: 'Coletor',
      Esporadico: 'Visitantes',
      Visitante: 'Visitante',
      Motorista: 'Motorista',
      Outro: 'Outro',
    };
    const counts: Record<string, number> = {};
    pessoasFiltered.forEach((p) => {
      const t = p.tipo || 'Visitante';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([tipo, value]) => ({ name: labels[tipo] || tipo, value, fill: colors[tipo] || '#6b7280' }))
      .sort((a, b) => b.value - a.value);
  }, [pessoasFiltered]);

  // ── Pré-autorizações por status ──
  const preAuthPorStatus = useMemo(() => {
    const colors: Record<string, string> = { agendado: '#3b82f6', confirmado: '#10b981', cancelado: '#ef4444', expirado: '#6b7280' };
    const labels: Record<string, string> = { agendado: 'Agendado', confirmado: 'Confirmado', cancelado: 'Cancelado', expirado: 'Expirado' };
    const counts: Record<string, number> = {};
    preAuthFiltered.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({ name: labels[status] || status, value: qtd, fill: colors[status] || '#6b7280' }));
  }, [preAuthFiltered]);

  // ── Achados e perdidos por status ──
  const achadosPorStatus = useMemo(() => {
    const colors: Record<string, string> = { achado: '#10b981', perdido: '#f59e0b', devolvido: '#3b82f6' };
    const labels: Record<string, string> = { achado: 'Achado', perdido: 'Perdido', devolvido: 'Devolvido' };
    const counts: Record<string, number> = {};
    achadosFiltered.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({ name: labels[status] || status, value: qtd, fill: colors[status] || '#6b7280' }));
  }, [achadosFiltered]);

  // ── Ocorrências por status ──
  const ocorrenciasPorStatus = useMemo(() => {
    const colors: Record<string, string> = { aberta: '#ef4444', em_andamento: '#f59e0b', resolvida: '#10b981', encaminhada: '#3b82f6' };
    const labels: Record<string, string> = { aberta: 'Aberta', em_andamento: 'Em Andamento', resolvida: 'Resolvida', encaminhada: 'Encaminhada' };
    const counts: Record<string, number> = {};
    ocorrenciasFiltered.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({ name: labels[status] || status, value: qtd, fill: colors[status] || '#6b7280' }));
  }, [ocorrenciasFiltered]);

  // ── Empresas mais frequentes (top 5) ──
  const empresasMaisFrequentes = useMemo(() => {
    const counts: Record<string, number> = {};
    registrosFluxoFiltered.forEach((r) => {
      let empresa = '';
      if ('empresa' in r) empresa = (r as any).empresa;
      if ('nomeEmpresa' in r) empresa = (r as any).nomeEmpresa;
      if (!empresa) return;
      const parts = empresa.split(' / ');
      const companyName = parts.length > 1 ? parts[parts.length - 1] : empresa;
      counts[companyName] = (counts[companyName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([empresa, qtd]) => ({ empresa: empresa.length > 20 ? empresa.slice(0, 20) + '…' : empresa, registros: qtd }));
  }, [registrosFluxoFiltered]);

  // ── Registros por departamento — uma fatia para cada departamento ──
  const registrosPorDepartamento = useMemo(() => {
    const totals: Record<string, number> = {};
    registrosFluxoFiltered.forEach((r) => {
      const departamento = String('departamento' in r ? (r as any).departamento || '' : '').trim();
      if (!departamento) return;
      totals[departamento] = (totals[departamento] || 0) + 1;
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([departamento, value], index) => ({
        name: departamento,
        value,
        fill: PESAGEM_CHART_COLORS[index % PESAGEM_CHART_COLORS.length],
      }));
  }, [registrosFluxoFiltered]);

  // ── Atividade por módulo (novo gráfico - radar) ──
  const atividadePorModulo = useMemo(() => {
    return [
      { modulo: 'Fluxo', valor: registrosFluxoFiltered.length },
      { modulo: 'Veículos', valor: veiculosFiltered.length },
      { modulo: 'Ocorrências', valor: ocorrenciasFiltered.length },
      { modulo: 'Achados', valor: achadosFiltered.length },
      { modulo: 'Pré-Aut.', valor: preAuthFiltered.length },
      { modulo: 'Checklists', valor: checklistsFiltered.length },
      { modulo: 'Inspeções', valor: inspecoesFiltered.length },
    ];
  }, [registrosFluxoFiltered, veiculosFiltered, ocorrenciasFiltered, achadosFiltered, preAuthFiltered, checklistsFiltered, inspecoesFiltered]);

  // ── Inspeções por status ──
  const inspecoesPorStatus = useMemo(() => {
    const colors: Record<string, string> = { em_andamento: '#f59e0b', concluida: '#3b82f6', aprovada: '#10b981' };
    const labels: Record<string, string> = { em_andamento: 'Em Andamento', concluida: 'Concluída', aprovada: 'Aprovada' };
    const counts: Record<string, number> = {};
    inspecoesFiltered.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({ name: labels[status] || status, value: qtd, fill: colors[status] || '#6b7280' }));
  }, [inspecoesFiltered]);

  // ── PESAGEM DE APARA — uma linha para cada tipo de reboque ──
  const aparaPesoTotalPorReboque = useMemo(() => {
    const ordered = [...pesagensApara].sort(
      (a, b) => parseDashboardTimestamp((a as any).data, (a as any).horarioEntrada)
        - parseDashboardTimestamp((b as any).data, (b as any).horarioEntrada)
    );
    const tipoReboques = Array.from(new Set(
      ordered.map((r) => String((r as any).tipoReboque || 'NÃO INFORMADO'))
    ));
    const series: DashboardLineSeries[] = tipoReboques.map((tipoReboque, index) => ({
      key: `reboque_${index}`,
      name: tipoReboque,
      color: PESAGEM_CHART_COLORS[index % PESAGEM_CHART_COLORS.length],
    }));
    const data = ordered.map((r, index) => {
      const tipoReboque = String((r as any).tipoReboque || 'NÃO INFORMADO');
      const point: Record<string, string | number | null> = { registro: `#${String(index + 1).padStart(2, '0')}` };
      series.forEach((line) => {
        point[line.key] = line.name === tipoReboque ? Number((r as any).pesoCarregado ?? 0) : 0;
      });
      return point;
    });
    return { data, series };
  }, [pesagensApara]);

  // ── PESAGEM DE TINTA/SOLVENTE — uma linha para cada material ──
  const tintaPesoPorMaterial = useMemo(() => {
    const ordered = [...pesagensTinta].sort(
      (a, b) => parseDashboardTimestamp((a as any).data, (a as any).horarioEntrada)
        - parseDashboardTimestamp((b as any).data, (b as any).horarioEntrada)
    );
    const materials = Array.from(new Set(
      ordered.map((r) => String((r as any).material || 'NÃO INFORMADO'))
    ));
    const series: DashboardLineSeries[] = materials.map((material, index) => ({
      key: `material_${index}`,
      name: material,
      color: PESAGEM_CHART_COLORS[index % PESAGEM_CHART_COLORS.length],
    }));
    const data = ordered.map((r, index) => {
      const material = String((r as any).material || 'NÃO INFORMADO');
      const point: Record<string, string | number | null> = { registro: `#${String(index + 1).padStart(2, '0')}` };
      series.forEach((line) => {
        point[line.key] = line.name === material ? Number((r as any).peso ?? 0) : 0;
      });
      return point;
    });
    return { data, series };
  }, [pesagensTinta]);

  // ── Evolução diária das pesagens (Apara + Tinta/Solvente) ──
  const pesagensPorDia = useMemo(() => {
    const dataMap: Record<string, { apara: number; tinta: number }> = {};
    const labels: Record<string, string> = {};
    const cur = new Date(inicio);
    while (cur.getTime() <= fim.getTime()) {
      const dataStr = cur.toLocaleDateString('pt-BR');
      dataMap[dataStr] = { apara: 0, tinta: 0 };
      labels[dataStr] = cur.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      cur.setDate(cur.getDate() + 1);
    }
    pesagensApara.forEach((r) => {
      const d = String((r as any).data);
      if (dataMap[d]) dataMap[d].apara++;
    });
    pesagensTinta.forEach((r) => {
      const d = String((r as any).data);
      if (dataMap[d]) dataMap[d].tinta++;
    });
    return Object.keys(dataMap).map((d) => ({
      dia: labels[d],
      Apara: dataMap[d].apara,
      'Tinta/Solv.': dataMap[d].tinta,
    }));
  }, [pesagensApara, pesagensTinta, inicio, fim]);

  const renderTooltip = (cursorColor = '16,185,129') => (
    <Tooltip content={<ChartTooltip />} trigger={tooltipTrigger} cursor={{ fill: `rgba(${cursorColor},0.1)` }} />
  );
  const renderPieTooltip = () => <Tooltip content={<ChartTooltip />} trigger={tooltipTrigger} />;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list space-y-4 p-4 md:p-6 pb-56"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão geral completa do sistema</p>
        </div>

        {/* Filtro de Período */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1">
            <Filter className="h-4 w-4" />
            <span>Período:</span>
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[160px] h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === 'personalizado' && (
            <div className="flex items-center gap-2 bg-card border rounded-md p-1 px-2">
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-7 w-[120px] text-xs px-1 border-none focus-visible:ring-0"
              />
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-7 w-[120px] text-xs px-1 border-none focus-visible:ring-0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Dica de interação no mobile */}
      {isMobile && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
          <span>Toque nas barras ou fatias dos gráficos para ver os detalhes.</span>
        </div>
      )}

      {/* ── Chaves pendentes de devolução ── */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-orange-200/70 dark:border-orange-900/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Chaves pendentes de devolução
            </CardTitle>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              {chavesPendentes.length}
            </span>
          </CardHeader>
          <CardContent className="p-3">
            {chavesPendentes.length > 0 ? (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {chavesPendentes.map((registro) => (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-orange-50/70 px-3 py-2 dark:bg-orange-950/20"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <KeyRound className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
                      <span className="truncate text-sm font-medium text-foreground">
                        {registro.chave || 'Departamento não informado'}
                      </span>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {registro.horarioRetirada || '--:--'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">
                Nenhuma chave pendente de devolução.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── KPI Cards (2 rows of 4) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={item}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          kpis.filter((k) => k.value > 0).map((kpi) => (
            <motion.div key={kpi.title} variants={item} className="h-full min-w-0">
              <Card className="overflow-hidden h-full">
                <CardContent className="p-4 h-full">
                  <div className="flex items-center gap-3 h-full min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${kpi.bg}`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight break-words whitespace-normal">
                        {kpi.title}
                      </p>
                      <p className="mt-0.5 text-xl sm:text-2xl font-bold leading-none break-all">
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Pré-autorizações pendentes de entrada ── */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-cyan-200/70 dark:border-cyan-900/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CalendarCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                Pré-Autorizações Pendentes de Entrada
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Pendências do período selecionado, sem entrada registrada no Fluxo.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setCurrentPage('pre-autorizacao')}
            >
              Ver pendentes
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {preAuthPendentes.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted-foreground">
                <CalendarCheck className="h-4 w-4 text-emerald-500" />
                Não há pré-autorizações pendentes de entrada no período selecionado.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {preAuthPendentes.slice(0, 6).map((preAutorizacao) => (
                  <button
                    key={preAutorizacao.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    onClick={() => setCurrentPage('pre-autorizacao')}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-semibold">{preAutorizacao.visitanteNome}</span>
                        <span className="text-xs text-muted-foreground">{preAutorizacao.visitanteDoc || 'Documento não informado'}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Building2 className="h-3.5 w-3.5 shrink-0" />{preAutorizacao.visitanteEmpresa || 'Empresa não informada'}</span>
                        {preAutorizacao.departamento && <span className="truncate">{preAutorizacao.departamento}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-300"><Clock3 className="h-3.5 w-3.5" />{preAutorizacao.horarioPrevisto || 'Sem horário'}</span>
                      <span className="text-muted-foreground">{preAutorizacao.dataPrevista}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {preAuthPendentes.length > 6 && (
              <div className="border-t border-border/50 px-4 py-2 text-center text-xs text-muted-foreground">
                +{preAuthPendentes.length - 6} pendências. Use “Ver pendentes” para abrir a tela Pré-Autorização.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Todos os gráficos em um único grid contínuo (auto-flow 2x2) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entradasSaidasPorHora.some((d) => d.entradas > 0 || d.saidas > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entradas vs Saídas por Hora</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={entradasSaidasPorHora}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hora" tick={AXIS_TICK_STYLE} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" className="cursor-pointer" />
                      <Bar dataKey="saidas" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Saídas" className="cursor-pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tendenciaSemanal.some((d) => d.movimentacoes > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tendência Semanal</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendenciaSemanal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="dia" tick={AXIS_TICK_STYLE} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="movimentacoes"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Movimentações"
                        className="cursor-pointer"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {checklistsPorStatus.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Checklists por Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={checklistsPorStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        className="cursor-pointer"
                      >
                        {checklistsPorStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(entry as any).fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {fluxoPorPeriodo.some((d) => d.fluxo > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fluxo por Período do Dia</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fluxoPorPeriodo}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="periodo" tick={AXIS_TICK_STYLE_SMALL} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <defs>
                        <linearGradient id="colorFluxo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="fluxo" stroke="#10b981" fill="url(#colorFluxo)" strokeWidth={2} name="Fluxo" className="cursor-pointer" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {movimentacaoAcumulada.some((d) => d.entradas > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Movimentação Acumulada por Hora</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={movimentacaoAcumulada}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hora" tick={AXIS_TICK_STYLE_SMALL} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="entradas" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Entradas" className="cursor-pointer" />
                      <Line type="monotone" dataKey="acumulado" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name="Acumulado" className="cursor-pointer" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {atividadePorModulo.some((d) => d.valor > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Atividade por Módulo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={atividadePorModulo} outerRadius="70%">
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="modulo" tick={AXIS_TICK_STYLE_SMALL} />
                      <PolarRadiusAxis tick={AXIS_TICK_STYLE_SMALL} allowDecimals={false} />
                      {renderPieTooltip()}
                      <Radar name="Registros" dataKey="valor" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {fluxoPorCategoria.some((d) => d.Abertos > 0 || d.Finalizados > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Registros por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fluxoPorCategoria} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      <YAxis dataKey="categoria" type="category" width={100} tick={AXIS_TICK_STYLE_SMALL} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="Abertos" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Abertos" stackId="a" className="cursor-pointer" />
                      <Bar dataKey="Finalizados" fill="#10b981" radius={[0, 4, 4, 0]} name="Finalizados" stackId="a" className="cursor-pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pesagensPorDia.some((d) => d.Apara > 0 || d['Tinta/Solv.'] > 0) && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Evolução das Pesagens</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pesagensPorDia}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="dia" tick={AXIS_TICK_STYLE_SMALL} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Area type="monotone" dataKey="Apara" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.16} strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} name="Apara" className="cursor-pointer" />
                      <Area type="monotone" dataKey="Tinta/Solv." stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.16} strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} activeDot={{ r: 5 }} name="Tinta/Solv." className="cursor-pointer" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {aparaPesoTotalPorReboque.data.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peso Total por Tipo de Reboque</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aparaPesoTotalPorReboque.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="registro" tick={AXIS_TICK_STYLE_SMALL} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      {aparaPesoTotalPorReboque.series.map((line) => (
                        <Area
                          key={line.key}
                          type="monotone"
                          dataKey={line.key}
                          stroke={line.color}
                          fill={line.color}
                          fillOpacity={0.16}
                          strokeWidth={2}
                          dot={{ fill: line.color, r: 3 }}
                          activeDot={{ r: 5 }}
                          name={line.name}
                          className="cursor-pointer"
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tintaPesoPorMaterial.data.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peso (kg) por Material</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tintaPesoPorMaterial.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="registro" tick={AXIS_TICK_STYLE_SMALL} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      {tintaPesoPorMaterial.series.map((line) => (
                        <Area
                          key={line.key}
                          type="monotone"
                          dataKey={line.key}
                          stroke={line.color}
                          fill={line.color}
                          fillOpacity={0.16}
                          strokeWidth={2}
                          dot={{ fill: line.color, r: 3 }}
                          activeDot={{ r: 5 }}
                          name={line.name}
                          className="cursor-pointer"
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {empresasMaisFrequentes.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Empresas Mais Frequentes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={empresasMaisFrequentes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      <YAxis dataKey="empresa" type="category" width={130} tick={AXIS_TICK_STYLE_SMALL} />
                      {renderTooltip('6,182,212')}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="registros" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Registros" className="cursor-pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {registrosPorDepartamento.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Registros por Departamento</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={registrosPorDepartamento}
                        cx="50%"
                        cy="46%"
                        innerRadius={46}
                        outerRadius={82}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        className="cursor-pointer"
                      >
                        {registrosPorDepartamento.map((entry, index) => (
                          <Cell key={`departamento-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/50 pt-3 sm:grid-cols-3">
                  {registrosPorDepartamento.map((entry, index) => (
                    <div
                      key={`departamento-legenda-${index}`}
                      className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
                      title={`${entry.name}: ${entry.value}`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 truncate">{abbreviateDashboardLabel(entry.name)}</span>
                      <span className="shrink-0 font-semibold text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {ocorrenciasPorTipo.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ocorrências por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ocorrenciasPorTipo}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="tipo" tick={AXIS_TICK_STYLE_SMALL} />
                      <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                      {renderTooltip('239,68,68')}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="qtd" fill="#ef4444" radius={[4, 4, 0, 0]} name="Ocorrências" className="cursor-pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {ocorrenciasPorGravidade.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ocorrências por Gravidade</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ocorrenciasPorGravidade} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {ocorrenciasPorGravidade.map((entry, index) => (
                          <Cell key={`grav-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {ocorrenciasPorStatus.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ocorrências por Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ocorrenciasPorStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {ocorrenciasPorStatus.map((entry, index) => (
                          <Cell key={`oc-status-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {veiculosPorTipo.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Veículos por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={veiculosPorTipo} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {veiculosPorTipo.map((entry, index) => (
                          <Cell key={`vei-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pessoasPorTipo.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pessoas Cadastradas por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pessoasPorTipo} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {pessoasPorTipo.map((entry, index) => (
                          <Cell key={`pes-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {preAuthPorStatus.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pré-Autorizações por Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={preAuthPorStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {preAuthPorStatus.map((entry, index) => (
                          <Cell key={`pa-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {achadosPorStatus.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Achados e Perdidos por Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={achadosPorStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {achadosPorStatus.map((entry, index) => (
                          <Cell key={`ap-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {inspecoesPorStatus.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inspeções Diárias por Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={inspecoesPorStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" className="cursor-pointer">
                        {inspecoesPorStatus.map((entry, index) => (
                          <Cell key={`insp-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {renderPieTooltip()}
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* ── Summary Cards Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lista Negra */}
        {listaNegraFiltered.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldBan className="h-4 w-4 text-orange-500" />
                  Entradas na Lista Negra
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {listaNegraFiltered.slice(0, 3).map((ln) => (
                    <div key={ln.id} className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{ln.nome}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          ln.status === 'ativo'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {ln.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  ))}
                  {listaNegraFiltered.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{listaNegraFiltered.length - 3} mais</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Avisos Fixados */}
        {avisosFiltered.filter((a) => a.fixado).length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Avisos Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {avisosFiltered
                    .filter((a) => a.fixado)
                    .slice(0, 3)
                    .map((av) => (
                      <div key={av.id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{av.titulo}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            av.prioridade === 'alta'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : av.prioridade === 'media'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {av.prioridade}
                        </span>
                      </div>
                    ))}
                  {avisosFiltered.filter((a) => a.fixado).length > 3 && (
                    <p className="text-xs text-muted-foreground">+{avisosFiltered.filter((a) => a.fixado).length - 3} mais</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Últimas Pré-Autorizações */}
        {preAuthFiltered.filter((p) => p.status === 'agendado' || p.status === 'confirmado').length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-cyan-500" />
                  Pré-Autorizações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {preAuthFiltered
                    .filter((p) => p.status === 'agendado' || p.status === 'confirmado')
                    .slice(0, 3)
                    .map((pa) => (
                      <div key={pa.id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{pa.visitanteNome}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            pa.status === 'confirmado'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {pa.status === 'confirmado' ? 'Confirmado' : 'Agendado'}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
