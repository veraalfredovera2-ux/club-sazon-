import { Platform } from 'react-native';

export const ONESIGNAL_APP_ID = '575ad8fe-1a24-4435-8a1d-0e1246633b60';
const SDK_HOST = '://onesignal.com';
const SDK_PATH = '/sdks/web/v16/OneSignalSDK.page.js';
const SUPABASE_HOST = 'pripxtsriyxhafevokjg.supabase.co';
const SUPABASE_PATH = '/functions/v1/enviar-push';
const SUPABASE_ANON = 'sb_publishable_ShY2V3Oh7gB4ZHSBzI5o_Q_GSMxzmds';

let inicializado = false;

export function iniciarOneSignalWeb(usuario) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    if (!inicializado) {
      inicializado = true;
      const script = document.createElement('script');
      script.src = 'https://' + SDK_HOST + SDK_PATH;
      script.defer = true;
      document.head.appendChild(script);
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            safari_web_id: 'web.onesignal.auto.4979c8f7-1397-4bb3-8d4b-5aebacc6595c',
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false }
          });
        } catch (e) {}
      });
    }
    if (usuario?.id) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.login(String(usuario.id));
          await OneSignal.User.addTag('rol', String(usuario.rol || 'cliente'));
        } catch (e) {}
      });
    }
  } catch (e) {}
}

export async function pedirPermisoPushWeb(usuario) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    iniciarOneSignalWeb(usuario);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 4000);
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.Notifications.requestPermission();
          if (usuario?.id) {
            await OneSignal.login(String(usuario.id));
            await OneSignal.User.addTag('rol', String(usuario.rol || 'cliente'));
          }
          clearTimeout(timer);
          resolve(Boolean(OneSignal.Notifications.permission));
        } catch (e) {
          clearTimeout(timer);
          resolve(false);
        }
      });
    });
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
