'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CalendarClock, Clock3, UserRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PreAutorizacao } from '@/lib/data';
import { getPreAutorizacaoDateTime } from '@/lib/pre-autorizacao-utils';

type Props = {
  items: PreAutorizacao[];
  onOpen: () => void;
};

function formatDocument(value: string): { label: string; value: string } {
  if (!value) return { label: 'RG/CPF', value: 'Documento não informado' };
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return {
      label: 'CPF',
      value: digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    };
  }
  return {
    label: 'RG',
    value: digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value,
  };
}

function formatCountdown(target: Date | null, now: number): { label: string; tone: 'normal' | 'late' | 'now' } {
  if (!target) return { label: 'Horário não informado', tone: 'normal' };
  const diff = target.getTime() - now;
  const absoluteMinutes = Math.floor(Math.abs(diff) / 60_000);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  if (Math.abs(diff) < 60_000) return { label: 'Chegada agora', tone: 'now' };
  if (diff < 0) {
    return {
      label: `Atrasado há ${hours ? `${hours}h ` : ''}${minutes}min`,
      tone: 'late',
    };
  }
  return {
    label: `Chega em ${hours ? `${hours}h ` : ''}${minutes}min`,
    tone: 'normal',
  };
}

export default function PreAutorizacaoBanner({ items, onOpen }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => {
      const aTime = getPreAutorizacaoDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = getPreAutorizacaoDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }),
    [items],
  );

  useEffect(() => {
    if (!orderedItems.length) return;
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, [orderedItems.length]);

  useEffect(() => {
    if (orderedItems.length <= 1 || dismissed) return;
    const carousel = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % orderedItems.length);
    }, 3000);
    return () => window.clearInterval(carousel);
  }, [dismissed, orderedItems.length]);

  if (!orderedItems.length || dismissed) return null;

  const safeIndex = Math.min(activeIndex, orderedItems.length - 1);
  const item = orderedItems[safeIndex];
  const document = formatDocument(item.visitanteDoc);
  const countdown = formatCountdown(getPreAutorizacaoDateTime(item), now);
  const horario = item.horarioPrevisto || 'Não informado';

  return (
    <section
      className="mx-4 mt-2 cursor-pointer overflow-hidden rounded-lg border border-orange-300/80 bg-orange-100/95 text-orange-950 shadow-sm outline-none transition-colors hover:bg-orange-200/90 focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-orange-800/70 dark:bg-orange-950/35 dark:text-orange-50 dark:hover:bg-orange-900/45 md:mx-6 xl:mx-6"
      aria-label="Abrir Pré-Autorização"
      aria-live="polite"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="relative flex min-h-[56px] items-center gap-2 px-2.5 py-1.5 sm:px-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-200/80 text-orange-700 dark:bg-orange-900/60 dark:text-orange-200">
          <CalendarClock className="size-4" />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              drag={orderedItems.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (orderedItems.length <= 1) return;
                if (info.offset.x < -60) {
                  setActiveIndex((current) => (current + 1) % orderedItems.length);
                } else if (info.offset.x > 60) {
                  setActiveIndex((current) => (current - 1 + orderedItems.length) % orderedItems.length);
                }
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-orange-700/80 dark:text-orange-200/80">
                <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" />Pré-autorização</span>
                {orderedItems.length > 1 && <span>{safeIndex + 1} / {orderedItems.length}</span>}
              </div>
              <div className="mt-0 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-[13px] leading-tight sm:text-sm">
                <span className="inline-flex min-w-0 items-center gap-1 font-bold">
                  <UserRound className="size-3 shrink-0" />
                  <span className="truncate">{item.visitanteNome || 'Visitante não informado'}</span>
                </span>
                <span className="hidden text-orange-700/50 sm:inline dark:text-orange-200/50">·</span>
                <span className="font-medium">{document.label} {document.value}</span>
                <span className="hidden text-orange-700/50 sm:inline dark:text-orange-200/50">·</span>
                <span className="inline-flex min-w-0 items-center gap-1 font-medium">
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{item.visitanteEmpresa || 'Empresa não informada'}</span>
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[10px] text-orange-800/80 dark:text-orange-100/80">
                <span className="inline-flex items-center gap-1 font-semibold"><Clock3 className="size-3" />Visita às {horario}</span>
                <Badge
                  variant="outline"
                  className={
                    countdown.tone === 'late'
                      ? 'h-4 px-1.5 text-[9px] border-red-400 bg-red-100/80 text-red-700 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200'
                      : countdown.tone === 'now'
                        ? 'h-4 px-1.5 text-[9px] border-emerald-400 bg-emerald-100/80 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'h-4 px-1.5 text-[9px] border-orange-400 bg-orange-200/70 text-orange-800 dark:border-orange-700 dark:bg-orange-900/50 dark:text-orange-100'
                  }
                >
                  {countdown.label}
                </Badge>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-full text-orange-800 hover:bg-orange-200/80 hover:text-orange-950 dark:text-orange-100 dark:hover:bg-orange-900/60 dark:hover:text-white"
          aria-label="Ocultar faixa de pré-autorização"
          onClick={(event) => {
            event.stopPropagation();
            setDismissed(true);
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </section>
  );
}
