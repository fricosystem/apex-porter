# Validação de produção — 2026-08-21

## Vercel
- A proteção **Vercel Authentication / Require Log In** foi desativada e salva no projeto `apex-porter`.
- `https://apex-porter.vercel.app/` responde HTTP 200 publicamente.
- `https://apex-porter.vercel.app/sw` responde HTTP 200 com `content-type: application/javascript`.
- O service worker publicado contém a configuração Firebase real: projectId `apex-porter`, messagingSenderId `835585913477`, appId `1:835585913477:web:a6b193cc36e9ba9d886fec` e carrega `firebase-messaging-compat.js`.
- `/icons/icon-192x192.png`, `/icons/maskable-icon-512x512.png` e `/manifest.json` respondem HTTP 200.

## Firebase Authentication
- Antes da alteração, os domínios autorizados eram apenas `localhost`, `apex-porter.firebaseapp.com` e `apex-porter.web.app`.
- O domínio `apex-porter.vercel.app` foi adicionado com sucesso; o console exibiu `Success: apex-porter.vercel.app adicionado`.

## Próxima validação
- Testar login no endereço público e, depois, ativação/teste de notificações no PWA.
- Cloud Functions continuam indisponíveis no plano Spark; o fallback Firestore permanece responsável por eventos enquanto o app está aberto. Push com app minimizado/fechado requer backend FCM autorizado (Cloud Functions/servidor) e tokens registrados.

Fonte da evidência: respostas HTTP externas via curl e páginas autenticadas da Vercel/Firebase Console.

## Vercel — variável FCM

- A variável `NEXT_PUBLIC_FIREBASE_VAPID_KEY` foi adicionada com classificação Sensitive nos ambientes Production e Preview.
- A Vercel confirmou que uma nova implantação é necessária para que a variável entre em vigor; a implantação será feita junto com o próximo push das correções de segurança.
- O domínio oficial permanece exclusivamente `apex-porter.vercel.app`.
