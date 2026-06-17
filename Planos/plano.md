# Plano de Correção Atualizado - Criação de Rondas

## Problemas Reais Identificados
1. **Criação de múltiplas rondas por rota por dia**:
   - A lógica atual estava criando uma ronda para cada horário de plantão configurado, mas o usuário quer apenas uma rota por rota georeferenciada por dia
2. **Confusão sobre o objetivo do recurso**:
   - O propósito das rondas é permitir que os vigias executem uma rota, com checkpoints em diferentes horários, não criar uma ronda separada para cada horário
3. **Ainda há possibilidade de criar rondas duplicadas**:
   - Mesmo com a correção anterior, é importante garantir que a verificação de existência seja robusta

## Novos Passos para Correção

### Passo 1 – Redesenhar a lógica de criação automática de rondas
- Remover a criação de rondas por horário de plantão
- Criar apenas uma ronda por rota georeferenciada por dia (se não existir)
- Manter o array de `horariosPlantao` na rota apenas para referência e alertas, não para criação de múltiplas rondas

### Passo 2 – Atualizar a verificação de existência de ronda
- Verificar apenas se já existe uma ronda para a rota, data e posto (se aplicável)
- Não mais verificar por `horarioPlantao`

### Passo 3 – Simplificar a estrutura da Ronda
- Remover o campo `horarioPlantao` da interface `Ronda` (ou manter apenas para registros antigos)
- Garantir que as rondas criadas sejam claramente associadas à rota georeferenciada e ao dia

### Passo 4 – Testar exaustivamente
- Criar uma nova rota georeferenciada com pontos
- Abrir a aba Rondas e verificar se apenas uma ronda é criada por dia
- Verificar que a ronda é exibida corretamente para execução
