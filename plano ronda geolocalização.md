# Plano de Desenvolvimento: Ronda por Geolocalização

Abaixo está o plano estruturado em fases para a implementação da nova funcionalidade de rondas com geolocalização, conforme solicitado. Todos os itens estão marcados como não realizados.

## Fase 1: Estrutura Base e Navegação
- [x] Criar a nova página "Admin".
- [x] Criar um Bottom Navigation exclusivo para a página Admin, separado da navegação principal.
- [x] Adicionar a aba "Rondas" no novo Bottom Navigation.
- [x] Implementar a listagem de rotas criadas na aba "Rondas".
- [x] Remover o botão de excluir na lista de rotas criadas.

## Fase 2: Criação de Rotas (Modais e Formulários)
- [x] Adicionar o botão "Nova Rota" na parte superior da aba Rondas.
- [x] Criar o modal principal "Nova Rota" contendo a lista de pontos adicionados.
- [x] Criar o sub-modal de "Adicionar Novo Ponto da Rota" (aberto via botão `+` no modal "Nova Rota").
- [x] Implementar o mini mapa no sub-modal utilizando a geolocalização precisa atual do usuário.
- [x] Adicionar slider no sub-modal para definir o tamanho do raio do ponto.
- [x] Adicionar o campo "Nome do Ponto" (obrigatório) abaixo do mini mapa.
- [x] Adicionar o campo input para "Horário de Execução".
- [x] Adicionar switch "Recorrente (Sim/Não)". Se Sim, exibir checkboxes para os dias da semana.
- [x] Implementar o botão "Adicionar Ponto", que insere o ponto na lista local do modal "Nova Rota" (sem limite de pontos).
- [x] Implementar o botão "Criar Rota" no modal principal que salva os dados no Firestore na coleção `rotas`, com os pontos armazenados como nós/arrays no documento da rota.

## Fase 3: Criação de Rondas
- [x] Renomear o botão e modal atual de "Iniciar Ronda" para "Criar Ronda".
- [x] Adicionar o dropdown "Rota*" no modal "Criar Ronda" que lista os documentos da coleção `rotas` do Firestore.
- [x] Implementar lógica ao clicar em "Criar Ronda": adicionar o documento na coleção `rondas` e exibir na lista da aba Rondas.

## Fase 4: Execução da Ronda por Geolocalização
- [x] Manter o modal atual "Detalhes da Ronda" exclusivamente para visualização de dados (somente leitura).
- [x] Criar o novo modal "Iniciar Ronda" contendo a lógica de execução.
- [x] Ajustar a ação do botão "Iniciar" nos itens da lista para abrir o novo modal "Iniciar Ronda".
- [x] Implementar verificação de geolocalização em tempo real (usuário vs raio do ponto atual).
- [x] Implementar a regra de exibição do botão "Check-in":
  - [x] Visível inativo se fora do raio do ponto.
  - [x] Visível e ativo se dentro do raio do ponto.
  - [x] Visível até 5 minutos antes do horário de execução e manter visível após esse horário.
- [x] Ao clicar no "Check-in" (quando ativo), marcar o ponto da rota como concluído no documento do Firestore.

## Fase 5: Ajustes Finais e Informações de Interface
- [x] Adicionar status informativo ("Aguardando horário" ou "Fora do raio") caso o botão Check-in esteja inativo.
- [x] Validar a experiência visual e de feedback ao usuário, utilizando toasts (via `sonner`) para avisar o sucesso do check-in ou para alertar inconsistências.
- [x] Atualizar todo o plano de rota geolocalizada marcando as fases como concluídas.
