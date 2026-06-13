# Plano de Ajustes: Rondas, Rotas e Correção do Firestore

## Fase 1: Correção do Firestore (Modificação de Usuários e Coleções)
**Problema Identificado**:
Ao tentar modificar um usuário (ou outros registros) no painel, as alterações não refletem no Firestore. A investigação revelou dois pontos críticos:
1. O sistema possui uma função `transformToUpperCase` (`src/lib/firestore.ts`) que converte campos não isentos para maiúsculas antes de salvar. O campo `permissoes` (array de strings como `"dashboard"`) estava sendo convertido (ex: `"DASHBOARD"`), o que invalida os acessos e quebra a lógica de edição no painel.
2. A operação base de atualização usa `updateDoc` do Firestore. Se o documento ainda não existir na coleção (por ter sido importado ou criado apenas no Firebase Auth de forma incompleta), o `updateDoc` falha em vez de criar. 

**Ações**:
- Adicionar a chave `'permissoes'` e outras propriedades não-uppercaseáveis (como `'nome'` caso prefira manter caixa mista) na constante `DONT_UPPERCASE_KEYS` em `src/lib/firestore.ts`.
- Mudar o comportamento de `updateDocument` em `src/lib/firestore.ts` de `updateDoc` para `setDoc(..., { merge: true })`, garantindo que a modificação sempre tenha sucesso (criando o documento mesclado caso ele não exista).

## Fase 2: Reestruturação da Aba de Rondas (Somente Execução)
**Problema Identificado**:
A interface de Rondas (`src/components/ronda-page.tsx`) atualmente exibe botões para criar novas rondas, bem como ícones de lixeira (excluir). A diretriz exige que a tela seja utilizada apenas para execução pelos vigias e vigilantes.

**Ações**:
- Remover o botão "Criar Ronda" (e o respectivo modal) de `src/components/ronda-page.tsx`.
- Remover o botão de lixeira (exclusão) das rondas em andamento ou pendentes para os usuários comuns.
- Manter exclusivamente as funções de "Iniciar" (Play), "Check-in" e "Finalizar" a ronda. Rondas em andamento ou agendadas aparecerão na lista para o vigilante apenas cumprir a rota e confirmar sua posição (sem gerar novas instâncias a menos que sejam automáticas do sistema).

## Fase 3: Aprimoramento da Gestão de Rondas e Rotas (Aba Admin)
**Problema Identificado**:
Uma vez que a criação avulsa foi retirada do usuário final, a tela administrativa (`src/components/admin-page.tsx` - Aba Rondas) deve assumir o controle pleno e ter melhor gerenciamento das rotas e Rondas.

**Ações**:
- Transferir a funcionalidade de "Criar Ronda" avulsa para a aba administrativa de Rondas, permitindo ao administrador designar uma ronda imediatamente para a portaria.
- Adicionar/melhorar os filtros de Rondas no painel do administrador, permitindo visualizar com facilidade quem executou, os pontos validados, horários e rotas, atuando como um mini-relatório dinâmico.

---

> [!IMPORTANT]
> **O plano está pronto e aguardando confirmação.** 
> Responda autorizando a execução para que eu proceda com as alterações nos arquivos (Fase 1, Fase 2 e Fase 3). Não modifiquei os arquivos do sistema ainda, apenas gerei este plano.
