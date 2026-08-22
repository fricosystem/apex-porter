import type { PreAutorizacao } from './data';

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateParts(value: string | undefined): DateParts | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const match = slashMatch
    ? { day: Number(slashMatch[1]), month: Number(slashMatch[2]), year: Number(slashMatch[3]) }
    : isoMatch
      ? { year: Number(isoMatch[1]), month: Number(isoMatch[2]), day: Number(isoMatch[3]) }
      : null;

  if (!match || match.month < 1 || match.month > 12 || match.day < 1 || match.day > 31) {
    return null;
  }

  const validationDate = new Date(match.year, match.month - 1, match.day);
  if (
    validationDate.getFullYear() !== match.year
    || validationDate.getMonth() !== match.month - 1
    || validationDate.getDate() !== match.day
  ) {
    return null;
  }

  return match;
}

export function isPreAutorizacaoToday(
  preAutorizacao: PreAutorizacao,
  referenceDate = new Date(),
): boolean {
  const parts = parseDateParts(preAutorizacao.dataPrevista);
  if (!parts) return false;

  return parts.year === referenceDate.getFullYear()
    && parts.month === referenceDate.getMonth() + 1
    && parts.day === referenceDate.getDate();
}

export function getPreAutorizacaoDateTime(preAutorizacao: PreAutorizacao): Date | null {
  const parts = parseDateParts(preAutorizacao.dataPrevista);
  const time = String(preAutorizacao.horarioPrevisto ?? '').trim();
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);

  if (!parts || !timeMatch) return null;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (hours > 23 || minutes > 59) return null;

  const date = new Date(parts.year, parts.month - 1, parts.day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPreAutorizacaoPendente(preAutorizacao: PreAutorizacao): boolean {
  return preAutorizacao.status === 'agendado' && !preAutorizacao.registroFluxoId;
}

export function getPreAutorizacoesPendentesDoDia(
  preAutorizacoes: PreAutorizacao[],
  referenceDate = new Date(),
): PreAutorizacao[] {
  return preAutorizacoes
    .filter((preAutorizacao) => (
      isPreAutorizacaoPendente(preAutorizacao)
      && isPreAutorizacaoToday(preAutorizacao, referenceDate)
    ))
    .sort((a, b) => {
      const aTime = getPreAutorizacaoDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = getPreAutorizacaoDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}
