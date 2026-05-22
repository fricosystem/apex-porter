'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileDown, Printer, Calendar, Clock, ArrowRightLeft, User, Building2, Truck, Scale,
  Package, LogOut, Users, Mail, Car, UserCheck, BarChart3, PieChart, TrendingUp,
  Filter, Download, Table,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import {
  CATEGORIAS_FLUXO, OPCOES_DEPARTAMENTOS,
  type CategoriaFluxo, type RegistroFluxo,
} from '@/lib/data';
import { toast } from 'sonner';

type RelatorioTab = 'fluxo' | 'veiculos' | 'correspondencias' | 'pre-autorizacao';
type DateRange = 'hoje' | 'ontem' | 'semana' | 'mes' | 'personalizado';

const catIcons: Record<CategoriaFluxo, React.ElementType> = {
  entregas1: Package, visitantes: User, prestadores: Building2, pesagem: Scale,
  entregas2: Truck, coleta: ArrowRightLeft, movimentacao: Users, correspondencias: Mail,
};

function getMainField(r: RegistroFluxo): string {
  switch (r.categoria) {
    case 'entregas1': return r.nome;
    case 'visitantes': return r.nomeEmpresa;
    case 'prestadores': return r.nomeEmpresa;
    case 'pesagem': return r.motorista;
    case 'entregas2': return r.motorista;
    case 'coleta': return r.motorista;
    case 'movimentacao': return r.nomeColaborador;
    case 'correspondencias': return r.destinatario;
  }
}

function parseDate(d: string): Date {
  if (!d) return new Date(0);
  const parts = d.split('/');
  if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return new Date(d);
}

function formatDateForInput(d: string): string {
  const date = parseDate(d);
  if (isNaN(date.getTime())) return '';
  return format(date, 'yyyy-MM-dd');
}

export default function RelatoriosPage() {
  const { registrosFluxo, veiculos, preAutorizacoes } = useAppStore();

  const [activeTab, setActiveTab] = useState<RelatorioTab>('fluxo');
  const [dateRange, setDateRange] = useState<DateRange>('hoje');
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFluxo | 'todos'>('todos');
  const [departamentoFiltro, setDepartamentoFiltro] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'concluido'>('todos');

  // Date range helper
  const getDateRange = useMemo(() => {
    const hoje = new Date();
    let inicio: Date, fim: Date;
    switch (dateRange) {
      case 'hoje':
        inicio = fim = hoje;
        break;
      case 'ontem':
        inicio = fim = new Date(hoje.getTime() - 86400000);
        break;
      case 'semana':
        inicio = new Date(hoje.getTime() - 7 * 86400000);
        fim = hoje;
        break;
      case 'mes':
        inicio = new Date(hoje.getTime() - 30 * 86400000);
        fim = hoje;
        break;
      case 'personalizado':
        inicio = new Date(dataInicio);
        fim = new Date(dataFim);
        break;
      default:
        inicio = fim = hoje;
    }
    return { inicio, fim };
  }, [dateRange, dataInicio, dataFim]);

  // ── FLUXO ──
  const fluxoFiltered = useMemo(() => {
    return registrosFluxo.filter(r => {
      if (categoriaFiltro !== 'todos' && r.categoria !== categoriaFiltro) return false;
      if (departamentoFiltro !== 'todos') {
        const dep = 'departamento' in r ? (r as any).departamento : '';
        if (dep !== departamentoFiltro) return false;
      }
      const hasSaida = 'horarioSaida' in r && (r as any).horarioSaida !== '';
      if (statusFiltro === 'pendente' && hasSaida) return false;
      if (statusFiltro === 'concluido' && !hasSaida) return false;
      return true;
    });
  }, [registrosFluxo, categoriaFiltro, departamentoFiltro, statusFiltro]);

  const fluxoStats = useMemo(() => {
    const entradas = fluxoFiltered.length;
    const saidas = fluxoFiltered.filter(r => 'horarioSaida' in r && (r as any).horarioSaida !== '').length;
    const pendentes = entradas - saidas;
    const byCategory = CATEGORIAS_FLUXO.map(cat => ({
      label: cat.label,
      value: fluxoFiltered.filter(r => r.categoria === cat.value).length,
    })).filter(c => c.value > 0);
    return { entradas, saidas, pendentes, byCategory };
  }, [fluxoFiltered]);

  // ── VEÍCULOS ──
  const veiculosStats = useMemo(() => {
    const total = veiculos.length;
    const estacionados = veiculos.filter(v => !v.horarioSaida).length;
    const byTipo = (['Visitante', 'Prestador', 'Entregador', 'Colaborador'] as const).map(tipo => ({
      label: tipo,
      value: veiculos.filter(v => v.tipo === tipo).length,
    })).filter(t => t.value > 0);
    const vagasOcupadas = veiculos.filter(v => !v.horarioSaida && v.vaga).map(v => v.vaga);
    return { total, estacionados, byTipo, vagasOcupadas };
  }, [veiculos]);

  // ── CORRESPONDÊNCIAS ──
  const correspondenciasFiltered = useMemo(() => {
    return registrosFluxo.filter(r => r.categoria === 'correspondencias');
  }, [registrosFluxo]);

  const corrStats = useMemo(() => {
    const total = correspondenciasFiltered.length;
    const retirados = correspondenciasFiltered.filter(r => (r as any).horarioSaida !== '').length;
    const pendentes = total - retirados;
    const byDepartamento = OPCOES_DEPARTAMENTOS.map(dep => ({
      label: dep,
      value: correspondenciasFiltered.filter(r => (r as any).departamento === dep).length,
    })).filter(d => d.value > 0);
    return { total, retirados, pendentes, byDepartamento };
  }, [correspondenciasFiltered]);

  // ── PRÉ-AUTORIZAÇÃO ──
  const paStats = useMemo(() => {
    const total = preAutorizacoes.length;
    const byStatus = (['agendado', 'confirmado', 'cancelado', 'expirado'] as const).map(s => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: preAutorizacoes.filter(p => p.status === s).length,
    }));
    return { total, byStatus };
  }, [preAutorizacoes]);

  // ── EXPORT ──
  const handleExportCSV = () => {
    let csv = '';
    if (activeTab === 'fluxo') {
      csv = 'Categoria,Nome Principal,Data,Entrada,Saída\n';
      fluxoFiltered.forEach(r => {
        csv += `${CATEGORIAS_FLUXO.find(c => c.value === r.categoria)?.label || r.categoria},"${getMainField(r)}",${'data' in r ? (r as any).data : ''},${'horarioEntrada' in r ? (r as any).horarioEntrada : ''},${'horarioSaida' in r ? (r as any).horarioSaida : 'Pendente'}\n`;
      });
    } else if (activeTab === 'veiculos') {
      csv = 'Placa,Modelo,Cor,Tipo,Motorista,Empresa,Vaga,Data,Entrada,Saída\n';
      veiculos.forEach(v => {
        csv += `${v.placa},"${v.modelo}",${v.cor},${v.tipo},"${v.motoristaNome}","${v.empresa}",${v.vaga},${v.data},${v.horarioEntrada},${v.horarioSaida || 'Estacionado'}\n`;
      });
    } else if (activeTab === 'correspondencias') {
      csv = 'Destinatário,Remetente,Tipo,Departamento,Data,Entrada,Retirada,Quem Retirou\n';
      correspondenciasFiltered.forEach(r => {
        const c = r as any;
        csv += `"${c.destinatario}","${c.remetente}",${c.tipo},${c.departamento},${c.data},${c.horarioEntrada},${c.horarioSaida || 'Pendente'},"${c.quemRetirou || '-'}"\n`;
      });
    } else {
      csv = 'Visitante,Documento,Empresa,Departamento,Autorizado Por,Data Prevista,Horário,Status\n';
      preAutorizacoes.forEach(p => {
        csv += `"${p.visitanteNome}",${p.visitanteDoc},"${p.visitanteEmpresa}",${p.departamento},"${p.autorizadoPor}",${p.dataPrevista},${p.horarioPrevisto},${p.status}\n`;
      });
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  const handlePrint = () => window.print();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Relatórios Avançados</h2>
        <p className="text-sm text-muted-foreground">Filtre, analise e exporte dados</p>
      </div>

      {/* Tabs de tipo de relatório */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as RelatorioTab)}>
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="fluxo" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><ArrowRightLeft className="h-3.5 w-3.5 mr-1" />Fluxo</TabsTrigger>
          <TabsTrigger value="veiculos" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Car className="h-3.5 w-3.5 mr-1" />Veículos</TabsTrigger>
          <TabsTrigger value="correspondencias" className="text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white"><Mail className="h-3.5 w-3.5 mr-1" />Corresp.</TabsTrigger>
          <TabsTrigger value="pre-autorizacao" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white"><UserCheck className="h-3.5 w-3.5 mr-1" />Pré-Auth</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── FLUXO ── */}
      {activeTab === 'fluxo' && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Filter className="h-4 w-4" />Filtros</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Período</Label>
                  <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="semana">Última Semana</SelectItem>
                      <SelectItem value="mes">Último Mês</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dateRange === 'personalizado' && (
                  <>
                    <div className="space-y-1"><Label className="text-xs">Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-9 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-9 text-sm" /></div>
                  </>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={categoriaFiltro} onValueChange={v => setCategoriaFiltro(v as CategoriaFluxo | 'todos')}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {CATEGORIAS_FLUXO.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Departamento</Label>
                  <Select value={departamentoFiltro} onValueChange={v => setDepartamentoFiltro(v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {OPCOES_DEPARTAMENTOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFiltro} onValueChange={v => setStatusFiltro(v as typeof statusFiltro)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="concluido">Concluídos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Entradas</p><p className="text-2xl font-bold text-emerald-600">{fluxoStats.entradas}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Saídas</p><p className="text-2xl font-bold text-teal-600">{fluxoStats.saidas}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-amber-600">{fluxoStats.pendentes}</p></CardContent></Card>
          </div>

          {/* Por categoria */}
          {fluxoStats.byCategory.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4" />Por Categoria</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {fluxoStats.byCategory.map(c => (
                    <div key={c.label} className="flex items-center justify-between">
                      <span className="text-sm">{c.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${fluxoStats.entradas ? (c.value / fluxoStats.entradas) * 100 : 0}%` }} /></div>
                        <span className="text-sm font-medium w-8 text-right">{c.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fluxoFiltered.slice(0, 20).map(r => {
              const catLabel = CATEGORIAS_FLUXO.find(c => c.value === r.categoria)?.label || r.categoria;
              const hasSaida = 'horarioSaida' in r && (r as any).horarioSaida !== '';
              const Icon = catIcons[r.categoria];
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="font-semibold text-sm truncate">{getMainField(r)}</span><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{catLabel}</Badge></div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{'data' in r ? (r as any).data : ''}</span>
                          <span>{'horarioEntrada' in r ? (r as any).horarioEntrada : ''}</span>
                          {hasSaida && <span className="text-emerald-600">{(r as any).horarioSaida}</span>}
                        </div>
                      </div>
                      {hasSaida ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">OK</Badge> : <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">Pend.</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ── VEÍCULOS ── */}
      {activeTab === 'veiculos' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold text-blue-600">{veiculosStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Estacionados</p><p className="text-2xl font-bold text-amber-600">{veiculosStats.estacionados}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Saíram</p><p className="text-2xl font-bold text-emerald-600">{veiculosStats.total - veiculosStats.estacionados}</p></CardContent></Card>
          </div>
          {veiculosStats.byTipo.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4" />Por Tipo</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {veiculosStats.byTipo.map(t => (
                    <div key={t.label} className="flex items-center justify-between">
                      <span className="text-sm">{t.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${veiculosStats.total ? (t.value / veiculosStats.total) * 100 : 0}%` }} /></div>
                        <span className="text-sm font-medium w-8 text-right">{t.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {veiculosStats.vagasOcupadas.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Vagas Ocupadas</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {veiculosStats.vagasOcupadas.map(v => <Badge key={v} className="bg-blue-100 text-blue-700">{v}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── CORRESPONDÊNCIAS ── */}
      {activeTab === 'correspondencias' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold text-amber-600">{corrStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Retirados</p><p className="text-2xl font-bold text-emerald-600">{corrStats.retirados}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-red-600">{corrStats.pendentes}</p></CardContent></Card>
          </div>
          {corrStats.byDepartamento.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />Pendências por Departamento</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {corrStats.byDepartamento.map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-sm">{d.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: `${corrStats.total ? (d.value / corrStats.total) * 100 : 0}%` }} /></div>
                        <span className="text-sm font-medium w-8 text-right">{d.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── PRÉ-AUTORIZAÇÃO ── */}
      {activeTab === 'pre-autorizacao' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold text-purple-600">{paStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Agendados</p><p className="text-2xl font-bold text-amber-600">{preAutorizacoes.filter(p => p.status === 'agendado').length}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4" />Por Status</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {paStats.byStatus.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${paStats.total ? (s.value / paStats.total) * 100 : 0}%` }} /></div>
                      <span className="text-sm font-medium w-8 text-right">{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Export buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><Download className="h-4 w-4" /><span className="text-sm font-medium">Exportar Dados</span></div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
              <Table className="h-4 w-4 mr-2" />Exportar CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
