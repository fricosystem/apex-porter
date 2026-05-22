'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Plus, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function RamaisPage() {
  const { ramais, addRamal, removeRamal, buscaRamais, setBuscaRamais, departamentos } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [depNome, setDepNome] = useState('');
  const [pessoaNome, setPessoaNome] = useState('');
  const [ramalNumero, setRamalNumero] = useState('');

  // Use only real departments from Firestore
  const allDepartamentos = useMemo(() => {
    const storeDeps = departamentos.map((d) => d.nome).filter(Boolean);
    return Array.from(new Set(storeDeps)).sort((a, b) => a.localeCompare(b));
  }, [departamentos]);

  const filteredRamais = useMemo(() => {
    if (!buscaRamais) return ramais;
    const search = buscaRamais.toLowerCase();
    return ramais.filter(
      (r) =>
        r.departamento.toLowerCase().includes(search) ||
        r.nome.toLowerCase().includes(search) ||
        r.ramal.includes(search)
    );
  }, [ramais, buscaRamais]);

  const handleAdd = () => {
    if (!depNome || !pessoaNome || !ramalNumero) {
      toast.error('Preencha todos os campos');
      return;
    }
    addRamal({
      id: `ram_${Date.now()}`,
      departamento: depNome,
      nome: pessoaNome,
      ramal: ramalNumero,
    });
    toast.success('Ramal adicionado!');
    setDepNome('');
    setPessoaNome('');
    setRamalNumero('');
    setDialogOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ramais</h2>
          <p className="text-sm text-muted-foreground">
            Lista de ramais internos
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ramais..."
          value={buscaRamais}
          onChange={(e) => setBuscaRamais(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Departamento</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Ramal</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRamais.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-primary" />
                        {r.departamento}
                      </div>
                    </td>
                    <td className="p-3">{r.nome}</td>
                    <td className="p-3 font-mono font-semibold text-primary">{r.ramal}</td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          removeRamal(r.id);
                          toast.success('Ramal removido');
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Ramal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={depNome} onValueChange={setDepNome}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {allDepartamentos.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome da pessoa"
                value={pessoaNome}
                onChange={(e) => setPessoaNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ramal</Label>
              <Input
                placeholder="Ex: 100"
                value={ramalNumero}
                onChange={(e) => setRamalNumero(e.target.value)}
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
