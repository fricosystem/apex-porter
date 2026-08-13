'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Pin,
  PinOff,
  CheckCheck,
  Eye,
  Clock,
  StickyNote,
  Sunrise,
  Sun,
  Moon,
  Globe,
  CalendarClock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { format, isToday, isBefore, parseISO, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import type { TurnoAviso, CategoriaAviso } from '@/lib/data';

const prioridadeConfig = {
  alta: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    border: 'border-l-red-500',
    label: 'Alta',
  },
  media: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    border: 'border-l-amber-500',
    label: 'Média',
  },
  baixa: {
    icon: Info,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    border: 'border-l-emerald-500',
    label: 'Baixa',
  },
};

const turnoConfig: Record<string, { icon: typeof Sunrise; label: string; badge: string }> = {
  diurno: {
    icon: Sun,
    label: 'Diurno',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  noturno: {
    icon: Moon,
    label: 'Noturno',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  todos: {
    icon: Globe,
    label: 'Geral',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
};

const categoriaConfig: Record<string, { label: string; badge: string; pulse?: boolean }> = {
  Segurança: {
    label: 'Segurança',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  Operacional: {
    label: 'Operacional',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  Administrativo: {
    label: 'Administrativo',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  Urgente: {
    label: 'Urgente',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pulse: true,
  },
};

export default function AvisosPage() {
  const { avisos, addAviso, removeAviso, confirmarLeituraAviso, toggleFixarAviso, user } =
    useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>('media');
  const [turno, setTurno] = useState<TurnoAviso | ''>('');
  const [categoria, setCategoria] = useState<CategoriaAviso | ''>('');
  const [dataExpiracao, setDataExpiracao] = useState('');
  const [fixado, setFixado] = useState(false);

  // Filters
  const [busca, setBusca] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos_turnos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas_categorias');
  const [filtroStatusLeitura, setFiltroStatusLeitura] = useState<string>('todos_status');

  const userName = user?.nome || '';

  // Stats
  const stats = useMemo(() => {
    const totalAvisos = avisos.length;
    const naoLidos = avisos.filter((a) => !(a.lidoPor || []).includes(userName)).length;
    const fixados = avisos.filter((a) => a.fixado).length;
    const expirandoHoje = avisos.filter((a) => {
      if (!a.dataExpiracao) return false;
      try {
        return isToday(parseISO(a.dataExpiracao));
      } catch {
        return false;
      }
    }).length;
    return { totalAvisos, naoLidos, fixados, expirandoHoje };
  }, [avisos, userName]);

  // Filtered & sorted avisos
  const filteredAvisos = useMemo(() => {
    let result = [...avisos];

    // Search filter
    if (busca.trim()) {
      const term = busca.toLowerCase();
      result = result.filter(
        (a) =>
          a.titulo.toLowerCase().includes(term) ||
          a.conteudo.toLowerCase().includes(term) ||
          a.autor.toLowerCase().includes(term)
      );
    }

    // Turno filter
    if (filtroTurno && filtroTurno !== 'todos_turnos') {
      result = result.filter((a) => a.turno === filtroTurno);
    }

    // Categoria filter
    if (filtroCategoria && filtroCategoria !== 'todas_categorias') {
      result = result.filter((a) => a.categoria === filtroCategoria);
    }

    // Status leitura filter
    if (filtroStatusLeitura === 'lidos') {
      result = result.filter((a) => (a.lidoPor || []).includes(userName));
    } else if (filtroStatusLeitura === 'nao_lidos') {
      result = result.filter((a) => !(a.lidoPor || []).includes(userName));
    }

    // Sort: fixados first, then prioridade, then date
    const priorityOrder = { alta: 0, media: 1, baixa: 2 };
    result.sort((a, b) => {
      if (a.fixado && !b.fixado) return -1;
      if (!a.fixado && b.fixado) return 1;
      const pDiff = priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
      if (pDiff !== 0) return pDiff;
      return b.data.localeCompare(a.data);
    });

    return result;
  }, [avisos, busca, filtroTurno, filtroCategoria, filtroStatusLeitura, userName]);

  const isExpired = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    try {
      return isBefore(parseISO(dateStr), startOfDay(new Date()));
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error('Preencha título e conteúdo');
      return;
    }
    addAviso({
      id: `av_${Date.now()}`,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      prioridade,
      data: format(new Date(), 'yyyy-MM-dd'),
      autor: userName || 'Sistema',
      turno: turno || undefined,
      categoria: categoria || undefined,
      dataExpiracao: dataExpiracao || undefined,
      fixado,
      lidoPor: [],
    });
    toast.success('Aviso publicado!');
    setTitulo('');
    setConteudo('');
    setPrioridade('media');
    setTurno('');
    setCategoria('');
    setDataExpiracao('');
    setFixado(false);
    setDialogOpen(false);
  };

  const handleConfirmarLeitura = (id: string) => {
    confirmarLeituraAviso(id, userName);
    toast.success('Leitura confirmada!');
  };

  const handleToggleFixar = (id: string, currentlyPinned: boolean) => {
    toggleFixarAviso(id);
    toast.success(currentlyPinned ? 'Aviso desafixado' : 'Aviso fixado no topo');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-28 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Painel de Avisos</h2>
          <p className="text-sm text-muted-foreground">Comunicados por turno</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Aviso
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <StickyNote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalAvisos}</p>
              <p className="text-xs text-muted-foreground">Total Avisos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.naoLidos}</p>
              <p className="text-xs text-muted-foreground">Não Lidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Pin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.fixados}</p>
              <p className="text-xs text-muted-foreground">Fixados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
              <CalendarClock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expirandoHoje}</p>
              <p className="text-xs text-muted-foreground">Expirando Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, conteúdo ou autor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={filtroTurno} onValueChange={setFiltroTurno}>
              <SelectTrigger>
                <SelectValue placeholder="Turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos_turnos">Todos os Turnos</SelectItem>
                <SelectItem value="diurno">Diurno</SelectItem>
                <SelectItem value="noturno">Noturno</SelectItem>
                <SelectItem value="todos">Geral</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas_categorias">Todas</SelectItem>
                <SelectItem value="Segurança">Segurança</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroStatusLeitura} onValueChange={setFiltroStatusLeitura}>
              <SelectTrigger>
                <SelectValue placeholder="Status Leitura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos_status">Todos</SelectItem>
                <SelectItem value="lidos">Lidos</SelectItem>
                <SelectItem value="nao_lidos">Não Lidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Avisos List */}
      <div className="space-y-3">
        {filteredAvisos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum aviso encontrado</p>
            </CardContent>
          </Card>
        )}
        {filteredAvisos.map((aviso) => {
          const config = prioridadeConfig[aviso.prioridade];
          const Icon = config.icon;
          const expired = isExpired(aviso.dataExpiracao);
          const lidoPorCurrentUser = (aviso.lidoPor || []).includes(userName);
          const lidoCount = (aviso.lidoPor || []).length;
          const turnoInfo = aviso.turno ? turnoConfig[aviso.turno] : null;
          const TurnoIcon = turnoInfo?.icon;
          const catInfo = aviso.categoria ? categoriaConfig[aviso.categoria] : null;

          return (
            <Card
              key={aviso.id}
              className={`border-l-4 ${config.border} ${expired ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Pin indicator */}
                    {aviso.fixado && (
                      <div className="text-lg mt-0.5 shrink-0" title="Aviso fixado">
                        📌
                      </div>
                    )}

                    {/* Priority icon */}
                    <div className={`p-1.5 rounded-lg ${config.bg} mt-0.5 shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Title row with badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{aviso.titulo}</h3>
                        <Badge className={config.badge} variant="secondary">
                          {config.label}
                        </Badge>
                        {/* Read status badge */}
                        {lidoPorCurrentUser ? (
                          <Badge
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            variant="secondary"
                          >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Lido
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            variant="secondary"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Não Lido
                          </Badge>
                        )}
                      </div>

                      {/* Categoria + Turno badges */}
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        {catInfo && (
                          <Badge
                            className={`${catInfo.badge} ${catInfo.pulse ? 'animate-pulse' : ''}`}
                            variant="secondary"
                          >
                            {catInfo.label}
                          </Badge>
                        )}
                        {turnoInfo && TurnoIcon && (
                          <Badge className={turnoInfo.badge} variant="secondary">
                            <TurnoIcon className="h-3 w-3 mr-1" />
                            {turnoInfo.label}
                          </Badge>
                        )}
                      </div>

                      {/* Expiry indicator */}
                      {aviso.dataExpiracao && (
                        <div className="mt-1.5">
                          {expired ? (
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                              ⚠️ Expirado
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Expira em {format(parseISO(aviso.dataExpiracao), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                        {aviso.conteudo}
                      </p>

                      {/* Actions row */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {/* Confirm reading button */}
                        {!lidoPorCurrentUser && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleConfirmarLeitura(aviso.id)}
                          >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Confirmar Leitura
                          </Button>
                        )}

                        {/* Read count */}
                        {lidoCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Lido por {lidoCount} {lidoCount === 1 ? 'pessoa' : 'pessoas'}
                          </span>
                        )}
                      </div>

                      {/* Author + Date */}
                      <p className="text-xs text-muted-foreground mt-2">
                        {aviso.autor} • {format(new Date(aviso.data), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      onClick={() => handleToggleFixar(aviso.id, !!aviso.fixado)}
                      title={aviso.fixado ? 'Desafixar' : 'Fixar no topo'}
                    >
                      {aviso.fixado ? (
                        <PinOff className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Pin className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        removeAviso(aviso.id);
                        toast.success('Aviso removido');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Título do aviso"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Conteúdo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Conteúdo do aviso..."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={prioridade}
                onValueChange={(v) => setPrioridade(v as 'alta' | 'media' | 'baixa')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turno</Label>
              <Select
                value={turno}
                onValueChange={(v) => setTurno(v as TurnoAviso | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Turnos</SelectItem>
                  <SelectItem value="diurno">Diurno</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as CategoriaAviso | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Expiração</Label>
              <Input
                type="date"
                value={dataExpiracao}
                onChange={(e) => setDataExpiracao(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fixado"
                checked={fixado}
                onCheckedChange={(checked) => setFixado(checked === true)}
              />
              <Label htmlFor="fixado" className="text-sm font-normal cursor-pointer">
                Fixar no topo
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Autor</Label>
              <Input
                value={userName || 'Sistema'}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
