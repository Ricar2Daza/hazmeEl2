import { chatApi, directApi } from './axios';

export type ReceiptState = 'delivered' | 'read';

/**
 * Confirma entrega/lectura al backend por REST.
 *
 * El servidor es idempotente: sólo marca los mensajes que aún no tienen ese
 * estado y, si hay alguno, publica el evento de recibos por MQTT (y socket).
 * Un fallo de red no es grave — el polling de las páginas refresca y el
 * próximo intento lo cierra.
 */
export const postReceipt = (
  kind: 'direct' | 'chat',
  chatId: string,
  state: ReceiptState
): void => {
  const request =
    kind === 'chat' ? chatApi.receipts(chatId, state) : directApi.receipts(chatId, state);
  request.catch(() => undefined);
};
