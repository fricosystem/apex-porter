import type {
  AchadosPerdidosItem,
  Aviso,
  ChecklistTurno,
  InspecaoDiaria,
  Lembrete,
  ListaNegraEntry,
  Ocorrencia,
  PageType,
  PreAutorizacao,
  RegistroChave,
  RegistroFluxo,
  RegistroVeiculo,
  Ronda,
  User,
} from './data';
import { expandRegistroIndividualmente } from './registro-individualizacao';
import { isPreAutorizacaoPendente } from './pre-autorizacao-utils';

export type PendingCountSource = {
  user: User | null;
  registrosFluxo: RegistroFluxo[];
  veiculos: RegistroVeiculo[];
  preAutorizacoes: PreAutorizacao[];
  ocorrencias: Ocorrencia[];
  rondas: Ronda[];
  checklists: ChecklistTurno[];
  inspecoes: InspecaoDiaria[];
  avisos: Aviso[];
  listaNegra: ListaNegraEntry[];
  achadosPerdidos: AchadosPerdidosItem[];
  lembretes: Lembrete[];
  registrosChaves: RegistroChave[];
};

export type PendingCounts = Partial<Record<PageType, number>>;

function countFluxoAbertos(registrosFluxo: RegistroFluxo[]): number {
  return registrosFluxo
    .filter((registro) => !registro.inativo)
    .flatMap(expandRegistroIndividualmente)
    .filter((registro) => !registro.horarioSaida)
    .length;
}

/**
 * Counts the actionable/pending items represented by each navigable screen.
 * The source arrays are populated by Firestore onSnapshot subscriptions, so
 * calling this function again after a snapshot yields the current count.
 */
export function getPendingCounts(source: PendingCountSource): PendingCounts {
  const userName = source.user?.nome || '';
  const postoId = source.user?.postoId;

  const counts: PendingCounts = {
    fluxo: countFluxoAbertos(source.registrosFluxo),
    correspondencias: source.registrosFluxo.filter(
      (registro) => registro.categoria === 'correspondencias' && !registro.horarioSaida,
    ).length,
    veiculos: source.veiculos.filter((veiculo) => !veiculo.horarioSaida).length,
    'pre-autorizacao': source.preAutorizacoes.filter(isPreAutorizacaoPendente).length,
    ocorrencias: source.ocorrencias.filter(
      (ocorrencia) => ocorrencia.status === 'aberta' || ocorrencia.status === 'em_andamento',
    ).length,
    ronda: source.rondas.filter((ronda) => (
      (!postoId || ronda.postoId === postoId)
      && (ronda.status === 'aguardando' || ronda.status === 'em_andamento')
    )).length,
    'checklist-turno': source.checklists.filter((checklist) => checklist.status === 'pendente').length,
    'inspecao-diaria': source.inspecoes.filter((inspecao) => inspecao.status === 'em_andamento').length,
    avisos: userName
      ? source.avisos.filter((aviso) => !(aviso.lidoPor || []).includes(userName)).length
      : 0,
    'lista-negra': source.listaNegra.filter((entry) => entry.status === 'ativo').length,
    'achados-perdidos': source.achadosPerdidos.filter((item) => item.status !== 'devolvido').length,
    lembretes: source.lembretes.filter((lembrete) => lembrete.ativo).length,
    chaves: source.registrosChaves.filter((registro) => !registro.horarioDevolucao).length,
  };

  return counts;
}

export function getPendingCount(counts: PendingCounts, page: PageType): number {
  return counts[page] || 0;
}

export function sumPendingCounts(counts: PendingCounts, pages: PageType[]): number {
  return pages.reduce((total, page) => total + getPendingCount(counts, page), 0);
}

export function shouldShowPendingBadge(count: number | undefined): count is number {
  return typeof count === 'number' && count > 0;
}

export function formatPendingCount(count: number): string {
  return String(count);
}
