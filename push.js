import { Platform } from 'react-native';

export const ONESIGNAL_APP_ID = '575ad8fe-1a24-4435-8a1d-0e1246633b60';
const SUPABASE_HOST = 'pripxtsriyxhafevokjg.supabase.co';
const SUPABASE_PATH = '/functions/v1/enviar-push';
const SUPABASE_ANON = 'sb_publishable_ShY2V3Oh7gB4ZHSBzI5o_Q_GSMxzmds';

export function iniciarOneSignalWeb(usuario) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch (e) {}
}

export async function pedirPermisoPushWeb(usuario) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    return false;
  }
}

async function dispararPushSeguro(payload) {
  try {
    await fetch('https://' + SUPABASE_HOST + SUPABASE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
}

export async function notificarPushPorRol(rolDestino, titulo, mensaje) {
  await dispararPushSeguro({
    tipo: 'rol',
    rol: rolDestino,
    titulo,
    mensaje
  });
}

export async function notificarPushUsuario(usuarioId, titulo, mensaje) {
  if (!usuarioId) return;
  await dispararPushSeguro({
    tipo: 'usuario',
    usuario_id: String(usuarioId),
    titulo,
    mensaje
  });
}
