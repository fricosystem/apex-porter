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

// ── Custom Cursor with connector line from tooltip area to point ──
function ChartCursor(props: any) {
  const { x, y, width, height, top, bottom, points } = props;
  
  if (x === undefined) return null;

  const cx = x;
  const chartTop = top ?? 0;
  const chartBottom = bottom ?? 0;
  
  let pointY = y;
  let barWidth = width || 20;
  
  // For LineChart/AreaChart, use points if available
  if (points && points.length > 0 && points[0].value !== undefined) {
    pointY = points[0].y;
  }
  
  const color = '#10b981';

  return (
    <g>
      {/* Vertical line through the point */}
      <line
        x1={cx}
        y1={chartTop}
        x2={cx}
        y2={chartBottom}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.3"
      />

      {/* Connector line from chart top to the point */}
      {pointY !== undefined && (
        <line
          x1={cx}
          y1={chartTop}
          x2={cx}
          y2={pointY}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      )}

      {/* Dot at the point (target endpoint) */}
      {pointY !== undefined && (
        <>
          <circle cx={cx} cy={pointY} r="4" fill={color} opacity="0.8" />
          <circle cx={cx} cy={pointY} r="2" fill="#ffffff" />
        </>
      )}
      
      {/* For BarChart, show highlight behind bar */}
      {width !== undefined && height !== undefined && (
        <rect
          x={x - 2}
          y={chartTop}
          width={barWidth + 4}
          height={chartBottom - chartTop}
          fill="rgba(16,185,129,0.06)"
          rx={3}
        />
      )}
    </g>
  );
}

// ── Custom Tooltip Component ──
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const mainColor = payload[0]?.color || '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Badge container */}
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
        {/* Label (title) */}
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
        {/* Payload items */}
        {payload.map((entry: any, idx: number) => {
          const itemColor = entry.color || '#10b981';
          return (
            <div
              key={`tooltip-item-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* Color indicator with glow ring */}
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
                {/* Title (white bold) */}
                <span
                  style={{
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    lineHeight: 1.2,
                  }}
                >
                  {entry.name}
                </span>
                {/* Result subtitle (green, not bold) */}
                <span
                  style={{
                    color: itemColor,
                    fontWeight: 400,
                    fontSize: 15,
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
    </div>
  );
}

export default function DashboardPage() {
  const [activeChartStates, setActiveChartStates] = useState<Record<string, number | null>>({});
  
  const setActiveChartIndex = (chartId: string, index: number | null) => {
    setActiveChartStates(prev => ({
      ...prev,
      [chartId]: prev[chartId] === index ? null : index
    }));
  };
  
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
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const data = hours.map(h => ({ periodo: h, fluxo: 0 }));
    
    registrosFluxoFiltered.forEach(r => {
      if (r.horarioEntrada) {
        const h = r.horarioEntrada.split(':')[0] + ':00';
        const entry = data.find(d => d.periodo === h);
        if (entry) entry.fluxo++;
      }
    });
    
    return data;
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
                      <BarChart 
                        data={entradasSaidasPorHora}
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('entradasSaidas', data.activeIndex);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="hora" tick={AXIS_TICK_STYLE} />
                        <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ fill: 'rgba(16,185,129,0.1)' }} 
                          activeIndex={activeChartStates['entradasSaidas']}
                          active={activeChartStates['entradasSaidas'] !== null}
                        />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Bar 
                          dataKey="entradas" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                          name="Entradas" 
                          className="cursor-pointer"
                        />
                        <Bar 
                          dataKey="saidas" 
                          fill="#14b8a6" 
                          radius={[4, 4, 0, 0]} 
                          name="Saídas" 
                          className="cursor-pointer"
                        />
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
                      <LineChart 
                        data={tendenciaSemanal}
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('tendencia', data.activeIndex);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="dia" tick={AXIS_TICK_STYLE} />
                        <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ fill: 'rgba(16,185,129,0.1)' }} 
                          activeIndex={activeChartStates['tendencia']}
                          active={activeChartStates['tendencia'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('checklists', data.activeIndex);
                          }
                        }}
                      >
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
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['checklists']}
                          active={activeChartStates['checklists'] !== null}
                        />
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
                      <AreaChart 
                        data={fluxoPorPeriodo}
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('fluxoPeriodo', data.activeIndex);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="periodo" tick={AXIS_TICK_STYLE_SMALL} />
                        <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ fill: 'rgba(16,185,129,0.1)' }} 
                          activeIndex={activeChartStates['fluxoPeriodo']}
                          active={activeChartStates['fluxoPeriodo'] !== null}
                        />
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
                          className="cursor-pointer"
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
                      <BarChart 
                        data={fluxoPorCategoria} 
                        layout="vertical"
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('fluxoCategorias', data.activeIndex);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <YAxis dataKey="categoria" type="category" width={100} tick={AXIS_TICK_STYLE_SMALL} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ fill: 'rgba(16,185,129,0.1)' }} 
                          activeIndex={activeChartStates['fluxoCategorias']}
                          active={activeChartStates['fluxoCategorias'] !== null}
                        />
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

          {empresasMaisFrequentes.length > 0 && (
            <motion.div variants={item}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Empresas Mais Frequentes</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={empresasMaisFrequentes} 
                        layout="vertical"
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('empresas', data.activeIndex);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <YAxis dataKey="empresa" type="category" width={130} tick={AXIS_TICK_STYLE_SMALL} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ fill: 'rgba(6,182,212,0.1)' }} 
                          activeIndex={activeChartStates['empresas']}
                          active={activeChartStates['empresas'] !== null}
                        />
                        <Legend wrapperStyle={LEGEND_STYLE} />
                        <Bar dataKey="registros" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Registros" className="cursor-pointer" />
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
                      <BarChart 
                        data={ocorrenciasPorTipo}
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('ocorrenciasTipo', data.activeIndex);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="tipo" tick={AXIS_TICK_STYLE_SMALL} />
                        <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
                        <Tooltip 
                          content={<ChartTooltip />} 
                          cursor={{ fill: 'rgba(239,68,68,0.1)' }} 
                          activeIndex={activeChartStates['ocorrenciasTipo']}
                          active={activeChartStates['ocorrenciasTipo'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('ocorrenciasGravidade', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={ocorrenciasPorGravidade}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {ocorrenciasPorGravidade.map((entry, index) => (
                            <Cell key={`grav-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['ocorrenciasGravidade']}
                          active={activeChartStates['ocorrenciasGravidade'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('ocorrenciasStatus', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={ocorrenciasPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {ocorrenciasPorStatus.map((entry, index) => (
                            <Cell key={`oc-status-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['ocorrenciasStatus']}
                          active={activeChartStates['ocorrenciasStatus'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('veiculosTipo', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={veiculosPorTipo}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {veiculosPorTipo.map((entry, index) => (
                            <Cell key={`vei-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['veiculosTipo']}
                          active={activeChartStates['veiculosTipo'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('pessoasTipo', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={pessoasPorTipo}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {pessoasPorTipo.map((entry, index) => (
                            <Cell key={`pes-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['pessoasTipo']}
                          active={activeChartStates['pessoasTipo'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('preAuthStatus', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={preAuthPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {preAuthPorStatus.map((entry, index) => (
                            <Cell key={`pa-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['preAuthStatus']}
                          active={activeChartStates['preAuthStatus'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('achadosStatus', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={achadosPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {achadosPorStatus.map((entry, index) => (
                            <Cell key={`ap-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['achadosStatus']}
                          active={activeChartStates['achadosStatus'] !== null}
                        />
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
                      <PieChart
                        onClick={(data) => {
                          if (data?.activeIndex !== undefined) {
                            setActiveChartIndex('inspecoesStatus', data.activeIndex);
                          }
                        }}
                      >
                        <Pie
                          data={inspecoesPorStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {inspecoesPorStatus.map((entry, index) => (
                            <Cell key={`insp-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltip />} 
                          activeIndex={activeChartStates['inspecoesStatus']}
                          active={activeChartStates['inspecoesStatus'] !== null}
                        />
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
