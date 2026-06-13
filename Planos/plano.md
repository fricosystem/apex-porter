# Plano de Reestruturação Completa da Aba Rondas — Execução por Plantão

## Contexto e Objetivo
O fluxo de rondas precisa seguir uma lógica de plantão com horários fixos (00:00, 02:00, 04:00 e 06:00). Cada horário representa uma **instância independente da ronda** da mesma rota. O vigia recebe um alerta 10 minutos antes, executa a ronda ponto a ponto com geolocalização e foto, finaliza e a ronda vira histórico. A mesma rota fica disponível nos horários seguintes até todos serem concluídos, encerrando o ciclo do plantão.

---

## Fase 1: Ajuste no Modelo de Dados (`src/lib/data.ts`)

### Novos campos em `RotaGeoreferenciada`
Adicionar suporte a horários de plantão configuráveis por rota:
```ts
horariosPlantao?: string[];   // Ex: ['00:00', '02:00', '04:00', '06:00']
minutosAlerta?: number;       // Padrão: 10 (minutos antes de cada horário)
```

### Novos campos em `Ronda`
Para identificar a qual instância de horário uma ronda pertence e rastrear o histórico:
```ts
horarioPlantao?: string;      // Ex: '00:00' — horário do plantão ao qual pertence
cicloCompleto?: boolean;      // true quando todos os horários do plantão foram concluídos
fotoUrl?: string;             // URL da foto tirada na abertura geral da ronda (opcional)
```

### Novo campo em `PontoRonda`
Para salvar a foto tirada em cada ponto:
```ts
fotoUrl?: string;             // URL da foto tirada no check-in do ponto
```

---

## Fase 2: Lógica de Geração Automática por Horário de Plantão (`src/components/ronda-page.tsx`)

### Substituir o `useEffect` atual de auto-geração

A lógica atual verifica apenas o dia da semana. A nova lógica deve:

1. Obter a hora atual (`HH:mm`).
2. Para cada rota recorrente com `horariosPlantao` configurados:
   - Verificar se o dia da semana atual está nos `diasSemana` da rota.
   - Para **cada horário do plantão**, verificar se já existe uma ronda com `rotaId === rota.id`, `data === hoje` e `horarioPlantao === horário`.
   - Se não existir, verificar se já passou a hora de criação (hora atual >= horário do plantão) — **não criar adiantado**.
   - Se passou, criar a nova instância da ronda com `status: 'aguardando'` (novo status).
3. Rodar essa verificação a cada **1 minuto** via `setInterval`.

### Novo status: `'aguardando'`
Adicionar ao tipo `StatusRonda`:
```ts
export type StatusRonda = 'aguardando' | 'em_andamento' | 'concluida' | 'parcial';
```
Rondas com `status: 'aguardando'` aparecem na lista mas sem o botão Play — somente com a hora prevista de início.

---

## Fase 3: Sistema de Alertas Pré-Ronda (`src/components/ronda-page.tsx`)

### `useEffect` de alerta de 10 minutos

- Rodar a cada **30 segundos** para verificar se algum horário de plantão está a `minutosAlerta` minutos de distância.
- Se for o caso e o alerta ainda não foi emitido, exibir um toast/banner no topo da tela com countdown:

```
⏰ A Ronda das 00:00 inicia em 10 minutos — Fique atento!
```

- O alerta deve ser **único por horário/rota** (não repetir no mesmo plantão).
- Guardar os alertas emitidos em estado local (`alertasEmitidos: Set<string>`).

### Componente visual de alerta
Um banner fixo no topo da aba Rondas (acima da lista) com:
- Ícone de sino animado
- Nome da rota
- Countdown regressivo em tempo real (10:00 → 9:59 → ...)
- Cor âmbar/laranja chamativo

---

## Fase 4: Redesenho do Fluxo de Execução (`src/components/ronda-page.tsx`)

### 4.1 — Abertura da Ronda (botão Play)
- A ronda com `status: 'em_andamento'` exibe o botão **Play** na lista.
- Ao clicar, abre o modal de execução e registra `horarioInicio` e `porteiro: user.nome`.

### 4.2 — Ponto Ativo (um por vez, com intervalo de 2 minutos)

O sistema deve liberar os pontos **sequencialmente**:

- O **primeiro ponto** fica disponível imediatamente ao iniciar a ronda.
- Após o check-in de um ponto, o **próximo ponto aguarda 2 minutos** antes de liberar.
- Pontos ainda não liberados aparecem com status "Aguardando" (ícone de relógio).
- **Somente o ponto ativo** tem o botão de check-in habilitado.

### 4.3 — Geolocalização para Liberação do Check-in

- O sistema já monitora `userLat` / `userLon` via `watchPosition`.
- Quando o vigia entra no raio (`getDistanceFromLatLonInM <= ponto.raio`), o botão de check-in muda para **verde** e fica habilitado.
- Fora do raio: botão desabilitado e cinza, exibindo a distância atual ("Você está a 47m — raio: 30m").

### 4.4 — Captura de Foto por Ponto

Antes de confirmar o check-in, o sistema deve:
1. Abrir o componente de câmera (usar `<input type="file" accept="image/*" capture="environment" />`).
2. Exibir a preview da foto tirada.
3. Salvar o arquivo como base64 ou URL temporária no estado (upload para Storage do Firebase pode ser adicionado futuramente).
4. **Check-in só é liberado após a foto ser tirada** E o usuário estar no raio.

### 4.5 — Finalização da Ronda

- O botão **Finalizar Ronda** só fica clicável quando **todos os pontos tiverem check-in** realizado.
- Ao finalizar:
  - Registra `horarioFim`.
  - Define `status: 'concluida'` (ou `'parcial'` se algum ponto foi pulado por irregularidade).
  - Salva no Firestore via `updateRonda`.
  - Move o registro para o histórico.
  - **NÃO remove a ronda** — ela passa a ser somente-leitura no histórico.
  - Verifica se existem mais horários de plantão pendentes para a rota no dia — se sim, aguarda a próxima instância. Se não (`cicloCompleto: true`), exibe mensagem de encerramento do ciclo.

---

## Fase 5: Aba Histórico (`src/components/ronda-page.tsx`)

### Separação na UI: Pendentes × Histórico

A tela de Rondas passa a ter **duas seções** (ou duas abas internas):

#### Seção "Hoje"
- Lista somente rondas do dia com `status: 'aguardando'` ou `'em_andamento'`.
- Botão Play visível somente em `'em_andamento'`.

#### Seção "Histórico"
- Lista rondas com `status: 'concluida'` ou `'parcial'`, em ordem decrescente de data/hora.
- Cada card exibe: Rota, Data, Horário do Plantão, Porteiro, Pontos verificados/total.
- Botão de visualização (olho) abre o modal de detalhes somente-leitura com a lista de pontos, horários reais e fotos.

---

## Fase 6: Ajustes no Admin para Configurar Horários (`src/components/admin-page.tsx` e `modais-rota.tsx`)

### No modal de Nova/Editar Rota (`ModalNovaRota`)
Adicionar campo de configuração de horários de plantão:
- Toggle: "Ronda por Plantão" (se ativo, habilita os campos abaixo).
- Input de horários: campo de texto com `+` para adicionar múltiplos horários (ex: 00:00, 02:00, 04:00, 06:00).
- Input: "Alerta com antecedência (minutos)" — padrão 10.

---

## Fase 7: Atualização do Firestore (`src/lib/firestore-collections.ts` e `src/lib/store.ts`)

- Garantir que os campos `horarioPlantao`, `cicloCompleto` e `fotoUrl` (em `PontoRonda`) sejam incluídos na lista `DONT_UPPERCASE_KEYS` do `firestore.ts`.
- Adicionar `horariosPlantao` e `minutosAlerta` ao modelo `RotaGeoreferenciada` nas funções de leitura/gravação.
- Verificar se o `store.ts` já propaga todos os novos campos ao chamar `updateRonda`.

---

## Resumo das Fases

| Fase | Arquivo(s) | O que muda |
|------|-----------|-----------|
| 1 | `data.ts` | Novos campos: `horariosPlantao`, `horarioPlantao`, `fotoUrl`, `cicloCompleto`, `minutosAlerta` |
| 2 | `ronda-page.tsx` | Auto-geração por horário de plantão com `setInterval` de 1 min |
| 3 | `ronda-page.tsx` | Alerta 10 min antes com banner animado e countdown |
| 4 | `ronda-page.tsx` | Pontos sequenciais com intervalo de 2 min, foto obrigatória, check-in só dentro do raio |
| 5 | `ronda-page.tsx` | Separação UI: seção "Hoje" + seção "Histórico" |
| 6 | `modais-rota.tsx` | Campo de `horariosPlantao` no cadastro de rotas |
| 7 | `firestore.ts`, `store.ts`, `firestore-collections.ts` | Persistência dos novos campos |

> [!IMPORTANT]
> **Nenhuma modificação foi executada.** Este plano está aguardando aprovação para execução por fases.
