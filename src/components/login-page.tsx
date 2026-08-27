'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { requestNotificationPermissionOnAuth } from '@/lib/notifications';
import { formatLoginCooldown, getLoginRateLimitStatus } from '@/lib/auth-rate-limit';

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
        size: 1.5 + pseudoRandom4,
      };
    }), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-emerald-600"
          style={{
            left: p.left,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float-particle ${p.duration} ${p.delay} infinite linear`,
            boxShadow: `0 0 ${p.size * 4}px rgba(16,185,129,0.85)`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login, authLoading, authError } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    const updateCooldown = () => setCooldownMs(getLoginRateLimitStatus().retryAfterMs);
    updateCooldown();
    const timer = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const displayError = localError || authError;

  // ── Login Handler ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Preencha todos os campos');
      return;
    }
    // Solicita a permissão no gesto explícito de login; o token é sincronizado
    // pelo store somente depois que a autenticação for confirmada.
    await requestNotificationPermissionOnAuth().catch(() => 'denied');
    await login(email, password);
    setCooldownMs(getLoginRateLimitStatus().retryAfterMs);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-0 lg:px-12 lg:py-8"
      style={{
        background: '#ffffff',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
      }}
    >
      {/* ── Animated Grid Background ── */}
      <div
        className="absolute inset-0 opacity-[0.065]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(5,150,105,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.55) 1px, transparent 1px)',
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



      {/* ── Desktop Presentation Panel ── */}
      <motion.section
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 hidden w-full max-w-xl flex-1 flex-col justify-between self-stretch py-4 lg:flex lg:max-w-none lg:w-full lg:border-r lg:border-emerald-800/25 lg:pr-12 xl:py-8"
      >
        <div>
          <div className="relative z-20 mb-14 flex items-center gap-3 xl:mb-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-950/40 shadow-[0_0_28px_rgba(16,185,129,0.12)]">
              <img src="/icons/APEX_LOGO_LIGHT.png" alt="APEX Portaria" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-[0.2em] text-emerald-950">APEX PORTARIA</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-emerald-800/80">Controle de acesso</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800/85">
              <span className="h-px w-8 bg-emerald-600/80" />
              Gestão que acompanha o seu ritmo
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.04] tracking-tight text-emerald-950 xl:text-6xl">
              Mais controle para uma operação{' '}
              <span className="text-emerald-600">mais inteligente.</span>
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-900/75 xl:text-lg">
              Centralize acessos, registros e rotinas da portaria em uma experiência criada para tornar a operação mais segura, ágil e organizada todos os dias.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              'Operação em tempo real',
              'Decisões mais rápidas',
              'Visão do seu negócio',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-emerald-700/25 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-950/85">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs tracking-wide text-emerald-800/70">© 2026 APEX Portaria · DESENVOLVIDO POR APEX HUB</p>
      </motion.section>

      {/* ── Main Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md lg:flex lg:w-full lg:max-w-xl lg:flex-col lg:justify-center lg:justify-self-center lg:max-h-[calc(100vh-4rem)] lg:pl-16 lg:pr-8 lg:py-8 lg:overflow-y-auto lg:scrollbar-none"
      >
        {/* Logo */}
        <div className="text-center mb-8 lg:hidden">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="relative z-20 inline-flex items-center justify-center w-36 h-36 rounded-[2rem] mb-4"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(52,211,153,0.25)',
              boxShadow: '0 0 30px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)',
            }}
          >
            <img src="/icons/APEX_LOGO_LIGHT.png" alt="APEX Portaria Logo" className="w-24 h-24 object-contain" />
            {/* Pulse ring around logo */}
            <div
              className="absolute inset-0 rounded-[2rem] border border-emerald-400/30"
              style={{ animation: 'pulse-ring 2.5s ease-in-out infinite' }}
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-emerald-950 tracking-widest">APEX PORTARIA</h1>
          <p className="text-emerald-700/70 mt-1 text-xs tracking-[0.25em] uppercase">
            Sistema de Controle de Acesso
          </p>
        </div>

        <div className="mb-6 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800/85">
            Acesso ao sistema
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-emerald-950 xl:text-4xl">
            Bem-vindo!
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-900/75">
            Entre na sua conta para continuar operando.
          </p>
        </div>

        {/* Card — light theme with emerald accents, independent of system theme */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 lg:rounded-[1.5rem] lg:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(236,253,245,0.98) 100%)',
            border: '1px solid rgba(16,185,129,0.22)',
            boxShadow: '0 25px 60px rgba(15,23,42,0.12), 0 0 40px rgba(16,185,129,0.1)',
          }}
        >
          <div className="relative z-10">
            {/* ── LOGIN FORM ── */}
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-semibold tracking-tight text-emerald-950 mb-1 lg:hidden">Bem-vindo!</h2>
                  <p className="text-emerald-900/75 text-sm mb-7 lg:hidden">Entre na sua conta para continuar operando.</p>

                  <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
                    <div className="space-y-2">
                      <Label className="text-emerald-900/90 text-xs tracking-wider uppercase">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 bg-emerald-50/80 border-emerald-300 text-emerald-950 placeholder:text-emerald-700/70 focus:border-emerald-600/70 focus:ring-emerald-600/25"
                          style={{ colorScheme: 'light' }}
                          disabled={authLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-emerald-900/90 text-xs tracking-wider uppercase">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-10 bg-emerald-50/80 border-emerald-300 text-emerald-950 placeholder:text-emerald-700/70 focus:border-emerald-600/70 focus:ring-emerald-600/25"
                          style={{ colorScheme: 'light' }}
                          disabled={authLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/80 hover:text-black transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {displayError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-700 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-2"
                      >
                        {displayError}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      disabled={authLoading || cooldownMs > 0}
                      className="w-full h-11 lg:h-12 font-semibold tracking-wider uppercase text-sm relative overflow-hidden"
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
                      ) : cooldownMs > 0 ? (
                        `Aguarde ${formatLoginCooldown(cooldownMs)}`
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>

                </motion.div>
            <div className="mt-6 hidden border-t border-emerald-800/20 pt-4 lg:block">
              <p className="text-center text-[11px] leading-relaxed tracking-wide text-emerald-900/75">
                Ao continuar, você concorda com os termos de uso e a política de privacidade do APEX Portaria.
              </p>
            </div>
          </div>
        </div>
          <p className="text-center text-emerald-800/70 text-xs mt-6 tracking-widest uppercase lg:hidden">
          APEX Portaria v2.0 — DESENVOLVIDO POR APEX HUB
        </p>
      </motion.div>
    </div>
  );
}
