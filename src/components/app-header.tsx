'use client';

import React from 'react';

import { Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSignalStrength, type SignalLevel } from '@/lib/hooks/use-signal-strength';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ── Signal Bars ─────────────────────────────────────────────────────────────
function SignalBars({ level }: { level: SignalLevel }) {
  const heights = ['30%', '50%', '70%', '100%'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
      {heights.map((h, i) => {
        const active = level > 0 && i < level;
        return (
          <div
            key={i}
            style={{
              width: '3px',
              height: h,
              borderRadius: '1px',
              backgroundColor: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
              transition: 'background-color 0.4s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ── Signal Indicator ─────────────────────────────────────────────────────────
function SignalIndicator() {
  const { level, label, latency } = useSignalStrength();

  const tooltipText = level === 0
    ? 'Sem conexão'
    : `${label}${latency !== null ? ` · ${latency}ms` : ''}`;

  return (
    <div
      title={tooltipText}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '5px',
        cursor: 'default',
      }}
    >
      <SignalBars level={level} />
      {latency !== null && level > 0 && (
        <span
          style={{
            fontSize: '9px',
            lineHeight: 1,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {latency}ms
        </span>
      )}
    </div>
  );
}

// ── App Header ───────────────────────────────────────────────────────────────
export default function AppHeader() {
  const { user, setCurrentPage, logout } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  const initials = user?.nome
    ? user.nome
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'US';

  return (
    <header
      className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          height: '56px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {/* Left: Logo + título */}
        <div className="flex items-center gap-2">
          <img
            src="/icons/APEX_LOGO.png"
            alt="APEX Porter Logo"
            className="h-9 w-9 md:h-10 md:w-10 object-contain drop-shadow-sm"
          />
          <div className="hidden sm:block">
            <p className="text-[11px] leading-tight opacity-85">
              Sistema de Registro
            </p>
          </div>
        </div>

        {/* Center: Indicador de sinal */}
        <SignalIndicator />

        {/* Right: Ações */}
        <div className="flex items-center gap-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 h-9 px-2 gap-2"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-white/20 text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm max-w-24 truncate font-medium">
                  {user?.nome || 'Usuário'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCurrentPage('perfil')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentPage('configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
