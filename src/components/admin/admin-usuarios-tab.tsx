'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, User, Check, EyeOff, Eye, MapPin } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { User as UserType, PageType } from '@/lib/data';
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

// ── Permissões padrão para o cargo PORTEIRO ──────────────────────────────────
const PERMISSOES_PORTEIRO: PageType[] = [
  'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes',
  'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais',
  'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes',
];

const PAGINAS: PageType[] = [
  'dashboard', 'fluxo', 'correspondencias', 'veiculos', 'pre-autorizacao',
  'relatorios', 'cadastros', 'avisos', 'lista-negra', 'achados-perdidos',
  'ocorrencias', 'ronda', 'checklist-turno', 'inspecao-diaria',
  'protocolos-emergencia', 'configuracoes', 'perfil', 'lembretes', 'admin',
];

const PAGINA_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', fluxo: 'Fluxo', correspondencias: 'Correspondências',
  veiculos: 'Veículos', 'pre-autorizacao': 'Pré-autorização', relatorios: 'Relatórios',
  cadastros: 'Cadastros', avisos: 'Avisos', 'lista-negra': 'Lista Negra',
  'achados-perdidos': 'Achados e Perdidos', ocorrencias: 'Ocorrências', ronda: 'Ronda',
  'checklist-turno': 'Checklist de Turno', 'inspecao-diaria': 'Inspeção Diária',
  'protocolos-emergencia': 'Protocolos de Emergência', configuracoes: 'Configurações',
  perfil: 'Perfil', lembretes: 'Lembretes', admin: 'Admin',
};

// ── Tab principal ─────────────────────────────────────────────────────────────
export function AdminUsuariosTab() {
  const { usuarios, updateUsuario, addUsuario, postos } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNovoUsuario = () => {
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
    const existe = usuarios.find((u) => u.id === usuario.id);
    if (existe) {
      updateUsuario(senha ? { ...usuario, senha } : usuario);
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
          senha,
        });
        setModalOpen(false);
        setUsuarioSelecionado(null);
        setError(null);
      } catch (err: any) {
        setError(getAuthErrorMessage(err?.code || 'auth/default'));
      }
    }
  };

  const getPostoNome = (postoId?: string) => {
    if (!postoId) return 'Não atribuído';
    return postos.find((p) => p.id === postoId)?.nome ?? 'Não atribuído';
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
                    <Badge variant="default" className="text-[10px] bg-emerald-500">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{usuario.email}</p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {usuario.cargo && (
                    <span className="text-xs text-muted-foreground">{usuario.cargo}</span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getPostoNome(usuario.postoId)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditarUsuario(usuario);
              }}
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
        onClose={() => {
          setModalOpen(false);
          setUsuarioSelecionado(null);
        }}
        usuario={usuarioSelecionado}
        onSalvar={handleSalvarUsuario}
        error={error}
        setError={setError}
      />
    </div>
  );
}

// ── Modal de Usuário ──────────────────────────────────────────────────────────
interface ModalUsuarioProps {
  open: boolean;
  onClose: () => void;
  usuario: UserType | null;
  onSalvar: (usuario: UserType, senha?: string) => void;
  error?: string | null;
  setError?: (error: string | null) => void;
  loading?: boolean;
}

function ModalUsuario({
  open,
  onClose,
  usuario,
  onSalvar,
  error,
  setError,
  loading: externalLoading,
}: ModalUsuarioProps) {
  const { usuarios, postos, cargos } = useAppStore();
  const [formData, setFormData] = useState<UserType | null>(null);
  const [senha, setSenha] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  useEffect(() => {
    if (usuario) {
      const cargo = (usuario.cargo || '').toUpperCase();
      setFormData({
        ...usuario,
        ativo: usuario.ativo ?? true,
        permissoes: usuario.permissoes || (cargo === 'PORTEIRO' ? PERMISSOES_PORTEIRO : []),
      });
    } else {
      setFormData({
        id: '',
        nome: '',
        email: '',
        cargo: 'PORTEIRO',
        ativo: true,
        permissoes: PERMISSOES_PORTEIRO,
      });
      setSenha('');
    }
  }, [usuario]);

  if (!formData) return null;

  const handleTogglePermissao = (pagina: PageType) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const permissoes = prev.permissoes.includes(pagina)
        ? prev.permissoes.filter((p) => p !== pagina)
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] max-w-full p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {usuario && usuarios.find((u) => u.id === usuario.id)
              ? 'Editar Colaborador'
              : 'Novo Colaborador'}
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
              onChange={(e) => setFormData((prev) => prev ? { ...prev, nome: e.target.value } : prev)}
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
              onChange={(e) => setFormData((prev) => prev ? { ...prev, email: e.target.value } : prev)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Select
              value={formData.cargo || ''}
              onValueChange={(value) =>
                setFormData((prev) => prev ? { ...prev, cargo: value } : prev)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {cargos.filter((c) => c.ativo).map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.nome}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={usuario ? 'Nova senha (opcional)' : 'Senha para o novo colaborador'}
              required={!usuario}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posto">Posto</Label>
            <Select
              value={formData.postoId || ''}
              onValueChange={(value) =>
                setFormData((prev) => prev ? { ...prev, postoId: value || undefined } : prev)
              }
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
                onCheckedChange={(checked) =>
                  setFormData((prev) => prev ? { ...prev, ativo: checked } : prev)
                }
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Usuário Ativo
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissões</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormData((prev) => prev ? { ...prev, permissoes: PAGINAS } : prev)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormData((prev) => prev ? { ...prev, permissoes: [] } : prev)}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Nenhum
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 bg-muted/30">
              {PAGINAS.map((pagina) => (
                <div key={pagina} className="flex items-center gap-2">
                  <Switch
                    id={`permissao-${pagina}`}
                    checked={formData.permissoes.includes(pagina)}
                    onCheckedChange={() => handleTogglePermissao(pagina)}
                  />
                  <Label htmlFor={`permissao-${pagina}`} className="text-xs cursor-pointer">
                    {PAGINA_LABELS[pagina]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
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
