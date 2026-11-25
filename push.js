import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const ONESIGNAL_APP_ID = '575ad8fe-1a24-4635-8a1d-0e12d6633b60';
const SUPABASE_HOST = 'pripxtsriyxhafevokjg.supabase.co';
const SUPABASE_PATH = '/functions/v1/enviar-push';
const SUPABASE_ANON = 'sb_publishable_ShY2V3Oh7gB4ZHSBzI5o_Q_GSMxzmds';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
}

async function configurarCanalAndroid() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pedidos-sazon', {
      name: 'Alertas Club Sazón',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: new Array(0, 250, 250, 250),
      sound: 'default'
    });
  }
}

export async function iniciarOneSignalWeb(usuario) {
  try {
    if (Platform.OS !== 'web') {
      await configurarCanalAndroid();
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
      return;
    }
    if (typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch (e) {}
}

export async function pedirPermisoPushWeb(usuario) {
  try {
    if (Platform.OS !== 'web') {
      await configurarCanalAndroid();
      const { status: actual } = await Notifications.getPermissionsAsync();
      let finalStatus = actual;
      if (actual !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    return false;
  }
}

export async function mostrarNotificacionLocalNativa(titulo, mensaje) {
  try {
    if (Platform.OS === 'web') return;
    await configurarCanalAndroid();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensaje,
        sound: true
      },
      trigger: null
    });
  } catch (e) {}
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
