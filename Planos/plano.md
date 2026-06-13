# Plano Geral de Melhorias - APEX Porter

Este documento consolida as principais oportunidades de melhoria para o sistema APEX Porter, abrangendo refatoração de código, melhorias de UI/UX, desempenho e sugestões de novas funcionalidades divididas por cada módulo do sistema.

---

## 1. Arquitetura e Qualidade de Código (Technical Debt)

*   **Modularização de Arquivos Gigantes:** 
    *   Arquivos como `admin-page.tsx` e `store.ts` ultrapassaram 1.500 linhas.
    *   **Ação:** Refatorar quebrando em componentes menores (ex: arquivos separados para `AdminPainelTab`, `AdminRondasTab`). 
    *   Para o `store.ts`, adotar o **Zustand Slice Pattern**, separando o estado em "slices" (authSlice, fluxoSlice, rondasSlice).
*   **Resolução de Lints (`set-state-in-effect`):** 
    *   Há avisos de linting recorrentes por atualizações de estado síncronas dentro de `useEffect` (ex: `modais-rota.tsx`, `registro-modal.tsx`).
    *   **Ação:** Refatorar a inicialização de estados ou usar funções derivadas/memoizadas, evitando *cascading renders* que prejudicam a performance.
*   **Padronização de Datas:**
    *   Atualmente, o sistema mescla formatos `dd/MM/yyyy` e `YYYY-MM-DD`.
    *   **Ação:** Uniformizar o armazenamento no Firestore utilizando `Timestamps` ou strings em formato ISO (`YYYY-MM-DDTHH:mm:ss.sssZ`), e centralizar a formatação visual usando `date-fns`.

## 2. Desempenho e Otimização

*   **Lazy Loading no Firebase (Listeners sob demanda):**
    *   Atualmente, o `store.ts` faz *subscribe* em praticamente todas as coleções logo na inicialização. Em postos com grande volume de dados, isso consumirá excessivas leituras do Firestore.
    *   **Ação:** Modificar os *listeners* para escutarem dados baseados na aba/página ativa. Exemplo: carregar "Avisos" apenas quando o usuário navegar para a aba de Avisos.
*   **Virtualização de Listas Longas:**
    *   Na aba de Fluxo e Ocorrências, o histórico pode crescer rapidamente.
    *   **Ação:** Implementar o `@tanstack/react-virtual` ou `react-window` para renderizar apenas os itens visíveis na tela, mantendo a rolagem fluida.

## 3. UI, UX e Acessibilidade

*   **Modo Offline First (PWA Avançado):**
    *   Vigias podem ficar sem sinal durante a ronda.
    *   **Ação:** Salvar os check-ins de ronda localmente no `IndexedDB` do navegador/celular e realizar o *sync background* quando a conexão for reestabelecida.
*   **Skeletons de Carregamento:**
    *   **Ação:** Substituir telas brancas ou spinners inteiros por *Skeleton Loaders* (blocos cinzas piscantes) que imitam o layout enquanto o Firebase responde.
*   **Gráficos Ricos nos Dashboards:**
    *   **Ação:** Substituir as barras nativas de progresso da aba Admin por bibliotecas especializadas (como `Recharts` ou `Chart.js`) para visualização de linha do tempo, picos de acessos e gráficos em pizza de ocorrências.

## 4. Melhorias por Módulo (Novas Funcionalidades)

### Aba: Portaria / Fluxo
*   **Leitura de Documentos (OCR) e Placas:** Integração com APIs simples para extrair nome/RG tirando foto da CNH ou capturar a placa do veículo na entrada.
*   **QR Code Pass:** Geração de convite via WhatsApp com um QRCode para visitantes, que pode ser rapidamente bipado na portaria pelo vigia.
*   **Exportação do Livro:** Possibilidade de gerar um PDF oficial do Livro de Ocorrências e Livro de Passagem de Turno, pronto para impressão/assinatura do síndico.

### Aba: Ocorrências
*   **Anexos Múltiplos:** Permitir tirar fotos do incidente ou anexar boletins de ocorrência.
*   **Ditado de Ocorrências (Speech-to-Text):** Botão de microfone para o porteiro ditar a ocorrência, e a IA ou o próprio navegador (Web Speech API) transcreve para texto.
*   **Assinatura Digital:** Padronizar um campo de ciência/assinatura visual do supervisor ou gerente para fechar ocorrências graves.

### Aba: Rondas Patrimoniais
*   **Mapa Real (Leaflet/Google Maps):** Em vez de apenas exibir as coordenadas textuais ou botões estáticos, mostrar um mini mapa interativo pontilhando por onde o vigia já passou.
*   **Alerta de Pânico:** Um botão fixo/vermelho rápido na interface móvel para acionar o protocolo de emergência silenciosamente (enviando SMS/Email para a central).

### Aba: Admin
*   **Relatórios Automáticos:** O sistema poderia compilar um relatório semanal automático (resumo de faltas, rondas incompletas) e disparar por e-mail para o gerente do posto.
*   **Auditoria de Ações (Logs):** Um painel onde o Admin possa ver *quem* excluiu ou editou um registro ("Porteiro João excluiu o registro X às 14:02"). Isso é crucial em segurança patrimonial.
