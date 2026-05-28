
# Plano de Implementação de Sistema de Tickets para Pessoas Recorrentes

## Objetivo
Criar um sistema de tickets para pessoas que visitam a empresa frequentemente, permitindo:
- Gerar tickets aleatórios para visitantes recorrentes
- Utilizar o ticket para preencher automaticamente o formulário de novo registro com dados históricos
- Exibir o código do ticket no modal de novo registro quando aplicável

## Arquivos a Modificar/Criar

### 1. `src/lib/data.ts`
**Tarefa:** Adicionar campos novos à interface `Pessoa`
- Adicionar `ticket?: string` (código do ticket único)
- Adicionar `ultimaDataVisita?: string` (para verificar recorrência, opcional)

### 2. `src/components/registro-modal.tsx`
**Tarefas:**
1. Adicionar estados:
   - `ticketModalOpen` (controle do modal do ticket)
   - `ticketGerado` (armazena o código do ticket gerado)
2. Adicionar função para verificar recorrência:
   - Contar quantas vezes a pessoa (por CPF) aparece no histórico de `registrosFluxo` nos últimos X dias (ex: 30 dias)
3. Adicionar função para gerar ticket aleatório único
4. Adicionar UI ao lado do seletor de "Tipo de Visita":
   - Botão "Criar Ticket" (visível apenas se não tem ticket e é recorrente)
   - Exibição do código do ticket (visível se tem ticket e é recorrente)
5. Adicionar modal compacto para exibir o ticket gerado (mesmo estilo do modal de mensagem)
6. Adicionar lógica para salvar o ticket no cadastro da pessoa via store

### 3. `src/components/app-header.tsx` (ou componente de header principal)
**Tarefas:**
1. Adicionar ícone de ticket no header
2. Adicionar modal para inserir o código do ticket
3. Adicionar função para buscar pessoa por ticket
4. Adicionar função para buscar último registro da pessoa e preencher o `RegistroModal` com os dados (exceto data e horário de entrada, que são atuais)

### 4. `src/lib/store.ts`
**Tarefa:** Garantir que a função `updatePessoa` já está pronta para salvar o campo `ticket` (já está, pois aceita Partial&lt;Pessoa&gt;)

### 5. `src/lib/firestore-collections.ts`
**Tarefa:** Verificar se o campo `ticket` está sendo sincronizado corretamente com o Firestore (deve estar, pois estamos passando todos os campos da pessoa)

## Detalhes da Implementação

### Verificação de Recorrência
Considerar uma pessoa recorrente se:
- Tem pelo menos 3 registros no histórico
- OU visitou nos últimos 30 dias (opcional)
- E está cadastrada no `pessoas`

### Geração de Ticket
Formato sugerido: `TK-XXXX-XXXX` (letras e números aleatórios, ex: `TK-A3B5-C7D9`)
Garantir que o ticket é único verificando o `pessoas`

### Modal Compacto do Ticket
Usar o mesmo estilo do modal de "Gerar Mensagem" (DialogPrimitive com classes compactas)

### Preenchimento Automático via Ticket
Quando o ticket é inserido e encontrado:
1. Abrir `RegistroModal`
2. Preencher dados do último registro (nome, empresa, departamento, CPF, etc.)
3. Usar data e horário atual do sistema
4. Selecionar a mesma categoria do último registro

## Passos de Implementação

✅ 1. Modificar `src/lib/data.ts` para adicionar campos `ticket` à interface `Pessoa`
✅ 2. Implementar verificação de recorrência no `RegistroModal`
✅ 3. Implementar UI do ticket no `RegistroModal`
✅ 4. Implementar modal de exibição do ticket gerado
✅ 5. Adicionar ícone e modal de busca por ticket no header
✅ 6. Implementar busca por ticket e preenchimento automático
✅ 7. Testar o fluxo completo

