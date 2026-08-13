'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Posto } from '@/lib/data';
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

export function AdminPostosTab() {
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
    if (postos.find((p) => p.id === posto.id)) {
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
          <div
            key={posto.id}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{posto.nome}</span>
                  {posto.ativo ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-500">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      Inativo
                    </Badge>
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
        onClose={() => {
          setShowModal(false);
          setPostoEditar(null);
        }}
        posto={postoEditar}
        onSalvar={handleSalvarPosto}
      />
    </div>
  );
}

// ── Modal de Posto ─────────────────────────────────────────────────────────────
interface ModalPostoProps {
  open: boolean;
  onClose: () => void;
  posto: Posto | null;
  onSalvar: (posto: Posto) => void;
}

function ModalPosto({ open, onClose, posto, onSalvar }: ModalPostoProps) {
  const { postos } = useAppStore();
  const [formData, setFormData] = useState<Posto>({ id: '', nome: '', ativo: true });

  useEffect(() => {
    if (posto) {
      setFormData(posto);
    } else {
      setFormData({ id: crypto.randomUUID(), nome: '', ativo: true });
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
            {posto && postos.find((p) => p.id === posto.id) ? 'Editar Posto' : 'Novo Posto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Posto</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Portaria Principal"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Posto Ativo
              </Label>
            </div>
            {formData.ativo ? (
              <Badge variant="default" className="bg-emerald-500">
                Ativo
              </Badge>
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
