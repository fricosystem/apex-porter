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
    <div className="auth-particles absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
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
      className="auth-page relative flex min-h-screen w-full items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-0 lg:px-12 lg:py-8"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
      }}
    >
      <div className="auth-grid absolute inset-0" aria-hidden="true" />
      <div className="auth-orb auth-orb--top absolute rounded-full pointer-events-none" aria-hidden="true" />
      <div className="auth-orb auth-orb--bottom absolute rounded-full pointer-events-none" aria-hidden="true" />
      <TacticalParticles />

      {/* ── Desktop Presentation Panel ── */}
      <motion.section
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="auth-brand-panel relative z-10 hidden w-full flex-col self-stretch lg:flex"
        aria-label="Apresentação do APEX Portaria"
      >
        <div className="auth-brand-top">
          <div className="auth-logo-lockup">
            <div className="auth-logo-frame">
              <img src="/icons/APEX_LOGO_LIGHT.png" alt="APEX Portaria" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <p className="auth-brand-name">APEX PORTARIA</p>
              <p className="auth-brand-subtitle">Controle de acesso</p>
            </div>
          </div>
          <span className="auth-brand-status"><span /> Operação ativa</span>
        </div>

        <div className="auth-hero-copy">
          <p className="auth-eyebrow">
            <span className="auth-eyebrow-line" />
            Gestão que acompanha o seu ritmo
          </p>
          <h1>
            Mais controle para uma operação{' '}
            <span>mais inteligente.</span>
          </h1>
          <p className="auth-hero-description">
            Centralize acessos, registros e rotinas da portaria em uma experiência criada para tornar a operação mais segura, ágil e organizada todos os dias.
          </p>
        </div>

        <div className="auth-feature-grid">
          {[
            'Operação em tempo real',
            'Decisões mais rápidas',
            'Visão do seu negócio',
          ].map((item, index) => (
            <div key={item} className="auth-feature-card">
              <span className="auth-feature-index">0{index + 1}</span>
              <span className="auth-feature-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="auth-brand-footer">
          <span className="auth-footer-mark">APEX HUB <i /> SISTEMA OPERACIONAL</span>
          <p>© 2026 APEX Portaria</p>
        </div>
      </motion.section>

      {/* ── Main Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="auth-content-area relative z-10 w-full"
      >
        {/* Mobile brand */}
        <div className="auth-mobile-brand lg:hidden">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="auth-mobile-logo"
          >
            <img src="/icons/APEX_LOGO_LIGHT.png" alt="APEX Portaria" className="h-16 w-16 object-contain" />
          </motion.div>
          <div>
            <h1>APEX PORTARIA</h1>
            <p>Sistema de Controle de Acesso</p>
          </div>
        </div>

        <div className="auth-desktop-heading hidden lg:block">
          <p className="auth-section-kicker">Acesso ao sistema</p>
          <h2>Bem-vindo de volta!</h2>
          <p>Entre na sua conta para continuar operando.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-glow" aria-hidden="true" />
          <div className="auth-card-inner">
            <div className="auth-card-topline">
              <span className="auth-security-dot" />
              <span>Acesso protegido</span>
              <span className="auth-card-rule" />
              <span className="auth-card-code">APX / 01</span>
            </div>

            {/* ── LOGIN FORM ── */}
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-mobile-heading lg:hidden">
                <p className="auth-section-kicker">Acesso ao sistema</p>
                <h2>Bem-vindo de volta!</h2>
                <p>Entre na sua conta para continuar operando.</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form" noValidate>
                <div className="auth-field">
                  <Label htmlFor="email" className="auth-label">E-mail</Label>
                  <div className="auth-input-shell">
                    <Mail className="auth-input-icon" aria-hidden="true" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input pl-11"
                      style={{ colorScheme: 'light' }}
                      disabled={authLoading}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <Label htmlFor="password" className="auth-label">Senha</Label>
                  <div className="auth-input-shell">
                    <Lock className="auth-input-icon" aria-hidden="true" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input pl-11 pr-12"
                      style={{ colorScheme: 'light' }}
                      disabled={authLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-toggle"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {displayError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="auth-error"
                    role="alert"
                    aria-live="assertive"
                  >
                    <span className="auth-error-icon">!</span>
                    {displayError}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={authLoading || cooldownMs > 0}
                  className="auth-submit-button"
                  aria-busy={authLoading}
                >
                  {authLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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

            <div className="auth-terms">
              <span className="auth-terms-lock"><Lock className="h-3 w-3" aria-hidden="true" /></span>
              <p>Ao continuar, você concorda com os termos de uso e a política de privacidade do APEX Portaria.</p>
            </div>
          </div>
        </div>

        <p className="auth-mobile-footer lg:hidden">
          APEX Portaria v2.0 <span>·</span> DESENVOLVIDO POR APEX HUB
        </p>
      </motion.div>
    </div>
  );
}
