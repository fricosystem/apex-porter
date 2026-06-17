'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileWarning,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  TIPOS_OCORRENCIA,
  GRAVIDADES_OCORRENCIA,
  STATUS_OCORRENCIA,
} from '@/lib/data';
import type {
  TipoOcorrencia,
  GravidadeOcorrencia,
  StatusOcorrencia,
  Ocorrencia,
} from '@/lib/data';
import { format } from 'date-fns';
import { toast } from 'sonner';

const gravidadeBorderConfig: Record<GravidadeOcorrencia, string> = {
  leve: 'border-l-blue-500',
  moderada: 'border-l-amber-500',
  grave: 'border-l-orange-500',
  critica: 'border-l-red-500',
};

const gravidadeBadgeConfig: Record<GravidadeOcorrencia, string> = {
  leve: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  moderada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  grave: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critica: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusBadgeConfig: Record<StatusOcorrencia, string> = {
  aberta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolvida: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  encaminhada: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const gravidadeLabel: Record<GravidadeOcorrencia, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  grave: 'Grave',
  critica: 'Crítica',
};

const statusLabel: Record<StatusOcorrencia, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  resolvida: 'Resolvida',
  encaminhada: 'Encaminhada',
};

const tipoLabelMap: Record<TipoOcorrencia, string> = Object.fromEntries(
  TIPOS_OCORRENCIA.map((t) => [t.value, t.label])
) as Record<TipoOcorrencia, string>;

export default function OcorrenciasPage() {
  const { ocorrencias, addOcorrencia, updateOcorrencia, removeOcorrencia, user } = useAppStore();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterGravidade, setFilterGravidade] = useState<string>('todas');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // New ocorrencia form
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoOcorrencia>('outra');
  const [gravidade, setGravidade] = useState<GravidadeOcorrencia>('leve');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [envolvidos, setEnvolvidos] = useState('');
  const [acaoTomada, setAcaoTomada] = useState('');

  // Detail modal — update status
  const [newStatus, setNewStatus] = useState<StatusOcorrencia>('aberta');
  const [resolucao, setResolucao] = useState('');

  // Stats
  const stats = useMemo(() => {
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter((o) => o.status === 'aberta').length;
    const emAndamento = ocorrencias.filter((o) => o.status === 'em_andamento').length;
    const resolvidas = ocorrencias.filter((o) => o.status === 'resolvida').length;
    return { total, abertas, emAndamento, resolvidas };
  }, [ocorrencias]);

  // Filtered list
  const filteredOcorrencias = useMemo(() => {
    return ocorrencias.filter((o) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        o.titulo.toLowerCase().includes(searchLower) ||
        o.local.toLowerCase().includes(searchLower) ||
        o.envolvidos.toLowerCase().includes(searchLower);
      const matchesGravidade = filterGravidade === 'todas' || o.gravidade === filterGravidade;
      const matchesTipo = filterTipo === 'todos' || o.tipo === filterTipo;
      const matchesStatus = filterStatus === 'todos' || o.status === filterStatus;
      return matchesSearch && matchesGravidade && matchesTipo && matchesStatus;
    });
  }, [ocorrencias, search, filterGravidade, filterTipo, filterStatus]);

  const resetForm = () => {
    setTitulo('');
    setTipo('outra');
    setGravidade('leve');
    setLocal('');
    setDescricao('');
    setEnvolvidos('');
    setAcaoTomada('');
  };

  const handleAdd = () => {
    if (!titulo || !local || !descricao || !acaoTomada) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const now = new Date();
    addOcorrencia({
      id: `oc_${Date.now()}`,
      titulo,
      tipo,
      gravidade,
      status: 'aberta',
      data: format(now, 'yyyy-MM-dd'),
      horario: format(now, 'HH:mm'),
      local,
      descricao,
      envolvidos,
      acaoTomada,
      porteiro: user?.nome || 'Porteiro',
    });
    toast.success('Ocorrência registrada com sucesso!');
    resetForm();
    setNewDialogOpen(false);
  };

  const handleOpenDetail = (oc: Ocorrencia) => {
    setSelectedOcorrencia(oc);
    setNewStatus(oc.status);
    setResolucao(oc.resolucao || '');
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedOcorrencia) return;
    if (newStatus === 'resolvida' && !resolucao.trim()) {
      toast.error('Informe a resolução para fechar a ocorrência');
      return;
    }
    updateOcorrencia({
      ...selectedOcorrencia,
      status: newStatus,
      resolucao: newStatus === 'resolvida' ? resolucao : selectedOcorrencia.resolucao,
    });
    toast.success('Status atualizado com sucesso!');
    setDetailDialogOpen(false);
    setSelectedOcorrencia(null);
  };

  const handleDelete = (id: string) => {
    removeOcorrencia(id);
    toast.success('Ocorrência removida');
    setDeleteConfirmId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-28 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ocorrências</h2>
          <p className="text-sm text-muted-foreground">
            Registro de incidentes e anomalias durante o plantão
          </p>
        </div>
        <Button
          onClick={() => setNewDialogOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Ocorrência
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              <FileWarning className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.abertas}</p>
              <p className="text-xs text-muted-foreground">Abertas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resolvidas}</p>
              <p className="text-xs text-muted-foreground">Resolvidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, local ou envolvidos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={filterGravidade} onValueChange={setFilterGravidade}>
            <SelectTrigger>
              <SelectValue placeholder="Gravidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Gravidades</SelectItem>
              {GRAVIDADES_OCORRENCIA.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {TIPOS_OCORRENCIA.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              {STATUS_OCORRENCIA.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ocorrência Cards List */}
      {filteredOcorrencias.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma ocorrência encontrada</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 scrollbar-thin">
          {filteredOcorrencias.map((oc) => (
            <Card
              key={oc.id}
              className={`border-l-4 cursor-pointer transition-shadow hover:shadow-md ${gravidadeBorderConfig[oc.gravidade]}`}
              onClick={() => handleOpenDetail(oc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{oc.titulo}</h3>
                      <Badge className={gravidadeBadgeConfig[oc.gravidade]}>
                        {gravidadeLabel[oc.gravidade]}
                      </Badge>
                      <Badge className={statusBadgeConfig[oc.status]}>
                        {statusLabel[oc.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {tipoLabelMap[oc.tipo]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {oc.local}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(oc.data), 'dd/MM/yyyy')} às {oc.horario}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {oc.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {oc.porteiro}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {deleteConfirmId === oc.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(oc.id);
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(oc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Ocorrência Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Ocorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Título da ocorrência"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoOcorrencia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_OCORRENCIA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gravidade *</Label>
              <Select value={gravidade} onValueChange={(v) => setGravidade(v as GravidadeOcorrencia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRAVIDADES_OCORRENCIA.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Local *</Label>
              <Input
                placeholder="Local da ocorrência"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                placeholder="Descreva a ocorrência em detalhes..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Envolvidos</Label>
              <Input
                placeholder="Pessoas envolvidas (opcional)"
                value={envolvidos}
                onChange={(e) => setEnvolvidos(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ação Tomada *</Label>
              <Textarea
                placeholder="Descreva as ações tomadas..."
                value={acaoTomada}
                onChange={(e) => setAcaoTomada(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Porteiro</Label>
              <Input
                value={user?.nome || 'Porteiro'}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  value={format(new Date(), 'dd/MM/yyyy')}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  value={format(new Date(), 'HH:mm')}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ocorrência</DialogTitle>
          </DialogHeader>
          {selectedOcorrencia && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{selectedOcorrencia.titulo}</h3>
                <Badge className={gravidadeBadgeConfig[selectedOcorrencia.gravidade]}>
                  {gravidadeLabel[selectedOcorrencia.gravidade]}
                </Badge>
                <Badge className={statusBadgeConfig[selectedOcorrencia.status]}>
                  {statusLabel[selectedOcorrencia.status]}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Tipo:</span>{' '}
                  <Badge variant="outline">{tipoLabelMap[selectedOcorrencia.tipo]}</Badge>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Local:</span>{' '}
                  {selectedOcorrencia.local}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Data/Hora:</span>{' '}
                  {format(new Date(selectedOcorrencia.data), 'dd/MM/yyyy')} às {selectedOcorrencia.horario}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Descrição:</span>
                  <p className="mt-1 text-foreground">{selectedOcorrencia.descricao}</p>
                </div>
                {selectedOcorrencia.envolvidos && (
                  <div>
                    <span className="font-medium text-muted-foreground">Envolvidos:</span>{' '}
                    {selectedOcorrencia.envolvidos}
                  </div>
                )}
                <div>
                  <span className="font-medium text-muted-foreground">Ação Tomada:</span>
                  <p className="mt-1 text-foreground">{selectedOcorrencia.acaoTomada}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Porteiro:</span>{' '}
                  {selectedOcorrencia.porteiro}
                </div>
                {selectedOcorrencia.resolucao && (
                  <div>
                    <span className="font-medium text-muted-foreground">Resolução:</span>
                    <p className="mt-1 text-foreground">{selectedOcorrencia.resolucao}</p>
                  </div>
                )}
              </div>

              {selectedOcorrencia.status !== 'resolvida' && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Atualizar Status</h4>
                  <div className="space-y-2">
                    <Label>Novo Status</Label>
                    <Select
                      value={newStatus}
                      onValueChange={(v) => setNewStatus(v as StatusOcorrencia)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OCORRENCIA.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Resolução {newStatus === 'resolvida' && '*'}
                    </Label>
                    <Textarea
                      placeholder="Descreva a resolução da ocorrência..."
                      value={resolucao}
                      onChange={(e) => setResolucao(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleUpdateStatus}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Salvar
                  </Button>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setDetailDialogOpen(false)}
                  className="w-full"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
