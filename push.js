import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const SUPABASE_URL = 'https://' + 'pripxtsriyxhafevokjg' + '.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ShY2V3Oh7gB4ZHSBzI5o_Q_GSMxzmds';
const EXPO_PROJECT_ID = '2c268536-e816-43e1-b62e-f3f4a199499e';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export async function configurarCanalAndroid() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('pedidos-sazon', {
      name: 'Alertas de Pedidos Club Sazón',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: new Array(0, 400, 200, 400, 200, 500),
      lightColor: '#E50914',
      sound: 'default',
      bypassDnd: true,
      enableVibrate: true
    });
  } catch (e) {}
}

export async function iniciarOneSignalWeb(usuario) {
  if (Platform.OS === 'web') return;
  try {
    await configurarCanalAndroid();
    const { status: estActual } = await Notifications.getPermissionsAsync();
    let estFinal = estActual;
    if (estActual !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      estFinal = status;
    }
    if (estFinal === 'granted' && usuario?.id) {
      const tokenObj = await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID });
      const token = tokenObj?.data;
      if (token) {
        await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${usuario.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ push_token: token })
        });
      }
    }
  } catch (e) {}
}
export async function pedirPermisoPushWeb(usuario) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const p = await Notification.requestPermission();
      return p === 'granted';
    }
    return false;
  }
  await iniciarOneSignalWeb(usuario);
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function mostrarNotificacionLocalNativa(titulo, cuerpo) {
  if (Platform.OS === 'web') return;
  try {
    await configurarCanalAndroid();
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, sound: 'default', channelId: 'pedidos-sazon' },
      trigger: null
    });
  } catch (e) {}
}

export async function enviarPushNativo(titulo, mensaje, rolDestino = null, usuarioIdDestino = null) {
  try {
    let filtro = 'push_token=not.is.null';
    if (usuarioIdDestino) filtro += `&id=eq.${usuarioIdDestino}`;
    else if (rolDestino) filtro += `&rol=eq.${rolDestino}`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?select=push_token&${filtro}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const filas = await res.json();
    const tokens = [...new Set((Array.isArray(filas) ? filas : []).map(f => f.push_token).filter(t => String(t || '').startsWith('ExponentPushToken')))];
    if (!tokens.length) return;

    const mensajes = tokens.map(to => ({
      to,
      sound: 'default',
      title: titulo,
      body: mensaje,
      priority: 'high',
      channelId: 'pedidos-sazon'
    }));

    await fetch('https://exp.host', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(mensajes)
    });
  } catch (e) {}
}
