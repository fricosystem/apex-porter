'use client';

/**
 * Zustand Slice Pattern — Slices do AppStore
 *
 * Cada slice concentra o estado e as actions de um domínio específico.
 * O store principal em store.ts compõe todos eles com Object.assign().
 */

import { format } from 'date-fns';
import type {
  PageType,
  CategoriaFluxo,
  RegistroFluxo,
  Empresa,
  Departamento,
  Pessoa,
  Ramal,
  Posto,
  Cargo,
  Aviso,
  ListaNegraEntry,
  AchadosPerdidosItem,
  User,
  RegistroVeiculo,
  PreAutorizacao,
  Ocorrencia,
  Ronda,
  ChecklistTurno,
  InspecaoDiaria,
  ProtocoloEmergencia,
  AtivacaoProtocolo,
  Lembrete,
  RotaGeoreferenciada,
} from './data';
import type { FirestoreUser } from './auth';
import type { User as FirebaseUser } from 'firebase/auth';

// ─── Re-exports de tipo para que o store.ts importe de um único lugar ─────────
export type AppSettings = {
  autoTheme: boolean;
  themePreference?: 'light' | 'dark' | 'dark-apex' | 'auto';
  darkModeStart: string;
  darkModeEnd: string;
  fixedTheme: boolean;
  autoDarkTheme?: 'dark' | 'dark-apex';
};

export type SystemConfig = {
  itensInspecao: string[];
  itensChecklist: string[];
  pontosRonda: string[];
  rotasRonda: string[];
};

// ─── Tipos de cada slice ──────────────────────────────────────────────────────

export type NavigationSlice = {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
};

export type AuthSlice = {
  isAuthenticated: boolean;
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  authInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (nome: string, email: string, password: string, cargo?: string, cpf?: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  resetAuthError: () => void;
  sendPasswordReset: (email: string) => Promise<boolean>;
  setAuthFromFirebase: (firebaseUser: FirebaseUser, firestoreData?: FirestoreUser | null) => void;
};

export type FluxoSlice = {
  categoriaAtiva: CategoriaFluxo | 'todos';
  setCategoriaAtiva: (cat: CategoriaFluxo | 'todos') => void;
  registrosFluxo: RegistroFluxo[];
  addRegistroFluxo: (registro: RegistroFluxo) => void;
  inativarRegistroFluxo: (id: string, versaoNovaId?: string, motivoRefacao?: string) => void;
  registrarSaida: (id: string, detalhes?: string, ocorrencia?: string, pesoSaida?: number, porteiroSaida?: string) => void;
  buscaFluxo: string;
  setBuscaFluxo: (busca: string) => void;
  rascunhosFluxo: RegistroFluxo[];
  addRascunhoFluxo: (registro: RegistroFluxo) => void;
  updateRascunhoFluxo: (registro: RegistroFluxo) => void;
  removeRascunhoFluxo: (id: string) => void;
  ticketModalOpen: boolean;
  setTicketModalOpen: (open: boolean) => void;
  prefilledRegistroModal: { categoria?: CategoriaFluxo; formData?: Record<string, string> } | null;
  openRegistroModalWithPrefill: (data: { categoria: CategoriaFluxo; formData: Record<string, string> }) => void;
  clearPrefilledRegistroModal: () => void;
};

export type CadastrosSlice = {
  empresas: Empresa[];
  addEmpresa: (empresa: Empresa) => void;
  removeEmpresa: (id: string) => void;
  updateEmpresa: (empresa: Empresa) => void;
  departamentos: Departamento[];
  addDepartamento: (dep: Departamento) => void;
  removeDepartamento: (id: string) => void;
  updateDepartamento: (dep: Departamento) => void;
  pessoas: Pessoa[];
  addPessoa: (pessoa: Pessoa) => void;
  removePessoa: (id: string) => void;
  updatePessoa: (pessoa: Pessoa) => void;
  ramais: Ramal[];
  addRamal: (ramal: Ramal) => void;
  removeRamal: (id: string) => void;
  updateRamal: (ramal: Ramal) => void;
  buscaRamais: string;
  setBuscaRamais: (busca: string) => void;
  postos: Posto[];
  addPosto: (posto: Posto) => void;
  removePosto: (id: string) => void;
  updatePosto: (posto: Posto) => void;
  cargos: Cargo[];
  addCargo: (cargo: Cargo) => void;
  removeCargo: (id: string) => void;
  updateCargo: (cargo: Cargo) => void;
};

export type SegurancaSlice = {
  avisos: Aviso[];
  addAviso: (aviso: Aviso) => void;
  removeAviso: (id: string) => void;
  confirmarLeituraAviso: (id: string, porteiroNome: string) => void;
  toggleFixarAviso: (id: string) => void;
  listaNegra: ListaNegraEntry[];
  addListaNegra: (entry: ListaNegraEntry) => void;
  removeListaNegra: (id: string) => void;
  updateListaNegra: (entry: ListaNegraEntry) => void;
  achadosPerdidos: AchadosPerdidosItem[];
  addAchadosPerdidos: (item: AchadosPerdidosItem) => void;
  removeAchadosPerdidos: (id: string) => void;
  updateAchadosPerdidos: (item: AchadosPerdidosItem) => void;
  veiculos: RegistroVeiculo[];
  addVeiculo: (veiculo: RegistroVeiculo) => void;
  registrarSaidaVeiculo: (id: string, observacoes?: string) => void;
  removeVeiculo: (id: string) => void;
  preAutorizacoes: PreAutorizacao[];
  addPreAutorizacao: (pa: PreAutorizacao) => void;
  updatePreAutorizacao: (pa: PreAutorizacao) => void;
  cancelarPreAutorizacao: (id: string) => void;
  ocorrencias: Ocorrencia[];
  addOcorrencia: (oc: Ocorrencia) => void;
  updateOcorrencia: (oc: Ocorrencia) => void;
  removeOcorrencia: (id: string) => void;
};

export type RondasSlice = {
  rondas: Ronda[];
  addRonda: (ronda: Ronda) => void;
  updateRonda: (ronda: Ronda) => void;
  removeRonda: (id: string) => void;
  rotasGeoreferenciadas: RotaGeoreferenciada[];
  addRotaGeoreferenciada: (rota: RotaGeoreferenciada) => void;
  updateRotaGeoreferenciada: (rota: RotaGeoreferenciada) => void;
  removeRotaGeoreferenciada: (id: string) => void;
  checklists: ChecklistTurno[];
  addChecklist: (ck: ChecklistTurno) => void;
  updateChecklist: (ck: ChecklistTurno) => void;
  removeChecklist: (id: string) => void;
  inspecoes: InspecaoDiaria[];
  addInspecao: (inspecao: InspecaoDiaria) => void;
  updateInspecao: (inspecao: InspecaoDiaria) => void;
  removeInspecao: (id: string) => void;
  protocolos: ProtocoloEmergencia[];
  addProtocolo: (protocolo: ProtocoloEmergencia) => void;
  updateProtocolo: (protocolo: ProtocoloEmergencia) => void;
  removeProtocolo: (id: string) => void;
  ativacoes: AtivacaoProtocolo[];
  addAtivacao: (ativacao: AtivacaoProtocolo) => void;
};

export type ConfigSlice = {
  systemConfig: SystemConfig;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  lembretes: Lembrete[];
  addLembrete: (lembrete: Lembrete) => void;
  updateLembrete: (lembrete: Lembrete) => void;
  removeLembrete: (id: string) => void;
  usuarios: User[];
  addUsuario: (usuario: User) => void;
  updateUsuario: (usuario: User) => void;
  removeUsuario: (id: string) => void;
};

/** União de todos os slices — é o tipo completo do AppStore */
export type AppState =
  NavigationSlice &
  AuthSlice &
  FluxoSlice &
  CadastrosSlice &
  SegurancaSlice &
  RondasSlice &
  ConfigSlice;
