'use client';

import { useMemo, useState } from 'react';
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
import type { TooltipProps } from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Activity,
  Car,
  AlertTriangle,
  ShieldBan,
  PackageSearch,
  CalendarCheck,
  Users,
  FileCheck,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import {
  CATEGORIAS_FLUXO,
  TIPOS_OCORRENCIA,
  GRAVIDADES_OCORRENCIA,
  STATUS_OCORRENCIA,
  TIPOS_EMERGENCIA,
} from '@/lib/data';
import type { RegistroFluxo, TipoPessoa } from '@/lib/data';

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

// ── Custom Cursor with curved connector line from tooltip area to bar ──
function ChartCursor(props: any) {
  const { x, y, width, height, top, bottom } = props;
  if (x === undefined || y === undefined) return null;

  const barW = width || 20;
  const cx = x + barW / 2;
  const chartTop = top ?? 0;
  const barTop = y;
  const barH = height || 20;
  const barBottom = barTop + barH;

  const color = '#10b981';
  const midY = chartTop + (barTop - chartTop) * 0.5;

  return (
    <g>
      {/* Soft highlight behind hovered bar */}
      <rect
        x={x - 2}
        y={chartTop}
        width={barW + 4}
        height={barBottom - chartTop}
        fill="rgba(16,185,129,0.06)"
        rx={3}
      />

      {/* Main curved connector line: from chart top center → bar top center */}
      <path
        d={`M${cx},${chartTop} C${cx},${midY} ${cx - 10},${barTop - 8} ${cx},${barTop}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Dot at bar top (target endpoint) */}
      <circle cx={cx} cy={barTop} r="3" fill={color} opacity="0.5" />
      <circle cx={cx} cy={barTop} r="1.5" fill="#ffffff" />
    </g>
  );
}

// ── Custom Tooltip Component with curved connector ──
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const mainColor = payload[0]?.color || '#10b981';

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Badge container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))',
          borderRadius: 10,
          border: `1px solid ${mainColor}40`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.45), 0 0 16px ${mainColor}25`,
          minWidth: 'fit-content',
          position: 'relative',
        }}
      >
        {/* Small top accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 8,
          right: 8,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${mainColor}80, transparent)`,
          borderRadius: '0 0 2px 2px',
        }} />

        {/* Label (title) */}
        {label !== undefined && label !== '' && (
          <span
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.3,
              lineHeight: 1.3,
              paddingTop: 2,
            }}
          >
            {label}
          </span>
        )}
        {/* Payload items */}
        {payload.map((entry, idx) => {
          const itemColor = entry.color || '#10b981';
          return (
            <div
              key={`tooltip-item-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Color indicator with glow ring */}
              <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: itemColor,
                    boxShadow: `0 0 8px ${itemColor}90`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '50%',
                    border: `1.5px solid ${itemColor}50`,
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Title (white bold) */}
                <span
                  style={{
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 11.5,
                    lineHeight: 1.2,
                  }}
                >
                  {entry.name}
                </span>
                {/* Result subtitle (green, not bold) */}
                <span
                  style={{
                    color: '#10b981',
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.3,
                  }}
                >
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

      {/* Small downward arrow indicator below badge */}
      <svg
        width="16"
        height="8"
        viewBox="0 0 16 8"
        style={{ display: 'block', marginTop: -1 }}
      >
        <path
          d="M8,0 L8,6 M5,4 L8,7 L11,4"
          fill="none"
          stroke={mainColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const {
    registrosFluxo,
    veiculos,
    ocorrencias,
    listaNegra,
    achadosPerdidos,
    preAutorizacoes,
    pessoas,
    avisos,
    checklists,
    inspecoes,
    protocolos,
  } = useAppStore();

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

  const registrosFluxoFiltered = useMemo(() => registrosFluxo.filter(r => isDateInRange('data' in r ? (r as any).data : '')), [registrosFluxo, isDateInRange]);
  const veiculosFiltered = useMemo(() => veiculos.filter(v => isDateInRange(v.data)), [veiculos, isDateInRange]);
  const ocorrenciasFiltered = useMemo(() => ocorrencias.filter(o => isDateInRange(o.data)), [ocorrencias, isDateInRange]);
  const listaNegraFiltered = useMemo(() => listaNegra.filter(l => isDateInRange(l.data)), [listaNegra, isDateInRange]);
  const achadosFiltered = useMemo(() => achadosPerdidos.filter(a => isDateInRange(a.data)), [achadosPerdidos, isDateInRange]);
  const preAuthFiltered = useMemo(() => preAutorizacoes.filter(p => isDateInRange(p.dataPrevista)), [preAutorizacoes, isDateInRange]);
  const checklistsFiltered = useMemo(() => checklists.filter(c => isDateInRange(c.data)), [checklists, isDateInRange]);
  const inspecoesFiltered = useMemo(() => inspecoes.filter(i => isDateInRange(i.data)), [inspecoes, isDateInRange]);
  const avisosFiltered = useMemo(() => avisos.filter(a => isDateInRange(a.data)), [avisos, isDateInRange]);

  // ── Computed KPIs ──
  const kpis = useMemo(() => {
    const fluxoAbertos = registrosFluxoFiltered.filter((r) => !r.horarioSaida).length;
    const fluxoFechados = registrosFluxoFiltered.filter((r) => !!r.horarioSaida).length;
    const veiculosEstacionados = veiculosFiltered.filter((v) => !v.horarioSaida).length;
    const ocorrenciasAbertas = ocorrenciasFiltered.filter((o) => o.status === 'aberta' || o.status === 'em_andamento').length;
    const listaNegraAtiva = listaNegraFiltered.filter((l) => l.status === 'ativo').length;
    const achadosNaoDevolvidos = achadosFiltered.filter((a) => a.status !== 'devolvido').length;
    const preAuthPendentes = preAuthFiltered.filter((p) => p.status === 'agendado' || p.status === 'confirmado').length;
    const pessoasCadastradas = pessoas.filter(p => !p.inativo).length;
    const checklistsPendentes = checklistsFiltered.filter((c) => c.status === 'pendente').length;
    const avisosAtivos = avisosFiltered.filter((a) => a.fixado).length;

    return [
      {
        title: 'Fluxo Aberto',
        value: fluxoAbertos,
        icon: ArrowDown,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      },
      {
        title: 'Fluxo Finalizado',
        value: fluxoFechados,
        icon: ArrowUp,
        color: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50 dark:bg-teal-950/30',
      },
      {
        title: 'Veículos no Local',
        value: veiculosEstacionados,
        icon: Car,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
      },
      {
        title: 'Ocorrências Abertas',
        value: ocorrenciasAbertas,
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/30',
      },
      {
        title: 'Lista Negra Ativa',
        value: listaNegraAtiva,
        icon: ShieldBan,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/30',
      },
      {
        title: 'Achados e Perdidos',
        value: achadosNaoDevolvidos,
        icon: PackageSearch,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-950/30',
      },
      {
        title: 'Pré-Autorizações',
        value: preAuthPendentes,
        icon: CalendarCheck,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      },
      {
        title: 'Pessoas Cadastradas',
        value: pessoasCadastradas,
        icon: Users,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      },
    ];
  }, [registrosFluxoFiltered, veiculosFiltered, ocorrenciasFiltered, listaNegraFiltered, achadosFiltered, preAuthFiltered, pessoas, avisosFiltered, checklistsFiltered]);

  // ── Real Data for Charts ──
  const entradasSaidasPorHora = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const data = hours.map(h => ({ hora: h, entradas: 0, saidas: 0 }));
    
    registrosFluxoFiltered.forEach(r => {
      if (r.horarioEntrada) {
        const h = r.horarioEntrada.split(':')[0] + ':00';
        const entry = data.find(d => d.hora === h);
        if (entry) entry.entradas++;
      }
      if ('horarioSaida' in r && (r as any).horarioSaida) {
        const h = (r as any).horarioSaida.split(':')[0] + ':00';
        const entry = data.find(d => d.hora === h);
        if (entry) entry.saidas++;
      }
    });
    
    const firstActiveIndex = data.findIndex(d => d.entradas > 0 || d.saidas > 0);
    const lastActiveIndex = data.findLastIndex(d => d.entradas > 0 || d.saidas > 0);
    
    if (firstActiveIndex === -1) return data.slice(6, 18);
    
    const start = Math.max(0, firstActiveIndex - 1);
    const end = Math.min(23, lastActiveIndex + 1);
    
    return data.slice(start, end + 1);
  }, [registrosFluxoFiltered]);

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
    
    registrosFluxo.forEach(r => {
      const data = 'data' in r ? (r as any).data : '';
      if (data && dataMap[data] !== undefined) {
        dataMap[data]++;
      }
    });
    
    return Object.keys(dataMap)
      .filter(k => !k.includes('_label'))
      .map(k => ({
        dia: dataMap[`${k}_label`],
        data: k,
        movimentacoes: dataMap[k]
      }));
  }, [registrosFluxo, fim]);

  const fluxoPorPeriodo = useMemo(() => {
    const counts: Record<string, number> = {
      'Madrugada (00h-06h)': 0,
      'Manhã (06h-12h)': 0,
      'Tarde (12h-18h)': 0,
      'Noite (18h-00h)': 0,
    };
    registrosFluxoFiltered.forEach(r => {
      if (r.horarioEntrada) {
        const hour = parseInt(r.horarioEntrada.split(':')[0], 10);
        if (hour >= 6 && hour < 12) counts['Manhã (06h-12h)']++;
        else if (hour >= 12 && hour < 18) counts['Tarde (12h-18h)']++;
        else if (hour >= 18 && hour <= 23) counts['Noite (18h-00h)']++;
        else counts['Madrugada (00h-06h)']++;
      }
    });
    return Object.entries(counts).map(([periodo, fluxo]) => ({ periodo, fluxo }));
  }, [registrosFluxoFiltered]);

  const checklistsPorStatus = useMemo(() => {
    const colors: Record<string, string> = {
      pendente: '#ef4444',
      em_andamento: '#f59e0b',
      concluido: '#10b981',
    };
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído',
    };
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
      if (r.horarioSaida) {
        counts[cat].fechados++;
      } else {
        counts[cat].abertos++;
      }
    });
    return CATEGORIAS_FLUXO.map((c) => ({
      categoria: c.label.length > 12 ? c.label.slice(0, 12) + '…' : c.label,
      Abertos: counts[c.value]?.abertos || 0,
      Finalizados: counts[c.value]?.fechados || 0,
    }));
  }, [registrosFluxoFiltered]);

  // ── Ocorrências por tipo ──
  const ocorrenciasPorTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    TIPOS_OCORRENCIA.forEach((t) => { counts[t.value] = 0; });
    ocorrenciasFiltered.forEach((o) => {
      counts[o.tipo] = (counts[o.tipo] || 0) + 1;
    });
    return TIPOS_OCORRENCIA.map((t) => ({
      tipo: t.label,
      qtd: counts[t.value] || 0,
    })).filter((d) => d.qtd > 0);
  }, [ocorrenciasFiltered]);

  // ── Ocorrências por gravidade ──
  const ocorrenciasPorGravidade = useMemo(() => {
    const colors: Record<string, string> = {
      leve: '#10b981',
      moderada: '#f59e0b',
      grave: '#f97316',
      critica: '#ef4444',
    };
    const counts: Record<string, number> = {};
    GRAVIDADES_OCORRENCIA.forEach((g) => { counts[g.value] = 0; });
    ocorrenciasFiltered.forEach((o) => {
      counts[o.gravidade] = (counts[o.gravidade] || 0) + 1;
    });
    return GRAVIDADES_OCORRENCIA.map((g) => ({
      name: g.label,
      value: counts[g.value] || 0,
      fill: colors[g.value],
    })).filter((d) => d.value > 0);
  }, [ocorrenciasFiltered]);

  // ── Veículos por tipo ──
  const veiculosPorTipo = useMemo(() => {
    const colors: Record<string, string> = {
      Visitante: '#8b5cf6',
      Prestador: '#06b6d4',
      Entregador: '#10b981',
      Colaborador: '#3b82f6',
    };
    const counts: Record<string, number> = {};
    veiculosFiltered.forEach((v) => {
      counts[v.tipo] = (counts[v.tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([tipo, qtd]) => ({
      name: tipo,
      value: qtd,
      fill: colors[tipo] || '#6b7280',
    }));
  }, [veiculosFiltered]);

  // ── Pessoas por tipo ──
  const pessoasPorTipo = useMemo(() => {
    const colors: Record<string, string> = {
      Colaborador: '#3b82f6',
      Visitante: '#8b5cf6',
      Prestador: '#f59e0b',
      Entregador: '#10b981',
      Motorista: '#f97316',
      Outro: '#6b7280',
    };
    const counts: Record<string, number> = {};
    pessoas.filter(p => !p.inativo).forEach((p) => {
      const t = p.tipo || 'Outro';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([tipo, qtd]) => ({
      name: tipo,
      value: qtd,
      fill: colors[tipo] || '#6b7280',
    }));
  }, [pessoas]);

  // ── Pré-autorizações por status ──
  const preAuthPorStatus = useMemo(() => {
    const colors: Record<string, string> = {
      agendado: '#3b82f6',
      confirmado: '#10b981',
      cancelado: '#ef4444',
      expirado: '#6b7280',
    };
    const labels: Record<string, string> = {
      agendado: 'Agendado',
      confirmado: 'Confirmado',
      cancelado: 'Cancelado',
      expirado: 'Expirado',
    };
    const counts: Record<string, number> = {};
    preAuthFiltered.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({
      name: labels[status] || status,
      value: qtd,
      fill: colors[status] || '#6b7280',
    }));
  }, [preAuthFiltered]);

  // ── Achados e perdidos por status ──
  const achadosPorStatus = useMemo(() => {
    const colors: Record<string, string> = {
      achado: '#10b981',
      perdido: '#f59e0b',
      devolvido: '#3b82f6',
    };
    const labels: Record<string, string> = {
      achado: 'Achado',
      perdido: 'Perdido',
      devolvido: 'Devolvido',
    };
    const counts: Record<string, number> = {};
    achadosFiltered.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({
      name: labels[status] || status,
      value: qtd,
      fill: colors[status] || '#6b7280',
    }));
  }, [achadosFiltered]);

  // ── Ocorrências por status ──
  const ocorrenciasPorStatus = useMemo(() => {
    const colors: Record<string, string> = {
      aberta: '#ef4444',
      em_andamento: '#f59e0b',
      resolvida: '#10b981',
      encaminhada: '#3b82f6',
    };
    const labels: Record<string, string> = {
      aberta: 'Aberta',
      em_andamento: 'Em Andamento',
      resolvida: 'Resolvida',
      encaminhada: 'Encaminhada',
    };
    const counts: Record<string, number> = {};
    ocorrenciasFiltered.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({
      name: labels[status] || status,
      value: qtd,
      fill: colors[status] || '#6b7280',
    }));
  }, [ocorrenciasFiltered]);

  // ── Empresas mais frequentes (top 5) ──
  const empresasMaisFrequentes = useMemo(() => {
    const counts: Record<string, number> = {};
    registrosFluxoFiltered.forEach((r) => {
      let empresa = '';
      if ('empresa' in r) empresa = (r as any).empresa;
      if ('nomeEmpresa' in r) empresa = (r as any).nomeEmpresa;
      if (!empresa) return;
      // Extract company name from "Name / Company" format
      const parts = empresa.split(' / ');
      const companyName = parts.length > 1 ? parts[parts.length - 1] : empresa;
      counts[companyName] = (counts[companyName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([empresa, qtd]) => ({
        empresa: empresa.length > 20 ? empresa.slice(0, 20) + '…' : empresa,
        registros: qtd,
      }));
  }, [registrosFluxoFiltered]);

  // ── Inspeções por status ──
  const inspecoesPorStatus = useMemo(() => {
    const colors: Record<string, string> = {
      em_andamento: '#f59e0b',
      concluida: '#3b82f6',
      aprovada: '#10b981',
    };
    const labels: Record<string, string> = {
      em_andamento: 'Em Andamento',
      concluida: 'Concluída',
      aprovada: 'Aprovada',
    };
    const counts: Record<string, number> = {};
    inspecoesFiltered.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, qtd]) => ({
      name: labels[status] || status,
      value: qtd,
      fill: colors[status] || '#6b7280',
    }));
  }, [inspecoesFiltered]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list space-y-4 p-4 md:p-6 pb-28"
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

      {/* ── KPI Cards (2 rows of 4) ── */}
      {kpis.filter((k) => k.value > 0).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpis.filter((k) => k.value > 0).map((kpi) => (
            <motion.div key={kpi.title} variants={item}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${kpi.bg}`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Charts Row 1: Original (Entradas vs Saídas + Tendência Semanal) ── */}
      {(entradasSaidasPorHora.some((d) => d.entradas > 0 || d.saidas > 0) || tendenciaSemanal.some((d) => d.movimentacoes > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                        <Bar dataKey="saidas" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Saídas" />
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
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Line
                          type="monotone"
                          dataKey="movimentacoes"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Movimentações"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Charts Row 2: Checklists por Status + Fluxo por Período ── */}
      {(checklistsPorStatus.length > 0 || fluxoPorPeriodo.some((d) => d.fluxo > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        >
                          {checklistsPorStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={(entry as any).fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
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
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <defs>
                          <linearGradient id="colorFluxo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="fluxo"
                          stroke="#10b981"
                          fill="url(#colorFluxo)"
                          strokeWidth={2}
                          name="Fluxo"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Charts Row 3: Fluxo por Categoria (real data) + Empresas mais frequentes ── */}
      {(fluxoPorCategoria.some((d) => d.Abertos > 0 || d.Finalizados > 0) || empresasMaisFrequentes.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fluxoPorCategoria.some((d) => d.Abertos > 0 || d.Finalizados > 0) && (
            <motion.div variants={item}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Registros por Categoria (Dados Reais)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fluxoPorCategoria} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <YAxis dataKey="categoria" type="category" width={100} tick={AXIS_TICK_STYLE_SMALL} />
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Bar dataKey="Abertos" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Abertos" stackId="a" />
                        <Bar dataKey="Finalizados" fill="#10b981" radius={[0, 4, 4, 0]} name="Finalizados" stackId="a" />
                      </BarChart>
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
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Bar dataKey="registros" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Registros" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Charts Row 4: Ocorrências por tipo + Ocorrências por gravidade ── */}
      {(ocorrenciasPorTipo.length > 0 || ocorrenciasPorGravidade.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Bar dataKey="qtd" fill="#ef4444" radius={[4, 4, 0, 0]} name="Ocorrências" />
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
                        <Pie
                          data={ocorrenciasPorGravidade}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {ocorrenciasPorGravidade.map((entry, index) => (
                            <Cell key={`grav-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Charts Row 5: Ocorrências por status + Veículos por tipo ── */}
      {(ocorrenciasPorStatus.length > 0 || veiculosPorTipo.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <Pie
                          data={ocorrenciasPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {ocorrenciasPorStatus.map((entry, index) => (
                            <Cell key={`oc-status-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
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
                        <Pie
                          data={veiculosPorTipo}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {veiculosPorTipo.map((entry, index) => (
                            <Cell key={`vei-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Charts Row 6: Pessoas por tipo + Pré-autorizações por status ── */}
      {(pessoasPorTipo.length > 0 || preAuthPorStatus.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <Pie
                          data={pessoasPorTipo}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pessoasPorTipo.map((entry, index) => (
                            <Cell key={`pes-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
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
                        <Pie
                          data={preAuthPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {preAuthPorStatus.map((entry, index) => (
                            <Cell key={`pa-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Charts Row 7: Achados e Perdidos + Inspeções por status ── */}
      {(achadosPorStatus.length > 0 || inspecoesPorStatus.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <Pie
                          data={achadosPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {achadosPorStatus.map((entry, index) => (
                            <Cell key={`ap-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
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
                        <Pie
                          data={inspecoesPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {inspecoesPorStatus.map((entry, index) => (
                            <Cell key={`insp-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Summary Cards Row ── */}
      {(listaNegraFiltered.length > 0 || avisosFiltered.filter((a) => a.fixado).length > 0 || preAuthFiltered.filter((p) => p.status === 'agendado' || p.status === 'confirmado').length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ln.status === 'ativo'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
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
                {avisosFiltered.filter((a) => a.fixado).slice(0, 3).map((av) => (
                  <div key={av.id} className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{av.titulo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      av.prioridade === 'alta'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : av.prioridade === 'media'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        pa.status === 'confirmado'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
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
      )}
    </motion.div>
  );
}
