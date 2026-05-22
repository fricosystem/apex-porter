'use client';

// ── Firestore Collection-Specific Functions ──
// Typed CRUD + real-time subscriptions for each collection
// Phase 2: empresas, departamentos, pessoas, ramais
// Phase 3: registrosFluxo, veiculos, preAutorizacoes
// Phase 4: ocorrencias, listaNegra, achadosPerdidos
// Phase 5: avisos
// Phase 6: rondas, checklists, inspecoes
// Phase 7: protocolos, ativacoes, config

import {
  subscribeCollection,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  type Unsubscribe,
  where,
} from './firestore';
import type {
  Empresa,
  Departamento,
  Pessoa,
  Ramal,
  RegistroFluxo,
  RegistroVeiculo,
  PreAutorizacao,
  Ocorrencia,
  ListaNegraEntry,
  AchadosPerdidosItem,
  Aviso,
  Ronda,
  ChecklistTurno,
  InspecaoDiaria,
  ProtocoloEmergencia,
  AtivacaoProtocolo,
  Lembrete,
} from './data';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPRESAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EMPRESAS_COL = 'empresas';

export function subscribeEmpresas(callback: (data: Empresa[]) => void): Unsubscribe {
  return subscribeCollection<Empresa>(EMPRESAS_COL, callback);
}

export async function addEmpresa(data: Omit<Empresa, 'id'>): Promise<string> {
  return addDocument(EMPRESAS_COL, data as Record<string, unknown>);
}

export async function setEmpresa(id: string, data: Omit<Empresa, 'id'>): Promise<void> {
  await setDocument(EMPRESAS_COL, id, data as Record<string, unknown>);
}

export async function updateEmpresa(id: string, data: Partial<Empresa>): Promise<void> {
  await updateDocument(EMPRESAS_COL, id, data);
}

export async function removeEmpresa(id: string): Promise<void> {
  await deleteDocument(EMPRESAS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEPARTAMENTOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEPARTAMENTOS_COL = 'departamentos';

export function subscribeDepartamentos(callback: (data: Departamento[]) => void): Unsubscribe {
  return subscribeCollection<Departamento>(DEPARTAMENTOS_COL, callback);
}

export async function addDepartamento(data: Omit<Departamento, 'id'>): Promise<string> {
  return addDocument(DEPARTAMENTOS_COL, data as Record<string, unknown>);
}

export async function setDepartamento(id: string, data: Omit<Departamento, 'id'>): Promise<void> {
  await setDocument(DEPARTAMENTOS_COL, id, data as Record<string, unknown>);
}

export async function updateDepartamento(id: string, data: Partial<Departamento>): Promise<void> {
  await updateDocument(DEPARTAMENTOS_COL, id, data);
}

export async function removeDepartamento(id: string): Promise<void> {
  await deleteDocument(DEPARTAMENTOS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PESSOAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PESSOAS_COL = 'pessoas';

export function subscribePessoas(callback: (data: Pessoa[]) => void): Unsubscribe {
  return subscribeCollection<Pessoa>(PESSOAS_COL, callback);
}

export async function addPessoa(data: Omit<Pessoa, 'id'>): Promise<string> {
  return addDocument(PESSOAS_COL, data as Record<string, unknown>);
}

export async function setPessoa(id: string, data: Omit<Pessoa, 'id'>): Promise<void> {
  await setDocument(PESSOAS_COL, id, data as Record<string, unknown>);
}

export async function updatePessoa(id: string, data: Partial<Pessoa>): Promise<void> {
  await updateDocument(PESSOAS_COL, id, data);
}

export async function removePessoa(id: string): Promise<void> {
  await deleteDocument(PESSOAS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RAMAIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RAMAIS_COL = 'ramais';

export function subscribeRamais(callback: (data: Ramal[]) => void): Unsubscribe {
  return subscribeCollection<Ramal>(RAMAIS_COL, callback);
}

export async function addRamal(data: Omit<Ramal, 'id'>): Promise<string> {
  return addDocument(RAMAIS_COL, data as Record<string, unknown>);
}

export async function setRamal(id: string, data: Omit<Ramal, 'id'>): Promise<void> {
  await setDocument(RAMAIS_COL, id, data as Record<string, unknown>);
}

export async function updateRamal(id: string, data: Partial<Ramal>): Promise<void> {
  await updateDocument(RAMAIS_COL, id, data);
}

export async function removeRamal(id: string): Promise<void> {
  await deleteDocument(RAMAIS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGISTROS DE FLUXO (Phase 3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const REGISTROS_FLUXO_COL = 'registrosFluxo';

export function subscribeRegistrosFluxo(callback: (data: RegistroFluxo[]) => void): Unsubscribe {
  return subscribeCollection<RegistroFluxo>(REGISTROS_FLUXO_COL, callback);
}

export async function addRegistroFluxo(data: Omit<RegistroFluxo, 'id'>): Promise<string> {
  return addDocument(REGISTROS_FLUXO_COL, data as Record<string, unknown>);
}

export async function setRegistroFluxo(id: string, data: Omit<RegistroFluxo, 'id'>): Promise<void> {
  await setDocument(REGISTROS_FLUXO_COL, id, data as Record<string, unknown>);
}

export async function updateRegistroFluxo(id: string, data: Partial<RegistroFluxo>): Promise<void> {
  await updateDocument(REGISTROS_FLUXO_COL, id, data);
}

export async function removeRegistroFluxo(id: string): Promise<void> {
  await deleteDocument(REGISTROS_FLUXO_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VEÍCULOS (Phase 3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VEICULOS_COL = 'veiculos';

export function subscribeVeiculos(callback: (data: RegistroVeiculo[]) => void): Unsubscribe {
  return subscribeCollection<RegistroVeiculo>(VEICULOS_COL, callback);
}

export async function addVeiculo(data: Omit<RegistroVeiculo, 'id'>): Promise<string> {
  return addDocument(VEICULOS_COL, data as Record<string, unknown>);
}

export async function setVeiculo(id: string, data: Omit<RegistroVeiculo, 'id'>): Promise<void> {
  await setDocument(VEICULOS_COL, id, data as Record<string, unknown>);
}

export async function updateVeiculo(id: string, data: Partial<RegistroVeiculo>): Promise<void> {
  await updateDocument(VEICULOS_COL, id, data);
}

export async function removeVeiculo(id: string): Promise<void> {
  await deleteDocument(VEICULOS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRÉ-AUTORIZAÇÕES (Phase 3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PRE_AUTORIZACOES_COL = 'preAutorizacoes';

export function subscribePreAutorizacoes(callback: (data: PreAutorizacao[]) => void): Unsubscribe {
  return subscribeCollection<PreAutorizacao>(PRE_AUTORIZACOES_COL, callback);
}

export async function addPreAutorizacao(data: Omit<PreAutorizacao, 'id'>): Promise<string> {
  return addDocument(PRE_AUTORIZACOES_COL, data as Record<string, unknown>);
}

export async function setPreAutorizacao(id: string, data: Omit<PreAutorizacao, 'id'>): Promise<void> {
  await setDocument(PRE_AUTORIZACOES_COL, id, data as Record<string, unknown>);
}

export async function updatePreAutorizacao(id: string, data: Partial<PreAutorizacao>): Promise<void> {
  await updateDocument(PRE_AUTORIZACOES_COL, id, data);
}

export async function removePreAutorizacao(id: string): Promise<void> {
  await deleteDocument(PRE_AUTORIZACOES_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCORRÊNCIAS (Phase 4)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OCORRENCIAS_COL = 'ocorrencias';

export function subscribeOcorrencias(callback: (data: Ocorrencia[]) => void): Unsubscribe {
  return subscribeCollection<Ocorrencia>(OCORRENCIAS_COL, callback);
}

export async function addOcorrencia(data: Omit<Ocorrencia, 'id'>): Promise<string> {
  return addDocument(OCORRENCIAS_COL, data as Record<string, unknown>);
}

export async function setOcorrencia(id: string, data: Omit<Ocorrencia, 'id'>): Promise<void> {
  await setDocument(OCORRENCIAS_COL, id, data as Record<string, unknown>);
}

export async function updateOcorrencia(id: string, data: Partial<Ocorrencia>): Promise<void> {
  await updateDocument(OCORRENCIAS_COL, id, data);
}

export async function removeOcorrencia(id: string): Promise<void> {
  await deleteDocument(OCORRENCIAS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LISTA NEGRA (Phase 4)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LISTA_NEGRA_COL = 'listaNegra';

export function subscribeListaNegra(callback: (data: ListaNegraEntry[]) => void): Unsubscribe {
  return subscribeCollection<ListaNegraEntry>(LISTA_NEGRA_COL, callback);
}

export async function addListaNegra(data: Omit<ListaNegraEntry, 'id'>): Promise<string> {
  return addDocument(LISTA_NEGRA_COL, data as Record<string, unknown>);
}

export async function setListaNegra(id: string, data: Omit<ListaNegraEntry, 'id'>): Promise<void> {
  await setDocument(LISTA_NEGRA_COL, id, data as Record<string, unknown>);
}

export async function updateListaNegra(id: string, data: Partial<ListaNegraEntry>): Promise<void> {
  await updateDocument(LISTA_NEGRA_COL, id, data);
}

export async function removeListaNegra(id: string): Promise<void> {
  await deleteDocument(LISTA_NEGRA_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACHADOS E PERDIDOS (Phase 4)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ACHADOS_PERDIDOS_COL = 'achadosPerdidos';

export function subscribeAchadosPerdidos(callback: (data: AchadosPerdidosItem[]) => void): Unsubscribe {
  return subscribeCollection<AchadosPerdidosItem>(ACHADOS_PERDIDOS_COL, callback);
}

export async function addAchadosPerdidos(data: Omit<AchadosPerdidosItem, 'id'>): Promise<string> {
  return addDocument(ACHADOS_PERDIDOS_COL, data as Record<string, unknown>);
}

export async function setAchadosPerdidos(id: string, data: Omit<AchadosPerdidosItem, 'id'>): Promise<void> {
  await setDocument(ACHADOS_PERDIDOS_COL, id, data as Record<string, unknown>);
}

export async function updateAchadosPerdidos(id: string, data: Partial<AchadosPerdidosItem>): Promise<void> {
  await updateDocument(ACHADOS_PERDIDOS_COL, id, data);
}

export async function removeAchadosPerdidos(id: string): Promise<void> {
  await deleteDocument(ACHADOS_PERDIDOS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AVISOS / MURAIS (Phase 5)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AVISOS_COL = 'avisos';

export function subscribeAvisos(callback: (data: Aviso[]) => void): Unsubscribe {
  return subscribeCollection<Aviso>(AVISOS_COL, callback);
}

export async function addAviso(data: Omit<Aviso, 'id'>): Promise<string> {
  return addDocument(AVISOS_COL, data as Record<string, unknown>);
}

export async function setAviso(id: string, data: Omit<Aviso, 'id'>): Promise<void> {
  await setDocument(AVISOS_COL, id, data as Record<string, unknown>);
}

export async function updateAviso(id: string, data: Partial<Aviso>): Promise<void> {
  await updateDocument(AVISOS_COL, id, data);
}

export async function removeAviso(id: string): Promise<void> {
  await deleteDocument(AVISOS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RONDAS (Phase 6)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RONDAS_COL = 'rondas';

export function subscribeRondas(callback: (data: Ronda[]) => void): Unsubscribe {
  return subscribeCollection<Ronda>(RONDAS_COL, callback);
}

export async function addRonda(data: Omit<Ronda, 'id'>): Promise<string> {
  return addDocument(RONDAS_COL, data as Record<string, unknown>);
}

export async function setRonda(id: string, data: Omit<Ronda, 'id'>): Promise<void> {
  await setDocument(RONDAS_COL, id, data as Record<string, unknown>);
}

export async function updateRonda(id: string, data: Partial<Ronda>): Promise<void> {
  await updateDocument(RONDAS_COL, id, data);
}

export async function removeRonda(id: string): Promise<void> {
  await deleteDocument(RONDAS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHECKLISTS DE TURNO (Phase 6)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CHECKLISTS_COL = 'checklists';

export function subscribeChecklists(callback: (data: ChecklistTurno[]) => void): Unsubscribe {
  return subscribeCollection<ChecklistTurno>(CHECKLISTS_COL, callback);
}

export async function addChecklist(data: Omit<ChecklistTurno, 'id'>): Promise<string> {
  return addDocument(CHECKLISTS_COL, data as Record<string, unknown>);
}

export async function setChecklist(id: string, data: Omit<ChecklistTurno, 'id'>): Promise<void> {
  await setDocument(CHECKLISTS_COL, id, data as Record<string, unknown>);
}

export async function updateChecklist(id: string, data: Partial<ChecklistTurno>): Promise<void> {
  await updateDocument(CHECKLISTS_COL, id, data);
}

export async function removeChecklist(id: string): Promise<void> {
  await deleteDocument(CHECKLISTS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSPEÇÕES DIÁRIAS (Phase 6)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const INSPECOES_COL = 'inspecoes';

export function subscribeInspecoes(callback: (data: InspecaoDiaria[]) => void): Unsubscribe {
  return subscribeCollection<InspecaoDiaria>(INSPECOES_COL, callback);
}

export async function addInspecao(data: Omit<InspecaoDiaria, 'id'>): Promise<string> {
  return addDocument(INSPECOES_COL, data as Record<string, unknown>);
}

export async function setInspecao(id: string, data: Omit<InspecaoDiaria, 'id'>): Promise<void> {
  await setDocument(INSPECOES_COL, id, data as Record<string, unknown>);
}

export async function updateInspecao(id: string, data: Partial<InspecaoDiaria>): Promise<void> {
  await updateDocument(INSPECOES_COL, id, data);
}

export async function removeInspecao(id: string): Promise<void> {
  await deleteDocument(INSPECOES_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTOCOLOS DE EMERGÊNCIA (Phase 7)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PROTOCOLOS_COL = 'protocolos';

export function subscribeProtocolos(callback: (data: ProtocoloEmergencia[]) => void): Unsubscribe {
  return subscribeCollection<ProtocoloEmergencia>(PROTOCOLOS_COL, callback);
}

export async function addProtocolo(data: Omit<ProtocoloEmergencia, 'id'>): Promise<string> {
  return addDocument(PROTOCOLOS_COL, data as Record<string, unknown>);
}

export async function setProtocolo(id: string, data: Omit<ProtocoloEmergencia, 'id'>): Promise<void> {
  await setDocument(PROTOCOLOS_COL, id, data as Record<string, unknown>);
}

export async function updateProtocolo(id: string, data: Partial<ProtocoloEmergencia>): Promise<void> {
  await updateDocument(PROTOCOLOS_COL, id, data);
}

export async function removeProtocolo(id: string): Promise<void> {
  await deleteDocument(PROTOCOLOS_COL, id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATIVAÇÕES DE PROTOCOLO (Phase 7)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ATIVACOES_COL = 'ativacoes';

export function subscribeAtivacoes(callback: (data: AtivacaoProtocolo[]) => void): Unsubscribe {
  return subscribeCollection<AtivacaoProtocolo>(ATIVACOES_COL, callback);
}

export async function addAtivacao(data: Omit<AtivacaoProtocolo, 'id'>): Promise<string> {
  return addDocument(ATIVACOES_COL, data as Record<string, unknown>);
}

export async function setAtivacao(id: string, data: Omit<AtivacaoProtocolo, 'id'>): Promise<void> {
  await setDocument(ATIVACOES_COL, id, data as Record<string, unknown>);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURAÇÕES DO SISTEMA (Phase 7)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// The `config` collection uses named documents (key-value style):
//   config/itens_inspecao   → { itens: string[] }
//   config/itens_checklist  → { itens: string[] }
//   config/pontos_ronda     → { pontos: string[] }
//   config/rotas_ronda      → { rotas: string[] }

export interface ConfigItens {
  itens?: string[];
  pontos?: string[];
  rotas?: string[];
}

const CONFIG_COL = 'config';

export async function getConfig(key: string): Promise<ConfigItens | null> {
  return getDocument<ConfigItens>(CONFIG_COL, key);
}

export async function setConfig(key: string, data: ConfigItens): Promise<void> {
  await setDocument(CONFIG_COL, key, data as Record<string, unknown>);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEMBRETES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LEMBRETES_COL = 'lembretes';

export function subscribeLembretes(
  usuarioEmail: string,
  callback: (data: Lembrete[]) => void
): Unsubscribe {
  return subscribeCollection<Lembrete>(
    LEMBRETES_COL,
    callback,
    where('usuarioEmail', '==', usuarioEmail)
  );
}

export async function addLembrete(data: Omit<Lembrete, 'id'>): Promise<string> {
  return addDocument(LEMBRETES_COL, data as Record<string, unknown>);
}

export async function setLembrete(id: string, data: Omit<Lembrete, 'id'>): Promise<void> {
  await setDocument(LEMBRETES_COL, id, data as Record<string, unknown>);
}

export async function updateLembrete(id: string, data: Partial<Lembrete>): Promise<void> {
  await updateDocument(LEMBRETES_COL, id, data);
}

export async function removeLembrete(id: string): Promise<void> {
  await deleteDocument(LEMBRETES_COL, id);
}
