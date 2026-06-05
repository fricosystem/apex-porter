'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { onAuthChange, fetchUserProfile, ensureUserProfile } from '@/lib/auth';
import LoginPage from '@/components/login-page';
import DashboardPage from '@/components/dashboard-page';
import FluxoPage from '@/components/fluxo-page';
import RelatoriosPage from '@/components/relatorios-page';
import CadastrosPage from '@/components/cadastros-page';
import RamaisPage from '@/components/ramais-page';
import AvisosPage from '@/components/avisos-page';
import ListaNegraPage from '@/components/lista-negra-page';
import AchadosPerdidosPage from '@/components/achados-perdidos-page';
import ConfiguracoesPage from '@/components/configuracoes-page';
import CorrespondenciasPage from '@/components/correspondencias-page';
import VeiculosPage from '@/components/veiculos-page';
import PreAutorizacaoPage from '@/components/pre-autorizacao-page';
import OcorrenciasPage from '@/components/ocorrencias-page';
import RondaPage from '@/components/ronda-page';
import ChecklistTurnoPage from '@/components/checklist-turno-page';
import InspecaoDiariaPage from '@/components/inspecao-diaria-page';
import ProtocolosEmergenciaPage from '@/components/protocolos-emergencia-page';
import DepartamentosPage from '@/components/departamentos-page';
import EmpresasPage from '@/components/empresas-page';
import PerfilPage from '@/components/perfil-page';
import LembretesPage from '@/components/lembretes-page';
import AppHeader from '@/components/app-header';
import BottomNav from '@/components/bottom-nav';

function PageRenderer() {
  const { currentPage } = useAppStore();

  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    fluxo: <FluxoPage />,
    relatorios: <RelatoriosPage />,
    cadastros: <CadastrosPage />,
    departamentos: <DepartamentosPage />,
    empresas: <EmpresasPage />,
    ramais: <RamaisPage />,
    avisos: <AvisosPage />,
    'lista-negra': <ListaNegraPage />,
    'achados-perdidos': <AchadosPerdidosPage />,
    configuracoes: <ConfiguracoesPage />,
    perfil: <PerfilPage />,
    correspondencias: <CorrespondenciasPage />,
    veiculos: <VeiculosPage />,
    'pre-autorizacao': <PreAutorizacaoPage />,
    ocorrencias: <OcorrenciasPage />,
    ronda: <RondaPage />,
    'checklist-turno': <ChecklistTurnoPage />,
    'inspecao-diaria': <InspecaoDiariaPage />,
    'protocolos-emergencia': <ProtocolosEmergenciaPage />,
    lembretes: <LembretesPage />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {pages[currentPage] || <DashboardPage />}
      </motion.div>
    </AnimatePresence>
  );
}

// Particles for background animation
function TacticalParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => {
      // Use pseudo-random deterministic values based on index 'i' to avoid hydration mismatch
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

export default function Home() {
  const { isAuthenticated, currentPage, authInitialized, setAuthFromFirebase, settings } = useAppStore();
  const { setTheme } = useTheme();
  const [showLoading, setShowLoading] = useState(true);

  // Force minimum 4 seconds loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // ── Theme management and schedule synchronization ──
  useEffect(() => {
    const root = document.documentElement;

    const checkTimeGlobal = () => {
      if (settings.themePreference === 'dark-apex') {
        setTheme('dark');
        requestAnimationFrame(() => {
          root.classList.add('dark-apex');
        });
        return;
      }

      if (!settings.autoTheme || settings.fixedTheme) {
        // If not in auto mode, just ensure correct class based on themePreference
        root.classList.remove('dark-apex');
        if (settings.themePreference === 'dark') {
          setTheme('dark');
        } else if (settings.themePreference === 'light') {
          setTheme('light');
        }
        return;
      }

      // Auto mode schedule calculation
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = settings.darkModeStart.split(':').map(Number);
      const [endH, endM] = settings.darkModeEnd.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      let isDarkTime: boolean;
      if (startMinutes > endMinutes) {
        isDarkTime = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      } else {
        isDarkTime = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }

      root.classList.remove('dark-apex');
      if (isDarkTime) {
        const chosenDark = settings.autoDarkTheme || 'dark';
        setTheme('dark');
        if (chosenDark === 'dark-apex') {
          requestAnimationFrame(() => {
            root.classList.add('dark-apex');
          });
        }
      } else {
        setTheme('light');
      }
    };

    checkTimeGlobal();
    const interval = setInterval(checkTimeGlobal, 60000);
    return () => clearInterval(interval);
  }, [
    settings.themePreference,
    settings.autoTheme,
    settings.fixedTheme,
    settings.darkModeStart,
    settings.darkModeEnd,
    settings.autoDarkTheme,
    setTheme
  ]);

  // ── Firebase Auth State Observer ──
  // Restores session on page refresh (persists login via Firebase Auth)
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch profile from Firestore
        // fetchUserProfile returns null if document doesn't exist or on error
        const profile = await fetchUserProfile(firebaseUser.uid);

        if (!profile) {
          // Profile missing in Firestore — try to create it
          // This handles the case where registration created Auth user but Firestore write failed
          const nome = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';
          const email = firebaseUser.email || '';
          await ensureUserProfile(firebaseUser.uid, { nome, email, senha: '******' });
        }

        setAuthFromFirebase(firebaseUser, profile);
      } else {
        // User is signed out — the store already handles this via logout()
        // Only reset authInitialized if it hasn't been set yet (first load with no session)
        const state = useAppStore.getState();
        if (!state.authInitialized) {
          useAppStore.setState({ authInitialized: true, isAuthenticated: false, user: null });
        }
      }
    });

    return () => unsubscribe();
  }, [setAuthFromFirebase]);

  // Show loading while Firebase Auth initializes (first load) or during 4s forced delay
  if (!authInitialized || showLoading) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-between p-4 relative overflow-hidden"
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

        {/* Top spacer */}
        <div className="flex-1" />

        {/* Center: Logo and Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-36 h-36 rounded-[2rem] mb-4 relative"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(52,211,153,0.25)',
              boxShadow: '0 0 30px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)',
            }}
          >
            <img src="/icons/APEX_LOGO.png" alt="APEX Portaria Logo" className="w-24 h-24 object-contain" />
            <div
              className="absolute inset-0 rounded-[2rem] border border-emerald-400/30"
              style={{ animation: 'pulse-ring 2.5s ease-in-out infinite' }}
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-widest">APEX PORTARIA</h1>
          <p className="text-emerald-300/60 mt-1 text-xs tracking-[0.25em] uppercase">
            Sistema de Controle de Acesso
          </p>
        </motion.div>

        {/* Bottom spacer */}
        <div className="flex-1 flex flex-col justify-end items-center mb-8 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"
            />
            <p className="text-emerald-300/60 text-xs tracking-[0.2em] uppercase">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentPage === 'login') {
    return <LoginPage />;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        <PageRenderer />
      </main>
      <BottomNav />
    </div>
  );
}
