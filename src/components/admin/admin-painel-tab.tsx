'use client';

import { useState } from 'react';
import { User, MapPin, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

/** Verifica se uma data (string) cai dentro do período selecionado */
function isDateInPeriod(dateStr: string, period: string): boolean {
  if (period === 'todos') return true;
  if (!dateStr) return false;

  let dateObj: Date;
  if (dateStr.includes('/')) {
    const [d, m, rest] = dateStr.split('/');
    const y = rest.split(' ')[0];
    dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    const [y, m, rest] = dateStr.split('-');
    const d = rest.split(' ')[0];
    dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateObj);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (period === 'hoje') return diffDays === 0;
  if (period === 'ontem') return diffDays === 1;
  if (period === '7dias') return diffDays >= 0 && diffDays <= 7;
  if (period === '30dias') return diffDays >= 0 && diffDays <= 30;
  if (period === 'este_mes')
    return today.getMonth() === target.getMonth() && today.getFullYear() === target.getFullYear();

  return true;
}

export function AdminPainelTab() {
  const { usuarios, postos, ocorrencias, registrosFluxo, rondas, user } = useAppStore();

  const [filtroPosto, setFiltroPosto] = useState<string>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('hoje');

  const appliesPostoFilter = (itemPostoId?: string) => {
    if (user?.postoId && itemPostoId !== user.postoId) return false;
    if (!user?.postoId && filtroPosto !== 'todos' && itemPostoId !== filtroPosto) return false;
    return true;
  };

  const registrosFiltrados = registrosFluxo.filter(
    (r) => appliesPostoFilter(r.postoId) && isDateInPeriod(r.data, filtroPeriodo)
  );
  const ocorrenciasFiltradas = ocorrencias.filter(
    (o) => appliesPostoFilter(o.postoId) && isDateInPeriod(o.data, filtroPeriodo)
  );
  const ocorrenciasAbertas = ocorrenciasFiltradas.filter(
    (o) => o.status === 'aberta' || o.status === 'em_andamento'
  );
  const rondasFiltradas = rondas.filter(
    (r) => appliesPostoFilter(r.postoId) && isDateInPeriod(r.data, filtroPeriodo)
  );
  const rondasConcluidas = rondasFiltradas.filter((r) => r.status === 'concluida');

  const postosFiltrados = postos.filter((p) => appliesPostoFilter(p.id));
  const usuariosFiltrados = usuarios.filter((u) => appliesPostoFilter(u.postoId));

  const periodoLabel = filtroPeriodo.replace('_', ' ');

  const rondasData = [
    { name: 'Concluídas', value: rondasConcluidas.length, color: '#10b981' }, // emerald-500
    { name: 'Pendentes', value: rondasFiltradas.length - rondasConcluidas.length, color: '#eab308' }, // yellow-500
  ];

  const ocorrenciasStatus = [
    { name: 'Aberta', value: ocorrenciasFiltradas.filter(o => o.status === 'aberta').length, fill: '#ef4444' },
    { name: 'Em Andamento', value: ocorrenciasFiltradas.filter(o => o.status === 'em_andamento').length, fill: '#f59e0b' },
    { name: 'Resolvida', value: ocorrenciasFiltradas.filter(o => o.status === 'resolvida').length, fill: '#10b981' },
    { name: 'Encaminhada', value: ocorrenciasFiltradas.filter(o => o.status === 'encaminhada').length, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Visão geral do sistema APEX Porter com base nos filtros.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {!user?.postoId && (
            <Select value={filtroPosto} onValueChange={setFiltroPosto}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
                <SelectValue placeholder="Todos os Postos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Postos</SelectItem>
                {postos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="ontem">Ontem</SelectItem>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="este_mes">Este Mês</SelectItem>
              <SelectItem value="todos">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Usuários Cadastrados"
          value={usuariosFiltrados.length}
          icon={<User className="h-5 w-5" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="Postos (Filtro)"
          value={postosFiltrados.length}
          icon={<MapPin className="h-5 w-5" />}
          colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        />
        <MetricCard
          label="Registros (Período)"
          value={registrosFiltrados.length}
          icon={<Activity className="h-5 w-5" />}
          colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Ocorrências Abertas"
          value={ocorrenciasAbertas.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          colorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
      </div>

      {/* Rondas + Acessos Recentes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rondas Resumo */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Rondas ({periodoLabel})
          </h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rondasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {rondasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 w-full sm:w-1/2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Programadas</span>
                <span className="font-bold text-lg">{rondasFiltradas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Concluídas</span>
                <span className="font-bold text-lg text-emerald-600">{rondasConcluidas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <span className="font-bold text-lg text-yellow-600">
                  {rondasFiltradas.length - rondasConcluidas.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ocorrências Gráfico */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Status de Ocorrências ({periodoLabel})
          </h3>
          <div className="flex-1 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocorrenciasStatus} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ocorrenciasStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Componente interno reutilizável para os cards de métricas */
function MetricCard({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
