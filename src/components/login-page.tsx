'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';

type AuthMode = 'login' | 'register' | 'reset';

// Particles for background animation
function TacticalParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => {
      const pseudoRandom1 = (i * 13.54) % 100;
      const pseudoRandom2 = (i * 7.12) % 8;
      const pseudoRandom3 = (i * 3.14) % 8;
      const pseudoRandom4 = (i * 0.42) % 2;

      return {
        id: i,
        left: `${pseudoRandom1}%`,
        delay: `${pseudoRandom2}s`,
        duration: `${6 + pseudoRandom3}s`,
        size: 1 + pseudoRandom4,
      };
    }), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-emerald-400"
          style={{
            left: p.left,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float-particle ${p.duration} ${p.delay} infinite linear`,
            boxShadow: `0 0 ${p.size * 3}px rgba(52,211,153,0.4)`,
          }}
        />
      ))}
    </div>
  );
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function LoginPage() {
  const { login, register, sendPasswordReset, authLoading, authError, resetAuthError } = useAppStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('Porteiro');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const displayError = localError || authError;

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError('');
    resetAuthError();
    setResetSent(false);
    setPassword('');
    setNome('');
    setCpf('');
    setCargo('Porteiro');
  };

  // ── Login Handler ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Preencha todos os campos');
      return;
    }
    await login(email, password);
  };

  // ── Register Handler ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!nome || !email || !password) {
      setLocalError('Preencha todos os campos obrigatórios');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    await register(nome, email, password, cargo, cpf || undefined);
  };

  // ── Reset Password Handler ──
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email) {
      setLocalError('Informe seu email');
      return;
    }
    const success = await sendPasswordReset(email);
    if (success) {
      setResetSent(true);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #0a2e1f 0%, #061a12 40%, #030d09 100%)',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
      }}
    >
      {/* ── Animated Grid Background ── */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(52,211,153,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'grid-flow 4s linear infinite',
        }}
      />



      {/* ── Ambient Glow Spots ── */}
      <div
        className="absolute top-1/4 left-1/3 w-60 h-60 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          animation: 'glow-pulse 5s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
          animation: 'glow-pulse 6s ease-in-out infinite 2s',
        }}
      />

      {/* ── Floating Particles ── */}
      <TacticalParticles />



      {/* ── Main Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-36 h-36 rounded-[2rem] mb-4 relative"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(52,211,153,0.25)',
              boxShadow: '0 0 30px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)',
            }}
          >
            <img src="/icons/APEX_LOGO.png" alt="APEX Portaria Logo" className="w-24 h-24 object-contain" />
            {/* Pulse ring around logo */}
            <div
              className="absolute inset-0 rounded-[2rem] border border-emerald-400/30"
              style={{ animation: 'pulse-ring 2.5s ease-in-out infinite' }}
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-widest">APEX PORTARIA</h1>
          <p className="text-emerald-300/60 mt-1 text-xs tracking-[0.25em] uppercase">
            Sistema de Controle de Acesso
          </p>
        </div>

        {/* Card — FIXED theme (always dark tactical, independent of system theme) */}
        <div
          className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,30,22,0.95) 0%, rgba(6,20,14,0.98) 100%)',
            border: '1px solid rgba(52,211,153,0.15)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.05)',
          }}
        >
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {/* ── LOGIN MODE ── */}
              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-lg font-semibold text-emerald-50 mb-1">Bem-vindo</h2>
                  <p className="text-emerald-200/40 text-sm mb-6">Faça login para acessar o sistema</p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          style={{ colorScheme: 'dark' }}
                          disabled={authLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-10 bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          style={{ colorScheme: 'dark' }}
                          disabled={authLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/50 hover:text-emerald-400 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {displayError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm text-center bg-red-950/30 border border-red-800/30 rounded-lg p-2"
                      >
                        {displayError}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-11 font-semibold tracking-wider uppercase text-sm relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        border: '1px solid rgba(52,211,153,0.3)',
                        boxShadow: '0 0 20px rgba(16,185,129,0.2)',
                      }}
                    >
                      {authLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Entrando...
                        </span>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-emerald-400/70 hover:text-emerald-300 text-xs transition-colors flex items-center gap-1"
                    >
                      <KeyRound className="h-3 w-3" />
                      Esqueci a senha
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER MODE ── */}
              {mode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-300 text-xs mb-4 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Voltar ao login
                  </button>

                  <h2 className="text-lg font-semibold text-emerald-50 mb-1">Criar Conta</h2>
                  <p className="text-emerald-200/40 text-sm mb-6">Registre-se para acessar o sistema</p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">
                        Nome completo *
                      </Label>
                      <Input
                        type="text"
                        placeholder="Seu nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                        style={{ colorScheme: 'dark' }}
                        disabled={authLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">CPF</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          value={cpf}
                          onChange={(e) => setCpf(formatCpf(e.target.value))}
                          className="pl-9 bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          style={{ colorScheme: 'dark' }}
                          disabled={authLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          style={{ colorScheme: 'dark' }}
                          disabled={authLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-10 bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          style={{ colorScheme: 'dark' }}
                          disabled={authLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/50 hover:text-emerald-400 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">Cargo</Label>
                      <select
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        className="h-10 w-full rounded-md bg-emerald-950/40 border border-emerald-800/30 text-emerald-50 focus:border-emerald-500/50 focus:ring-emerald-500/20 focus:outline-none px-3 py-2 text-sm cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                        disabled={authLoading}
                      >
                        <option value="Porteiro" className="bg-emerald-950 text-emerald-50">PORTEIRO</option>
                        <option value="Supervisor" className="bg-emerald-950 text-emerald-50">SUPERVISOR</option>
                        <option value="Diretor" className="bg-emerald-950 text-emerald-50">DIRETOR</option>
                        <option value="RH" className="bg-emerald-950 text-emerald-50">RH</option>
                      </select>
                    </div>

                    {displayError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm text-center bg-red-950/30 border border-red-800/30 rounded-lg p-2"
                      >
                        {displayError}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-11 font-semibold tracking-wider uppercase text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        border: '1px solid rgba(52,211,153,0.3)',
                        boxShadow: '0 0 20px rgba(16,185,129,0.2)',
                      }}
                    >
                      {authLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Registrando...
                        </span>
                      ) : (
                        'Criar Conta'
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── RESET PASSWORD MODE ── */}
              {mode === 'reset' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-300 text-xs mb-4 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Voltar ao login
                  </button>

                  <h2 className="text-lg font-semibold text-emerald-50 mb-1">Recuperar Senha</h2>
                  <p className="text-emerald-200/40 text-sm mb-6">
                    Informe seu email para receber o link de redefinição
                  </p>

                  {resetSent ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
                        style={{
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid rgba(52,211,153,0.3)',
                        }}
                      >
                        <Mail className="w-8 h-8 text-emerald-400" />
                      </div>
                      <p className="text-emerald-200/80 text-sm">
                        Email de redefinição enviado para <strong className="text-emerald-100">{email}</strong>
                      </p>
                      <p className="text-emerald-200/40 text-xs">
                        Verifique sua caixa de entrada e spam
                      </p>
                      <Button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="mt-2"
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          border: '1px solid rgba(52,211,153,0.3)',
                        }}
                      >
                        Voltar ao login
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-emerald-200/60 text-xs tracking-wider uppercase">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-9 bg-emerald-950/40 border-emerald-800/30 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                            style={{ colorScheme: 'dark' }}
                            disabled={authLoading}
                          />
                        </div>
                      </div>

                      {displayError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-400 text-sm text-center bg-red-950/30 border border-red-800/30 rounded-lg p-2"
                        >
                          {displayError}
                        </motion.p>
                      )}

                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="w-full h-11 font-semibold tracking-wider uppercase text-sm"
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          border: '1px solid rgba(52,211,153,0.3)',
                          boxShadow: '0 0 20px rgba(16,185,129,0.2)',
                        }}
                      >
                        {authLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Enviando...
                          </span>
                        ) : (
                          'Enviar Link de Redefinição'
                        )}
                      </Button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-emerald-300/20 text-xs mt-6 tracking-widest uppercase">
          APEX Portaria v2.0 — DESENVOLVIDO POR APEX HUB
        </p>
      </motion.div>
    </div>
  );
}
