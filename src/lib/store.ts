'use client';

import { create } from 'zustand';
import { format } from 'date-fns';
import type { AppState } from './store-types';
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
import {
  signInWithEmail,
  signUpWithEmail,
  signOutFirebase,
  resetPassword,
  onAuthChange,
  fetchUserProfile,
  updateUserProfile,
  updateUltimoLogin,
  ensureUserProfile,
  getAuthErrorMessage,
  type FirestoreUser,
} from './auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeEmpresas,
  addEmpresa as addEmpresaFS,
  setEmpresa as setEmpresaFS,
  updateEmpresa as updateEmpresaFS,
  removeEmpresa as removeEmpresaFS,
  subscribeDepartamentos,
  addDepartamento as addDepartamentoFS,
  setDepartamento as setDepartamentoFS,
  updateDepartamento as updateDepartamentoFS,
  removeDepartamento as removeDepartamentoFS,
  subscribePessoas,
  addPessoa as addPessoaFS,
  setPessoa as setPessoaFS,
  updatePessoa as updatePessoaFS,
  removePessoa as removePessoaFS,
  subscribeRamais,
  addRamal as addRamalFS,
  setRamal as setRamalFS,
  updateRamal as updateRamalFS,
  removeRamal as removeRamalFS,
  subscribePostos,
  addPosto as addPostoFS,
  setPosto as setPostoFS,
  updatePosto as updatePostoFS,
  removePosto as removePostoFS,
  subscribeCargos,
  addCargo as addCargoFS,
  setCargo as setCargoFS,
  updateCargo as updateCargoFS,
  removeCargo as removeCargoFS,
  // Phase 3 — Fluxo + Veículos + Pré-Autorizações
  subscribeRegistrosFluxo,
  setRegistroFluxo as setRegistroFluxoFS,
  updateRegistroFluxo as updateRegistroFluxoFS,
  removeRegistroFluxo as removeRegistroFluxoFS,
  subscribeVeiculos,
  setVeiculo as setVeiculoFS,
  updateVeiculo as updateVeiculoFS,
  removeVeiculo as removeVeiculoFS,
  subscribePreAutorizacoes,
  setPreAutorizacao as setPreAutorizacaoFS,
  updatePreAutorizacao as updatePreAutorizacaoFS,
  removePreAutorizacao as removePreAutorizacaoFS,
  // Phase 4 — Ocorrências + Segurança
  subscribeOcorrencias,
  setOcorrencia as setOcorrenciaFS,
  updateOcorrencia as updateOcorrenciaFS,
  removeOcorrencia as removeOcorrenciaFS,
  subscribeListaNegra,
  setListaNegra as setListaNegraFS,
  updateListaNegra as updateListaNegraFS,
  removeListaNegra as removeListaNegraFS,
  subscribeAchadosPerdidos,
  setAchadosPerdidos as setAchadosPerdidosFS,
  updateAchadosPerdidos as updateAchadosPerdidosFS,
  removeAchadosPerdidos as removeAchadosPerdidosFS,
  // Phase 5 — Avisos
  subscribeAvisos,
  setAviso as setAvisoFS,
  updateAviso as updateAvisoFS,
  removeAviso as removeAvisoFS,
  // Phase 6 — Rondas + Checklists + Inspeções
  subscribeRondas,
  addRonda as addRondaFS,
  setRonda as setRondaFS,
  updateRonda as updateRondaFS,
  removeRonda as removeRondaFS,
  subscribeRotasGeoreferenciadas,
  addRotaGeoreferenciada as addRotaGeoreferenciadaFS,
  setRotaGeoreferenciada as setRotaGeoreferenciadaFS,
  updateRotaGeoreferenciada as updateRotaGeoreferenciadaFS,
  removeRotaGeoreferenciada as removeRotaGeoreferenciadaFS,
  subscribeChecklists,
  setChecklist as setChecklistFS,
  updateChecklist as updateChecklistFS,
  removeChecklist as removeChecklistFS,
  subscribeInspecoes,
  setInspecao as setInspecaoFS,
  updateInspecao as updateInspecaoFS,
  removeInspecao as removeInspecaoFS,
  // Phase 7 — Protocolos + Ativações + Config
  subscribeProtocolos,
  setProtocolo as setProtocoloFS,
  updateProtocolo as updateProtocoloFS,
  removeProtocolo as removeProtocoloFS,
  subscribeAtivacoes,
  setAtivacao as setAtivacaoFS,
  getConfig,
  setConfig,
  subscribeLembretes,
  addLembrete as addLembreteFS,
  setLembrete as setLembreteFS,
  updateLembrete as updateLembreteFS,
  removeLembrete as removeLembreteFS,
  subscribeUsuarios,
  addUsuario as addUsuarioFS,
  setUsuario as setUsuarioFS,
  updateUsuario as updateUsuarioFS,
  removeUsuario as removeUsuarioFS,
} from './firestore-collections';
import type { Unsubscribe } from './firestore';

interface AppSettings {
  autoTheme: boolean;
  themePreference?: 'light' | 'dark' | 'dark-apex' | 'auto';
  darkModeStart: string;
  darkModeEnd: string;
  fixedTheme: boolean;
  autoDarkTheme?: 'dark' | 'dark-apex';
}

// ── System config (loaded from Firestore config collection) ──
interface SystemConfig {
  itensInspecao: string[];
  itensChecklist: string[];
  pontosRonda: string[];
  rotasRonda: string[];
}

// Default config values (used if Firestore config doesn't exist yet)
import {
  ITENS_INSPECAO_PADRAO,
  ITENS_CHECKLIST_PADRAO,
  PONTOS_RONDA_PREDEFINIDOS,
  ROTAS_RONDA,
} from './data';

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  itensInspecao: ITENS_INSPECAO_PADRAO,
  itensChecklist: ITENS_CHECKLIST_PADRAO,
  pontosRonda: PONTOS_RONDA_PREDEFINIDOS,
  rotasRonda: ROTAS_RONDA,
};

async function loadSystemConfig() {
  const keys = ['itens_inspecao', 'itens_checklist', 'pontos_ronda', 'rotas_ronda'];
  const results = await Promise.all(keys.map((key) => getConfig(key)));

  const config: SystemConfig = {
    itensInspecao: (results[0]?.itens as string[]) || DEFAULT_SYSTEM_CONFIG.itensInspecao,
    itensChecklist: (results[1]?.itens as string[]) || DEFAULT_SYSTEM_CONFIG.itensChecklist,
    pontosRonda: (results[2]?.pontos as string[]) || DEFAULT_SYSTEM_CONFIG.pontosRonda,
    rotasRonda: (results[3]?.rotas as string[]) || DEFAULT_SYSTEM_CONFIG.rotasRonda,
  };

  useAppStore.setState({ systemConfig: config });
}

// Helper functions for rascunhos
const loadRascunhos = (): RegistroFluxo[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('rascunhosFluxo');
    if (saved) return JSON.parse(saved);
  }
  return [];
};

const saveRascunhos = (rascunhos: RegistroFluxo[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rascunhosFluxo', JSON.stringify(rascunhos));
  }
};

// ── Page group → Feature subscriptions mapping ──
// Maps a "feature group" to which pages use that data
const PAGE_FEATURE_MAP: Record<string, readonly string[]> = {
  fluxo:      ['fluxo', 'dashboard'],
  seguranca:  ['lista-negra', 'achados-perdidos', 'ocorrencias'],
  avisos:     ['avisos'],
  rondas:     ['rondas', 'admin'],
  checklists: ['checklist-turno', 'inspecao-diaria', 'admin'],
  protocolos: ['protocolos-emergencia', 'admin'],
  lembretes:  ['lembretes'],
  veiculos:   ['fluxo'],
};

// Active feature unsubscribe handles (keyed by feature group)
const featureUnsubs = new Map<string, Unsubscribe[]>();
// Core unsubscribe handles (always active while logged in)
let coreUnsubs: Unsubscribe[] = [];

function clearAllSubscriptions() {
  coreUnsubs.forEach((fn) => fn());
  coreUnsubs = [];
  featureUnsubs.forEach((fns) => fns.forEach((fn) => fn()));
  featureUnsubs.clear();
}

function startCoreSubscriptions() {
  coreUnsubs.forEach((fn) => fn());
  coreUnsubs = [];

  coreUnsubs.push(
    subscribeEmpresas((data) => useAppStore.setState({ empresas: data }))
  );
  coreUnsubs.push(
    subscribeDepartamentos((data) => useAppStore.setState({ departamentos: data }))
  );
  coreUnsubs.push(
    subscribePessoas((data) => useAppStore.setState({ pessoas: data }))
  );
  coreUnsubs.push(
    subscribeRamais((data) => useAppStore.setState({ ramais: data }))
  );
  coreUnsubs.push(
    subscribePostos((data) => useAppStore.setState({ postos: data }))
  );
  coreUnsubs.push(
    subscribeCargos((data) => useAppStore.setState({ cargos: data }))
  );
  coreUnsubs.push(
    subscribeUsuarios((data) => useAppStore.setState({ usuarios: data }))
  );
  // Lembretes depend on user email — wired up separately
  const state = useAppStore.getState();
  if (state.user?.email) {
    coreUnsubs.push(
      subscribeLembretes(state.user.email, (data) => useAppStore.setState({ lembretes: data }))
    );
  }

  // One-time config fetch
  loadSystemConfig().catch((err) => {
    console.warn('[Firestore] Falha ao carregar configurações do sistema:', err);
  });
}

function activateFeature(feature: string) {
  if (featureUnsubs.has(feature)) return; // already active

  const unsubs: Unsubscribe[] = [];

  switch (feature) {
    case 'fluxo':
    case 'veiculos':
      unsubs.push(
        subscribeRegistrosFluxo((data) => useAppStore.setState({ registrosFluxo: data }))
      );
      unsubs.push(
        subscribeVeiculos((data) => useAppStore.setState({ veiculos: data }))
      );
      unsubs.push(
        subscribePreAutorizacoes((data) => useAppStore.setState({ preAutorizacoes: data }))
      );
      break;

    case 'seguranca':
      unsubs.push(
        subscribeOcorrencias((data) => useAppStore.setState({ ocorrencias: data }))
      );
      unsubs.push(
        subscribeListaNegra((data) => useAppStore.setState({ listaNegra: data }))
      );
      unsubs.push(
        subscribeAchadosPerdidos((data) => useAppStore.setState({ achadosPerdidos: data }))
      );
      break;

    case 'avisos':
      unsubs.push(
        subscribeAvisos((data) => useAppStore.setState({ avisos: data }))
      );
      break;

    case 'rondas':
      unsubs.push(
        subscribeRondas((data) => useAppStore.setState({ rondas: data }))
      );
      unsubs.push(
        subscribeRotasGeoreferenciadas((data) => useAppStore.setState({ rotasGeoreferenciadas: data }))
      );
      break;

    case 'checklists':
      unsubs.push(
        subscribeChecklists((data) => useAppStore.setState({ checklists: data }))
      );
      unsubs.push(
        subscribeInspecoes((data) => useAppStore.setState({ inspecoes: data }))
      );
      break;

    case 'protocolos':
      unsubs.push(
        subscribeProtocolos((data) => useAppStore.setState({ protocolos: data }))
      );
      unsubs.push(
        subscribeAtivacoes((data) => useAppStore.setState({ ativacoes: data }))
      );
      break;
  }

  if (unsubs.length > 0) {
    featureUnsubs.set(feature, unsubs);
  }
}

function getFeaturesForPage(page: string): string[] {
  return Object.entries(PAGE_FEATURE_MAP)
    .filter(([, pages]) => pages.includes(page))
    .map(([feature]) => feature);
}

// Keep backward compat alias — called once after login
function startSubscriptions() {
  clearAllSubscriptions();
  startCoreSubscriptions();
}


// AppState is now defined via Zustand Slice Pattern in store-types.ts
// Import above already pulls it in.

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: (typeof window !== 'undefined' ? localStorage.getItem('apex_porter_currentPage') as PageType : null) || 'login',
  setCurrentPage: (page) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_porter_currentPage', page);
    }
    // Activate feature subscriptions for the new page (lazy loading)
    if (get().isAuthenticated) {
      const features = getFeaturesForPage(page);
      features.forEach(activateFeature);
    }
    set({ currentPage: page });
  },
  
  // Ticket
  ticketModalOpen: false,
  setTicketModalOpen: (open) => set({ ticketModalOpen: open }),
  prefilledRegistroModal: null,
  openRegistroModalWithPrefill: (data) => {
    set({ prefilledRegistroModal: data, currentPage: 'fluxo' });
  },
  clearPrefilledRegistroModal: () => set({ prefilledRegistroModal: null }),

  // Auth
  isAuthenticated: false,
  user: null,
  authLoading: false,
  authError: null,
  authInitialized: false,

  login: async (email: string, password: string) => {
    set({ authLoading: true, authError: null });
    try {
      const firebaseUser = await signInWithEmail(email, password);

      // Fetch profile (returns null if not found or error — that's OK)
      const profile = await fetchUserProfile(firebaseUser.uid);

      // Check if user is active
      const ativo = profile?.ativo ?? true;
      if (!ativo) {
        await signOutFirebase(); // Sign out immediately
        set({ authLoading: false, authError: 'Usuário inativo. Por favor, entre em contato com o RH.' });
        return false;
      }

      // If no profile in Firestore, try to create it
      // (handles the case where registration created Auth user but Firestore write failed)
      if (!profile) {
        const nome = firebaseUser.displayName || email.split('@')[0];
        await ensureUserProfile(firebaseUser.uid, { nome, email, senha: password });
      } else {
        // Update ultimoLogin in Firestore (non-blocking)
        updateUltimoLogin(firebaseUser.uid);
      }

      const userCargo = (profile?.cargo || 'PORTEIRO').toUpperCase();
      const userPermissoes = profile?.permissoes || [];

      // Permissões padrão para PORTEIRO
      const PERMISSOES_PORTEIRO: PageType[] = [
        'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes', 
        'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais', 
        'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes'
      ];

      // Se for PORTEIRO e não tem permissões, usamos as padrão
      const permissoes = userCargo === 'PORTEIRO' && userPermissoes.length === 0 
        ? PERMISSOES_PORTEIRO 
        : userPermissoes;

      // Check if user has any permissions (unless they're DESENVOLVEDOR or DIRETOR)
      const hasFullAccess = userCargo === 'DESENVOLVEDOR' || userCargo === 'DIRETOR';
      if (!hasFullAccess && userPermissoes.length === 0) {
        await signOutFirebase(); // Sign out immediately
        set({ authLoading: false, authError: 'Usuário sem permissões. Por favor, entre em contato com o RH.' });
        return false;
      }

      const user: User = {
        id: firebaseUser.uid,
        nome: profile?.nome || firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email || email,
        cargo: userCargo,
        dataCadastro: firebaseUser.metadata.creationTime || new Date().toISOString(),
        ativo: true,
        permissoes,
      };
      if (typeof window !== 'undefined') localStorage.setItem('apex_porter_currentPage', 'dashboard');
      set({ isAuthenticated: true, user, authLoading: false, currentPage: 'dashboard' });
      // Start Firestore core subscriptions, then activate dashboard features
      startSubscriptions();
      getFeaturesForPage('dashboard').forEach(activateFeature);
      return true;
    } catch (err: any) {
      const errorCode = err?.code || 'auth/default';
      const message = getAuthErrorMessage(errorCode);
      set({ authLoading: false, authError: message });
      return false;
    }
  },

  register: async (nome: string, email: string, password: string, cargo?: string, cpf?: string) => {
    set({ authLoading: true, authError: null });
    try {
      const firebaseUser = await signUpWithEmail(nome, email, password, cargo, cpf);
      // PERMISSOES padrão para PORTEIRO (same as we had before)
      const PERMISSOES_PORTEIRO: PageType[] = [
        'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes', 
        'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais', 
        'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes'
      ];
      const user: User = {
        id: firebaseUser.uid,
        nome,
        email: firebaseUser.email || email,
        ...(cpf ? { cpf } : {}),
        cargo: cargo || 'PORTEIRO',
        dataCadastro: firebaseUser.metadata.creationTime || new Date().toISOString(),
        ativo: true,
        permissoes: PERMISSOES_PORTEIRO
      };
      if (typeof window !== 'undefined') localStorage.setItem('apex_porter_currentPage', 'dashboard');
      set({ isAuthenticated: true, user, authLoading: false, currentPage: 'dashboard' });
      // Start Firestore core subscriptions, then activate dashboard features
      startSubscriptions();
      getFeaturesForPage('dashboard').forEach(activateFeature);
      return true;
    } catch (err: any) {
      const errorCode = err?.code || 'auth/default';
      const message = getAuthErrorMessage(errorCode);
      set({ authLoading: false, authError: message });
      return false;
    }
  },

  updateUser: (data) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...data };
      // Save to Firestore (fire-and-forget for local responsiveness)
      if (state.user.id) {
        updateUserProfile(state.user.id, data).catch(() => {
          // Silently fail — the local state is already updated
        });
      }
      return { user: updatedUser };
    });
  },

  logout: async () => {
    try {
      await signOutFirebase();
    } catch {
      // Force local logout even if Firebase signOut fails
    }
    // Stop Firestore subscriptions
    clearAllSubscriptions();
    if (typeof window !== 'undefined') localStorage.removeItem('apex_porter_currentPage');
    set({ isAuthenticated: false, user: null, currentPage: 'login' });
  },

  resetAuthError: () => set({ authError: null }),

  sendPasswordReset: async (email: string) => {
    try {
      await resetPassword(email);
      return true;
    } catch (err: any) {
      const errorCode = err?.code || 'auth/default';
      const message = getAuthErrorMessage(errorCode);
      set({ authError: message });
      return false;
    }
  },

  setAuthFromFirebase: (firebaseUser: FirebaseUser, firestoreData?: FirestoreUser | null) => {
    const cargo = (firestoreData?.cargo || 'PORTEIRO').toUpperCase();
    const hasFullAccess = cargo === 'DESENVOLVEDOR' || cargo === 'DIRETOR';
    
    // Permissões padrão para PORTEIRO
    const PERMISSOES_PORTEIRO = [
      'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes', 
      'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais', 
      'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes'
    ];

    let permissoes;
    if (hasFullAccess) {
      permissoes = [
        'dashboard', 'fluxo', 'correspondencias', 'veiculos', 'pre-autorizacao',
        'relatorios', 'cadastros', 'avisos', 'lista-negra', 'achados-perdidos',
        'ocorrencias', 'ronda', 'checklist-turno', 'inspecao-diaria',
        'protocolos-emergencia', 'configuracoes', 'perfil', 'lembretes', 'admin'
      ];
    } else if (cargo === 'PORTEIRO') {
      permissoes = firestoreData?.permissoes || PERMISSOES_PORTEIRO;
    } else {
      permissoes = firestoreData?.permissoes || [];
    }
    
    const user: User = {
      id: firebaseUser.uid,
      nome: firestoreData?.nome || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
      email: firebaseUser.email || '',
      cargo,
      dataCadastro: firebaseUser.metadata.creationTime || new Date().toISOString(),
      mapconfig: firestoreData?.mapconfig || 'padrao',
      ativo: firestoreData?.ativo ?? true,
      permissoes,
    };
    
    const targetPage = get().currentPage === 'login' ? 'dashboard' : get().currentPage;
    
    // Extract and apply saved settings if present
    const savedSettings = firestoreData?.settings;
    if (savedSettings) {
      set({ 
        isAuthenticated: true, 
        user, 
        authInitialized: true, 
        authLoading: false,
        currentPage: targetPage,
        settings: {
          ...get().settings,
          ...savedSettings
        }
      });
    } else {
      set({ isAuthenticated: true, user, authInitialized: true, authLoading: false, currentPage: targetPage });
    }
    
    // Update ultimoLogin in Firestore (non-blocking)
    updateUltimoLogin(firebaseUser.uid);
    // Start Firestore core subscriptions, then activate page-based features
    startSubscriptions();
    getFeaturesForPage(targetPage).forEach(activateFeature);

    // Load any pending offline rondas to state
    import('./offline-sync').then(({ getOfflineRondas }) => {
      getOfflineRondas().then(offlineRondas => {
        if (offlineRondas && offlineRondas.length > 0) {
          set(state => ({ rondas: [...offlineRondas, ...state.rondas] }));
        }
      });
    });
  },

  // Fluxo (Firestore-backed — Phase 3)
  categoriaAtiva: 'todos',
  setCategoriaAtiva: (cat) => set({ categoriaAtiva: cat }),
  registrosFluxo: [],
  addRegistroFluxo: (registro) => {
    set((state) => ({ registrosFluxo: [...state.registrosFluxo, registro] }));
    const { id, ...data } = registro;
    setRegistroFluxoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar registro de fluxo:', err);
    });
  },
  inativarRegistroFluxo: (id, versaoNovaId, motivoRefacao) => {
    const now = format(new Date(), 'dd/MM/yyyy HH:mm');
    set((state) => ({
      registrosFluxo: state.registrosFluxo.map((r) =>
        r.id === id
          ? {
              ...r,
              inativo: true,
              dataInativacao: now,
              versaoAnteriorId: versaoNovaId,
              motivoRefacao: motivoRefacao || 'Refeito com nova versão',
            }
          : r
      ),
    }));
    updateRegistroFluxoFS(id, {
      inativo: true,
      dataInativacao: now,
      versaoAnteriorId: versaoNovaId || undefined,
      motivoRefacao: motivoRefacao || 'Refeito com nova versão',
    }).catch((err) => {
      console.warn('[Firestore] Falha ao inativar registro de fluxo:', err);
    });
  },
  registrarSaida: (id, detalhes?: string, ocorrencia?: string, pesoSaida?: number, porteiroSaida?: string) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const horarioSaida = `${hours}:${minutes}`;
    set((state) => ({
      registrosFluxo: state.registrosFluxo.map((r) => {
        if (r.id !== id) return r;
        const updated: any = {
          ...r,
          horarioSaida,
          detalhes: detalhes || r.detalhes,
          ocorrencia: ocorrencia || r.ocorrencia,
        };
        if (pesoSaida !== undefined && pesoSaida > 0) {
          updated.pesoSaida = pesoSaida;
          const pesoEntrada = (r as any).pesoEntrada ?? 0;
          updated.resultadoDiferenca = pesoSaida - pesoEntrada;
        }
        if (porteiroSaida) updated.porteiroSaida = porteiroSaida;
        return updated;
      }),
    }));
    const fsUpdate: Record<string, unknown> = { horarioSaida, detalhes, ocorrencia };
    if (pesoSaida !== undefined && pesoSaida > 0) {
      fsUpdate.pesoSaida = pesoSaida;
      // calculate diferenca from current store state
      const current = get().registrosFluxo.find((r) => r.id === id);
      const pesoEntrada = (current as any)?.pesoEntrada ?? 0;
      fsUpdate.resultadoDiferenca = pesoSaida - pesoEntrada;
    }
    if (porteiroSaida) fsUpdate.porteiroSaida = porteiroSaida;
    updateRegistroFluxoFS(id, fsUpdate).catch((err) => {
      console.warn('[Firestore] Falha ao registrar saída de fluxo:', err);
    });
  },
  buscaFluxo: '',
  setBuscaFluxo: (busca) => set({ buscaFluxo: busca }),

  rascunhosFluxo: loadRascunhos(),
  addRascunhoFluxo: (registro) => {
    set((state) => {
      const newRascunhos = [...state.rascunhosFluxo, { ...registro, isRascunho: true }];
      saveRascunhos(newRascunhos);
      return { rascunhosFluxo: newRascunhos };
    });
  },
  updateRascunhoFluxo: (registro) => {
    set((state) => {
      const newRascunhos = state.rascunhosFluxo.map((r) => r.id === registro.id ? { ...registro, isRascunho: true } : r);
      saveRascunhos(newRascunhos);
      return { rascunhosFluxo: newRascunhos };
    });
  },
  removeRascunhoFluxo: (id) => {
    set((state) => {
      const newRascunhos = state.rascunhosFluxo.filter((r) => r.id !== id);
      saveRascunhos(newRascunhos);
      return { rascunhosFluxo: newRascunhos };
    });
  },

  // Cadastros (Firestore-backed)
  empresas: [],
  addEmpresa: (empresa) => {
    // Optimistic local update
    set((state) => ({ empresas: [...state.empresas, empresa] }));
    // Write to Firestore (use the provided id as doc id)
    const { id, ...data } = empresa;
    setEmpresaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar empresa:', err);
    });
  },
  removeEmpresa: (id) => {
    set((state) => ({ empresas: state.empresas.filter((e) => e.id !== id) }));
    removeEmpresaFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover empresa:', err);
    });
  },
  updateEmpresa: (empresa) => {
    set((state) => ({
      empresas: state.empresas.map((e) => (e.id === empresa.id ? empresa : e)),
    }));
    const { id, ...data } = empresa;
    updateEmpresaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar empresa:', err);
    });
  },
  departamentos: [],
  addDepartamento: (dep) => {
    set((state) => ({ departamentos: [...state.departamentos, dep] }));
    const { id, ...data } = dep;
    setDepartamentoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar departamento:', err);
    });
  },
  removeDepartamento: (id) => {
    set((state) => ({
      departamentos: state.departamentos.filter((d) => d.id !== id),
    }));
    removeDepartamentoFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover departamento:', err);
    });
  },
  updateDepartamento: (dep) => {
    set((state) => ({
      departamentos: state.departamentos.map((d) => (d.id === dep.id ? dep : d)),
    }));
    const { id, ...data } = dep;
    updateDepartamentoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar departamento:', err);
    });
  },
  pessoas: [],
  addPessoa: (pessoa) => {
    const dataCadastro = pessoa.dataCadastro || format(new Date(), 'yyyy-MM-dd');
    const newPessoa = { ...pessoa, dataCadastro };
    set((state) => ({ pessoas: [...state.pessoas, newPessoa] }));
    const { id, ...data } = newPessoa;
    setPessoaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar pessoa:', err);
    });
  },
  removePessoa: (id) => {
    set((state) => ({
      pessoas: state.pessoas.map((p) => (p.id === id ? { ...p, inativo: true } : p)),
    }));
    updatePessoaFS(id, { inativo: true }).catch((err) => {
      console.warn('[Firestore] Falha ao inativar pessoa:', err);
    });
  },
  updatePessoa: (pessoa) => {
    set((state) => ({
      pessoas: state.pessoas.map((p) => (p.id === pessoa.id ? pessoa : p)),
    }));
    const { id, ...data } = pessoa;
    updatePessoaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar pessoa:', err);
    });
  },

  // Ramais (Firestore-backed)
  ramais: [],
  addRamal: (ramal) => {
    set((state) => ({ ramais: [...state.ramais, ramal] }));
    const { id, ...data } = ramal;
    setRamalFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar ramal:', err);
    });
  },
  removeRamal: (id) => {
    set((state) => ({ ramais: state.ramais.filter((r) => r.id !== id) }));
    removeRamalFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover ramal:', err);
    });
  },
  updateRamal: (ramal) => {
    set((state) => ({
      ramais: state.ramais.map((r) => (r.id === ramal.id ? ramal : r)),
    }));
    const { id, ...data } = ramal;
    updateRamalFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar ramal:', err);
    });
  },
  buscaRamais: '',
  setBuscaRamais: (busca) => set({ buscaRamais: busca }),

  // Postos (Firestore-backed)
  postos: [],
  addPosto: (posto) => {
    set((state) => ({ postos: [...state.postos, posto] }));
    const { id, ...data } = posto;
    setPostoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar posto:', err);
    });
  },
  removePosto: (id) => {
    set((state) => ({ postos: state.postos.filter((p) => p.id !== id) }));
    removePostoFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover posto:', err);
    });
  },
  updatePosto: (posto) => {
    set((state) => ({
      postos: state.postos.map((p) => (p.id === posto.id ? posto : p)),
    }));
    const { id, ...data } = posto;
    updatePostoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar posto:', err);
    });
  },

  // Cargos (Firestore-backed)
  cargos: [],
  addCargo: (cargo) => {
    set((state) => ({ cargos: [...state.cargos, cargo] }));
    const { id, ...data } = cargo;
    addCargoFS(data).then((newId) => {
      if (id !== newId) {
        set((state) => ({
          cargos: state.cargos.map((c) => (c.id === id ? { ...c, id: newId } : c)),
        }));
      }
    }).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar cargo:', err);
    });
  },
  removeCargo: (id) => {
    set((state) => ({ cargos: state.cargos.filter((c) => c.id !== id) }));
    removeCargoFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover cargo:', err);
    });
  },
  updateCargo: (cargo) => {
    set((state) => ({
      cargos: state.cargos.map((c) => (c.id === cargo.id ? cargo : c)),
    }));
    const { id, ...data } = cargo;
    updateCargoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar cargo:', err);
    });
  },

  // Avisos (Firestore-backed — Phase 5)
  avisos: [],
  addAviso: (aviso) => {
    set((state) => ({ avisos: [aviso, ...state.avisos] }));
    const { id, ...data } = aviso;
    setAvisoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar aviso:', err);
    });
  },
  removeAviso: (id) => {
    set((state) => ({ avisos: state.avisos.filter((a) => a.id !== id) }));
    removeAvisoFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover aviso:', err);
    });
  },

  // Lista Negra (Firestore-backed — Phase 4)
  listaNegra: [],
  addListaNegra: (entry) => {
    set((state) => ({ listaNegra: [...state.listaNegra, entry] }));
    const { id, ...data } = entry;
    setListaNegraFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar à lista negra:', err);
    });
  },
  removeListaNegra: (id) => {
    set((state) => ({ listaNegra: state.listaNegra.filter((e) => e.id !== id) }));
    removeListaNegraFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover da lista negra:', err);
    });
  },
  updateListaNegra: (entry) => {
    set((state) => ({
      listaNegra: state.listaNegra.map((e) => (e.id === entry.id ? entry : e)),
    }));
    const { id, ...data } = entry;
    updateListaNegraFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar lista negra:', err);
    });
  },

  // Achados e Perdidos (Firestore-backed — Phase 4)
  achadosPerdidos: [],
  addAchadosPerdidos: (item) => {
    set((state) => ({ achadosPerdidos: [...state.achadosPerdidos, item] }));
    const { id, ...data } = item;
    setAchadosPerdidosFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar achados/perdidos:', err);
    });
  },
  removeAchadosPerdidos: (id) => {
    set((state) => ({
      achadosPerdidos: state.achadosPerdidos.filter((i) => i.id !== id),
    }));
    removeAchadosPerdidosFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover achados/perdidos:', err);
    });
  },
  updateAchadosPerdidos: (item) => {
    set((state) => ({
      achadosPerdidos: state.achadosPerdidos.map((i) =>
        i.id === item.id ? item : i
      ),
    }));
    const { id, ...data } = item;
    updateAchadosPerdidosFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar achados/perdidos:', err);
    });
  },

  // Veículos (Firestore-backed — Phase 3)
  veiculos: [],
  addVeiculo: (veiculo) => {
    set((state) => ({ veiculos: [...state.veiculos, veiculo] }));
    const { id, ...data } = veiculo;
    setVeiculoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar veículo:', err);
    });
  },
  registrarSaidaVeiculo: (id, observacoes?) => {
    const now = new Date();
    const horarioSaida = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    set((state) => ({
      veiculos: state.veiculos.map((v) =>
        v.id === id ? { ...v, horarioSaida, observacoes: observacoes || v.observacoes } : v
      ),
    }));
    updateVeiculoFS(id, { horarioSaida, observacoes }).catch((err) => {
      console.warn('[Firestore] Falha ao registrar saída de veículo:', err);
    });
  },
  removeVeiculo: (id) => {
    set((state) => ({ veiculos: state.veiculos.filter((v) => v.id !== id) }));
    removeVeiculoFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover veículo:', err);
    });
  },

  // Pré-Autorização (Firestore-backed — Phase 3)
  preAutorizacoes: [],
  addPreAutorizacao: (pa) => {
    set((state) => ({ preAutorizacoes: [...state.preAutorizacoes, pa] }));
    const { id, ...data } = pa;
    setPreAutorizacaoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar pré-autorização:', err);
    });
  },
  updatePreAutorizacao: (pa) => {
    set((state) => ({
      preAutorizacoes: state.preAutorizacoes.map((p) =>
        p.id === pa.id ? pa : p
      ),
    }));
    const { id, ...data } = pa;
    updatePreAutorizacaoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar pré-autorização:', err);
    });
  },
  cancelarPreAutorizacao: (id) => {
    set((state) => ({
      preAutorizacoes: state.preAutorizacoes.map((p) =>
        p.id === id ? { ...p, status: 'cancelado' as const } : p
      ),
    }));
    updatePreAutorizacaoFS(id, { status: 'cancelado' }).catch((err) => {
      console.warn('[Firestore] Falha ao cancelar pré-autorização:', err);
    });
  },

  // Ocorrências (Firestore-backed — Phase 4)
  ocorrencias: [],
  addOcorrencia: (oc) => {
    set((state) => ({ ocorrencias: [oc, ...state.ocorrencias] }));
    const { id, ...data } = oc;
    setOcorrenciaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar ocorrência:', err);
    });
  },
  updateOcorrencia: (oc) => {
    set((state) => ({
      ocorrencias: state.ocorrencias.map((o) => (o.id === oc.id ? oc : o)),
    }));
    const { id, ...data } = oc;
    updateOcorrenciaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar ocorrência:', err);
    });
  },
  removeOcorrencia: (id) => {
    set((state) => ({ ocorrencias: state.ocorrencias.filter((o) => o.id !== id) }));
    removeOcorrenciaFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover ocorrência:', err);
    });
  },

  // Rondas e Rotas Georeferenciadas
  rondas: [],
  addRonda: (ronda) => {
    // Add locally to state first for immediate UI feedback
    set((state) => ({ rondas: [...state.rondas, ronda] }));
    const { id, ...data } = ronda;
    
    // Check network status before trying Firestore
    if (!get().isOnline) {
      console.log('[Store] Offline mode: Saving ronda locally');
      import('./offline-sync').then(({ saveRondaOffline }) => {
        saveRondaOffline(data).catch(e => console.error('Failed to save offline:', e));
      });
      return;
    }

    console.log('[Store] Adicionando ronda ao Firestore:', id, data);
    setRondaFS(id, data).catch((err) => {
      console.error('[Firestore] Falha ao adicionar ronda, salvando offline como fallback:', err);
      import('./offline-sync').then(({ saveRondaOffline }) => {
        saveRondaOffline(data).catch(e => console.error('Failed to save offline fallback:', e));
      });
    });
  },
  updateRonda: (ronda) => {
    set((state) => ({
      rondas: state.rondas.map((r) => (r.id === ronda.id ? ronda : r)),
    }));
    const { id, ...data } = ronda;
    updateRondaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar ronda:', err);
    });
  },
  removeRonda: (id) => {
    set((state) => ({
      rondas: state.rondas.filter((r) => r.id !== id),
    }));
    removeRondaFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover ronda:', err);
    });
  },

  rotasGeoreferenciadas: [],
  addRotaGeoreferenciada: (rota) => {
    set((state) => ({ rotasGeoreferenciadas: [...state.rotasGeoreferenciadas, rota] }));
    const { id, ...data } = rota;
    setRotaGeoreferenciadaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar rota georeferenciada:', err);
    });
  },
  updateRotaGeoreferenciada: (rota) => {
    set((state) => ({
      rotasGeoreferenciadas: state.rotasGeoreferenciadas.map((r) => (r.id === rota.id ? rota : r)),
    }));
    const { id, ...data } = rota;
    updateRotaGeoreferenciadaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar rota georeferenciada:', err);
    });
  },
  removeRotaGeoreferenciada: (id) => {
    set((state) => ({
      rotasGeoreferenciadas: state.rotasGeoreferenciadas.filter((r) => r.id !== id),
    }));
    removeRotaGeoreferenciadaFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover rota georeferenciada:', err);
    });
  },

  // Checklist de Turno (Firestore-backed — Phase 6)
  checklists: [],
  addChecklist: (ck) => {
    set((state) => ({
      checklists: [ck, ...state.checklists.filter((c) => c.id !== ck.id)],
    }));
    const { id, ...data } = ck;
    setChecklistFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar checklist:', err);
    });
  },
  updateChecklist: (ck) => {
    set((state) => ({
      checklists: state.checklists.map((c) => (c.id === ck.id ? ck : c)),
    }));
    const { id, ...data } = ck;
    updateChecklistFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar checklist:', err);
    });
  },
  removeChecklist: (id) => {
    set((state) => ({ checklists: state.checklists.filter((c) => c.id !== id) }));
    removeChecklistFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover checklist:', err);
    });
  },

  // Inspeção Diária (Firestore-backed — Phase 6)
  inspecoes: [],
  addInspecao: (inspecao) => {
    set((state) => ({ inspecoes: [inspecao, ...state.inspecoes] }));
    const { id, ...data } = inspecao;
    setInspecaoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar inspeção:', err);
    });
  },
  updateInspecao: (inspecao) => {
    set((state) => ({
      inspecoes: state.inspecoes.map((i) => (i.id === inspecao.id ? inspecao : i)),
    }));
    const { id, ...data } = inspecao;
    updateInspecaoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar inspeção:', err);
    });
  },
  removeInspecao: (id) => {
    set((state) => ({ inspecoes: state.inspecoes.filter((i) => i.id !== id) }));
    removeInspecaoFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover inspeção:', err);
    });
  },

  // Protocolos de Emergência (Firestore-backed — Phase 7)
  protocolos: [],
  addProtocolo: (protocolo) => {
    set((state) => ({ protocolos: [protocolo, ...state.protocolos] }));
    const { id, ...data } = protocolo;
    setProtocoloFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar protocolo:', err);
    });
  },
  updateProtocolo: (protocolo) => {
    set((state) => ({
      protocolos: state.protocolos.map((p) => (p.id === protocolo.id ? protocolo : p)),
    }));
    const { id, ...data } = protocolo;
    updateProtocoloFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar protocolo:', err);
    });
  },
  removeProtocolo: (id) => {
    set((state) => ({ protocolos: state.protocolos.filter((p) => p.id !== id) }));
    removeProtocoloFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover protocolo:', err);
    });
  },

  // Ativação de Protocolo (Firestore-backed — Phase 7)
  ativacoes: [],
  addAtivacao: (ativacao) => {
    set((state) => ({ ativacoes: [ativacao, ...state.ativacoes] }));
    const { id, ...data } = ativacao;
    setAtivacaoFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar ativação:', err);
    });
  },

  // Avisos — enhanced (Firestore-backed — Phase 5)
  confirmarLeituraAviso: (id, porteiroNome) => {
    set((state) => ({
      avisos: state.avisos.map((a) => {
        if (a.id !== id) return a;
        const lidoPor = a.lidoPor || [];
        if (lidoPor.includes(porteiroNome)) return a;
        return { ...a, lidoPor: [...lidoPor, porteiroNome] };
      }),
    }));
    // Update Firestore with the new lidoPor array
    const aviso = get().avisos.find((a) => a.id === id);
    if (aviso) {
      const lidoPor = aviso.lidoPor || [];
      if (!lidoPor.includes(porteiroNome)) {
        updateAvisoFS(id, { lidoPor: [...lidoPor, porteiroNome] }).catch((err) => {
          console.warn('[Firestore] Falha ao confirmar leitura do aviso:', err);
        });
      }
    }
  },
  toggleFixarAviso: (id) => {
    set((state) => ({
      avisos: state.avisos.map((a) =>
        a.id === id ? { ...a, fixado: !a.fixado } : a
      ),
    }));
    // Update Firestore with the new fixado value
    const aviso = get().avisos.find((a) => a.id === id);
    if (aviso) {
      updateAvisoFS(id, { fixado: aviso.fixado }).catch((err) => {
        console.warn('[Firestore] Falha ao alternar fixação do aviso:', err);
      });
    }
  },

  // System Config (Phase 7)
  systemConfig: { ...DEFAULT_SYSTEM_CONFIG },
  updateSystemConfig: (config) => {
    set((state) => ({
      systemConfig: { ...state.systemConfig, ...config },
    }));
    // Save each part to Firestore config collection
    if (config.itensInspecao) {
      setConfig('itens_inspecao', { itens: config.itensInspecao }).catch((err) => {
        console.warn('[Firestore] Falha ao salvar config itens_inspecao:', err);
      });
    }
    if (config.itensChecklist) {
      setConfig('itens_checklist', { itens: config.itensChecklist }).catch((err) => {
        console.warn('[Firestore] Falha ao salvar config itens_checklist:', err);
      });
    }
    if (config.pontosRonda) {
      setConfig('pontos_ronda', { pontos: config.pontosRonda }).catch((err) => {
        console.warn('[Firestore] Falha ao salvar config pontos_ronda:', err);
      });
    }
    if (config.rotasRonda) {
      setConfig('rotas_ronda', { rotas: config.rotasRonda }).catch((err) => {
        console.warn('[Firestore] Falha ao salvar config rotas_ronda:', err);
      });
    }
  },

  // Connection status (Phase 8)
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnlineStatus: (status) => set({ isOnline: status }),

  // Settings (synced with Firestore usuarios/{uid}/settings)
  settings: {
    autoTheme: false,
    themePreference: 'light',
    darkModeStart: '18:00',
    darkModeEnd: '06:00',
    fixedTheme: false,
    autoDarkTheme: 'dark',
  },
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    // Save to Firestore user profile settings (non-blocking)
    const user = get().user;
    if (user?.id) {
      updateUserProfile(user.id, { settings: { ...get().settings, ...newSettings } }).catch((err) => {
        console.warn('[Firestore] Falha ao salvar configurações do usuário:', err);
      });
    }
  },

  // Lembretes
  lembretes: [],
  addLembrete: (lembrete) => {
    set((state) => ({ lembretes: [...state.lembretes, lembrete] }));
    const { id, ...data } = lembrete;
    setLembreteFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar lembrete:', err);
    });
  },
  updateLembrete: (lembrete) => {
    set((state) => ({
      lembretes: state.lembretes.map((l) => (l.id === lembrete.id ? lembrete : l)),
    }));
    const { id, ...data } = lembrete;
    updateLembreteFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar lembrete:', err);
    });
  },
  removeLembrete: (id) => {
    set((state) => ({ lembretes: state.lembretes.filter((l) => l.id !== id) }));
    removeLembreteFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover lembrete:', err);
    });
  },

  // Usuários
  usuarios: [],
  addUsuario: (usuario) => {
    set((state) => ({ usuarios: [...state.usuarios, usuario] }));
    const { id, ...data } = usuario;
    setUsuarioFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar usuário:', err);
    });
  },
  updateUsuario: (usuario) => {
    set((state) => ({
      usuarios: state.usuarios.map((u) => (u.id === usuario.id ? usuario : u)),
    }));
    const { id, ...data } = usuario;
    updateUsuarioFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao atualizar usuário:', err);
    });
  },
  removeUsuario: (id) => {
    set((state) => ({ usuarios: state.usuarios.filter((u) => u.id !== id) }));
    removeUsuarioFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover usuário:', err);
    });
  },
}));

// Setup network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
    // Dynamically import syncOfflineRondas to avoid circular dependencies
    import('./offline-sync').then(({ syncOfflineRondas }) => {
      syncOfflineRondas().then(count => {
        if (count > 0) {
          console.log(`[Offline Sync] Sincronizadas ${count} rondas pendentes.`);
        }
      });
    });
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });
}
