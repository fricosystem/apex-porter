import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentReference } from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({
  region: 'southamerica-east1',
  maxInstances: 10,
});

const db = getFirestore();
const messaging = getMessaging();
const APP_LINK = process.env.APP_PUBLIC_URL || 'https://apex-porter.vercel.app/';

const TITLE_BY_CATEGORY: Record<string, string> = {
  entregas1: 'REGISTRO DE ENTREGA',
  visitantes: 'REGISTRO DE ENTRADA',
  prestadores: 'REGISTRO DE ENTRADA',
  pesagem: 'REGISTRO DE PESAGEM',
  entregas2: 'REGISTRO DE ENTRADA',
  coleta: 'REGISTRO DE ENTRADA',
  movimentacao: 'REGISTRO DE MOVIMENTAÇÃO',
  correspondencias: 'NOVA CORRESPONDÊNCIA',
  pesagem_apara: 'REGISTRO DE PESAGEM DE APARA',
  pesagem_tinta: 'REGISTRO DE PESAGEM DE TINTA/SOLVENTE',
};

const ACTION_BY_CATEGORY: Record<string, string> = {
  entregas1: 'ENTREGA',
  visitantes: 'VISITA',
  prestadores: 'PRESTAÇÃO DE SERVIÇO',
  pesagem: 'PESAGEM',
  entregas2: 'ENTREGA',
  coleta: 'COLETA',
  movimentacao: 'MOVIMENTAÇÃO INTERNA',
  correspondencias: 'RECEBIMENTO DE CORRESPONDÊNCIA',
  pesagem_apara: 'PESAGEM DE APARA',
  pesagem_tinta: 'PESAGEM DE TINTA/SOLVENTE',
};

type FluxoRecord = {
  categoria?: string;
  nome?: string;
  motorista?: string;
  nomeColaborador?: string;
  destinatario?: string;
  condutor?: string;
  empresa?: string;
  visitanteEmpresa?: string;
  departamento?: string;
  criadoPorUid?: string;
  criadoPor?: string;
  autorUid?: string;
  autorNome?: string;
};

type PushTarget = {
  token: string;
  ref: DocumentReference;
  uid: string;
};

function clean(value: unknown, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function createRecordNotification(registro: FluxoRecord, registroId: string) {
  const categoria = clean(registro.categoria, 'registro');
  const title = TITLE_BY_CATEGORY[categoria] || `NOVO ${categoria.toUpperCase()}`;
  const person = clean(
    registro.nome || registro.motorista || registro.nomeColaborador || registro.destinatario || registro.condutor,
    'PESSOA NÃO INFORMADA',
  );
  const empresa = clean(registro.empresa || registro.visitanteEmpresa, 'EMPRESA NÃO INFORMADA');
  const departamento = clean(registro.departamento, 'DEPARTAMENTO NÃO INFORMADO');
  const author = clean(registro.criadoPor || registro.autorNome, 'USUÁRIO NÃO INFORMADO');
  const action = ACTION_BY_CATEGORY[categoria] || categoria.toUpperCase();
  const body = `${person} pela empresa ${empresa} foi liberado por ${author} e irá fazer ${action} no ${departamento}.`;
  const authorUid = clean(registro.criadoPorUid || registro.autorUid, '');

  return {
    title,
    body,
    authorUid,
    data: {
      type: 'registro-fluxo',
      registroId,
      categoria,
      title,
      body,
      link: `${APP_LINK}#fluxo`,
      notificationId: `registro-${registroId}`,
    },
  };
}

async function getEnabledTargets(excludedUid?: string, onlyUid?: string): Promise<PushTarget[]> {
  const snapshot = await db.collectionGroup('pushTokens').where('enabled', '==', true).get();
  const targets: PushTarget[] = [];

  for (const tokenDoc of snapshot.docs) {
    const uid = tokenDoc.ref.parent.parent?.id;
    const token = tokenDoc.get('token');
    if (!uid || !token || uid === excludedUid || (onlyUid && uid !== onlyUid)) continue;
    targets.push({ token: String(token), ref: tokenDoc.ref, uid });
  }

  return targets;
}

async function sendToTargets(
  targets: PushTarget[],
  data: Record<string, string>,
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  for (let index = 0; index < targets.length; index += 500) {
    const chunk = targets.slice(index, index + 500);
    const message: MulticastMessage = {
      tokens: chunk.map((target) => target.token),
      data,
      webpush: {
        headers: { TTL: '300' },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    successCount += response.successCount;
    failureCount += response.failureCount;

    const staleTokenRefs = response.responses
      .map((result, responseIndex) => ({ result, ref: chunk[responseIndex]?.ref }))
      .filter(({ result }) => {
        const code = result.error?.code;
        return code === 'messaging/registration-token-not-registered'
          || code === 'messaging/invalid-registration-token';
      })
      .map(({ ref }) => ref)
      .filter((ref): ref is DocumentReference => Boolean(ref));

    await Promise.all(staleTokenRefs.map((ref) => ref.delete().catch(() => {})));
  }

  return { successCount, failureCount };
}

export const notifyOnFluxoCreated = onDocumentCreated(
  'registrosFluxo/{registroId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const registro = snapshot.data() as FluxoRecord;
    const notification = createRecordNotification(registro, snapshot.id);
    const targets = await getEnabledTargets(notification.authorUid || undefined);
    if (targets.length === 0) return;

    const result = await sendToTargets(targets, notification.data);
    console.log('[FCM] Registro enviado', {
      registroId: snapshot.id,
      categoria: registro.categoria,
      destinatarios: targets.length,
      ...result,
    });
  },
);

export const notifyOnPushTestRequested = onDocumentCreated(
  'pushTestRequests/{requestId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const request = snapshot.data() as {
      targetUid?: string;
      requestedByUid?: string;
      requestedByName?: string;
    };
    const targetUid = clean(request.targetUid, '');
    const requestedByUid = clean(request.requestedByUid, '');
    if (!targetUid || !requestedByUid || targetUid !== requestedByUid) return;

    const targets = await getEnabledTargets(undefined, targetUid);
    if (targets.length === 0) return;

    const title = 'TESTE DE NOTIFICAÇÃO';
    const body = `Olá, ${clean(request.requestedByName, 'USUÁRIO')}. As notificações push estão funcionando neste dispositivo.`;
    const result = await sendToTargets(targets, {
      type: 'push-test',
      requestId: snapshot.id,
      title,
      body,
      link: `${APP_LINK}#perfil`,
      notificationId: `push-test-${snapshot.id}`,
    });

    await snapshot.ref.set({ processedAt: new Date(), ...result }, { merge: true });
  },
);
