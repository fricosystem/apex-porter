# Arquitetura de notificações FCM

## Requisito
Entregar notificações reais aos demais usuários do sistema quando um registro for criado na aba Fluxo. A entrega deve funcionar em PWA, tablet e desktop, inclusive com a tela bloqueada, o aplicativo minimizado ou fechado.

## Decisão
Usar Firebase Cloud Messaging para os dispositivos web e uma Cloud Function acionada pela criação de documentos em `registrosFluxo/{registroId}`. O cliente registra a instalação/dispositivo e salva o token em `usuarios/{uid}/pushTokens/{tokenId}`. A Cloud Function lê os tokens de todos os usuários habilitados, exclui o `authorUid` do registro e envia a notificação usando o Firebase Admin SDK.

## Payload
- Título: rótulo da categoria do registro, por exemplo `REGISTRO DE ENTRADA`.
- Corpo: mensagem personalizada com nome, empresa, usuário autor, ação e departamento quando disponível.
- Ícone: `/icons/icone-site.png`.
- Link: URL da aplicação, para reabrir/focar o PWA ao tocar na notificação.
- Dados: `type`, `registroId`, `categoria`, `authorUid` e campos normalizados da mensagem.

## Cliente web
- Solicitar permissão apenas por ação explícita no perfil.
- Registrar o service worker único em `/sw`.
- Usar a chave VAPID pública do projeto fornecida pelo usuário.
- Registrar/atualizar token por usuário e por dispositivo.
- Tratar `onMessage` em primeiro plano sem duplicar o toast/notificação nativa.
- Tratar mensagem em background no service worker e usar `notificationclick` para focar ou abrir o sistema.

## Segurança e implantação
A chave VAPID pública pode ser usada no cliente. Credenciais administrativas não podem ser expostas no navegador; a Cloud Function usa credenciais padrão do ambiente Firebase. O disparo real fora do preview depende da habilitação da API Cloud Messaging e da implantação das Functions no projeto `apex-porter`.

## Referências oficiais
1. https://firebase.google.com/docs/cloud-messaging/web/get-started
2. https://firebase.google.com/docs/cloud-messaging/web/receive-messages
3. https://firebase.google.com/docs/cloud-messaging/send/admin-sdk
4. https://firebase.google.com/docs/cloud-messaging/send/v1-api
