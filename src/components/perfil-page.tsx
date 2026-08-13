'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User as UserIcon, Mail, Shield, Calendar, Clock, Key, Save, Lock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { updateUserPassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function PerfilPage() {
  const { user, updateUser } = useAppStore();

  const [nome, setNome] = useState(user?.nome || '');
  const [loadingSave, setLoadingSave] = useState(false);

  // Password state
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(false);

  const initials = (user?.nome || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  let dataCadFormatada = 'Não disponível';
  let tempoConta = 'Recente';

  if (user?.dataCadastro) {
    try {
      const dateObj = new Date(user.dataCadastro);
      if (!isNaN(dateObj.getTime())) {
        dataCadFormatada = format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        tempoConta = formatDistanceToNow(dateObj, { locale: ptBR });
      }
    } catch {
      // ignore
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('O nome não pode ficar vazio.');
      return;
    }
    setLoadingSave(true);
    try {
      updateUser({ nome: nome.trim().toUpperCase() });
      toast.success('Nome de exibição atualizado!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoadingSenha(true);
    try {
      await updateUserPassword(novaSenha);
      toast.success('Senha atualizada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err) {
      toast.error('Falha ao atualizar a senha. Tente fazer login novamente.');
    } finally {
      setLoadingSenha(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-24"
    >
      {/* Top Header */}
      <div className="pb-2 border-b border-border/40">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
        <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">
          Informações pessoais, credenciais e registro de acesso da sua conta
        </p>
      </div>

      {/* Profile Overview Banner */}
      <Card className="border-border/60 bg-gradient-to-br from-card/80 to-card shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-primary/20 shadow-sm ring-4 ring-background">
            <AvatarFallback className="bg-primary/90 text-primary-foreground text-2xl md:text-3xl font-extrabold tracking-wider">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {user?.nome || 'Usuário'}
              </h2>
              <span className="inline-flex items-center gap-1.5 font-medium text-xs px-3 py-1 rounded-full bg-primary/10 text-primary self-center sm:self-auto border border-primary/20 shadow-2xs">
                <Shield className="h-3.5 w-3.5 text-primary" /> {user?.cargo || 'Porteiro'}
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-muted-foreground/70" />
              <span>{user?.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/40 shadow-2xs hover:border-border transition-colors">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 mt-0.5">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data de Cadastro</p>
              <p className="text-base font-semibold capitalize text-foreground">{dataCadFormatada}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 shadow-2xs hover:border-border transition-colors">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 mt-0.5">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tempo de Conta</p>
              <p className="text-base font-semibold text-foreground capitalize">{tempoConta}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Display Name Card */}
      <Card className="border-border/60 shadow-2xs">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Dados de Exibição</h3>
              <p className="text-xs text-muted-foreground">Atualize a forma como seu nome é exibido no sistema</p>
            </div>
            <UserIcon className="h-5 w-5 text-muted-foreground/60 hidden sm:block" />
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="h-11 font-medium uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargoStatic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo / Função</Label>
              <div className="flex items-center gap-2 h-11 px-3.5 rounded-md bg-muted/50 border border-border text-muted-foreground text-sm font-medium">
                <Lock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span>{user?.cargo || 'Porteiro'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">O cargo/função é gerenciado pelo administrador do sistema.</p>
            </div>

            <Button
              type="submit"
              disabled={loadingSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 shadow-sm font-medium tracking-wide"
            >
              <Save className="mr-2 h-4 w-4" />
              {loadingSave ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-border/60 shadow-2xs">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Segurança da Conta</h3>
              <p className="text-xs text-muted-foreground">Mantenha sua senha atualizada e segura</p>
            </div>
            <Key className="h-5 w-5 text-muted-foreground/60 hidden sm:block" />
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="••••••••"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="h-11 tracking-widest font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmar Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="h-11 tracking-widest font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loadingSenha || !novaSenha || !confirmarSenha}
              variant="outline"
              className="border-primary/40 hover:bg-primary hover:text-primary-foreground h-10 px-6 font-medium transition-all shadow-2xs"
            >
              {loadingSenha ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
