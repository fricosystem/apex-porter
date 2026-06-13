'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Map as MapIcon, Trash2, Edit2, User, X, Check, EyeOff, Eye, MapPin, Briefcase, CalendarDays, ChevronLeft, ChevronRight, Play, Navigation } from 'lucide-react';
import AdminBottomNav, { AdminTab } from './admin-bottom-nav';
import { useAppStore } from '@/lib/store';
import { ModalNovaRota } from './modais-rota';
import { RotaGeoreferenciada, User as UserType, PageType, Posto, Cargo, Ronda, PontoRonda } from '@/lib/data';
import { signUpWithEmail, getAuthErrorMessage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('painel');

  return (
    <div className="h-full flex flex-col bg-background relative pb-16">
      <div className="flex-1 overflow-y-auto" id="admin-scroll-root">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {currentTab === 'painel' && <AdminPainelTab />}
            {currentTab === 'rondas' && <AdminRondasTab />}
            {currentTab === 'usuarios' && <AdminUsuariosTab />}
            {currentTab === 'postos' && <AdminPostosTab />}
            {currentTab === 'cargos' && <AdminCargosTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AdminBottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

function AdminPainelTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground text-sm">
        Bem-vindo à área administrativa. Selecione uma opção no menu abaixo.
      </p>
    </div>
  );
}

function AdminRondasTab() {
  const { rotasGeoreferenciadas, removeRotaGeoreferenciada, postos, user, rondas, addRonda } = useAppStore();
  const [showNovaRota, setShowNovaRota] = useState(false);
  const [rotaEditar, setRotaEditar] = useState<RotaGeoreferenciada | null>(null);
  
  // Nova navegação interna
  const [subTab, setSubTab] = useState<'rotas' | 'registros' | 'calendario'>('rotas');
  
  // Modal de Ronda Avulsa
  const [modalAvulsaOpen, setModalAvulsaOpen] = useState(false);
  const [selectedRotaId, setSelectedRotaId] = useState<string>('');

  const getPostoNome = (postoId?: string) => {
    if (!postoId) return 'Não atribuído';
    const posto = postos.find(p => p.id === postoId);
    return posto ? posto.nome : 'Não atribuído';
  };

  const rotasFiltradas = rotasGeoreferenciadas.filter(rota => {
    if (!user?.postoId) return true;
    return rota.postoId === user.postoId;
  });

  const rondasFiltradas = rondas.filter(ronda => {
    if (!user?.postoId) return true;
    return ronda.postoId === user.postoId;
  });

  const getStatusLabel = (status: Ronda['status']) => {
    const labels = {
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída',
      'parcial': 'Parcial'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: Ronda['status']) => {
    const colors = {
      'em_andamento': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'concluida': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'parcial': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const handleCriarRondaAvulsa = () => {
    if (!selectedRotaId) return;
    const rota = rotasGeoreferenciadas.find(r => r.id === selectedRotaId);
    if (!rota) return;

    const hoje = new Date();
    // format yyyy-MM-dd
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
      porteiro: 'A Definir', // Pode ser assumida depois
      pontos,
      recorrente: false,
    };

    addRonda(novaRonda);
    setModalAvulsaOpen(false);
    setSelectedRotaId('');
    setSubTab('registros');
  };

  // --- Lógica do Calendário ---
  const today = new Date();
  const [mesAtual, setMesAtual] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
  const primeiroDiaSemana = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay();

  const diasCalendario = Array.from({ length: diasNoMes }, (_, i) => {
    const d = i + 1;
    return new Date(mesAtual.getFullYear(), mesAtual.getMonth(), d);
  });

  const isHoje = (data: Date) => {
    return data.getDate() === today.getDate() && data.getMonth() === today.getMonth() && data.getFullYear() === today.getFullYear();
  };

  const formatDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getStatusDia = (data: Date) => {
    const dataStr = formatDateString(data);
    const rondasDoDia = rondasFiltradas.filter(r => r.data === dataStr);
    if (rondasDoDia.length === 0) return 'nenhuma';
    const temNaoConcluida = rondasDoDia.some(r => r.status === 'parcial' || (r.status === 'em_andamento' && data < new Date(today.getFullYear(), today.getMonth(), today.getDate())));
    const todasConcluidas = rondasDoDia.every(r => r.status === 'concluida');
    if (temNaoConcluida) return 'vermelho';
    if (todasConcluidas) return 'verde';
    return 'cinza';
  };

  const rondasDiaSelecionado = diaSelecionado ? rondasFiltradas.filter(r => r.data === diaSelecionado) : [];
  const formatarDataExibicao = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Navegação de Sub-Abas */}
      <div className="flex bg-muted/50 p-1 rounded-lg">
        <button 
          onClick={() => setSubTab('rotas')} 
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'rotas' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
        >
          Rotas
        </button>
        <button 
          onClick={() => setSubTab('registros')} 
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'registros' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
        >
          Registros
        </button>
        <button 
          onClick={() => setSubTab('calendario')} 
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'calendario' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
        >
          Calendário
        </button>
      </div>

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
            <div key={rota.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MapIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-sm">{rota.nome}</span>
                  <p className="text-xs text-muted-foreground">
                    {rota.pontos.length} pontos cadastrados | Posto: {getPostoNome(rota.postoId)}
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
              <div key={ronda.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
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
                      {ronda.pontos.filter(p => p.horarioReal).length}/{ronda.pontos.length} pontos verificados
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

      {subTab === 'calendario' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Calendário
            </h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1)); setDiaSelecionado(null); }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-medium min-w-[120px] text-center capitalize">
                {mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => { setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1)); setDiaSelecionado(null); }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Espaços vazios antes do dia 1 */}
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 min-h-[64px]" />
              ))}
              
              {/* Dias do Mês */}
              {diasCalendario.map(dia => {
                const status = getStatusDia(dia);
                const dateStr = formatDateString(dia);
                const isSelected = diaSelecionado === dateStr;
                const rondasCount = rondasFiltradas.filter(r => r.data === dateStr).length;
                let bgColor = 'bg-muted/20 border-transparent hover:border-muted-foreground/30';
                let dotColor = '';
                let textColor = 'text-foreground';
                
                if (status === 'verde') {
                  bgColor = 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400';
                  dotColor = 'bg-emerald-500';
                } else if (status === 'vermelho') {
                  bgColor = 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-400';
                  dotColor = 'bg-red-500';
                } else if (status === 'cinza') {
                  bgColor = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-400';
                  dotColor = 'bg-gray-400';
                }
                if (isHoje(dia)) textColor = 'text-primary font-bold';

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
                    <span className={`text-sm ${textColor}`}>
                      {dia.getDate()}
                    </span>
                    {rondasCount > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {Array.from({ length: Math.min(rondasCount, 3) }).map((_, i) => (
                          <div key={i} className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        ))}
                        {rondasCount > 3 && <span className="text-[9px] text-muted-foreground">+{rondasCount - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground justify-end flex-wrap">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Todas Concluídas</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Falha / Parcial</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-400" /> Pendente / Futuro</div>
            </div>
          </div>

          {/* Painel de Detalhes do Dia Selecionado */}
          <AnimatePresence>
            {diaSelecionado && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Header do painel */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rondas do dia</p>
                    <h3 className="font-bold text-base capitalize mt-0.5">{formatarDataExibicao(diaSelecionado)}</h3>
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
                    <p className="text-sm text-muted-foreground">Nenhuma ronda registrada neste dia.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {rondasDiaSelecionado.map((ronda) => {
                      const pontosVerificados = ronda.pontos.filter(p => p.horarioReal).length;
                      const totalPontos = ronda.pontos.length;
                      const progresso = totalPontos > 0 ? (pontosVerificados / totalPontos) * 100 : 0;
                      const irregularidades = ronda.pontos.filter(p => p.status === 'irregularidade').length;

                      return (
                        <div key={ronda.id} className="p-4 space-y-3">
                          {/* Cabeçalho da ronda */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`p-1.5 rounded-lg ${
                                ronda.status === 'concluida' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                ronda.status === 'parcial' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                <Navigation className={`h-4 w-4 ${
                                  ronda.status === 'concluida' ? 'text-emerald-600' :
                                  ronda.status === 'parcial' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{ronda.rota}</p>
                                <p className="text-xs text-muted-foreground">{getPostoNome(ronda.postoId)}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(ronda.status)}>
                              {getStatusLabel(ronda.status)}
                            </Badge>
                          </div>

                          {/* Informações gerais */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/40 rounded-lg p-2.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Porteiro</p>
                              <p className="text-sm font-medium mt-0.5">{ronda.porteiro}</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-2.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Horário</p>
                              <p className="text-sm font-medium mt-0.5">
                                {ronda.horarioInicio || '--:--'}{ronda.horarioFim ? ` → ${ronda.horarioFim}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{pontosVerificados}/{totalPontos} pontos verificados</span>
                              {irregularidades > 0 && (
                                <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                                  ⚠️ {irregularidades} irregularidade{irregularidades > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progresso}%`, backgroundColor: progresso === 100 ? '#10b981' : '#f59e0b' }}
                              />
                            </div>
                          </div>

                          {/* Lista de pontos */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pontos da Ronda</p>
                            <div className="bg-muted/30 rounded-lg divide-y divide-border/50">
                              {ronda.pontos.map((ponto) => (
                                <div key={ponto.id} className="flex items-center justify-between px-3 py-2 gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {ponto.horarioReal ? (
                                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                                        ponto.status === 'irregularidade' ? 'bg-red-500' : 'bg-emerald-500'
                                      }`} />
                                    ) : (
                                      <div className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30 border border-muted-foreground/30" />
                                    )}
                                    <span className="text-xs truncate">{ponto.ponto}</span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {ponto.horarioReal ? (
                                      <span className={`text-xs font-medium ${
                                        ponto.status === 'irregularidade' ? 'text-red-600' : 'text-emerald-600'
                                      }`}>
                                        {ponto.horarioReal}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground/60">Previsto: {ponto.horarioPrevisto || '--:--'}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Observações se houver irregularidades */}
                          {ronda.pontos.some(p => p.observacao && p.observacao.trim()) && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Observações</p>
                              <div className="space-y-1">
                                {ronda.pontos.filter(p => p.observacao && p.observacao.trim()).map(p => (
                                  <div key={p.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5">
                                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">{p.ponto}</p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">{p.observacao}</p>
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

      {/* Modais existentes (Rotas) */}
      <AnimatePresence>
        {showNovaRota && (
          <ModalNovaRota onClose={() => setShowNovaRota(false)} />
        )}
        {rotaEditar && (
          <ModalNovaRota 
            onClose={() => setRotaEditar(null)} 
            rotaEditar={rotaEditar}
          />
        )}
      </AnimatePresence>

      {/* Modal de Nova Ronda Avulsa */}
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
                    <SelectItem key={rota.id} value={rota.id}>{rota.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRotaId && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg border border-border">
                Uma ronda para esta rota será gerada imediatamente com a data de hoje. Ela aparecerá automaticamente na aba "Rondas" dos vigias para execução.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalAvulsaOpen(false)}>Cancelar</Button>
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

function AdminUsuariosTab() {
  const { usuarios, updateUsuario, addUsuario, postos } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNovoUsuario = () => {
    // Quando criar novo usuário, passamos null para o ModalUsuario
    setUsuarioSelecionado(null);
    setError(null);
    setModalOpen(true);
  };

  const handleEditarUsuario = (usuario: UserType) => {
    setUsuarioSelecionado(usuario);
    setError(null);
    setModalOpen(true);
  };

  const handleSalvarUsuario = async (usuario: UserType, senha?: string) => {
    const existe = usuarios.find(u => u.id === usuario.id);
    if (existe) {
      // If we have a new password, add it to the user object
      const usuarioToSave = senha ? { ...usuario, senha } : usuario;
      updateUsuario(usuarioToSave);
      setModalOpen(false);
      setUsuarioSelecionado(null);
    } else {
      if (!senha) {
        setError('Senha é obrigatória para criar um novo colaborador');
        return;
      }
      try {
        const firebaseUser = await signUpWithEmail(usuario.nome, usuario.email, senha, usuario.cargo);
        addUsuario({ 
          ...usuario, 
          id: firebaseUser.uid, 
          dataCadastro: new Date().toISOString(),
          ativo: true,
          senha
        });
        setModalOpen(false);
        setUsuarioSelecionado(null);
        setError(null);
      } catch (err: any) {
        setError(getAuthErrorMessage(err?.code || 'auth/default'));
      }
    }
  };

  const getPostoNome = (postoId?: string) => {
    if (!postoId) return 'Não atribuído';
    const posto = postos.find(p => p.id === postoId);
    return posto ? posto.nome : 'Não atribuído';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gerenciar Colaboradores</h2>
        <button
          onClick={handleNovoUsuario}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {usuarios.map((usuario) => (
          <div 
            key={usuario.id} 
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleEditarUsuario(usuario)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{usuario.nome}</span>
                  {usuario.ativo ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-500">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{usuario.email}</p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {usuario.cargo && (
                    <span className="text-xs text-muted-foreground">{usuario.cargo}</span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getPostoNome(usuario.postoId)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditarUsuario(usuario); }}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {usuarios.length === 0 && (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
          </div>
        )}
      </div>

      <ModalUsuario 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setUsuarioSelecionado(null); }} 
        usuario={usuarioSelecionado}
        onSalvar={handleSalvarUsuario}
        error={error}
        setError={setError}
      />
    </div>
  );
}

interface ModalUsuarioProps {
  open: boolean;
  onClose: () => void;
  usuario: UserType | null;
  onSalvar: (usuario: UserType, senha?: string) => void;
  error?: string | null;
  setError?: (error: string | null) => void;
  loading?: boolean;
}

function ModalUsuario({ open, onClose, usuario, onSalvar, error, setError, loading: externalLoading }: ModalUsuarioProps) {
  const { usuarios, postos, cargos } = useAppStore();
  const [formData, setFormData] = useState<UserType | null>(null);
  const [senha, setSenha] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  // Permissões padrão para PORTEIRO
  const PERMISSOES_PORTEIRO = [
    'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes', 
    'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais', 
    'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes'
  ];

  useEffect(() => {
    if (usuario) {
      const cargo = (usuario.cargo || '').toUpperCase();
      setFormData({
        ...usuario,
        ativo: usuario.ativo ?? true,
        permissoes: usuario.permissoes || (cargo === 'PORTEIRO' ? PERMISSOES_PORTEIRO : [])
      });
    } else {
      // Novo usuário - padrão PORTEIRO
      setFormData({
        id: '',
        nome: '',
        email: '',
        cargo: 'PORTEIRO',
        ativo: true,
        permissoes: PERMISSOES_PORTEIRO
      });
      setSenha('');
    }
  }, [usuario]);

  if (!formData) return null;

  const handleTogglePermissao = (pagina: PageType) => {
    setFormData(prev => {
      if (!prev) return prev;
      const permissoes = prev.permissoes.includes(pagina)
        ? prev.permissoes.filter(p => p !== pagina)
        : [...prev.permissoes, pagina];
      return { ...prev, permissoes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setError) setError(null);
    setInternalLoading(true);
    try {
      await onSalvar(formData, senha || undefined);
    } finally {
      setInternalLoading(false);
    }
  };

  const paginas: PageType[] = [
    'dashboard', 'fluxo', 'correspondencias', 'veiculos', 'pre-autorizacao',
    'relatorios', 'cadastros', 'avisos', 'lista-negra', 'achados-perdidos',
    'ocorrencias', 'ronda', 'checklist-turno', 'inspecao-diaria',
    'protocolos-emergencia', 'configuracoes', 'perfil', 'lembretes', 'admin'
  ];

  const paginaLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'fluxo': 'Fluxo',
    'correspondencias': 'Correspondências',
    'veiculos': 'Veículos',
    'pre-autorizacao': 'Pré-autorização',
    'relatorios': 'Relatórios',
    'cadastros': 'Cadastros',
    'avisos': 'Avisos',
    'lista-negra': 'Lista Negra',
    'achados-perdidos': 'Achados e Perdidos',
    'ocorrencias': 'Ocorrências',
    'ronda': 'Ronda',
    'checklist-turno': 'Checklist de Turno',
    'inspecao-diaria': 'Inspeção Diária',
    'protocolos-emergencia': 'Protocolos de Emergência',
    'configuracoes': 'Configurações',
    'perfil': 'Perfil',
    'lembretes': 'Lembretes',
    'admin': 'Admin'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] max-w-full p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {usuario && usuarios.find(u => u.id === usuario.id) ? 'Editar Colaborador' : 'Novo Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/30">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => prev ? { ...prev, nome: e.target.value } : prev)}
              placeholder="Nome completo do colaborador"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => prev ? { ...prev, email: e.target.value } : prev)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Select
              value={formData.cargo || ''}
              onValueChange={(value) => setFormData(prev => prev ? { ...prev, cargo: value } : prev)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {cargos.filter(c => c.ativo).map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.nome}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={usuario ? "Nova senha (opcional)" : "Senha para o novo colaborador"}
              required={!usuario}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posto">Posto</Label>
            <Select
              value={formData.postoId || ''}
              onValueChange={(value) => setFormData(prev => prev ? { ...prev, postoId: value || undefined } : prev)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um posto" />
              </SelectTrigger>
              <SelectContent>
                {postos.map((posto) => (
                  <SelectItem key={posto.id} value={posto.id}>
                    {posto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => prev ? { ...prev, ativo: checked } : prev)}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Usuário Ativo</Label>
            </div>
            {formData.ativo ? (
              <Badge variant="default" className="bg-emerald-500">Ativo</Badge>
            ) : (
              <Badge variant="destructive">Inativo</Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissões</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormData(prev => prev ? { ...prev, permissoes: paginas } : prev)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormData(prev => prev ? { ...prev, permissoes: [] } : prev)}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Nenhum
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 bg-muted/30">
              {paginas.map((pagina) => (
                <div key={pagina} className="flex items-center gap-2">
                  <Switch
                    id={`permissao-${pagina}`}
                    checked={formData.permissoes.includes(pagina)}
                    onCheckedChange={() => handleTogglePermissao(pagina)}
                  />
                  <Label
                    htmlFor={`permissao-${pagina}`}
                    className="text-xs cursor-pointer"
                  >
                    {paginaLabels[pagina]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminCargosTab() {
  const { cargos, addCargo, updateCargo, removeCargo } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [cargoEditar, setCargoEditar] = useState<Cargo | null>(null);

  const handleNovoCargo = () => {
    setCargoEditar(null);
    setShowModal(true);
  };

  const handleEditarCargo = (cargo: Cargo) => {
    setCargoEditar(cargo);
    setShowModal(true);
  };

  const handleSalvarCargo = (cargo: Cargo) => {
    if (cargos.find(c => c.id === cargo.id)) {
      updateCargo(cargo);
    } else {
      addCargo(cargo);
    }
    setShowModal(false);
    setCargoEditar(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gerenciar Cargos</h2>
        <button
          onClick={handleNovoCargo}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Cargo
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {cargos.map((cargo) => (
          <div key={cargo.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{cargo.nome}</span>
                  {cargo.ativo ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-500">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditarCargo(cargo)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeCargo(cargo.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {cargos.length === 0 && (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum cargo cadastrado.</p>
          </div>
        )}
      </div>

      <ModalCargo
        open={showModal}
        onClose={() => { setShowModal(false); setCargoEditar(null); }}
        cargo={cargoEditar}
        onSalvar={handleSalvarCargo}
      />
    </div>
  );
}

interface ModalCargoProps {
  open: boolean;
  onClose: () => void;
  cargo: Cargo | null;
  onSalvar: (cargo: Cargo) => void;
}

function ModalCargo({ open, onClose, cargo, onSalvar }: ModalCargoProps) {
  const { cargos } = useAppStore();
  const [formData, setFormData] = useState<Cargo>({
    id: '',
    nome: '',
    ativo: true,
  });

  useEffect(() => {
    if (cargo) {
      setFormData(cargo);
    } else {
      setFormData({
        id: `cargo-${Date.now()}`,
        nome: '',
        ativo: true,
      });
    }
  }, [cargo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] max-w-full p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {cargo && cargos.find(c => c.id === cargo.id) ? 'Editar Cargo' : 'Novo Cargo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Cargo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Porteiro"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Cargo Ativo</Label>
            </div>
            {formData.ativo ? (
              <Badge variant="default" className="bg-emerald-500">Ativo</Badge>
            ) : (
              <Badge variant="destructive">Inativo</Badge>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminPostosTab() {
  const { postos, addPosto, updatePosto, removePosto } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [postoEditar, setPostoEditar] = useState<Posto | null>(null);

  const handleNovoPosto = () => {
    setPostoEditar(null);
    setShowModal(true);
  };

  const handleEditarPosto = (posto: Posto) => {
    setPostoEditar(posto);
    setShowModal(true);
  };

  const handleSalvarPosto = (posto: Posto) => {
    if (postos.find(p => p.id === posto.id)) {
      updatePosto(posto);
    } else {
      addPosto(posto);
    }
    setShowModal(false);
    setPostoEditar(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gerenciar Postos</h2>
        <button
          onClick={handleNovoPosto}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Posto
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {postos.map((posto) => (
          <div key={posto.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{posto.nome}</span>
                  {posto.ativo ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-500">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditarPosto(posto)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => removePosto(posto.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {postos.length === 0 && (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum posto cadastrado.</p>
          </div>
        )}
      </div>

      <ModalPosto
        open={showModal}
        onClose={() => { setShowModal(false); setPostoEditar(null); }}
        posto={postoEditar}
        onSalvar={handleSalvarPosto}
      />
    </div>
  );
}

interface ModalPostoProps {
  open: boolean;
  onClose: () => void;
  posto: Posto | null;
  onSalvar: (posto: Posto) => void;
}

function ModalPosto({ open, onClose, posto, onSalvar }: ModalPostoProps) {
  const { postos } = useAppStore();
  const [formData, setFormData] = useState<Posto>({
    id: '',
    nome: '',
    ativo: true,
  });

  useEffect(() => {
    if (posto) {
      setFormData(posto);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        nome: '',
        ativo: true,
      });
    }
  }, [posto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] max-w-full p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {posto && postos.find(p => p.id === posto.id) ? 'Editar Posto' : 'Novo Posto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Posto</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Portaria Principal"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Posto Ativo</Label>
            </div>
            {formData.ativo ? (
              <Badge variant="default" className="bg-emerald-500">Ativo</Badge>
            ) : (
              <Badge variant="destructive">Inativo</Badge>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
