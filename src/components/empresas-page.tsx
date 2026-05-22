'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Search,
  Building,
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
import { type Empresa } from '@/lib/data';
import { toast } from 'sonner';

interface FormState {
  nome: string;
  cnpj: string;
  contato: string;
}

const EMPTY_FORM: FormState = {
  nome: '',
  cnpj: '',
  contato: '',
};

export default function EmpresasPage() {
  const { empresas, addEmpresa, removeEmpresa, updateEmpresa } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');

  // Sincroniza e filtra a busca pelas empresas cadastradas
  const filteredEmpresas = useMemo(() => {
    let list = [...(empresas || [])];
    
    // Sort alphabetically by name
    list.sort((a, b) => a.nome.localeCompare(b.nome));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.nome.toLowerCase().includes(q) ||
          (e.cnpj && e.cnpj.toLowerCase().includes(q)) ||
          (e.contato && e.contato.toLowerCase().includes(q))
      );
    }
    return list;
  }, [empresas, search]);

  const openNewDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (emp: Empresa) => {
    setEditingId(emp.id);
    setForm({
      nome: emp.nome,
      cnpj: emp.cnpj || '',
      contato: emp.contato || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) {
      toast.error('O nome da empresa é obrigatório');
      return;
    }

    if (editingId) {
      updateEmpresa({
        id: editingId,
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim() || undefined,
        contato: form.contato.trim() || undefined,
      });
      toast.success('Empresa atualizada com sucesso!');
    } else {
      addEmpresa({
        id: `emp_${Date.now()}`,
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim() || undefined,
        contato: form.contato.trim() || undefined,
      });
      toast.success('Empresa cadastrada com sucesso!');
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
            <Building className="h-5 w-5 text-emerald-600" />
            Empresas
          </h2>
          <p className="text-sm text-muted-foreground">
            {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} cadastrada{empresas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={openNewDialog}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Empresa
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por empresa, CNPJ ou contato..."
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
          {filteredEmpresas.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search
                  ? 'Nenhuma empresa encontrada com os filtros aplicados'
                  : 'Nenhuma empresa cadastrada ainda'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewDialog}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Cadastrar Empresa
              </Button>
            </motion.div>
          )}

          {filteredEmpresas.map((e) => (
            <motion.div
              key={e.id}
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
                        <p className="font-semibold text-foreground truncate">{e.nome}</p>
                        <div className="text-xs text-muted-foreground space-y-0.5 truncate">
                          {e.cnpj && <p>CNPJ: {e.cnpj}</p>}
                          {e.contato && <p>Contato / Telefone: {e.contato}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald/10"
                          onClick={() => openEditDialog(e)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            removeEmpresa(e.id);
                            toast.success('Empresa removida');
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

      {/* Modal Novo/Editar Empresa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Editar Empresa
                </>
              ) : (
                <>
                  <Building className="h-5 w-5 text-emerald-600" />
                  Nova Empresa
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Campo Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome da Empresa *</Label>
              <Input
                placeholder="Ex: APEX Sistemas, Terceirizada Premium"
                value={form.nome}
                onChange={(e) => updateForm('nome', e.target.value)}
              />
            </div>

            {/* Campo CNPJ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CNPJ</Label>
              <Input
                placeholder="Ex: 00.000.000/0001-00"
                value={form.cnpj}
                onChange={(e) => updateForm('cnpj', e.target.value)}
              />
            </div>

            {/* Campo Contato */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Contato / Telefone</Label>
              <Input
                placeholder="Ex: (11) 98888-8888 ou contato@apex.com"
                value={form.contato}
                onChange={(e) => updateForm('contato', e.target.value)}
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
