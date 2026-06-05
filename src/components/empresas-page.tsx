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
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { type Empresa, type RegistroFluxo } from '@/lib/data';
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
  const { empresas, addEmpresa, removeEmpresa, updateEmpresa, registrosFluxo } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEmpresa, setDetailsEmpresa] = useState<Empresa | null>(null);
  const [showMoreVisits, setShowMoreVisits] = useState(false);

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

  const empresaVisits = useMemo(() => {
    if (!detailsEmpresa) return [];
    return registrosFluxo
      .filter((r) => {
        let company = '';
        switch (r.categoria) {
          case 'entregas1': company = r.empresa; break;
          case 'visitantes':
          case 'prestadores':
            company = (r as any).empresa || r.nomeEmpresa?.split(' / ')[1] || ''; break;
          case 'pesagem':
          case 'entregas2':
          case 'coleta': company = r.empresa; break;
          case 'movimentacao': return false;
          case 'correspondencias': company = r.remetente; break;
        }
        return company === detailsEmpresa.nome;
      })
      .sort((a, b) => {
        const da = 'data' in a ? (a as any).data : '';
        const ha = a.horarioEntrada || '';
        const db = 'data' in b ? (b as any).data : '';
        const hb = b.horarioEntrada || '';
        if (da !== db) return da > db ? -1 : 1;
        return ha > hb ? -1 : 1;
      });
  }, [detailsEmpresa, registrosFluxo]);

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
              <Card className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setDetailsEmpresa(e); setShowMoreVisits(false); setDetailsOpen(true); }}>
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
                          onClick={(event) => { event.stopPropagation(); openEditDialog(e); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
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

      {/* Modal Detalhes da Empresa */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-600" />
              Detalhes da Empresa
            </DialogTitle>
          </DialogHeader>

          {detailsEmpresa && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Building className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{detailsEmpresa.nome}</h3>
                    {detailsEmpresa.contato && <p className="text-sm text-muted-foreground">{detailsEmpresa.contato}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {detailsEmpresa.cnpj && (
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="text-sm font-medium">{detailsEmpresa.cnpj}</p>
                    </div>
                  )}
                  {detailsEmpresa.contato && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contato</p>
                      <p className="text-sm font-medium">{detailsEmpresa.contato}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visitas */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Histórico de Visitas ({empresaVisits.length})
                </h4>
                
                {empresaVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">
                    Nenhum registro encontrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {empresaVisits.slice(0, showMoreVisits ? 25 : 5).map((v) => (
                      <div key={v.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg border text-sm">
                        <div>
                          <p className="font-medium">
                            {'data' in v ? (v as any).data : ''}
                            <span className="text-muted-foreground ml-2 font-normal">{v.horarioEntrada}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {v.categoria} • {(v as any).departamento || '-'}
                          </p>
                        </div>
                        {v.horarioSaida && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                            Saída: {v.horarioSaida}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {empresaVisits.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowMoreVisits(!showMoreVisits)}
                  >
                    {showMoreVisits ? (
                      <>Ver menos <ChevronUp className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>Ver mais {Math.min(empresaVisits.length - 5, 20)} visitas <ChevronDown className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
            {detailsEmpresa && (
               <Button 
                 onClick={() => {
                   setDetailsOpen(false);
                   openEditDialog(detailsEmpresa);
                 }}
                 className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
               >
                 <Edit2 className="h-4 w-4 mr-2" />
                 Editar
               </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
