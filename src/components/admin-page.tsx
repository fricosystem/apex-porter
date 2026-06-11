'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Map as MapIcon, Trash2, Edit2, User, X, Check, EyeOff, Eye, MapPin } from 'lucide-react';
import AdminBottomNav, { AdminTab } from './admin-bottom-nav';
import { useAppStore } from '@/lib/store';
import { ModalNovaRota } from './modais-rota';
import { RotaGeoreferenciada, User as UserType, PageType, Posto } from '@/lib/data';
import { signUpWithEmail, getAuthErrorMessage } from '@/lib/auth';
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('painel');

  return (
    <div className="h-full flex flex-col bg-background relative pb-16">
      <div className="flex-1 overflow-y-auto" id="admin-scroll-root">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {currentTab === 'painel' && <AdminPainelTab />}
            {currentTab === 'rondas' && <AdminRondasTab />}
            {currentTab === 'usuarios' && <AdminUsuariosTab />}
            {currentTab === 'postos' && <AdminPostosTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AdminBottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

function AdminPainelTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground text-sm">
        Bem-vindo à área administrativa. Selecione uma opção no menu abaixo.
      </p>
    </div>
  );
}

function AdminRondasTab() {
  const { rotasGeoreferenciadas, removeRotaGeoreferenciada } = useAppStore();
  const [showNovaRota, setShowNovaRota] = useState(false);
  const [rotaEditar, setRotaEditar] = useState<RotaGeoreferenciada | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Rotas de Ronda</h2>
        <button
          onClick={() => setShowNovaRota(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Rota
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {rotasGeoreferenciadas.map((rota) => (
          <div key={rota.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-medium text-sm">{rota.nome}</span>
                <p className="text-xs text-muted-foreground">{rota.pontos.length} pontos cadastrados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotaEditar(rota)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeRotaGeoreferenciada(rota.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {rotasGeoreferenciadas.length === 0 && (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <MapIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhuma rota cadastrada.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNovaRota && (
          <ModalNovaRota onClose={() => setShowNovaRota(false)} />
        )}
        {rotaEditar && (
          <ModalNovaRota 
            onClose={() => setRotaEditar(null)} 
            rotaEditar={rotaEditar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminUsuariosTab() {
  const { usuarios, updateUsuario, addUsuario } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNovoUsuario = () => {
    // Quando criar novo usuário, passamos null para o ModalUsuario
    setUsuarioSelecionado(null);
    setError(null);
    setModalOpen(true);
  };

  const handleEditarUsuario = (usuario: UserType) => {
    setUsuarioSelecionado(usuario);
    setError(null);
    setModalOpen(true);
  };

  const handleSalvarUsuario = async (usuario: UserType, senha?: string) => {
    const existe = usuarios.find(u => u.id === usuario.id);
    if (existe) {
      // If we have a new password, add it to the user object
      const usuarioToSave = senha ? { ...usuario, senha } : usuario;
      updateUsuario(usuarioToSave);
      setModalOpen(false);
      setUsuarioSelecionado(null);
    } else {
      if (!senha) {
        setError('Senha é obrigatória para criar um novo colaborador');
        return;
      }
      try {
        const firebaseUser = await signUpWithEmail(usuario.nome, usuario.email, senha, usuario.cargo);
        addUsuario({ 
          ...usuario, 
          id: firebaseUser.uid, 
          dataCadastro: new Date().toISOString(),
          ativo: true,
          senha
        });
        setModalOpen(false);
        setUsuarioSelecionado(null);
        setError(null);
      } catch (err: any) {
        setError(getAuthErrorMessage(err?.code || 'auth/default'));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gerenciar Colaboradores</h2>
        <button
          onClick={handleNovoUsuario}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {usuarios.map((usuario) => (
          <div 
            key={usuario.id} 
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleEditarUsuario(usuario)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{usuario.nome}</span>
                  {usuario.ativo ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-500">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{usuario.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{usuario.cargo}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditarUsuario(usuario); }}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {usuarios.length === 0 && (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
          </div>
        )}
      </div>

      <ModalUsuario 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setUsuarioSelecionado(null); }} 
        usuario={usuarioSelecionado}
        onSalvar={handleSalvarUsuario}
        error={error}
        setError={setError}
      />
    </div>
  );
}

interface ModalUsuarioProps {
  open: boolean;
  onClose: () => void;
  usuario: UserType | null;
  onSalvar: (usuario: UserType, senha?: string) => void;
  error?: string | null;
  setError?: (error: string | null) => void;
  loading?: boolean;
}

function ModalUsuario({ open, onClose, usuario, onSalvar, error, setError, loading: externalLoading }: ModalUsuarioProps) {
  const { usuarios, postos } = useAppStore();
  const [formData, setFormData] = useState<UserType | null>(null);
  const [senha, setSenha] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  // Permissões padrão para PORTEIRO
  const PERMISSOES_PORTEIRO = [
    'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes', 
    'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais', 
    'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes'
  ];

  useEffect(() => {
    if (usuario) {
      const cargo = (usuario.cargo || '').toUpperCase();
      setFormData({
        ...usuario,
        ativo: usuario.ativo ?? true,
        permissoes: usuario.permissoes || (cargo === 'PORTEIRO' ? PERMISSOES_PORTEIRO : [])
      });
    } else {
      // Novo usuário - padrão PORTEIRO
      setFormData({
        id: '',
        nome: '',
        email: '',
        cargo: 'PORTEIRO',
        ativo: true,
        permissoes: PERMISSOES_PORTEIRO
      });
      setSenha('');
    }
  }, [usuario]);

  if (!formData) return null;

  const handleTogglePermissao = (pagina: PageType) => {
    setFormData(prev => {
      if (!prev) return prev;
      const permissoes = prev.permissoes.includes(pagina)
        ? prev.permissoes.filter(p => p !== pagina)
        : [...prev.permissoes, pagina];
      return { ...prev, permissoes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setError) setError(null);
    setInternalLoading(true);
    try {
      await onSalvar(formData, senha || undefined);
    } finally {
      setInternalLoading(false);
    }
  };

  const paginas: PageType[] = [
    'dashboard', 'fluxo', 'correspondencias', 'veiculos', 'pre-autorizacao',
    'relatorios', 'cadastros', 'avisos', 'lista-negra', 'achados-perdidos',
    'ocorrencias', 'ronda', 'checklist-turno', 'inspecao-diaria',
    'protocolos-emergencia', 'configuracoes', 'perfil', 'lembretes', 'admin'
  ];

  const paginaLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'fluxo': 'Fluxo',
    'correspondencias': 'Correspondências',
    'veiculos': 'Veículos',
    'pre-autorizacao': 'Pré-autorização',
    'relatorios': 'Relatórios',
    'cadastros': 'Cadastros',
    'avisos': 'Avisos',
    'lista-negra': 'Lista Negra',
    'achados-perdidos': 'Achados e Perdidos',
    'ocorrencias': 'Ocorrências',
    'ronda': 'Ronda',
    'checklist-turno': 'Checklist de Turno',
    'inspecao-diaria': 'Inspeção Diária',
    'protocolos-emergencia': 'Protocolos de Emergência',
    'configuracoes': 'Configurações',
    'perfil': 'Perfil',
    'lembretes': 'Lembretes',
    'admin': 'Admin'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] max-w-full p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {usuario && usuarios.find(u => u.id === usuario.id) ? 'Editar Colaborador' : 'Novo Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/30">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => prev ? { ...prev, nome: e.target.value } : prev)}
              placeholder="Nome completo do colaborador"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => prev ? { ...prev, email: e.target.value } : prev)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={formData.cargo || ''}
              onChange={(e) => setFormData(prev => prev ? { ...prev, cargo: e.target.value.toUpperCase() } : prev)}
              placeholder="Cargo do colaborador"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={usuario ? "Nova senha (opcional)" : "Senha para o novo colaborador"}
              required={!usuario}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posto">Posto</Label>
            <Select
              value={formData.postoId || ''}
              onValueChange={(value) => setFormData(prev => prev ? { ...prev, postoId: value || undefined } : prev)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um posto" />
              </SelectTrigger>
              <SelectContent>
                {postos.map((posto) => (
                  <SelectItem key={posto.id} value={posto.id}>
                    {posto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => prev ? { ...prev, ativo: checked } : prev)}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Usuário Ativo</Label>
            </div>
            {formData.ativo ? (
              <Badge variant="default" className="bg-emerald-500">Ativo</Badge>
            ) : (
              <Badge variant="destructive">Inativo</Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissões</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormData(prev => prev ? { ...prev, permissoes: paginas } : prev)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormData(prev => prev ? { ...prev, permissoes: [] } : prev)}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Nenhum
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 bg-muted/30">
              {paginas.map((pagina) => (
                <div key={pagina} className="flex items-center gap-2">
                  <Switch
                    id={`permissao-${pagina}`}
                    checked={formData.permissoes.includes(pagina)}
                    onCheckedChange={() => handleTogglePermissao(pagina)}
                  />
                  <Label
                    htmlFor={`permissao-${pagina}`}
                    className="text-xs cursor-pointer"
                  >
                    {paginaLabels[pagina]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminPostosTab() {
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
    if (postos.find(p => p.id === posto.id)) {
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
          <div key={posto.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{posto.nome}</span>
                  {posto.ativo ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-500">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
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
        onClose={() => { setShowModal(false); setPostoEditar(null); }}
        posto={postoEditar}
        onSalvar={handleSalvarPosto}
      />
    </div>
  );
}

interface ModalPostoProps {
  open: boolean;
  onClose: () => void;
  posto: Posto | null;
  onSalvar: (posto: Posto) => void;
}

function ModalPosto({ open, onClose, posto, onSalvar }: ModalPostoProps) {
  const { postos } = useAppStore();
  const [formData, setFormData] = useState<Posto>({
    id: '',
    nome: '',
    ativo: true,
  });

  useEffect(() => {
    if (posto) {
      setFormData(posto);
    } else {
      setFormData({
        id: `posto-${Date.now()}`,
        nome: '',
        ativo: true,
      });
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
            {posto && postos.find(p => p.id === posto.id) ? 'Editar Posto' : 'Novo Posto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 h-full">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Posto</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Portaria Principal"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Posto Ativo</Label>
            </div>
            {formData.ativo ? (
              <Badge variant="default" className="bg-emerald-500">Ativo</Badge>
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
