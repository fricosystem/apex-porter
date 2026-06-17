'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Package } from 'lucide-react';
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
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusConfig = {
  achado: {
    label: 'Achado',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  perdido: {
    label: 'Perdido',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  devolvido: {
    label: 'Devolvido',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
};

export default function AchadosPerdidosPage() {
  const { achadosPerdidos, addAchadosPerdidos, removeAchadosPerdidos, updateAchadosPerdidos } =
    useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [localEncontrado, setLocalEncontrado] = useState('');
  const [cor, setCor] = useState('');
  const [status, setStatus] = useState<'achado' | 'perdido' | 'devolvido'>('achado');
  const [observacoes, setObservacoes] = useState('');

  const handleAdd = () => {
    if (!descricao || !localEncontrado) {
      toast.error('Preencha descrição e local');
      return;
    }
    addAchadosPerdidos({
      id: `ap_${Date.now()}`,
      descricao,
      localEncontrado,
      data: format(new Date(), 'yyyy-MM-dd'),
      status,
      cor: cor || undefined,
      observacoes: observacoes || undefined,
    });
    toast.success('Item registrado!');
    setDescricao('');
    setLocalEncontrado('');
    setCor('');
    setStatus('achado');
    setObservacoes('');
    setDialogOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: 'achado' | 'perdido' | 'devolvido') => {
    const item = achadosPerdidos.find((i) => i.id === id);
    if (item) {
      updateAchadosPerdidos({ ...item, status: newStatus });
      toast.success('Status atualizado');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Achados e Perdidos</h2>
          <p className="text-sm text-muted-foreground">
            Registro de itens encontrados e perdidos
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achadosPerdidos.map((item) => {
          const config = statusConfig[item.status];
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{item.descricao}</h3>
                      <Badge className={config.badge}>{config.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {item.localEncontrado}
                    </p>
                    {item.cor && (
                      <p className="text-xs text-muted-foreground">
                        🎨 Cor: {item.cor}
                      </p>
                    )}
                    {item.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.observacoes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      📅 {format(new Date(item.data), 'dd/MM/yyyy')}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {(['achado', 'perdido', 'devolvido'] as const).map((s) => (
                        <Button
                          key={s}
                          variant={item.status === s ? 'default' : 'outline'}
                          size="sm"
                          className={`h-6 text-[10px] px-2 ${
                            item.status === s && s === 'devolvido'
                              ? 'bg-teal-600 hover:bg-teal-700'
                              : ''
                          }`}
                          onClick={() => handleStatusChange(item.id, s)}
                        >
                          {statusConfig[s].label}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                        onClick={() => {
                          removeAchadosPerdidos(item.id);
                          toast.success('Item removido');
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Descrição do item"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Local Encontrado *</Label>
              <Input
                placeholder="Onde o item foi encontrado"
                value={localEncontrado}
                onChange={(e) => setLocalEncontrado(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                placeholder="Cor do item"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as 'achado' | 'perdido' | 'devolvido')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achado">Achado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                  <SelectItem value="devolvido">Devolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações adicionais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
