# Hardening da autenticação pública

Este documento registra as medidas aplicadas ao acesso público do APEX Portaria. O objetivo foi remover o auto-cadastro da superfície cliente, manter o login por email e senha para contas existentes e acrescentar camadas de proteção sem alterar regras Firestore/Storage, dados ou permissões pós-login.

## Escopo aplicado

A tela pública de autenticação renderiza somente os campos Email, Senha e Entrar. O método `register` foi removido do `AuthSlice` e do store, e a função pública `signUpWithEmail` deixou de ser exportada. O cadastro de colaboradores continua disponível exclusivamente na área administrativa por `createUserAccountWithoutChangingSession`, que usa uma instância secundária do Firebase Auth para não substituir a sessão do administrador.

As mensagens do login passaram a ser não enumeráveis: falhas como usuário inexistente, senha incorreta, credencial inválida e conta desativada não informam qual condição ocorreu. O código do erro continua disponível apenas no fluxo interno para decisão de mensagem e diagnóstico; senhas, tokens e dados pessoais não são registrados.

O login também aplica uma limitação progressiva local no navegador. Após cinco falhas de autenticação dentro de uma janela de quinze minutos, é aplicado cooldown inicial de quinze segundos, com aumento progressivo até quinze minutos. O contador é apagado após uma autenticação válida. O estado não armazena email ou senha e o botão mostra o tempo restante.

> A limitação local é uma camada complementar de UX e dissuasão. Ela não é um rate limiter forte: pode ser apagada pelo usuário, varia por navegador/dispositivo e não substitui os controles do Firebase, App Check ou um limitador server-side.

## MFA e proteção contra abuso

MFA não foi ativado compulsoriamente nesta entrega. A ativação segura exige habilitar um provedor no Firebase Authentication com Identity Platform, configurar regiões e números de teste SMS, verificar emails, autorizar os domínios e implementar o enrollment e a verificação com `RecaptchaVerifier`. A documentação oficial recomenda escolher entre enrollment obrigatório, opcional, na página de perfil ou incremental para recursos sensíveis [1]. O login trata o código de erro de segundo fator sem revelar a condição da conta, mas o fluxo de desafio/enrollment deve ser implementado e testado em homologação antes de exigir MFA em produção.

A proteção forte recomendada para a próxima etapa é registrar o app no Firebase App Check com um provedor web, observar métricas e só então avaliar enforcement gradual. O App Check atesta que o tráfego vem da aplicação, mas deve ser validado contra todos os ambientes e domínios autorizados antes de bloquear requisições [2]. O provedor Email/Senha permaneceu inalterado para evitar indisponibilidade de contas existentes [3].

| Item | Estado nesta entrega | Impacto operacional |
| --- | --- | --- |
| Auto-cadastro público | Removido da tela, store e serviço exportado | Contas continuam sendo criadas pelo administrador |
| Login Email/Senha | Mantido | Usuários existentes não são bloqueados por mudança de provedor |
| Mensagens de login | Padronizadas para não enumeração | Menor exposição de existência/status de contas |
| Tentativas repetidas | Cooldown local progressivo | Complementar; não substitui proteção do Firebase |
| MFA | Não imposto | Nenhum usuário existente depende de telefone/segundo fator nesta entrega |
| App Check | Não ativado nesta entrega | Requer configuração e rollout no Firebase Console |
| Firestore/Storage rules | Não alteradas | Risco de autorização pós-login permanece fora deste escopo |

## Rollout recomendado para MFA

O rollout deve começar em projeto de homologação com uma conta administrativa de recuperação, email verificado, números de teste configurados e domínio de homologação autorizado. Depois do enrollment voluntário e da verificação do desafio, deve-se testar login normal, erro de código, perda do dispositivo, troca de telefone, logout e recuperação operacional. Só após esses testes deve ser considerada a exigência incremental para perfis sensíveis, com uma janela de comunicação e um procedimento de recuperação aprovado pela empresa.

## Verificações executadas

A checagem TypeScript, `git diff --check` e o build de produção passaram. O preview exibiu apenas Email, Senha, Entrar e o aviso de privacidade. Não foram usadas credenciais reais, contas não foram criadas e as regras `firestore.rules` e `storage.rules` não foram modificadas.

## Referências

[1]: https://firebase.google.com/docs/auth/web/multi-factor "Firebase — Add multi-factor authentication to your web app"

[2]: https://firebase.google.com/docs/app-check "Firebase — App Check"

[3]: https://firebase.google.com/docs/auth/web/password-auth "Firebase — Authenticate with Firebase using Password-Based Accounts"
