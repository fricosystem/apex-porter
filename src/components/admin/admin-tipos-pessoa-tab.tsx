'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Edit2,
  Plus,
  RotateCcw,
  Search,
  ShieldOff,
  Tags,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTipoPessoaOptions, type TipoPessoaConfig, type TipoPessoaOption } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TipoFormState {
  nome: string;
  ativo: boolean;
}

const EMPTY_FORM: TipoFormState = {
  nome: '',
  ativo: true,
};

function createTipoValue(): string {
  return `tipo_${Date.now()}`;
}

export function AdminTiposPessoaTab() {
  const { tiposPessoa, addTipoPessoa, updateTipoPessoa, inativarTipoPessoa } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<TipoPessoaOption | null>(null);
  const [form, setForm] = useState<TipoFormState>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');

  const allOptions = useMemo(() => getTipoPessoaOptions(tiposPessoa), [tiposPessoa]);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return allOptions
      .filter((option) => !query || option.label.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        if (Boolean(a.sistema) !== Boolean(b.sistema)) return a.sistema ? -1 : 1;
        return a.label.localeCompare(b.label, 'pt-BR');
      });
  }, [allOptions, search]);

  const openNewDialog = () => {
    setEditingOption(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (option: TipoPessoaOption) => {
    setEditingOption(option);
    setForm({ nome: option.label, ativo: option.ativo });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingOption(null);
    setForm({ ...EMPTY_FORM });
  };

  const saveOption = () => {
    const nome = form.nome.trim().toUpperCase();
    if (!nome) {
      toast.error('Informe o nome do tipo de pessoa');
      return;
    }

    const option = editingOption;
    const existingConfig = option ? tiposPessoa.find((tipo) => tipo.id === option.id) : undefined;
    const config: TipoPessoaConfig = {
      id: option?.id || createTipoValue(),
      nome,
      valor: option?.value || createTipoValue(),
      ativo: form.ativo,
      ...(option?.sistema ? { sistema: true } : {}),
    };

    if (existingConfig) {
      updateTipoPessoa(config);
      toast.success('Tipo de pessoa atualizado com sucesso!');
    } else {
      addTipoPessoa(config);
      toast.success('Tipo de pessoa cadastrado com sucesso!');
    }
    closeDialog();
  };

  const toggleActive = (option: TipoPessoaOption) => {
    if (option.ativo) {
      const existingConfig = tiposPessoa.find((tipo) => tipo.id === option.id);
      if (existingConfig) {
        inativarTipoPessoa(option.id);
      } else {
        addTipoPessoa({
          id: option.id,
          nome: option.label.toUpperCase(),
          valor: option.value,
          ativo: false,
          ...(option.sistema ? { sistema: true } : {}),
        });
      }
      toast.success('Tipo de pessoa inativado e preservado para auditoria');
      return;
    }

    const existingConfig = tiposPessoa.find((tipo) => tipo.id === option.id);
    const config: TipoPessoaConfig = {
      id: option.id,
      nome: option.label.toUpperCase(),
      valor: option.value,
      ativo: true,
      ...(option.sistema ? { sistema: true } : {}),
    };
    if (existingConfig) updateTipoPessoa(config);
    else addTipoPessoa(config);
    toast.success('Tipo de pessoa reativado');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tags className="h-5 w-5 text-emerald-600" />
            Tipos de Pessoa
          </h2>
          <p className="text-sm text-muted-foreground">
            {allOptions.filter((option) => option.ativo).length} ativos de {allOptions.length} opções gerenciadas
          </p>
        </div>
        <Button onClick={openNewDialog} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-1" />
          Novo Tipo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tipo de pessoa..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9 pr-10"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Limpar pesquisa"
            className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredOptions.map((option) => (
            <motion.div
              key={option.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className={`overflow-hidden ${!option.ativo ? 'opacity-65' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 shrink-0 ${option.ativo ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate uppercase">{option.label}</p>
                          <Badge variant={option.ativo ? 'default' : 'destructive'} className="text-[10px]">
                            {option.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {option.sistema ? 'Padrão do sistema' : 'Personalizado'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.ativo
                            ? 'Disponível no dropdown Tipo dos cadastros de pessoa.'
                            : 'Não aparece para novos cadastros, mas permanece preservado.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald/10"
                          onClick={() => openEditDialog(option)}
                          title="Editar tipo de pessoa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => toggleActive(option)}
                          title={option.ativo ? 'Inativar tipo de pessoa' : 'Reativar tipo de pessoa'}
                        >
                          {option.ativo ? <ShieldOff className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOptions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Tags className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum tipo encontrado.</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              {editingOption ? 'Editar Tipo de Pessoa' : 'Novo Tipo de Pessoa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tipo-pessoa-nome">Nome exibido no dropdown</Label>
              <Input
                id="tipo-pessoa-nome"
                value={form.nome}
                onChange={(event) => setForm((previous) => ({ ...previous, nome: event.target.value.toUpperCase() }))}
                placeholder="Ex.: TERCEIRIZADO"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="tipo-pessoa-ativo" className="cursor-pointer">Tipo disponível</Label>
                <p className="text-xs text-muted-foreground mt-1">Tipos inativos não aparecem para novos cadastros.</p>
              </div>
              <Switch
                id="tipo-pessoa-ativo"
                checked={form.ativo}
                onCheckedChange={(ativo) => setForm((previous) => ({ ...previous, ativo }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-3 sm:gap-3">
            <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button>
            <Button type="button" onClick={saveOption} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
