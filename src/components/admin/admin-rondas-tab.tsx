'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Map as MapIcon,
  Trash2,
  Edit2,
  X,
  MapPin,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ModalNovaRota } from '@/components/modais-rota';
import { RotaGeoreferenciada, Ronda, PontoRonda } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function AdminRondasTab() {
  const { rotasGeoreferenciadas, removeRotaGeoreferenciada, postos, user, rondas, addRonda } =
    useAppStore();
  const [showNovaRota, setShowNovaRota] = useState(false);
  const [rotaEditar, setRotaEditar] = useState<RotaGeoreferenciada | null>(null);

  // Sub-navegação interna
  const [subTab, setSubTab] = useState<'rotas' | 'registros' | 'calendario'>('rotas');

  // Modal de Ronda Avulsa
  const [modalAvulsaOpen, setModalAvulsaOpen] = useState(false);
  const [selectedRotaId, setSelectedRotaId] = useState<string>('');

  // Filtros Globais
  const [filtroPosto, setFiltroPosto] = useState<string>('todos');
  const [filtroRota, setFiltroRota] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const getPostoNome = (postoId?: string) => {
    if (!postoId) return 'Não atribuído';
    return postos.find((p) => p.id === postoId)?.nome ?? 'Não atribuído';
  };

  const rotasOpcoes = rotasGeoreferenciadas.filter((r) =>
    user?.postoId
      ? r.postoId === user.postoId
      : filtroPosto !== 'todos'
      ? r.postoId === filtroPosto
      : true
  );

  const rotasFiltradas = rotasGeoreferenciadas.filter((rota) => {
    if (user?.postoId && rota.postoId !== user.postoId) return false;
    if (!user?.postoId && filtroPosto !== 'todos' && rota.postoId !== filtroPosto) return false;
    return true;
  });

  const rondasFiltradas = rondas.filter((ronda) => {
    if (user?.postoId && ronda.postoId !== user.postoId) return false;
    if (!user?.postoId && filtroPosto !== 'todos' && ronda.postoId !== filtroPosto) return false;
    if (filtroRota !== 'todas' && ronda.rotaId !== filtroRota) return false;
    if (filtroStatus !== 'todos' && ronda.status !== filtroStatus) return false;
    return true;
  });

  const getStatusLabel = (status: Ronda['status']) =>
    ({ em_andamento: 'Em Andamento', concluida: 'Concluída', parcial: 'Parcial' }[status] || status);

  const getStatusColor = (status: Ronda['status']) =>
    ({
      em_andamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      concluida: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      parcial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    }[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300');

  const handleCriarRondaAvulsa = () => {
    if (!selectedRotaId) return;
    const rota = rotasGeoreferenciadas.find((r) => r.id === selectedRotaId);
    if (!rota) return;

    const hoje = new Date();
    const dataFormatada = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const id = `rn_${Date.now()}_${rota.id}`;

    const pontos: PontoRonda[] = rota.pontos.map((p, idx) => ({
      id: `pt_${Date.now()}_${idx}`,
      rondaId: id,
      ponto: p.nome,
      horarioPrevisto: p.horarioExecucao,
      horarioReal: '',
      status: 'ok',
      observacao: '',
      latitude: p.latitude,
      longitude: p.longitude,
      raio: p.raio,
    }));

    const novaRonda: Ronda = {
      id,
      rota: rota.nome,
      rotaId: rota.id,
      postoId: rota.postoId,
      data: dataFormatada,
      horarioInicio: '',
      horarioFim: '',
      status: 'em_andamento',
      porteiro: 'A Definir',
      pontos,
      recorrente: false,
    };

    addRonda(novaRonda);
    setModalAvulsaOpen(false);
    setSelectedRotaId('');
    setSubTab('registros');
  };

  // --- Calendário ---
  const today = new Date();
  const [mesAtual, setMesAtual] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
  const primeiroDiaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay();
  const diasCalendario = Array.from({ length: diasNoMes }, (_, i) => {
    return new Date(mesAtual.getFullYear(), mesAtual.getMonth(), i + 1);
  });

  const isHoje = (data: Date) =>
    data.getDate() === today.getDate() &&
    data.getMonth() === today.getMonth() &&
    data.getFullYear() === today.getFullYear();

  const formatDateString = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getStatusDia = (data: Date) => {
    const dataStr = formatDateString(data);
    const rondasDoDia = rondasFiltradas.filter((r) => r.data === dataStr);
    if (rondasDoDia.length === 0) return 'nenhuma';
    const temNaoConcluida = rondasDoDia.some(
      (r) =>
        r.status === 'parcial' ||
        (r.status === 'em_andamento' &&
          data < new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    );
    const todasConcluidas = rondasDoDia.every((r) => r.status === 'concluida');
    if (temNaoConcluida) return 'vermelho';
    if (todasConcluidas) return 'verde';
    return 'cinza';
  };

  const rondasDiaSelecionado = diaSelecionado
    ? rondasFiltradas.filter((r) => r.data === diaSelecionado)
    : [];

  const formatarDataExibicao = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-Abas */}
      <div className="flex bg-muted/50 p-1 rounded-lg">
        {(['rotas', 'registros', 'calendario'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              subTab === tab
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {tab === 'rotas' ? 'Rotas' : tab === 'registros' ? 'Registros' : 'Calendário'}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        {!user?.postoId && (
          <div className="flex-1">
            <Select value={filtroPosto} onValueChange={setFiltroPosto}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Filtrar por Posto" />
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
          </div>
        )}

        {subTab !== 'rotas' && (
          <div className="flex-1">
            <Select value={filtroRota} onValueChange={setFiltroRota}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Filtrar por Rota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Rotas</SelectItem>
                {rotasOpcoes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {subTab !== 'rotas' && (
          <div className="flex-1">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="parcial">Parcial / Falha</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sub-aba: Rotas */}
      {subTab === 'rotas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Rotas de Ronda</h2>
            <button
              onClick={() => setShowNovaRota(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Rota
            </button>
          </div>

          <div className="space-y-3">
            {rotasFiltradas.map((rota) => (
              <div
                key={rota.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MapIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{rota.nome}</span>
                    <p className="text-xs text-muted-foreground">
                      {rota.pontos.length} pontos | Posto: {getPostoNome(rota.postoId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotaEditar(rota)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeRotaGeoreferenciada(rota.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {rotasFiltradas.length === 0 && (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
                <MapIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhuma rota cadastrada.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-aba: Registros */}
      {subTab === 'registros' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Registros de Ronda</h2>
            <button
              onClick={() => setModalAvulsaOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              Ronda Avulsa
            </button>
          </div>

          <div className="space-y-3">
            {rondasFiltradas.map((ronda) => (
              <div
                key={ronda.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ronda.rota}</span>
                      <Badge className={getStatusColor(ronda.status)}>
                        {getStatusLabel(ronda.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ronda.data} • {ronda.porteiro} • Posto: {getPostoNome(ronda.postoId)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ronda.pontos.filter((p) => p.horarioReal).length}/{ronda.pontos.length} pontos verificados
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {rondasFiltradas.length === 0 && (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhum registro de ronda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-aba: Calendário */}
      {subTab === 'calendario' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Calendário
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
                  setDiaSelecionado(null);
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-medium min-w-[120px] text-center capitalize">
                {mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
                  setDiaSelecionado(null);
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 min-h-[64px]" />
              ))}

              {diasCalendario.map((dia) => {
                const status = getStatusDia(dia);
                const dateStr = formatDateString(dia);
                const isSelected = diaSelecionado === dateStr;
                const rondasCount = rondasFiltradas.filter((r) => r.data === dateStr).length;

                let bgColor = 'bg-muted/20 border-transparent hover:border-muted-foreground/30';
                let dotColor = '';
                const textColor = isHoje(dia) ? 'text-primary font-bold' : 'text-foreground';

                if (status === 'verde') {
                  bgColor =
                    'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400';
                  dotColor = 'bg-emerald-500';
                } else if (status === 'vermelho') {
                  bgColor =
                    'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-400';
                  dotColor = 'bg-red-500';
                } else if (status === 'cinza') {
                  bgColor =
                    'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-400';
                  dotColor = 'bg-gray-400';
                }

                return (
                  <button
                    key={dia.toISOString()}
                    onClick={() => setDiaSelecionado(isSelected ? null : dateStr)}
                    className={`p-2 min-h-[64px] border-2 rounded-xl transition-all relative text-left w-full
                      ${bgColor}
                      ${isHoje(dia) ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-background scale-95' : 'hover:scale-95'}
                    `}
                  >
                    <span className={`text-sm ${textColor}`}>{dia.getDate()}</span>
                    {rondasCount > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {Array.from({ length: Math.min(rondasCount, 3) }).map((_, i) => (
                          <div key={i} className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        ))}
                        {rondasCount > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{rondasCount - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground justify-end flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" /> Todas Concluídas
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" /> Falha / Parcial
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400" /> Pendente / Futuro
              </div>
            </div>
          </div>

          <AnimatePresence>
            {diaSelecionado && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Rondas do dia
                    </p>
                    <h3 className="font-bold text-base capitalize mt-0.5">
                      {formatarDataExibicao(diaSelecionado)}
                    </h3>
                  </div>
                  <button
                    onClick={() => setDiaSelecionado(null)}
                    className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {rondasDiaSelecionado.length === 0 ? (
                  <div className="p-8 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ronda registrada neste dia.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {rondasDiaSelecionado.map((ronda) => {
                      const pontosVerificados = ronda.pontos.filter((p) => p.horarioReal).length;
                      const totalPontos = ronda.pontos.length;
                      const progresso =
                        totalPontos > 0 ? (pontosVerificados / totalPontos) * 100 : 0;
                      const irregularidades = ronda.pontos.filter(
                        (p) => p.status === 'irregularidade'
                      ).length;

                      return (
                        <div key={ronda.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`p-1.5 rounded-lg ${
                                  ronda.status === 'concluida'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                    : ronda.status === 'parcial'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}
                              >
                                <Navigation
                                  className={`h-4 w-4 ${
                                    ronda.status === 'concluida'
                                      ? 'text-emerald-600'
                                      : ronda.status === 'parcial'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{ronda.rota}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getPostoNome(ronda.postoId)}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(ronda.status)}>
                              {getStatusLabel(ronda.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/40 rounded-lg p-2.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                Porteiro
                              </p>
                              <p className="text-sm font-medium mt-0.5">{ronda.porteiro}</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-2.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                Horário
                              </p>
                              <p className="text-sm font-medium mt-0.5">
                                {ronda.horarioInicio || '--:--'}
                                {ronda.horarioFim ? ` → ${ronda.horarioFim}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {pontosVerificados}/{totalPontos} pontos verificados
                              </span>
                              {irregularidades > 0 && (
                                <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                                  ⚠️ {irregularidades} irregularidade
                                  {irregularidades > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${progresso}%`,
                                  backgroundColor: progresso === 100 ? '#10b981' : '#f59e0b',
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Pontos da Ronda
                            </p>
                            <div className="bg-muted/30 rounded-lg divide-y divide-border/50">
                              {ronda.pontos.map((ponto) => (
                                <div
                                  key={ponto.id}
                                  className="flex items-center justify-between px-3 py-2 gap-3"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {ponto.horarioReal ? (
                                      <div
                                        className={`h-2 w-2 rounded-full shrink-0 ${
                                          ponto.status === 'irregularidade'
                                            ? 'bg-red-500'
                                            : 'bg-emerald-500'
                                        }`}
                                      />
                                    ) : (
                                      <div className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30 border border-muted-foreground/30" />
                                    )}
                                    <span className="text-xs truncate">{ponto.ponto}</span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {ponto.horarioReal ? (
                                      <span
                                        className={`text-xs font-medium ${
                                          ponto.status === 'irregularidade'
                                            ? 'text-red-600'
                                            : 'text-emerald-600'
                                        }`}
                                      >
                                        {ponto.horarioReal}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground/60">
                                        Previsto: {ponto.horarioPrevisto || '--:--'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {ronda.pontos.some((p) => p.observacao && p.observacao.trim()) && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Observações
                              </p>
                              <div className="space-y-1">
                                {ronda.pontos
                                  .filter((p) => p.observacao && p.observacao.trim())
                                  .map((p) => (
                                    <div
                                      key={p.id}
                                      className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5"
                                    >
                                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                                        {p.ponto}
                                      </p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                                        {p.observacao}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modais de Rota */}
      <AnimatePresence>
        {showNovaRota && <ModalNovaRota onClose={() => setShowNovaRota(false)} />}
        {rotaEditar && (
          <ModalNovaRota onClose={() => setRotaEditar(null)} rotaEditar={rotaEditar} />
        )}
      </AnimatePresence>

      {/* Modal Ronda Avulsa */}
      <Dialog open={modalAvulsaOpen} onOpenChange={setModalAvulsaOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-600" />
              Lançar Ronda Avulsa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione a Rota</Label>
              <Select value={selectedRotaId} onValueChange={setSelectedRotaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma rota..." />
                </SelectTrigger>
                <SelectContent>
                  {rotasFiltradas.map((rota) => (
                    <SelectItem key={rota.id} value={rota.id}>
                      {rota.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRotaId && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg border border-border">
                Uma ronda será gerada imediatamente com a data de hoje e aparecerá na aba "Rondas"
                dos vigias.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalAvulsaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriarRondaAvulsa}
              disabled={!selectedRotaId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Lançar Ronda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
