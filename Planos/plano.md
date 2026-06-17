# Plano de Correção - Bug de Criação Automática de Rondas

## Problemas Identificados
1. **Loop infinito no useEffect de criação automática de rondas**:
   - O useEffect em `RondaPage.tsx` (linhas 204‑274) inclui `rondas` e `addRonda` no array de dependências
   - Quando `addRonda` é chamada, atualiza o estado `rondas`, que dispara o useEffect novamente, gerando um loop infinito que cria várias rondas rapidamente
2. **Possível falha na verificação de existência de ronda**:
   - A verificação de `existingRonda` pode não ser suficientemente robusta para evitar duplicatas

## Passos para Correção

### Passo 1 – Corrigir o loop infinito no useEffect de criação automática de rondas
- Remover `rondas` e `addRonda` do array de dependências do useEffect
- Usar `useRef` para armazenar a última data/hora de criação para evitar re‑execução excessiva
- Ou usar uma flag para controlar quando devemos tentar criar novas rondas

### Passo 2 – Melhorar a verificação de existência de ronda
- Aumentar a robustez da condição de `existingRonda`
- Garantir que não haja duplicatas para a mesma rota, data e horário de plantão

### Passo 3 – Otimizar a lógica de intervalo
- Garantir que o intervalo só verifique uma vez por minuto, não em cada re‑renderização
- Melhorar a performance da função `checkAndCreateRondas`

### Passo 4 – Testar a correção
- Simular a criação de uma rota recorrente
- Verificar se apenas uma ronda é criada por horário de plantão
- Garantir que não há mais loops infinitos
