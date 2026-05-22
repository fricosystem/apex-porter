'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Search,
  Clock,
  Calendar,
  Repeat,
  Bell,
  Edit2,
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
import { format, parseISO, isBefore, isAfter, isEqual, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import type { Lembrete, TipoRecorrencia } from '@/lib/data';

const recorrenciaLabels: Record<TipoRecorrencia, string> = {
  unica: 'Uma vez',
  diaria: 'Diariamente',
  semanal: 'Semanalmente',
  mensal: 'Mensalmente',
  anual: 'Anualmente',
};

export default function LembretesPage() {
  const { lembretes, addLembrete, updateLembrete, removeLembrete, user } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hora, setHora] = useState(format(new Date(), 'HH:mm'));
  const [recorrente, setRecorrente] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState<TipoRecorrencia>('unica');
  const [minutosAntes, setMinutosAntes] = useState(0);

  const [notificacaoAberta, setNotificacaoAberta] = useState(false);
  const [notificacaoAtual, setNotificacaoAtual] = useState<Lembrete | null>(null);
  const [notificacaoTipo, setNotificacaoTipo] = useState<'antes' | 'exato'>('exato');

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      lembretes.forEach((lembrete) => {
        if (!lembrete.ativo) return;

        const dataHoraLembrete = parseISO(`${lembrete.data}T${lembrete.hora}`);
        
        if (lembrete.minutosAntes > 0 && !lembrete.notificadoAntes) {
          const dataHoraAntes = addMinutes(dataHoraLembrete, -lembrete.minutosAntes);
          if (isEqual(now, dataHoraAntes) || (isAfter(now, dataHoraAntes) && isBefore(now, dataHoraLembrete))) {
            setNotificacaoAtual(lembrete);
            setNotificacaoTipo('antes');
            setNotificacaoAberta(true);
            updateLembrete({ ...lembrete, notificadoAntes: true });
          }
        }

        if (!lembrete.notificadoNoHorario) {
          if (isEqual(now, dataHoraLembrete) || (isAfter(now, dataHoraLembrete) && !lembrete.notificadoNoHorario)) {
            setNotificacaoAtual(lembrete);
            setNotificacaoTipo('exato');
            setNotificacaoAberta(true);
            updateLembrete({ ...lembrete, notificadoNoHorario: true });
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [lembretes, updateLembrete]);

  const stats = useMemo(() => {
    const total = lembretes.length;
    const ativos = lembretes.filter((l) => l.ativo).length;
    const notificarHoje = lembretes.filter((l) => {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      return l.ativo && l.data === hoje;
    }).length;
    const recorrentes = lembretes.filter((l) => l.recorrente).length;
    return { total, ativos, notificarHoje, recorrentes };
  }, [lembretes]);

  const filteredLembretes = useMemo(() => {
    let result = [...lembretes];

    if (busca.trim()) {
      const term = busca.toLowerCase();
      result = result.filter(
        (l) =>
          l.titulo.toLowerCase().includes(term) ||
          l.descricao.toLowerCase().includes(term)
      );
    }

    if (filtroStatus === 'ativos') {
      result = result.filter((l) => l.ativo);
    } else if (filtroStatus === 'inativos') {
      result = result.filter((l) => !l.ativo);
    } else if (filtroStatus === 'hoje') {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      result = result.filter((l) => l.data === hoje);
    }

    result.sort((a, b) => {
      const dateA = parseISO(`${a.data}T${a.hora}`);
      const dateB = parseISO(`${b.data}T${b.hora}`);
      return dateA.getTime() - dateB.getTime();
    });

    return result;
  }, [lembretes, busca, filtroStatus]);

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setData(format(new Date(), 'yyyy-MM-dd'));
    setHora(format(new Date(), 'HH:mm'));
    setRecorrente(false);
    setTipoRecorrencia('unica');
    setMinutosAntes(0);
    setEditingId(null);
  };

  const handleOpenEdit = (lembrete: Lembrete) => {
    setEditingId(lembrete.id);
    setTitulo(lembrete.titulo);
    setDescricao(lembrete.descricao);
    setData(lembrete.data);
    setHora(lembrete.hora);
    setRecorrente(lembrete.recorrente);
    setTipoRecorrencia(lembrete.tipoRecorrencia);
    setMinutosAntes(lembrete.minutosAntes);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!titulo.trim()) {
      toast.error('Preencha o título');
      return;
    }

    const lembreteData: Omit<Lembrete, 'id'> = {
      usuarioEmail: user?.email || '',
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      data,
      hora,
      recorrente,
      tipoRecorrencia,
      minutosAntes,
      notificadoAntes: false,
      notificadoNoHorario: false,
      dataCriacao: new Date().toISOString(),
      ativo: true,
    };

    if (editingId) {
      updateLembrete({ ...lembreteData, id: editingId } as Lembrete);
      toast.success('Lembrete atualizado!');
    } else {
      addLembrete({ ...lembreteData, id: `lem_${Date.now()}` } as Lembrete);
      toast.success('Lembrete criado!');
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleToggleAtivo = (lembrete: Lembrete) => {
    updateLembrete({ ...lembrete, ativo: !lembrete.ativo });
    toast.success(lembrete.ativo ? 'Lembrete desativado' : 'Lembrete ativado');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-28 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Lembretes</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus lembretes</p>
        </div>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Lembrete
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.notificarHoje}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recorrentes}</p>
              <p className="text-xs text-muted-foreground">Recorrentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredLembretes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum lembrete encontrado</p>
            </CardContent>
          </Card>
        )}
        {filteredLembretes.map((lembrete) => (
          <Card
            key={lembrete.id}
            className={`border-l-4 ${lembrete.ativo ? 'border-l-emerald-500' : 'border-l-gray-300 opacity-60'}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg ${lembrete.ativo ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-gray-100 dark:bg-gray-800'} mt-0.5 shrink-0`}>
                    <Bell className={`h-4 w-4 ${lembrete.ativo ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{lembrete.titulo}</h3>
                      {lembrete.recorrente && (
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" variant="secondary">
                          <Repeat className="h-3 w-3 mr-1" />
                          {recorrenciaLabels[lembrete.tipoRecorrencia]}
                        </Badge>
                      )}
                      {!lembrete.ativo && (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" variant="secondary">
                          Inativo
                        </Badge>
                      )}
                    </div>

                    {lembrete.descricao && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {lembrete.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(lembrete.data), 'dd/MM/yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lembrete.hora}
                      </span>
                      {lembrete.minutosAntes > 0 && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          {lembrete.minutosAntes} min antes
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    onClick={() => handleOpenEdit(lembrete)}
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    onClick={() => handleToggleAtivo(lembrete)}
                    title={lembrete.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {lembrete.ativo ? (
                      <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      removeLembrete(lembrete.id);
                      toast.success('Lembrete removido');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Título do lembrete"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do lembrete..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recorrente"
                checked={recorrente}
                onCheckedChange={(checked) => setRecorrente(checked === true)}
              />
              <Label htmlFor="recorrente" className="text-sm font-normal cursor-pointer">
                Recorrente
              </Label>
            </div>
            {recorrente && (
              <div className="space-y-2">
                <Label>Tipo de Recorrência</Label>
                <Select
                  value={tipoRecorrencia}
                  onValueChange={(v) => setTipoRecorrencia(v as TipoRecorrencia)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unica">Uma vez</SelectItem>
                    <SelectItem value="diaria">Diariamente</SelectItem>
                    <SelectItem value="semanal">Semanalmente</SelectItem>
                    <SelectItem value="mensal">Mensalmente</SelectItem>
                    <SelectItem value="anual">Anualmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Lembrar X minutos antes</Label>
              <Input
                type="number"
                min="0"
                placeholder="0 para não lembrar antes"
                value={minutosAntes}
                onChange={(e) => setMinutosAntes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {editingId ? 'Salvar Alterações' : 'Criar Lembrete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notificacaoAberta} onOpenChange={setNotificacaoAberta}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              {notificacaoTipo === 'antes' ? 'Lembrete' : 'Hora do Lembrete!'}
            </DialogTitle>
          </DialogHeader>
          {notificacaoAtual && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{notificacaoAtual.titulo}</h3>
              {notificacaoAtual.descricao && (
                <p className="text-sm text-muted-foreground">{notificacaoAtual.descricao}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(parseISO(notificacaoAtual.data), 'dd/MM/yyyy')} às {notificacaoAtual.hora}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setNotificacaoAberta(false)} className="bg-emerald-600 hover:bg-emerald-700">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
