'use client';

import React, { useState } from 'react';

import { Settings, LogOut, User as UserIcon, Ticket } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSignalStrength, type SignalLevel } from '@/lib/hooks/use-signal-strength';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { extractUnifiedFromRecord, mapToFormFields } from './registro-modal';
import { type CategoriaFluxo } from '@/lib/data';
import { toast } from 'sonner';
import { X } from 'lucide-react';

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
  const { user, setCurrentPage, logout, pessoas, registrosFluxo, setTicketModalOpen, ticketModalOpen, openRegistroModalWithPrefill } = useAppStore();
  const [ticketInput, setTicketInput] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleTicketSubmit = () => {
    if (!ticketInput.trim()) {
      toast.error('Digite o código do ticket');
      return;
    }
    
    // Process ticket input: remove any non-digit characters, since tickets are DDMNX (digits only)
    const processedTicket = ticketInput.trim().replace(/\D/g, '');

    // Find the pessoa with this ticket
    const pessoa = pessoas.find(p => p.ticket === processedTicket);
    if (!pessoa) {
      toast.error('Ticket não encontrado');
      return;
    }

    // Find the last record for this pessoa (match by CPF)
    const pessoaCpfLimpo = pessoa.rgCpf.replace(/\D/g, '');
    const lastRecord = registrosFluxo.filter(r => {
      const recordDoc = extractUnifiedFromRecord(r).doc.replace(/\D/g, '');
      return recordDoc === pessoaCpfLimpo;
    }).sort((a, b) => {
      // Sort by date (DD/MM/YYYY) and time (HH:MM)
      const [aDay, aMonth, aYear] = (a as any).data?.split('/').map(Number) || [0, 0, 0];
      const [aHour, aMin] = (a as any).horarioEntrada?.split(':').map(Number) || [0, 0];
      const aDate = new Date(aYear, aMonth - 1, aDay, aHour, aMin);
      
      const [bDay, bMonth, bYear] = (b as any).data?.split('/').map(Number) || [0, 0, 0];
      const [bHour, bMin] = (b as any).horarioEntrada?.split(':').map(Number) || [0, 0];
      const bDate = new Date(bYear, bMonth - 1, bDay, bHour, bMin);

      return bDate.getTime() - aDate.getTime();
    })[0];

    if (lastRecord) {
      // Extract data from last record
      const unifiedData = extractUnifiedFromRecord(lastRecord);
      const formFields = mapToFormFields(lastRecord.categoria, unifiedData);
      
      // Add current date and time
      formFields.data = format(new Date(), 'dd/MM/yyyy');
      formFields.horarioEntrada = format(new Date(), 'HH:mm');
      formFields.porteiro = user?.nome || '';

      openRegistroModalWithPrefill({
        categoria: lastRecord.categoria,
        formData: formFields
      });
    } else {
      toast.info('Nenhum registro anterior encontrado para este ticket');
    }

    setTicketModalOpen(false);
    setTicketInput('');
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
    <>
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
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-white/10 h-9 w-9"
              onClick={() => setTicketModalOpen(true)}
            >
              <Ticket className="h-5 w-5" />
            </Button>
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

      {/* Ticket Modal */}
      <Dialog open={ticketModalOpen} onOpenChange={(v) => setTicketModalOpen(v)}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-background rounded-lg border shadow-lg p-4"
          >
            <DialogTitle className="flex items-center gap-2 text-sm font-medium mb-3">
              <Ticket className="h-5 w-5 text-emerald-600" />
              Usar Ticket
            </DialogTitle>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticketInput">Código do Ticket</Label>
                <Input
                  id="ticketInput"
                  placeholder="DDMNX (ex: 03101)"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTicketSubmit();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTicketModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleTicketSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  Usar Ticket
                </Button>
              </div>
            </div>
            <DialogPrimitive.Close className="absolute top-3 right-3 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-muted">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
