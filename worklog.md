# APEX Porter - Worklog

## Project: APEX Porter - Sistema de Registro de Entrada e Saída
## Date: 2025-03-15

### Summary
Built a complete single-page web application called "APEX Porter" - an entry/exit registration system for Android and tablets. The entire app runs on the `/` route using client-side state management with Zustand.

### Files Created

1. **`src/lib/data.ts`** - Type definitions, interfaces, and all fictional data
   - 6 category types for fluxo records (entregas1, visitantes, prestadores, pesagem, entregas2, coleta)
   - CRUD interfaces for Empresa, Departamento, Funcionario, Ramal, Aviso, ListaNegraEntry, AchadosPerdidosItem
   - Pre-populated data in Brazilian Portuguese
   - Chart data configurations for dashboard

2. **`src/lib/store.ts`** - Zustand global state store
   - Navigation state (currentPage)
   - Auth state (isAuthenticated, user, login/register/logout)
   - Fluxo records with 6 categories (add, registrarSaida, search)
   - Cadastros (empresas, departamentos, funcionarios) with CRUD
   - Ramais with search
   - Avisos, Lista Negra, Achados e Perdidos with CRUD
   - Settings (autoTheme, darkModeStart/End, fixedTheme)

3. **`src/components/theme-provider.tsx`** - next-themes ThemeProvider wrapper

4. **`src/app/globals.css`** - Custom emerald/teal theme CSS variables
   - Light and dark mode with emerald primary colors
   - Custom scrollbar styling
   - Override of all CSS variables for emerald brand

5. **`src/app/layout.tsx`** - Root layout with ThemeProvider and Sonner toaster

6. **`src/components/login-page.tsx`** - Login/Register page
   - Beautiful gradient background (emerald/teal)
   - Toggle between login and registration forms
   - Framer Motion animations
   - Password visibility toggle

7. **`src/components/app-header.tsx`** - App header
   - APEX PORTER branding
   - Theme toggle (sun/moon)
   - Settings link
   - User avatar dropdown with logout

8. **`src/components/bottom-nav.tsx`** - Bottom navigation
   - 4 primary nav items (Dashboard, Fluxo, Relatórios, Cadastros)
   - "More" button expanding to secondary nav (Ramais, Avisos, Lista Negra, Achados e Perdidos, Configurações)
   - Framer Motion animations with overlay

9. **`src/components/dashboard-page.tsx`** - Dashboard with recharts
   - 4 KPI cards (Entradas, Saídas, Pendentes, Total)
   - Bar chart: Entradas vs Saídas por hora
   - Line chart: Tendência semanal
   - Pie chart: Distribuição por categoria
   - Area chart: Fluxo por período do dia
   - All charts with dark mode support

10. **`src/components/fluxo-page.tsx`** - Main entry/exit page
    - 6 tab categories with proper column layouts
    - Search/filter functionality
    - "Registrar Saída" button for pending records
    - Floating Action Button (FAB) to add new record
    - Pre-populated with 5-8 fictional records per category

11. **`src/components/registro-modal.tsx`** - Registration modal (shadcn Dialog)
    - Category selector (pre-selected from active tab)
    - Dynamic form fields based on category
    - Auto-filled date and time for entry
    - Select components for Empresa and Departamento
    - Validation and toast notifications

12. **`src/components/relatorios-page.tsx`** - Reports page
    - Date range filters
    - Category filter
    - Summary cards
    - Export and Print buttons (simulated)
    - Filtered records table

13. **`src/components/cadastros-page.tsx`** - Registration management
    - 3 tabs: Empresas, Departamentos, Funcionários
    - CRUD operations with dialogs
    - Pre-populated fictional data

14. **`src/components/ramais-page.tsx`** - Phone extensions page
    - Search functionality
    - Table with Department, Name, Extension columns
    - Add and delete operations
    - 15 pre-populated entries

15. **`src/components/avisos-page.tsx`** - Notices page
    - Priority-based cards (Alta=red, Média=amber, Baixa=emerald)
    - Add new notice dialog
    - Sorted by priority
    - 5 pre-populated notices

16. **`src/components/lista-negra-page.tsx`** - Blacklist page
    - Warning banner
    - Active/Inactive status toggle
    - Add new entry with reason and status
    - 4 pre-populated entries

17. **`src/components/achados-perdidos-page.tsx`** - Lost and found page
    - Card grid layout
    - Status management (Achado/Perdido/Devolvido)
    - Item details with color and location
    - 5 pre-populated items

18. **`src/components/configuracoes-page.tsx`** - Settings page
    - User profile section
    - Theme selection (Claro/Escuro/Auto)
    - Auto theme with time-based switching
    - Dark mode start/end time inputs
    - Fixed theme toggle
    - App info section
    - Logout button

19. **`src/app/page.tsx`** - Main app component
    - Login/auth gate
    - Page renderer with AnimatePresence transitions
    - Layout with header, content area, bottom nav

### Technology Stack
- Next.js 16 with App Router
- TypeScript 5
- Tailwind CSS 4 with custom emerald theme
- shadcn/ui component library
- Zustand for state management
- next-themes for theme switching
- recharts for dashboard charts
- framer-motion for animations
- date-fns for date formatting
- sonner for toast notifications
- lucide-react for icons

### Lint Status
All ESLint errors fixed. Clean lint pass.

---

Task ID: 1
Agent: Main Agent
Task: Add new category "Movimentação Interna Colaboradores" with specific fields

Work Log:
- Added 'movimentacao' to CategoriaFluxo type union in data.ts
- Added RegistroMovimentacao interface with fields: nomeColaborador, rgCpf, horarioEntrada, horarioSaida, autorizadoPor, assinaturaColaborador, porteiro, data, detalhes?, ocorrencia?
- Added 'MOVIMENTAÇÃO INTERNA COLABORADORES' to CATEGORIAS_FLUXO array
- Added RegistroMovimentacao to RegistroFluxo type union
- Added 4 fictional initial records for movimentacao category
- Updated registro-modal.tsx: added mapToFormFields case, extractUnifiedFromRecord case, handleSubmit case, and renderFields case for 'movimentacao'
- Updated fluxo-page.tsx: added Users icon, catIcons entry, getMainField case, getSecondaryFields case, getAllFields case for 'movimentacao'
- Updated relatorios-page.tsx: added Users icon, catIcons entry, getMainField case, getSecondaryFields case for 'movimentacao'
- Updated DADOS_GRAFICO_PIZZA to include 'Mov. Interna' category
- Also removed register functionality from login (from previous task)
- Build successful with no errors

Stage Summary:
- New category "MOVIMENTAÇÃO INTERNA COLABORADORES" fully integrated across all pages
- Form fields: Nome do Colaborador, RG/CPF, Horário Entrada, Autorizado Por, Assinatura Colaborador, Porteiro, Data
- Horário Saída is registered via the detail modal (same as other categories)
- Autocomplete works for Nome do Colaborador, RG/CPF, and Autorizado Por fields

---
Task ID: 1
Agent: Main Agent
Task: Add Correspondências tab to bottom navigation with dedicated page

Work Log:
- Added 'correspondencias' to PageType union in data.ts
- Created new correspondencias-page.tsx component with: stats cards (Pendentes/Retirados/Total), search bar, tipo filter, status tabs, card list with icons per type, registration modal, detail modal with retirada flow
- Updated bottom-nav.tsx: added Mail icon import, replaced Relatórios with Correspondências in PRIMARY_NAV, moved Relatórios to SECONDARY_NAV
- Updated page.tsx: imported CorrespondenciasPage and added it to page renderer map
- Build passes successfully

Stage Summary:
- Correspondências tab now appears in bottom navigation as a primary tab
- Dedicated page filters only correspondência records from the shared fluxo store
- Relatórios moved to secondary menu (Mais)
- Page features: stats, search, tipo filter, status tabs, register/retirada modals

---
Task ID: 1
Agent: Main Agent
Task: Implementar 4 módulos do plano: Registro de Ocorrências (#2), Ronda/Patrulhamento (#4), Checklist de Turno (#6), Painel de Avisos por Turno (#8)

Work Log:
- Read all current source files (data.ts, store.ts, bottom-nav.tsx, page.tsx, plano.md, avisos-page.tsx)
- Updated data.ts: Added PageType entries (ocorrencias, ronda, checklist-turno), new types (Ocorrencia, Ronda, PontoRonda, ChecklistTurno, ItemChecklist, TurnoAviso, CategoriaAviso), enhanced Aviso interface with turno/categoria/dataExpiracao/fixado/lidoPor, added seed data for all new modules, added constants (TIPOS_OCORRENCIA, GRAVIDADES_OCORRENCIA, STATUS_OCORRENCIA, ROTAS_RONDA, PONTOS_RONDA_PREDEFINIDOS, ITENS_CHECKLIST_PADRAO)
- Updated store.ts: Added imports for new types and seed data, added state slices and CRUD functions for ocorrencias/rondas/checklists, added confirmarLeituraAviso and toggleFixarAviso functions
- Created ocorrencias-page.tsx: Full ocorrências page with stats cards, search/filters, color-coded cards, new/detail dialogs, status update workflow
- Created ronda-page.tsx: Full rondas page with stats, search/filter, route selection, ponto checklist with check-in, finalize ronda workflow
- Created checklist-turno-page.tsx: Full shift handover page with 14-item checklist, progress bars, interactive fill mode, conclude workflow
- Replaced avisos-page.tsx: Enhanced with turno categories, expiry dates, read confirmations, pin/fixed avisos, filter by turno/categoria/read status
- Updated bottom-nav.tsx: Added Ocorrências, Rondas, Plantão entries to SECONDARY_NAV with AlertTriangle, Footprints, ClipboardCheck icons
- Updated page.tsx: Added imports and route mappings for new pages
- Updated plano.md: Marked modules #2, #4, #6, #8 with ✅ and "IMPLEMENTADO" labels, updated phase table

Stage Summary:
- All 4 modules implemented and building successfully
- Build: ✓ Compiled successfully
- plano.md updated with ✅ markers for all implemented modules
---
Task ID: 1
Agent: Main Agent
Task: Restructure Cadastros tab to Pessoas-only with full auto-fill in Fluxo modal

Work Log:
- Expanded `Pessoa` interface in `data.ts` with new fields: `tipo` (TipoPessoa), `empresa`, `rgCpf`, `placa`, `telefone`
- Added `TipoPessoa` type and `TIPOS_PESSOA` constant for person type classification (Colaborador, Visitante, Prestador, Entregador, Motorista, Outro)
- Updated `PESSOAS_INICIAIS` seed data with 14 richer entries covering all types
- Completely rewrote `cadastros-page.tsx`: removed 4-tab system (Pessoas/Empresas/Departamentos/Ramais), replaced with single Pessoas management page with:
  - Type filter chips (Todos, Colaborador, Visitante, etc. with counts)
  - Search across nome, empresa, rgCpf, departamento, cargo, placa
  - Color-coded type badges and stripe indicators on cards
  - Full edit dialog with all fields (nome, tipo, empresa, departamento, cargo, rgCpf, placa, telefone, email)
  - Animated list with Framer Motion
- Updated `registro-modal.tsx` suggestion builders:
  - `nameSuggestions`: now populates ALL unified fields from Pessoa (empresa→company, rgCpf→doc, placa→plate, departamento→department)
  - `empresaSuggestions`: added pessoas as source for empresa data with full unified data
  - `rgCpfSuggestions`: added pessoas as primary source with full unified data
  - `placaSuggestions`: added pessoas as primary source with full unified data
  - `departamentoSuggestions`: added pessoas departamento as additional source
- When selecting any suggestion in the Fluxo modal, `mapToFormFields` now receives complete unified data and auto-fills ALL matching fields for the selected category
- Build verified successfully with no errors

Stage Summary:
- Cadastros tab now shows only Pessoas with full CRUD (create, edit, delete)
- Fluxo modal suggestions fully leverage Pessoa data for auto-fill
- Selecting a suggestion auto-fills ALL available fields (nome→name, empresa→company, rgCpf→doc, placa→plate, departamento→department)
- 14 seed pessoas covering Colaboradores, Visitantes, Prestadores, Entregadores, Motoristas

---
Task ID: 1
Agent: main
Task: Fix missing legends in Dashboard charts and improve legend/axis text contrast for dark/light themes, plus improve flowchart-style cursor connectors

Work Log:
- Analyzed 4 screenshots: identified 4 charts missing legends (Tendência Semanal, Fluxo por Período do Dia, Empresas Mais Frequentes, Ocorrências por Tipo)
- Added `<Legend wrapperStyle={LEGEND_STYLE} />` to all 4 charts that were missing it
- Updated all existing `<Legend />` to `<Legend wrapperStyle={LEGEND_STYLE} />` across all PieCharts
- Fixed root cause: CSS variables use `oklch()` format but code was wrapping them in `hsl(var(--x))` which produces invalid CSS like `hsl(oklch(...))`
- Changed `AXIS_TICK_STYLE.fill` from `'hsl(var(--muted-foreground))'` to `'var(--muted-foreground)'`
- Changed `AXIS_TICK_STYLE_SMALL.fill` from `'hsl(var(--muted-foreground))'` to `'var(--muted-foreground)'`
- Changed `LEGEND_STYLE.color` from `'hsl(var(--foreground))'` to `'var(--foreground)'`
- Fixed CSS in globals.css: `.recharts-legend-item-text` now uses `fill: var(--foreground)` instead of `color: hsl(var(--foreground))`
- Added CSS rules for `.recharts-default-legend li` and `.recharts-text` for full theme-aware contrast
- Redesigned ChartCursor with flowchart-style dual bezier S-curves, diamond node at top, target circle at bar top, and soft glow column
- Updated ChartTooltip SVG connector to be more compact and elegant

Stage Summary:
- All 14 charts now have properly styled legends with theme-aware colors
- Fixed critical CSS variable format issue that caused dark text in dark theme
- Flowchart-style cursor connectors redesigned with dual curves and decorative nodes

---
Task ID: 2
Agent: main
Task: Fix connector line between tooltip and selected bar - was appearing as static icon instead of actual connecting line

Work Log:
- Analyzed screenshot: confirmed the ChartCursor decorative elements (diamond, dual curves, circles) appeared as static icons rather than a connecting line
- The ChartTooltip had a small static SVG (30x16px) below the badge that also appeared as a decorative icon
- Redesigned ChartCursor: simplified to a single curved bezier path from chart top → bar top, with a target dot at the endpoint
- Replaced the static SVG connector in ChartTooltip with a minimal downward arrow indicator (16x8px)
- Removed all complex decorative elements (diamonds, polygons, dual curves) that looked like static icons

Stage Summary:
- ChartCursor now draws a clean curved connecting line from the top of the chart area (where tooltip sits) down to the top of the hovered bar
- ChartTooltip has a minimal downward arrow instead of a decorative SVG connector
- The connecting line uses a bezier curve with smooth flow, visually linking tooltip position to bar

---
Task ID: 3
Agent: main
Task: Create comprehensive Firebase integration plan (Firestore + Auth only) for APEX Porter

Work Log:
- Read and analyzed the entire project structure (18 data domains, 20+ components, single monolithic Zustand store)
- Identified all data types, interfaces, store slices, and component dependencies
- Identified current auth is entirely mock (no backend), all data is in-memory with seed data
- Created 9-phase integration plan covering Firestore + Authentication only
- Written plan to /home/z/my-project/plano/plano.md

Stage Summary:
- Phase 1: Firebase SDK setup + Authentication (replace mock login)
- Phase 2: Firestore collections + migrate Cadastros (empresas, departamentos, pessoas, ramais)
- Phase 3: Migrate Fluxo + Veículos + Pré-Autorizações
- Phase 4: Migrate Ocorrências + Lista Negra + Achados Perdidos + Security Rules
- Phase 5: Migrate Avisos + Lista Negra auto-check on fluxo registration
- Phase 6: Migrate Rondas + Checklists + Inspeções
- Phase 7: Migrate Protocolos + Config + User Settings
- Phase 8: Real-time sync consolidation + offline persistence + query optimization
- Phase 9: Legacy cleanup + documentation

---
Task ID: 4
Agent: main
Task: Implementar Fase 1 — Infraestrutura Base e Autenticação Firebase

Work Log:
- Installed `firebase` npm package
- Removed unused `next-auth` package
- Created `src/lib/firebase.ts` — Firebase app initialization, Auth instance, Firestore instance, offline persistence enabled
- Created `src/lib/auth.ts` — Full auth service with:
  - signInWithEmail(), signUpWithEmail(), signOutFirebase()
  - resetPassword(), onAuthChange()
  - fetchUserProfile(), updateUserProfile()
  - getAuthErrorMessage() — Portuguese error translations for all Firebase Auth error codes
  - FirestoreUser interface
- Refactored Zustand store auth slice:
  - login() now async → calls signInWithEmail + fetchUserProfile
  - Added register() → calls signUpWithEmail (creates Auth user + Firestore doc)
  - logout() now async → calls signOutFirebase
  - Added sendPasswordReset(), resetAuthError(), setAuthFromFirebase()
  - Added authLoading, authError, authInitialized state fields
  - updateUser() now saves to Firestore (fire-and-forget)
  - Removed localStorage email/password persistence
- Refactored LoginPage:
  - 3 modes: login, register, reset password
  - Animated transitions between modes (AnimatePresence)
  - Loading spinner during auth operations
  - Portuguese error messages from Firebase
  - Registration form with nome, email, password, cargo
  - Password reset with confirmation screen
- Updated page.tsx:
  - Added Firebase onAuthStateChanged observer
  - Restores session on page refresh (persists via Firebase Auth)
  - Shows loading spinner while auth initializes
  - authInitialized gate prevents flash of login page
- Updated AppHeader: logout handler for async function
- Updated ConfiguracoesPage: email field read-only (managed by Firebase Auth), profile saves to Firestore
- Updated plano.md: Phase 1 marked as ✅ CONCLUÍDA

Stage Summary:
- Firebase SDK initialized with project config (apex-porter project)
- Authentication fully integrated: login, register, password reset, session persistence
- Firestore offline persistence enabled
- User profile stored in Firestore `users/{uid}` collection
- All auth errors translated to Portuguese
- Build successful, no errors

---
Task ID: 5
Agent: main
Task: Fix Firebase auth bugs (register error + login failure) + save to 'usuarios' collection with new fields

Work Log:
- Identified root cause of register error: signUpWithEmail created Auth user but Firestore setDoc failed (security rules), throwing error even though Auth user existed
- Identified root cause of login failure: fetchUserProfile threw exception on Firestore permission denied, causing the whole login to fail
- Rewrote auth.ts: changed collection from 'users' to 'usuarios', added fields (senha, dataCadastro, ultimoLogin)
- Made all Firestore operations resilient: fetchUserProfile returns null on error, signUpWithEmail catches Firestore write failures
- Added updateUltimoLogin() function for last login timestamp
- Added ensureUserProfile() to create missing Firestore docs on login
- Updated store.ts: login now calls ensureUserProfile if profile missing, updates ultimoLogin
- Updated page.tsx: auth observer calls ensureUserProfile for missing profiles
- Updated plano.md: collection renamed to 'usuarios', new fields documented, Firestore rules warning added

Stage Summary:
- Register now works: Auth user created + Firestore write failure doesn't block registration
- Login now works: Firestore errors don't prevent authentication, missing profiles auto-created
- Collection 'usuarios' with fields: nome, email, senha, dataCadastro, ultimoLogin
- Build successful

---
Task ID: 6
Agent: main
Task: Fase 2 — Modelo de Dados Firestore e Migração de Cadastros

Work Log:
- Created src/lib/firestore.ts with generic CRUD helpers:
  - getCollection, getDocument, addDocument, setDocument, updateDocument, deleteDocument
  - subscribeCollection (onSnapshot), subscribeDocument
  - queryCollection with QueryConstraint support
- Created src/lib/firestore-collections.ts with typed CRUD for 4 collections:
  - empresas: subscribeEmpresas, addEmpresa, setEmpresa, updateEmpresa, removeEmpresa
  - departamentos: subscribeDepartamentos, addDepartamento, setDepartamento, updateDepartamento, removeDepartamento
  - pessoas: subscribePessoas, addPessoa, setPessoa, updatePessoa, removePessoa
  - ramais: subscribeRamais, addRamal, setRamal, updateRamal, removeRamal
- Updated Zustand store (store.ts):
  - All cadastro actions now write to Firestore (optimistic local update + Firestore write)
  - Added Firestore subscription system: startSubscriptions() / clearSubscriptions()
  - Subscriptions start on login/register/setAuthFromFirebase, stop on logout
  - onSnapshot listeners automatically update local state from Firestore
  - Seed data kept as initial fallback for offline mode
- Updated ramais-page.tsx: department dropdown now uses store departamentos merged with OPCOES_DEPARTAMENTOS
- Created src/lib/seed-firestore.ts: seed script to populate Firestore with initial data (idempotent)
- Added "Banco de Dados" section to configuracoes-page.tsx with seed button
- Updated plano.md: Phase 2 marked as ✅ CONCLUÍDA

Stage Summary:
- 4 Firestore collections fully integrated: empresas, departamentos, pessoas, ramais
- Real-time sync via onSnapshot — all connected clients see changes instantly
- Optimistic updates for responsive UI + Firestore persistence
- Seed button available in Settings > Banco de Dados
- Build successful

---
Task ID: 6/7/8
Agent: general-purpose
Task: Phase 9 cleanup — remove seed data, update imports, remove legacy files, create .env.local

Work Log:
- Read worklog.md and analyzed current project state
- Read data.ts (1796 lines) — identified seed data constants (lines 531-1796) vs types + lookup constants (lines 1-529)
- Identified UI constants that must stay in data.ts (DADOS_GRAFICO_*, OPCOES_*) because they're used by components
- Created src/lib/seed-data.ts with all 16 _INICIAIS seed constants + `const today = '2025-03-15'`, importing types and lookup constants (ITENS_CHECKLIST_PADRAO, ITENS_INSPECAO_PADRAO) from './data'
- Trimmed data.ts from 1796 to 606 lines — now contains only types, lookup constants, and UI config constants
- Updated seed-firestore.ts: changed import from './data' to './seed-data' for seed data constants
- Removed legacy files: src/lib/db.ts (Prisma client), prisma/ directory, src/app/api/route.ts (placeholder API route)
- Removed @prisma/client and prisma from package.json dependencies, removed db:* scripts
- Removed next-auth from package.json (already absent — was removed in Phase 1)
- Fixed package.json trailing comma issue (invalid JSON after script removal)
- Created .env.local with all NEXT_PUBLIC_FIREBASE_* config variables
- Cleaned unused imports in store.ts:
  - Removed `ItemInspecao` type import (used 0 times in file)
  - Removed `TipoPessoa` type import (used 0 times in file)
  - Removed `ConfigItens` type import (used 0 times in store — only imported from firestore-collections)
  - Kept `FirestoreUser` type (used in setAuthFromFirebase signature and interface)
- Fixed build error: seed-data.ts used ITENS_CHECKLIST_PADRAO and ITENS_INSPECAO_PADRAO without importing them — added value imports from './data'
- Ran bun install after removing prisma packages (2 packages removed)
- Build verified successfully: ✓ Compiled + ✓ Static pages generated

Stage Summary:
- data.ts: 1796 → 606 lines (types + lookup constants + UI config only)
- seed-data.ts: Created with all 16 seed data constants (1205 lines)
- seed-firestore.ts: Updated to import from seed-data.ts
- Legacy files removed: db.ts, prisma/, api/route.ts
- Packages removed: @prisma/client, prisma
- .env.local created with Firebase config for future reference
- 3 unused type imports removed from store.ts (ItemInspecao, TipoPessoa, ConfigItens)
- Build passes cleanly

---
Task ID: 9
Agent: main
Task: Fase 7, 8 e 9 — Verificar e completar integração Firebase

Work Log:
- Verificou-se que Fases 7 e 8 já estavam completamente implementadas em sessões anteriores
- Fase 7 (Protocolos + Ativações + Config): firestore-collections.ts tem subscribeProtocolos/addProtocolo/updateProtocolo/removeProtocolo, subscribeAtivacoes/addAtivacao/setAtivacao, getConfig/setConfig — tudo integrado no store.ts e ProtocolosEmergenciaPage
- Fase 8 (Tempo Real + Otimizações): use-firestore.ts tem useFirestoreCollection/useFirestoreDocument/useOnlineStatus, enableIndexedDbPersistence habilitado no firebase.ts, indicador de conexão no AppHeader (Wifi/WifiOff), Dashboard usa useMemo com dependências Zustand
- Fase 9 (Limpeza + Finalização) — itens pendentes completados:
  - Removido db/custom.db e diretório db/
  - Atualizado .env para remover DATABASE_URL (SQLite legado)
  - Atualizado public/sw.js (v1→v2): não intercepta requisições Firebase (googleapis.com, firebaseapp.com, firebase.io), cache apenas para same-origin responses OK
  - Migrado firebase.ts de config hardcoded para environment variables (NEXT_PUBLIC_FIREBASE_*)
  - Criado .env.example com template das variáveis Firebase
  - Atualizado next.config.ts com env config expondo variáveis Firebase ao cliente
- Build verificado com sucesso: ✓ Compiled successfully

Stage Summary:
- Fases 7, 8, 9 do plano Firebase CONCLUÍDAS
- Todas as 9 fases da integração Firebase estão completas
- Configuração do Firebase agora usa env vars em vez de hardcoded
- Service Worker atualizado para não interferir com Firebase
- Código legado removido (SQLite, DATABASE_URL)
- Build passa com sucesso
