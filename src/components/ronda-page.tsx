'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus, Search, Inbox, Clock, MapPin, Shield, Eye, Trash2,
  CheckCircle2, AlertTriangle, Play, ChevronDown, ChevronUp,
  Navigation, Timer, User, CalendarDays,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Load map dynamically to avoid SSR issues
const RotaMap = dynamic(() => import('./rota-map'), { ssr: false, loading: () => <div className="h-64 w-full bg-muted/50 rounded-xl flex items-center justify-center">Carregando mapa...</div> });
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import {
  ROTAS_RONDA, PONTOS_RONDA_PREDEFINIDOS,
  type Ronda, type PontoRonda, type StatusRonda, type RotaGeoreferenciada,
} from '@/lib/data';
import { toast } from 'sonner';

type StatusFilter = 'todas' | 'em_andamento' | 'concluida' | 'parcial';

const statusLabels: Record<StatusRonda, string> = {
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  parcial: 'Parcial',
};

const statusColors: Record<StatusRonda, string> = {
  em_andamento: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  concluida: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  parcial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const statusIcons: Record<StatusRonda, React.ElementType> = {
  em_andamento: Timer,
  concluida: CheckCircle2,
  parcial: AlertTriangle,
};

function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getWeekNumber(d: Date): number {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  return weekNo;
}

function getDayName(date: Date): string {
  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return days[date.getDay()];
}

const diaLabels: Record<string, string> = {
  dom: 'Dom',
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb'
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in m
  return d;
}

function isTimeValidForCheckin(horarioPrevisto: string): boolean {
  if (!horarioPrevisto) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = horarioPrevisto.split(':').map(Number);
  const previstoMinutes = h * 60 + m;
  
  // Available from 5 minutes before
  return currentMinutes >= (previstoMinutes - 5);
}

function getPontosForRota(rotaIndex: number): string[] {
  const offsets = [0, 6, 10, 6];
  const start = offsets[rotaIndex] || 0;
  return PONTOS_RONDA_PREDEFINIDOS.slice(start, start + 6);
}

function generatePontos(rondaId: string, rota: string): PontoRonda[] {
  const rotaIndex = ROTAS_RONDA.indexOf(rota);
  const pontos = getPontosForRota(rotaIndex >= 0 ? rotaIndex : 0);
  const now = new Date();
  const baseMinutes = now.getHours() * 60 + now.getMinutes();

  return pontos.map((ponto, idx) => {
    const scheduled = baseMinutes + idx * 10;
    const hours = Math.floor(scheduled / 60) % 24;
    const mins = scheduled % 60;
    return {
      id: `pt_${Date.now()}_${idx}`,
      rondaId,
      ponto,
      horarioPrevisto: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
      horarioReal: '',
      status: 'ok' as const,
      observacao: '',
    };
  });
}

export default function RondaPage() {
  const { rondas, addRonda, updateRonda, removeRonda, user, rotasGeoreferenciadas, updateUser } = useAppStore();

  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New ronda modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRota, setSelectedRota] = useState('');
  
  // Map config from user profile
  const isSatellite = user?.mapconfig === 'satelite';
  const setIsSatellite = (value: boolean) => {
    updateUser({ mapconfig: value ? 'satelite' : 'padrao' });
  };

  // Detail modal (read-only)
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRonda, setSelectedRonda] = useState<Ronda | null>(null);

  // Execution modal
  const [executionOpen, setExecutionOpen] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [rondaIniciada, setRondaIniciada] = useState(false);
  
  // Confirmation modal for finalizing ronda
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  
  // Confirmation modal for deleting ronda
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Watch position
  useEffect(() => {
    if (!executionOpen) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
      },
      (err) => console.error('Error watching position', err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [executionOpen]);

  // Auto-create daily recurring rondas
  useEffect(() => {
    const today = new Date();
    const dateString = format(today, 'yyyy-MM-dd');
    const todayDay = getDayName(today);
    const currentWeek = getWeekNumber(today);
    const currentYear = today.getFullYear();

    rotasGeoreferenciadas.forEach(rota => {
      if (rota.recorrente && rota.diasSemana && rota.diasSemana.includes(todayDay)) {
        // Check if we already have a ronda for TODAY
        const existingRonda = rondas.find(
          r => r.rotaId === rota.id && r.data === dateString
        );
        if (!existingRonda) {
          // Create a new ronda for today
          const id = `rn_${Date.now()}_${rota.id}`;
          const pontos: PontoRonda[] = rota.pontos.map((p, idx) => ({
            id: `pt_${Date.now()}_${idx}`,
            rondaId: id,
            ponto: p.nome,
            horarioPrevisto: p.horarioExecucao,
            horarioReal: '',
            status: 'ok' as const,
            observacao: '',
            latitude: p.latitude,
            longitude: p.longitude,
            raio: p.raio,
          }));

          const ronda: Ronda = {
            id,
            rota: rota.nome,
            rotaId: rota.id,
            postoId: rota.postoId, // Default to the route's posto
            data: dateString,
            horarioInicio: '',
            horarioFim: '',
            status: 'em_andamento',
            porteiro: 'A Definir', // Will be set when a guard starts it
            pontos,
            recorrente: true,
            diasSemana: rota.diasSemana,
            semanaAno: currentWeek,
            ano: currentYear
          };
          addRonda(ronda);
        }
      }
    });
  }, [rotasGeoreferenciadas, rondas, addRonda]);

  // Stats
  const stats = useMemo(() => {
    const userRondas = rondas.filter(r => !user?.postoId || r.postoId === user.postoId);
    return {
      total: userRondas.length,
      emAndamento: userRondas.filter(r => r.status === 'em_andamento').length,
      concluidas: userRondas.filter(r => r.status === 'concluida').length,
    };
  }, [rondas, user]);

  // Filtered
  const filtered = useMemo(() => {
    return rondas.filter(r => {
      // Only show rondas with postoId matching current user's postoId (if user has a posto)
      if (user?.postoId && r.postoId !== user.postoId) return false;
      if (statusFilter === 'em_andamento' && r.status !== 'em_andamento') return false;
      if (statusFilter === 'concluida' && r.status !== 'concluida') return false;
      if (statusFilter === 'parcial' && r.status !== 'parcial') return false;
      if (busca) {
        const s = busca.toLowerCase();
        return [r.rota, r.porteiro].some(f => f.toLowerCase().includes(s));
      }
      return true;
    });
  }, [rondas, busca, statusFilter, user]);

  // Helper: count checked pontos
  const countChecked = (ronda: Ronda) => ronda.pontos.filter(p => p.horarioReal).length;
  const countIrregularidades = (ronda: Ronda) => ronda.pontos.filter(p => p.status === 'irregularidade').length;

  // Handle new ronda
  const handleOpenModal = () => {
    setSelectedRota('');
    setModalOpen(true);
  };

  const handleCreateRonda = async () => {
    if (!selectedRota) {
      toast.error('Selecione uma rota');
      return;
    }

    const rotaData = rotasGeoreferenciadas.find((r) => r.id === selectedRota);
    if (!rotaData) {
      toast.error('Rota não encontrada');
      return;
    }

    const today = new Date();
    const id = `rn_${Date.now()}`;
    const pontos: PontoRonda[] = rotaData.pontos.map((p, idx) => ({
      id: `pt_${Date.now()}_${idx}`,
      rondaId: id,
      ponto: p.nome,
      horarioPrevisto: p.horarioExecucao,
      horarioReal: '',
      status: 'ok' as const,
      observacao: '',
      latitude: p.latitude,
      longitude: p.longitude,
      raio: p.raio,
    }));

    const ronda: Ronda = {
      id,
      rota: rotaData.nome,
      rotaId: rotaData.id,
      postoId: user?.postoId,
      data: format(today, 'yyyy-MM-dd'),
      horarioInicio: '', // Será preenchido quando iniciar a ronda
      horarioFim: '',
      status: 'em_andamento',
      porteiro: user?.nome || 'Porteiro',
      pontos,
      recorrente: rotaData.recorrente,
      diasSemana: rotaData.diasSemana,
      semanaAno: getWeekNumber(today),
      ano: today.getFullYear()
    };
    
    console.log('Criando ronda:', ronda);
    addRonda(ronda);
    toast.success('Ronda criada!');
    setModalOpen(false);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };
  
  const confirmDelete = () => {
    if (deleteId) {
      removeRonda(deleteId);
      toast.success('Ronda removida');
      setConfirmDeleteOpen(false);
      setDeleteId(null);
    }
  };

  // Handle open detail (read-only view)
  const handleOpenDetail = (ronda: Ronda) => {
    setSelectedRonda({ ...ronda, pontos: ronda.pontos.map(p => ({ ...p })) });
    setDetailOpen(true);
  };

  // Handle open execution
  const handleOpenExecution = (ronda: Ronda) => {
    // Get the latest version from store
    const latestRonda = rondas.find(r => r.id === ronda.id) || ronda;
    setSelectedRonda({ ...latestRonda, pontos: latestRonda.pontos.map(p => ({ ...p })) });
    const anyChecked = latestRonda.pontos.some(p => !!p.horarioReal);
    setRondaIniciada(anyChecked);
    setExecutionOpen(true);
  };

  // Start ronda
  const handleStartRonda = () => {
    if (!selectedRonda) return;
    const updatedRonda = {
      ...selectedRonda,
      horarioInicio: getCurrentTime(),
      data: getCurrentDate(), // Garante que a data é atual
      porteiro: user?.nome || 'Porteiro',
    };
    setSelectedRonda(updatedRonda);
    updateRonda(updatedRonda);
    setRondaIniciada(true);
    toast.success('Ronda iniciada!');
  };

  // Check-in a ponto
  const handleCheckin = (pontoId: string) => {
    if (!selectedRonda) return;
    const updatedPontos = selectedRonda.pontos.map(p =>
      p.id === pontoId ? { ...p, horarioReal: getCurrentTime() } : p
    );
    const updatedRonda = { ...selectedRonda, pontos: updatedPontos };
    setSelectedRonda(updatedRonda);
    updateRonda(updatedRonda);
    toast.success('Check-in realizado no ponto!');
  };

  // Update ponto field
  const updatePontoField = (pontoId: string, field: keyof PontoRonda, value: string) => {
    if (!selectedRonda) return;
    const updatedPontos = selectedRonda.pontos.map(p =>
      p.id === pontoId ? { ...p, [field]: value } : p
    );
    const updatedRonda = { ...selectedRonda, pontos: updatedPontos };
    setSelectedRonda(updatedRonda);
    updateRonda(updatedRonda);
  };

  // Finalizar ronda
  const handleFinalizar = () => {
    if (!selectedRonda) return;
    const checked = selectedRonda.pontos.filter(p => p.horarioReal).length;
    const total = selectedRonda.pontos.length;
    
    if (checked < total) {
      // Show confirmation
      setConfirmFinalizeOpen(true);
    } else {
      finalizeRonda();
    }
  };

  const finalizeRonda = () => {
    if (!selectedRonda) return;
    const checked = selectedRonda.pontos.filter(p => p.horarioReal).length;
    const total = selectedRonda.pontos.length;
    const status: StatusRonda = checked === total ? 'concluida' : 'parcial';
    const updated: Ronda = {
      ...selectedRonda,
      horarioFim: getCurrentTime(),
      status,
    };
    updateRonda(updated);
    toast.success(status === 'concluida' ? 'Ronda concluída com sucesso!' : 'Ronda finalizada parcialmente');
    setExecutionOpen(false);
    setConfirmFinalizeOpen(false);
    setSelectedRonda(null);
  };

  // Save intermediate changes when closing execution
  const handleCloseExecution = (open: boolean) => {
    if (!open) {
      if (selectedRonda && selectedRonda.status === 'em_andamento') {
        updateRonda(selectedRonda);
      }
      setExecutionOpen(false);
      setSelectedRonda(null);
    }
  };

  // Close read-only detail
  const handleCloseDetail = (open: boolean) => {
    if (!open) {
      setDetailOpen(false);
      setSelectedRonda(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Navigation className="h-6 w-6 text-emerald-600" />
            Rondas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro de patrulhamento</p>
        </div>
        {/* Botão de criar ronda removido para esta tela (agora apenas no Admin) */}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total de Rondas</p>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.total}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.emAndamento}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.concluidas}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por rota ou porteiro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44 h-11 text-sm bg-muted/50 border-0">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ronda cards list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <p className="text-lg font-medium mb-1">Nenhuma ronda encontrada</p>
          <p className="text-sm text-muted-foreground/70">Aguarde a atribuição de uma ronda ou horários programados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ronda, idx) => {
            const checked = countChecked(ronda);
            const total = ronda.pontos.length;
            const irregularidades = countIrregularidades(ronda);
            const isExpanded = expandedId === ronda.id;
            const StatusIcon = statusIcons[ronda.status];
            const progressPct = total > 0 ? (checked / total) * 100 : 0;

            return (
              <motion.div
                key={ronda.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Card header — clickable */}
                    <div
                      className="p-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : ronda.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="p-2.5 rounded-xl bg-muted shrink-0">
                              <StatusIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                                <h3 className="font-bold text-lg truncate">{ronda.rota}</h3>
                                <Badge className={`${statusColors[ronda.status]} text-xs px-2 py-0.5`}>
                                  {statusLabels[ronda.status]}
                                </Badge>
                              </div>
                              {/* Dias da Semana para recorrentes */}
                              {ronda.recorrente && ronda.diasSemana && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {Object.keys(diaLabels).map(dia => {
                                    const isIncluded = ronda.diasSemana?.includes(dia);
                                    const isChecked = ronda.pontos.every(p => !!p.horarioReal);
                                    return (
                                      <Badge 
                                        key={dia} 
                                        className={`text-xs px-1.5 py-0.5 ${isIncluded ? (isChecked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300') : 'bg-gray-100 text-gray-400 dark:bg-gray-800/30 dark:text-gray-500'}`}
                                      >
                                        {diaLabels[dia]}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 text-base text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                {ronda.data}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {ronda.horarioInicio}{ronda.horarioFim ? ` — ${ronda.horarioFim}` : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {ronda.porteiro}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-base font-medium text-muted-foreground">
                                  {checked}/{total} pontos verificados
                                </span>
                                {irregularidades > 0 && (
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5">
                                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                                    {irregularidades} irregularidade{irregularidades > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${progressPct}%`,
                                    backgroundColor: progressPct === 100 ? '#10b981' : '#f59e0b',
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {ronda.status === 'em_andamento' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={e => { e.stopPropagation(); handleOpenExecution(ronda); }}
                            >
                              <Play className="h-5 w-5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-muted-foreground"
                            onClick={e => { e.stopPropagation(); handleOpenDetail(ronda); }}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>

                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded pontos summary */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-border/50 bg-muted/20"
                      >
                        <div className="p-3.5 space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Pontos da Ronda
                          </p>
                          {ronda.pontos.map(ponto => (
                            <div
                              key={ponto.id}
                              className="flex items-center gap-2 text-base py-1"
                            >
                              {ponto.horarioReal ? (
                                <CheckCircle2 className={`h-4 w-4 shrink-0 ${ponto.status === 'irregularidade' ? 'text-red-500' : 'text-emerald-500'}`} />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                              )}
                              <span className="font-medium min-w-0 truncate flex-1">{ponto.ponto}</span>
                              <span className="text-muted-foreground shrink-0">
                                {ponto.horarioPrevisto}
                              </span>
                              {ponto.horarioReal && (
                                <span className={`shrink-0 ${ponto.status === 'irregularidade' ? 'text-red-500 font-medium' : 'text-emerald-600'}`}>
                                  → {ponto.horarioReal}
                                </span>
                              )}
                              {ponto.status === 'irregularidade' && (
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}



      {/* Ronda Detail Modal (Read-Only) */}
      <Dialog open={detailOpen} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-full w-full h-full max-h-[100vh] m-0 rounded-none flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Detalhes da Ronda
            </DialogTitle>
          </DialogHeader>
          {selectedRonda && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center">
                <Badge className={`${statusColors[selectedRonda.status]} text-sm px-4 py-1`}>
                  {statusLabels[selectedRonda.status]}
                </Badge>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Rota</span>
                  <span className="text-sm text-foreground text-right font-medium">{selectedRonda.rota}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Data</span>
                  <span className="text-sm text-foreground">{selectedRonda.data}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Início</span>
                  <span className="text-sm text-foreground">{selectedRonda.horarioInicio}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Fim</span>
                  <span className="text-sm text-foreground">{selectedRonda.horarioFim || '—'}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Porteiro</span>
                  <span className="text-sm text-foreground">{selectedRonda.porteiro}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pontos de Verificação
                </p>
                {selectedRonda.pontos.map((ponto) => {
                  const isChecked = !!ponto.horarioReal;
                  return (
                    <Card key={ponto.id} className={`overflow-hidden border ${ponto.status === 'irregularidade' ? 'border-red-200 dark:border-red-800' : isChecked ? 'border-emerald-200 dark:border-emerald-800' : 'border-border'}`}>
                      <CardContent className="p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isChecked ? (
                              <CheckCircle2 className={`h-4 w-4 shrink-0 ${ponto.status === 'irregularidade' ? 'text-red-500' : 'text-emerald-500'}`} />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">{ponto.ponto}</span>
                              {ponto.latitude && ponto.longitude && (
                                <span className="text-[10px] text-muted-foreground">
                                  Raio de verificação: {ponto.raio || 50}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>



                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Previsto</Label>
                            <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
                              <p className="text-base font-medium">{ponto.horarioPrevisto}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Atual</Label>
                            <div className={`rounded-lg px-3 py-2 border ${ponto.horarioReal ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-muted/50 border-border'}`}>
                              <p className={`text-base font-medium ${ponto.horarioReal ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                                {ponto.horarioReal || '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Status</Label>
                            <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
                              <p className="text-base font-medium">{ponto.status === 'ok' ? 'OK' : 'Irregularidade'}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Observação</Label>
                            <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
                              <p className="text-base font-medium">{ponto.observacao || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ronda Execution Modal */}
      <Dialog open={executionOpen} onOpenChange={handleCloseExecution}>
        <DialogContent className="max-w-full w-full h-full max-h-[100vh] m-0 rounded-none flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Play className="h-6 w-6 text-emerald-600" />
              Execução da Ronda
            </DialogTitle>
          </DialogHeader>
          {selectedRonda && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-base font-medium text-muted-foreground shrink-0">Rota</span>
                  <span className="text-base text-foreground text-right font-medium">{selectedRonda.rota}</span>
                </div>
              </div>

              {/* Progress summary */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">
                  {countChecked(selectedRonda)}/{selectedRonda.pontos.length} pontos verificados
                </span>
                {countIrregularidades(selectedRonda) > 0 && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm px-3 py-1">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {countIrregularidades(selectedRonda)} irregularidade{countIrregularidades(selectedRonda) > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Map */}
              <RotaMap
                pontos={selectedRonda.pontos.filter(p => p.latitude && p.longitude).map(p => ({
                  latitude: p.latitude as number,
                  longitude: p.longitude as number,
                  nome: p.ponto,
                  status: p.horarioReal ? (p.status === 'irregularidade' ? 'irregularidade' : 'ok') : 'pending'
                }))}
                isSatellite={isSatellite}
              />

              {/* Pontos checklist */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Pontos de Verificação (Geolocalizados)
                </p>
                {!rondaIniciada && (
                  <Button 
                    onClick={handleStartRonda}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Iniciar Ronda
                  </Button>
                )}
                {rondaIniciada && (
                  <></>
                )}
                {selectedRonda.pontos.map((ponto, index) => {
                  // Encontra o índice do primeiro ponto não verificado
                  const firstUncheckedIndex = selectedRonda.pontos.findIndex(p => !p.horarioReal);
                  const isCurrentPonto = firstUncheckedIndex === index;
                  const isChecked = !!ponto.horarioReal;
                  
                  // Check if all previous pontos are checked (sequential enable)
                  const previousChecked = index === 0 || selectedRonda.pontos.slice(0, index).every(p => !!p.horarioReal);
                  
                  // Geofencing Check
                  let inRadius = false;
                  let dist = -1;
                  if (ponto.latitude && ponto.longitude && userLat && userLon) {
                    dist = getDistanceFromLatLonInM(userLat, userLon, ponto.latitude, ponto.longitude);
                    if (dist <= (ponto.raio || 50)) {
                      inRadius = true;
                    }
                  } else if (!ponto.latitude || !ponto.longitude) {
                    // Fallback se o ponto não tem lat/long (rotas mockadas legadas)
                    inRadius = true; 
                  }

                  const timeValid = isTimeValidForCheckin(ponto.horarioPrevisto);
                  
                  // Check-in visível até 5 min antes, inativo se fora do raio OR previous not checked
                  const showCheckin = !isChecked && timeValid;
                  const canCheckin = inRadius && showCheckin && previousChecked;

                  // Se a ronda estiver iniciada, só mostra o ponto atual ou os já verificados
                  if (rondaIniciada && !isChecked && !isCurrentPonto) return null;
                  
                  return (
                    <Card key={ponto.id} className={`overflow-hidden border ${isCurrentPonto ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : ponto.status === 'irregularidade' ? 'border-red-200 dark:border-red-800' : isChecked ? 'border-emerald-200 dark:border-emerald-800' : 'border-border'}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isChecked ? (
                              <CheckCircle2 className={`h-5 w-5 shrink-0 ${ponto.status === 'irregularidade' ? 'text-red-500' : 'text-emerald-500'}`} />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-base truncate">{ponto.ponto}</span>
                              {ponto.latitude && ponto.longitude && (
                                <span className="text-xs text-muted-foreground">
                                  Raio de verificação: {ponto.raio || 50}m
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {showCheckin || !isChecked ? (
                            <Button
                              size="sm"
                              disabled={!canCheckin}
                              className={`h-9 text-sm px-4 ${canCheckin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                              onClick={() => canCheckin && handleCheckin(ponto.id)}
                            >
                              <MapPin className="h-4 w-4 mr-1.5" />
                              {canCheckin ? 'Check-in' : (!timeValid ? 'Aguardando horário' : (!previousChecked ? 'Aguardando ponto anterior' : (dist >= 0 ? `Longe (${Math.round(dist)}m)` : 'Aguardando GPS')))}
                            </Button>
                          ) : null}
                        </div>



                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Previsto</Label>
                            <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
                              <p className="text-base font-medium">{ponto.horarioPrevisto}</p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Atual</Label>
                            <div className={`rounded-lg px-3 py-2 border ${ponto.horarioReal ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-muted/50 border-border'}`}>
                              <p className={`text-base font-medium ${ponto.horarioReal ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                                {ponto.horarioReal || '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Select
                              value={ponto.status}
                              onValueChange={v => updatePontoField(ponto.id, 'status', v)}
                              disabled={!isCurrentPonto && isChecked}
                            >
                              <SelectTrigger className={`h-10 text-sm ${ponto.status === 'irregularidade' ? 'border-red-300' : 'border-emerald-300'} ${(!isCurrentPonto && isChecked) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    OK
                                  </span>
                                </SelectItem>
                                <SelectItem value="irregularidade">
                                  <span className="flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    Irregularidade
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Observação</Label>
                            <Input
                              value={ponto.observacao}
                              onChange={e => updatePontoField(ponto.id, 'observacao', e.target.value)}
                              placeholder="Observações..."
                              className="h-10 text-sm"
                              disabled={!isCurrentPonto && isChecked}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Progresso: {countChecked(selectedRonda)}/{selectedRonda.pontos.length} pontos
                  </span>
                  <span className="font-bold text-emerald-600">
                    {Math.round((countChecked(selectedRonda) / selectedRonda.pontos.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(countChecked(selectedRonda) / selectedRonda.pontos.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      countChecked(selectedRonda) === selectedRonda.pontos.length ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Finalizar button */}
              <Button
                onClick={handleFinalizar}
                disabled={countChecked(selectedRonda) !== selectedRonda.pontos.length}
                className={`w-full h-12 font-semibold text-base shadow-lg ${
                  countChecked(selectedRonda) === selectedRonda.pontos.length
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Finalizar Ronda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Finalizing Ronda */}
      <Dialog open={confirmFinalizeOpen} onOpenChange={v => setConfirmFinalizeOpen(v)}>
        <DialogContent className="!fixed !inset-auto !top-[50%] !left-[50%] !translate-x-[-50%] !translate-y-[-50%] !w-auto !h-auto !max-w-sm !m-auto !rounded-xl !border !px-6 !py-5 !shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              Finalizar Ronda Parcialmente?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-muted-foreground">
              Você ainda não verificou todos os pontos da ronda. Deseja finalizar a ronda parcialmente?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmFinalizeOpen(false)} className="text-base">
              Cancelar
            </Button>
            <Button onClick={finalizeRonda} className="bg-amber-600 hover:bg-amber-700 text-white text-base">
              Finalizar Parcialmente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Deleting Ronda */}
      <Dialog open={confirmDeleteOpen} onOpenChange={v => setConfirmDeleteOpen(v)}>
        <DialogContent className="!fixed !inset-auto !top-[50%] !left-[50%] !translate-x-[-50%] !translate-y-[-50%] !w-auto !h-auto !max-w-sm !m-auto !rounded-xl !border !px-6 !py-5 !shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Excluir Ronda?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-muted-foreground">
              Tem certeza que deseja excluir esta ronda? Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} className="text-base">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white text-base">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
