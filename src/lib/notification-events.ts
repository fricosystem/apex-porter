'use client';

import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { RegistroFluxo } from './data';
import { db } from './firebase';

const NOTIFICATION_EVENTS_COLLECTION = 'notificationEvents';

export type DeviceNotificationEvent = {
  id: string;
  kind: 'registro-fluxo' | 'push-test';
  title: string;
  body: string;
  link?: string;
  authorUid?: string;
  targetUid?: string;
  notificationId?: string;
  createdAtMs: number;
};

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

function clean(value: unknown, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

export function buildRegistroNotification(registro: RegistroFluxo) {
  const fields = registro as unknown as Record<string, unknown>;
  const categoria = clean(fields.categoria, 'registro');
  const title = TITLE_BY_CATEGORY[categoria] || `NOVO ${categoria.toUpperCase()}`;
  const person = clean(
    fields.nome || fields.motorista || fields.nomeColaborador || fields.destinatario || fields.condutor,
    'PESSOA NÃO INFORMADA',
  );
  const empresa = clean(fields.empresa || fields.visitanteEmpresa, 'EMPRESA NÃO INFORMADA');
  const departamento = clean(fields.departamento, 'DEPARTAMENTO NÃO INFORMADO');
  const author = clean(fields.criadoPor, 'USUÁRIO NÃO INFORMADO');
  const action = ACTION_BY_CATEGORY[categoria] || categoria.toUpperCase();

  return {
    title,
    body: `${person} pela empresa ${empresa} foi liberado por ${author} e irá fazer ${action} no ${departamento}.`,
    link: '/#fluxo',
  };
}

export async function createDeviceNotificationEvent(input: {
  kind: DeviceNotificationEvent['kind'];
  title: string;
  body: string;
  authorUid?: string;
  targetUid?: string;
  notificationId?: string;
  link?: string;
}): Promise<string | null> {
  if (!db) return null;
  const ref = await addDoc(collection(db, NOTIFICATION_EVENTS_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
  return ref.id;
}

export async function createRegistroNotificationEvent(registro: RegistroFluxo): Promise<string | null> {
  const notification = buildRegistroNotification(registro);
  return createDeviceNotificationEvent({
    kind: 'registro-fluxo',
    title: notification.title,
    body: notification.body,
    authorUid: registro.criadoPorUid,
    notificationId: `registro-${registro.id}`,
    link: notification.link,
  });
}

export function subscribeDeviceNotificationEvents(
  uid: string,
  onEvent: (event: DeviceNotificationEvent) => void,
): Unsubscribe {
  if (!db || !uid) return () => {};

  // Começa a observar a partir deste carregamento para não reexibir eventos antigos.
  const queryStartedAt = Date.now();
  const eventsQuery = query(
    collection(db, NOTIFICATION_EVENTS_COLLECTION),
    where('createdAtMs', '>=', queryStartedAt),
  );

  return onSnapshot(eventsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== 'added') return;
      const data = change.doc.data() as Omit<DeviceNotificationEvent, 'id'>;
      if (data.authorUid === uid) return;
      if (data.targetUid && data.targetUid !== uid) return;
      if (!data.title || !data.body) return;

      onEvent({
        ...data,
        id: change.doc.id,
        createdAtMs: Number(data.createdAtMs || Date.now()),
      });
    });
  }, (error) => {
    console.warn('[Notifications] Falha ao observar eventos do dispositivo:', error);
  });
}
