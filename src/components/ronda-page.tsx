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

  // Stats
  const stats = useMemo(() => ({
    total: rondas.length,
    emAndamento: rondas.filter(r => r.status === 'em_andamento').length,
    concluidas: rondas.filter(r => r.status === 'concluida').length,
  }), [rondas]);

  // Filtered
  const filtered = useMemo(() => {
    return rondas.filter(r => {
      if (statusFilter === 'em_andamento' && r.status !== 'em_andamento') return false;
      if (statusFilter === 'concluida' && r.status !== 'concluida') return false;
      if (statusFilter === 'parcial' && r.status !== 'parcial') return false;
      if (busca) {
        const s = busca.toLowerCase();
        return [r.rota, r.porteiro].some(f => f.toLowerCase().includes(s));
      }
      return true;
    });
  }, [rondas, busca, statusFilter]);

  // Helper: count checked pontos
  const countChecked = (ronda: Ronda) => ronda.pontos.filter(p => p.horarioReal).length;
  const countIrregularidades = (ronda: Ronda) => ronda.pontos.filter(p => p.status === 'irregularidade').length;

  // Handle new ronda
  const handleOpenModal = () => {
    setSelectedRota('');
    setModalOpen(true);
  };

  const handleCreateRonda = () => {
    if (!selectedRota) {
      toast.error('Selecione uma rota');
      return;
    }

    const rotaData = rotasGeoreferenciadas.find((r) => r.id === selectedRota);
    if (!rotaData) {
      toast.error('Rota não encontrada');
      return;
    }

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
      data: format(new Date(), 'yyyy-MM-dd'),
      horarioInicio: getCurrentTime(),
      horarioFim: '',
      status: 'em_andamento',
      porteiro: user?.nome || 'Porteiro',
      pontos,
    };
    addRonda(ronda);
    toast.success('Ronda criada!');
    setModalOpen(false);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    removeRonda(id);
    toast.success('Ronda removida');
  };

  // Handle open detail (read-only view)
  const handleOpenDetail = (ronda: Ronda) => {
    setSelectedRonda({ ...ronda, pontos: ronda.pontos.map(p => ({ ...p })) });
    setDetailOpen(true);
  };

  // Handle open execution
  const handleOpenExecution = (ronda: Ronda) => {
    setSelectedRonda({ ...ronda, pontos: ronda.pontos.map(p => ({ ...p })) });
    setExecutionOpen(true);
  };

  // Check-in a ponto
  const handleCheckin = (pontoId: string) => {
    if (!selectedRonda) return;
    const updatedPontos = selectedRonda.pontos.map(p =>
      p.id === pontoId ? { ...p, horarioReal: getCurrentTime() } : p
    );
    setSelectedRonda({ ...selectedRonda, pontos: updatedPontos });
    toast.success('Check-in realizado no ponto!');
  };

  // Update ponto field
  const updatePontoField = (pontoId: string, field: keyof PontoRonda, value: string) => {
    if (!selectedRonda) return;
    const updatedPontos = selectedRonda.pontos.map(p =>
      p.id === pontoId ? { ...p, [field]: value } : p
    );
    setSelectedRonda({ ...selectedRonda, pontos: updatedPontos });
  };

  // Finalizar ronda
  const handleFinalizar = () => {
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
        <Button onClick={handleOpenModal} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Criar Ronda
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.total}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Total de Rondas</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.emAndamento}</p>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-0.5">Em Andamento</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.concluidas}</p>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mt-0.5">Concluídas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por rota ou porteiro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44 h-10 bg-muted/50 border-0">
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
          <p className="text-sm text-muted-foreground/70">Toque em Criar Ronda para iniciar um patrulhamento.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : ronda.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2.5 rounded-xl bg-muted shrink-0">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm truncate">{ronda.rota}</h3>
                              <Badge className={`${statusColors[ronda.status]} text-[10px] px-2 py-0`}>
                                {statusLabels[ronda.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {ronda.data}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {ronda.horarioInicio}{ronda.horarioFim ? ` — ${ronda.horarioFim}` : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {ronda.porteiro}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {checked}/{total} pontos verificados
                                </span>
                                {irregularidades > 0 && (
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0">
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
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={e => { e.stopPropagation(); handleOpenExecution(ronda); }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={e => { e.stopPropagation(); handleOpenDetail(ronda); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={e => { e.stopPropagation(); handleDelete(ronda.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                        <div className="p-4 space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Pontos da Ronda
                          </p>
                          {ronda.pontos.map(ponto => (
                            <div
                              key={ponto.id}
                              className="flex items-center gap-2 text-xs py-1"
                            >
                              {ponto.horarioReal ? (
                                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${ponto.status === 'irregularidade' ? 'text-red-500' : 'text-emerald-500'}`} />
                              ) : (
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
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
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
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

      {/* New Ronda Dialog */}
      <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
        <DialogContent className="max-w-full w-full h-full max-h-[100vh] m-0 rounded-none flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-600" />
              Criar Ronda
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
              <Label>Rota *</Label>
              <Select value={selectedRota} onValueChange={setSelectedRota}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a rota" />
                </SelectTrigger>
                <SelectContent>
                  {rotasGeoreferenciadas.map((rota) => (
                    <SelectItem key={rota.id} value={rota.id}>{rota.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRota && rotasGeoreferenciadas.find(r => r.id === selectedRota) && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Mapa da Rota</Label>
                    <button
                      type="button"
                      onClick={() => setIsSatellite(!isSatellite)}
                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      {isSatellite ? 'Padrão' : 'Satélite'}
                    </button>
                  </div>
                  <RotaMap 
                    pontos={rotasGeoreferenciadas.find(r => r.id === selectedRota)!.pontos.map(p => ({
                      latitude: p.latitude,
                      longitude: p.longitude,
                      nome: p.nome
                    }))} 
                    isSatellite={isSatellite}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pontos que serão verificados</Label>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    {rotasGeoreferenciadas.find(r => r.id === selectedRota)!.pontos.map((ponto, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{ponto.nome}</span>
                        <span className="text-muted-foreground ml-auto">{ponto.horarioExecucao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Porteiro</Label>
                <Input
                  value={user?.nome || 'Porteiro'}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 p-4 border-t border-border">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRonda} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Play className="h-4 w-4 mr-2" />
              Criar Ronda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ronda Detail Modal (Read-Only) */}
      <Dialog open={detailOpen} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Detalhes da Ronda
            </DialogTitle>
          </DialogHeader>
          {selectedRonda && (
            <div className="space-y-4">
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
                            <span className="font-medium text-sm truncate">{ponto.ponto}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Previsto</Label>
                            <Input value={ponto.horarioPrevisto} readOnly className="h-8 text-xs bg-muted/50" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Atual</Label>
                            <Input value={ponto.horarioReal} readOnly className="h-8 text-xs bg-muted/50" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Status</Label>
                            <Input value={ponto.status === 'ok' ? 'OK' : 'Irregularidade'} readOnly className="h-8 text-xs bg-muted/50" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Observação</Label>
                            <Input value={ponto.observacao} readOnly className="h-8 text-xs bg-muted/50" />
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-600" />
              Execução da Ronda
            </DialogTitle>
          </DialogHeader>
          {selectedRonda && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Rota</span>
                  <span className="text-sm text-foreground text-right font-medium">{selectedRonda.rota}</span>
                </div>
              </div>

              {/* Progress summary */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {countChecked(selectedRonda)}/{selectedRonda.pontos.length} pontos verificados
                </span>
                {countIrregularidades(selectedRonda) > 0 && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {countIrregularidades(selectedRonda)} irregularidade{countIrregularidades(selectedRonda) > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Pontos checklist */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pontos de Verificação (Geolocalizados)
                </p>
                {selectedRonda.pontos.map((ponto) => {
                  const isChecked = !!ponto.horarioReal;
                  
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
                  
                  // Check-in visível até 5 min antes, inativo se fora do raio
                  const showCheckin = !isChecked && timeValid;
                  const canCheckin = inRadius && showCheckin;

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
                            <span className="font-medium text-sm truncate">{ponto.ponto}</span>
                          </div>
                          
                          {showCheckin || !isChecked ? (
                            <Button
                              size="sm"
                              disabled={!canCheckin}
                              className={`h-7 text-xs ${canCheckin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                              onClick={() => canCheckin && handleCheckin(ponto.id)}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              {canCheckin ? 'Check-in' : (!timeValid ? 'Aguardando horário' : (dist >= 0 ? `Longe (${Math.round(dist)}m)` : 'Aguardando GPS'))}
                            </Button>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Previsto</Label>
                            <Input
                              value={ponto.horarioPrevisto}
                              readOnly
                              className="h-8 text-xs bg-muted/50"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Atual</Label>
                            <Input
                              type="time"
                              value={ponto.horarioReal}
                              readOnly
                              className="h-8 text-xs bg-muted/50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Status</Label>
                            <Select
                              value={ponto.status}
                              onValueChange={v => updatePontoField(ponto.id, 'status', v)}
                            >
                              <SelectTrigger className={`h-8 text-xs ${ponto.status === 'irregularidade' ? 'border-red-300' : 'border-emerald-300'}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    OK
                                  </span>
                                </SelectItem>
                                <SelectItem value="irregularidade">
                                  <span className="flex items-center gap-1.5">
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                    Irregularidade
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Observação</Label>
                            <Input
                              value={ponto.observacao}
                              onChange={e => updatePontoField(ponto.id, 'observacao', e.target.value)}
                              placeholder="Observações..."
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Finalizar button */}
              <Button
                onClick={handleFinalizar}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Finalizar Ronda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
