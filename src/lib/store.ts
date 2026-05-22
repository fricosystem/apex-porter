'use client';

import { create } from 'zustand';
import { format } from 'date-fns';
import type {
  PageType,
  CategoriaFluxo,
  RegistroFluxo,
  Empresa,
  Departamento,
  Pessoa,
  Ramal,
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
  setRonda as setRondaFS,
  updateRonda as updateRondaFS,
  removeRonda as removeRondaFS,
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

// ── Firestore subscription unsubscribe handles ──
let unsubs: Unsubscribe[] = [];

function clearSubscriptions() {
  unsubs.forEach((fn) => fn());
  unsubs = [];
}

function startSubscriptions() {
  clearSubscriptions();

  // Subscribe to empresas
  unsubs.push(
    subscribeEmpresas((data) => {
      useAppStore.setState({ empresas: data });
    })
  );

  // Subscribe to departamentos
  unsubs.push(
    subscribeDepartamentos((data) => {
      useAppStore.setState({ departamentos: data });
    })
  );

  // Subscribe to pessoas
  unsubs.push(
    subscribePessoas((data) => {
      useAppStore.setState({ pessoas: data });
    })
  );

  // Subscribe to ramais
  unsubs.push(
    subscribeRamais((data) => {
      useAppStore.setState({ ramais: data });
    })
  );

  // Phase 3 — Registros de Fluxo
  unsubs.push(
    subscribeRegistrosFluxo((data) => {
      useAppStore.setState({ registrosFluxo: data });
    })
  );

  // Phase 3 — Veículos
  unsubs.push(
    subscribeVeiculos((data) => {
      useAppStore.setState({ veiculos: data });
    })
  );

  // Phase 3 — Pré-Autorizações
  unsubs.push(
    subscribePreAutorizacoes((data) => {
      useAppStore.setState({ preAutorizacoes: data });
    })
  );

  // Phase 4 — Ocorrências
  unsubs.push(
    subscribeOcorrencias((data) => {
      useAppStore.setState({ ocorrencias: data });
    })
  );

  // Phase 4 — Lista Negra
  unsubs.push(
    subscribeListaNegra((data) => {
      useAppStore.setState({ listaNegra: data });
    })
  );

  // Phase 4 — Achados e Perdidos
  unsubs.push(
    subscribeAchadosPerdidos((data) => {
      useAppStore.setState({ achadosPerdidos: data });
    })
  );

  // Phase 5 — Avisos
  unsubs.push(
    subscribeAvisos((data) => {
      useAppStore.setState({ avisos: data });
    })
  );

  // Phase 6 — Rondas
  unsubs.push(
    subscribeRondas((data) => {
      useAppStore.setState({ rondas: data });
    })
  );

  // Phase 6 — Checklists
  unsubs.push(
    subscribeChecklists((data) => {
      useAppStore.setState({ checklists: data });
    })
  );

  // Phase 6 — Inspeções
  unsubs.push(
    subscribeInspecoes((data) => {
      useAppStore.setState({ inspecoes: data });
    })
  );

  // Phase 7 — Protocolos de Emergência
  unsubs.push(
    subscribeProtocolos((data) => {
      useAppStore.setState({ protocolos: data });
    })
  );

  // Phase 7 — Ativações de Protocolo
  unsubs.push(
    subscribeAtivacoes((data) => {
      useAppStore.setState({ ativacoes: data });
    })
  );

  // Subscribe to lembretes (only if we have a user with email)
  const state = useAppStore.getState();
  if (state.user?.email) {
    unsubs.push(
      subscribeLembretes(state.user.email, (data) => {
        useAppStore.setState({ lembretes: data });
      })
    );
  }

  // Phase 7 — Load system config from Firestore (one-time fetch, not real-time)
  loadSystemConfig().catch((err) => {
    console.warn('[Firestore] Falha ao carregar configurações do sistema:', err);
  });
}

interface AppState {
  // Navigation
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;

  // Auth
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

  // Fluxo
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

  // Cadastros
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

  // Ramais
  ramais: Ramal[];
  addRamal: (ramal: Ramal) => void;
  removeRamal: (id: string) => void;
  updateRamal: (ramal: Ramal) => void;
  buscaRamais: string;
  setBuscaRamais: (busca: string) => void;

  // Avisos
  avisos: Aviso[];
  addAviso: (aviso: Aviso) => void;
  removeAviso: (id: string) => void;

  // Lista Negra
  listaNegra: ListaNegraEntry[];
  addListaNegra: (entry: ListaNegraEntry) => void;
  removeListaNegra: (id: string) => void;
  updateListaNegra: (entry: ListaNegraEntry) => void;

  // Achados e Perdidos
  achadosPerdidos: AchadosPerdidosItem[];
  addAchadosPerdidos: (item: AchadosPerdidosItem) => void;
  removeAchadosPerdidos: (id: string) => void;
  updateAchadosPerdidos: (item: AchadosPerdidosItem) => void;

  // Veículos
  veiculos: RegistroVeiculo[];
  addVeiculo: (veiculo: RegistroVeiculo) => void;
  registrarSaidaVeiculo: (id: string, observacoes?: string) => void;
  removeVeiculo: (id: string) => void;

  // Pré-Autorização
  preAutorizacoes: PreAutorizacao[];
  addPreAutorizacao: (pa: PreAutorizacao) => void;
  updatePreAutorizacao: (pa: PreAutorizacao) => void;
  cancelarPreAutorizacao: (id: string) => void;

  // Ocorrências
  ocorrencias: Ocorrencia[];
  addOcorrencia: (oc: Ocorrencia) => void;
  updateOcorrencia: (oc: Ocorrencia) => void;
  removeOcorrencia: (id: string) => void;

  // Rondas
  rondas: Ronda[];
  addRonda: (ronda: Ronda) => void;
  updateRonda: (ronda: Ronda) => void;
  removeRonda: (id: string) => void;

  // Checklist de Turno
  checklists: ChecklistTurno[];
  addChecklist: (ck: ChecklistTurno) => void;
  updateChecklist: (ck: ChecklistTurno) => void;
  removeChecklist: (id: string) => void;

  // Inspeção Diária
  inspecoes: InspecaoDiaria[];
  addInspecao: (inspecao: InspecaoDiaria) => void;
  updateInspecao: (inspecao: InspecaoDiaria) => void;
  removeInspecao: (id: string) => void;

  // Protocolos de Emergência
  protocolos: ProtocoloEmergencia[];
  addProtocolo: (protocolo: ProtocoloEmergencia) => void;
  updateProtocolo: (protocolo: ProtocoloEmergencia) => void;
  removeProtocolo: (id: string) => void;

  // Ativação de Protocolo
  ativacoes: AtivacaoProtocolo[];
  addAtivacao: (ativacao: AtivacaoProtocolo) => void;

  // Avisos — enhanced
  confirmarLeituraAviso: (id: string, porteiroNome: string) => void;
  toggleFixarAviso: (id: string) => void;

  // System Config (Phase 7)
  systemConfig: SystemConfig;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;

  // Connection status (Phase 8)
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Lembretes
  lembretes: Lembrete[];
  addLembrete: (lembrete: Lembrete) => void;
  updateLembrete: (lembrete: Lembrete) => void;
  removeLembrete: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: (typeof window !== 'undefined' ? localStorage.getItem('apex_porter_currentPage') as PageType : null) || 'login',
  setCurrentPage: (page) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_porter_currentPage', page);
    }
    set({ currentPage: page });
  },

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

      // If no profile in Firestore, try to create it
      // (handles the case where registration created Auth user but Firestore write failed)
      if (!profile) {
        const nome = firebaseUser.displayName || email.split('@')[0];
        await ensureUserProfile(firebaseUser.uid, { nome, email, senha: password });
      } else {
        // Update ultimoLogin in Firestore (non-blocking)
        updateUltimoLogin(firebaseUser.uid);
      }

      const user: User = {
        id: firebaseUser.uid,
        nome: profile?.nome || firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email || email,
        cargo: 'Porteiro',
        dataCadastro: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };
      if (typeof window !== 'undefined') localStorage.setItem('apex_porter_currentPage', 'dashboard');
      set({ isAuthenticated: true, user, authLoading: false, currentPage: 'dashboard' });
      // Start Firestore real-time subscriptions
      startSubscriptions();
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
      const user: User = {
        id: firebaseUser.uid,
        nome,
        email: firebaseUser.email || email,
        ...(cpf ? { cpf } : {}),
        cargo: cargo || 'Porteiro',
        dataCadastro: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };
      if (typeof window !== 'undefined') localStorage.setItem('apex_porter_currentPage', 'dashboard');
      set({ isAuthenticated: true, user, authLoading: false, currentPage: 'dashboard' });
      // Start Firestore real-time subscriptions
      startSubscriptions();
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
    clearSubscriptions();
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
    const user: User = {
      id: firebaseUser.uid,
      nome: firestoreData?.nome || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
      email: firebaseUser.email || '',
      cargo: 'Porteiro',
      dataCadastro: firebaseUser.metadata.creationTime || new Date().toISOString(),
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
    // Start Firestore real-time subscriptions
    startSubscriptions();
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

  // Rondas (Firestore-backed — Phase 6)
  rondas: [],
  addRonda: (ronda) => {
    set((state) => ({ rondas: [ronda, ...state.rondas] }));
    const { id, ...data } = ronda;
    setRondaFS(id, data).catch((err) => {
      console.warn('[Firestore] Falha ao adicionar ronda:', err);
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
    set((state) => ({ rondas: state.rondas.filter((r) => r.id !== id) }));
    removeRondaFS(id).catch((err) => {
      console.warn('[Firestore] Falha ao remover ronda:', err);
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
}));
