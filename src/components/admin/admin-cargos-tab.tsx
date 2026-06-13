'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Cargo } from '@/lib/data';
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

export function AdminCargosTab() {
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
    if (cargos.find((c) => c.id === cargo.id)) {
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
          <div
            key={cargo.id}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{cargo.nome}</span>
                  {cargo.ativo ? (
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
        onClose={() => {
          setShowModal(false);
          setCargoEditar(null);
        }}
        cargo={cargoEditar}
        onSalvar={handleSalvarCargo}
      />
    </div>
  );
}

// ── Modal de Cargo ────────────────────────────────────────────────────────────
interface ModalCargoProps {
  open: boolean;
  onClose: () => void;
  cargo: Cargo | null;
  onSalvar: (cargo: Cargo) => void;
}

function ModalCargo({ open, onClose, cargo, onSalvar }: ModalCargoProps) {
  const { cargos } = useAppStore();
  const [formData, setFormData] = useState<Cargo>({ id: '', nome: '', ativo: true });

  useEffect(() => {
    if (cargo) {
      setFormData(cargo);
    } else {
      setFormData({ id: `cargo-${Date.now()}`, nome: '', ativo: true });
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
            {cargo && cargos.find((c) => c.id === cargo.id) ? 'Editar Cargo' : 'Novo Cargo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Cargo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Porteiro"
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
                Cargo Ativo
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
