'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Search,
  Building2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { type Departamento } from '@/lib/data';
import { toast } from 'sonner';
import AutocompleteInput from './autocomplete-input';
import { EMPRESAS_INICIAIS } from '@/lib/seed-data';

interface FormState {
  nome: string;
  empresa: string;
}

const EMPTY_FORM: FormState = {
  nome: '',
  empresa: '',
};

export default function DepartamentosPage() {
  const { departamentos, addDepartamento, removeDepartamento, updateDepartamento, empresas } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');

  // ── Unified suggestions ──
  const empresaSuggestions = useMemo(() => {
    const map = new Map<string, { label: string; sublabel?: string }>();
    
    // 1. Fallback from seed data
    (EMPRESAS_INICIAIS || []).forEach((e) => {
      map.set(e.nome, { label: e.nome, sublabel: e.cnpj || 'Empresa' });
    });

    // 2. From active database
    (empresas || []).forEach((e) => {
      map.set(e.nome, { label: e.nome, sublabel: e.cnpj || 'Empresa cadastrada' });
    });

    return Array.from(map.values());
  }, [empresas]);

  // Sincroniza e filtra a busca pelos departamentos
  const filteredDepartamentos = useMemo(() => {
    let list = departamentos || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.nome.toLowerCase().includes(q) ||
          (d.empresa && d.empresa.toLowerCase().includes(q))
      );
    }
    return list;
  }, [departamentos, search]);

  const openNewDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (dep: Departamento) => {
    setEditingId(dep.id);
    setForm({
      nome: dep.nome,
      empresa: dep.empresa || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) {
      toast.error('O nome do departamento é obrigatório');
      return;
    }
    if (!form.empresa.trim()) {
      toast.error('A empresa é obrigatória');
      return;
    }

    if (editingId) {
      updateDepartamento({
        id: editingId,
        nome: form.nome.trim(),
        empresa: form.empresa.trim(),
      });
      toast.success('Departamento atualizado!');
    } else {
      addDepartamento({
        id: `dep_${Date.now()}`,
        nome: form.nome.trim(),
        empresa: form.empresa.trim(),
      });
      toast.success('Departamento cadastrado!');
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Departamentos
          </h2>
          <p className="text-sm text-muted-foreground">
            {departamentos.length} departamento{departamentos.length !== 1 ? 's' : ''} cadastrado{departamentos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={openNewDialog}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Departamento
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por departamento ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredDepartamentos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search
                  ? 'Nenhum departamento encontrado com os filtros aplicados'
                  : 'Nenhum departamento cadastrado ainda'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewDialog}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Cadastrar Departamento
              </Button>
            </motion.div>
          )}

          {filteredDepartamentos.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Stripe indicator */}
                    <div className="w-1.5 shrink-0 bg-emerald-500" />
                    <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{d.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Empresa: {d.empresa}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald/10"
                          onClick={() => openEditDialog(d)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            removeDepartamento(d.id);
                            toast.success('Departamento removido');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Novo/Editar Departamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Editar Departamento
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Novo Departamento
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Campo Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome do Departamento *</Label>
              <Input
                placeholder="Ex: TI, Recursos Humanos, Recepção"
                value={form.nome}
                onChange={(e) => updateForm('nome', e.target.value)}
              />
            </div>

            {/* Campo Empresa */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Empresa *</Label>
              <AutocompleteInput
                placeholder="Ex: APEX Sistemas, Terceirizada Premium"
                value={form.empresa}
                onChange={(v) => updateForm('empresa', v)}
                suggestions={empresaSuggestions}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {editingId ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
