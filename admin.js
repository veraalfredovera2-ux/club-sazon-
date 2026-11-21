import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, ROJO, TARJETA, BORDE } from './estilos';
import { NavegacionSuperior, LOGO } from './pantallas';
import { mostrarAviso } from './avisos';
import { obtenerCatalogo, guardarProductoAdmin, eliminarProductoAdmin, obtenerRecompensas, guardarRecompensaAdmin, obtenerPromociones, guardarPromocionAdmin, obtenerConfigPagos, guardarConfigPagos, obtenerSolicitudesCanje, confirmarEntregaCanje, subirImagenGaleria, obtenerRidersAdmin, guardarRiderAdmin, eliminarRiderAdmin, suscribirPushDispositivo } from './servicios';

function generarWavDataUri(silencio = false) {
  const sr = 8000, dur = silencio ? 3 : 1.2, n = Math.floor(sr * dur);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const freq = (Math.floor(t * 4) % 2 === 0) ? 980 : 1320;
    const val = silencio ? 2 : Math.round(Math.sin(2 * Math.PI * freq * t) * 32000);
    v.setInt16(44 + i * 2, val, true);
  }
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes.at(i));
  return 'data:audio/wav;base64,' + btoa(bin);
}

function obtenerInfoHoraPeru() {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const peru = new Date(utc - 5 * 3600000);
  const hh = String(peru.getHours()).padStart(2, '0'), mm = String(peru.getMinutes()).padStart(2, '0');
  const min = peru.getHours() * 60 + peru.getMinutes();
  const turno = (min >= 410 && min <= 660) ? 'TURNO MAÑANA' : (min >= 1110 && min <= 1430) ? 'TURNO NOCHE' : 'LOCAL CERRADO';
  return { hora: `${hh}:${mm}`, turno };
}

async function registrarSwYNotificarAdmin(titulo, cuerpo) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const opciones = { body: cuerpo, vibrate: Array.of(600, 200, 600, 200, 800), tag: 'pedido-nuevo-' + Date.now(), renotify: true, requireInteraction: true, silent: false };
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) { await reg.showNotification(titulo, opciones); return; }
    }
    new Notification(titulo, opciones);
  } catch (e) {}
}

export function VistaAdmin({ usuario, pedidos, recargar, onConfirmarAdmin, onCompletar, onCancelar, cerrarSesion, cargando }) {
  const [tab, setTab] = useState('panel');
  const [productos, setProductos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [solicitudesCanje, setSolicitudesCanje] = useState([]);
  const [riders, setRiders] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titular: 'Club Sazón', titularLimpio: 'Club Sazón', local_lat: '-12.089700', local_lng: '-77.003100', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false });
  const [hMananaIni, setHMananaIni] = useState('06:50');
  const [hMananaFin, setHMananaFin] = useState('11:00');
  const [hNocheIni, setHNocheIni] = useState('18:30');
  const [hNocheFin, setHNocheFin] = useState('23:50');
  const [costosDel, setCostosDel] = useState({});
  const [editProd, setEditProd] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [editRider, setEditRider] = useState(null);
  const [riderHistId, setRiderHistId] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [audioListo, setAudioListo] = useState(true);
  const cfgCargadaRef = useRef(false);
  const conocidosRef = useRef(null), audioSirenaRef = useRef(null), audioFondoRef = useRef(null), timeoutRef = useRef(null), wakeRef = useRef(null);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
        const aSirena = new window.Audio(generarWavDataUri(false));
        aSirena.loop = true;
        audioSirenaRef.current = aSirena;
        const aFondo = new window.Audio(generarWavDataUri(true));
        aFondo.loop = true;
        aFondo.volume = 0.02;
        audioFondoRef.current = aFondo;
      } catch (e) {}
    }
    AsyncStorage.getItem('admin_sonido_activo').then(v => {
      const activo = v === null ? true : v === '1';
      setAudioListo(activo);
      if (activo) {
        iniciarKeepAliveFondo();
        suscribirPushDispositivo('admin', usuario?.id);
      }
    });
    cargarTodoAdmin();
    try { if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
    const t = setInterval(() => { recargar(); cargarTodoAdmin(); }, 3500);
    return () => { clearInterval(t); liberarWakeLock(); detenerKeepAliveFondo(); detenerAlarma(); };
  }, []);

  useEffect(() => { if (audioListo) { activarWakeLock(); iniciarKeepAliveFondo(); } else { liberarWakeLock(); detenerKeepAliveFondo(); detenerAlarma(); } }, [audioListo]);

  function iniciarKeepAliveFondo() {
    try {
      if (audioFondoRef.current && audioFondoRef.current.paused) audioFondoRef.current.play().catch(() => {});
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = new window.MediaMetadata({ title: 'Club Sazón • Recepción de Pedidos', artist: 'Alertas Activas en Segundo Plano' });
        navigator.mediaSession.playbackState = 'playing';
      }
    } catch (e) {}
  }
  function detenerKeepAliveFondo() {
    try {
      if (audioFondoRef.current) { audioFondoRef.current.pause(); audioFondoRef.current.currentTime = 0; }
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
    } catch (e) {}
  }
  async function activarWakeLock() { try { if (Platform.OS === 'web' && navigator?.wakeLock && !wakeRef.current) wakeRef.current = await navigator.wakeLock.request('screen'); } catch (e) {} }
  function liberarWakeLock() { try { if (wakeRef.current) { wakeRef.current.release(); wakeRef.current = null; } } catch (e) {} }

  async function alternarSonido() {
    const nuevo = !audioListo; setAudioListo(nuevo);
    await AsyncStorage.setItem('admin_sonido_activo', nuevo ? '1' : '0');
    if (nuevo) {
      iniciarKeepAliveFondo();
      tocarPitidoPrueba();
      try {
        if (Platform.OS === 'web' && 'Notification' in window) {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            await suscribirPushDispositivo('admin', usuario?.id);
            registrarSwYNotificarAdmin('Sonido en segundo plano activo', 'Recibirás alertas sonoras incluso con la pantalla apagada.');
          }
        }
      } catch (e) {}
    } else detenerAlarma();
  }

  const esPendiente = (est) => est === 'Pendiente' || est === 'Pendiente de confirmación';

  useEffect(() => {
    const pendientes = (pedidos || []).filter(p => esPendiente(p.estado));
    if (conocidosRef.current === null) { conocidosRef.current = pendientes.map(p => p.id); return; }
    const nuevos = pendientes.filter(p => !conocidosRef.current.includes(p.id));
    if (nuevos.length > 0 && audioListo) {
      activarAlarma15Seg();
      const ult = nuevos.at(0);
      registrarSwYNotificarAdmin(
        `¡Nuevo Pedido ${ult?.numero_pedido || ''}!`,
        `Cliente: ${ult?.clientes?.nombre_completo || 'Cliente'} • Total: S/ ${Number(ult?.total || 0).toFixed(2)}`
      );
    }
    if (pendientes.length === 0) detenerAlarma();
    conocidosRef.current = pendientes.map(p => p.id);
  }, [pedidos, audioListo]);

  function tocarPitidoPrueba() {
    try {
      if (audioSirenaRef.current) {
        audioSirenaRef.current.currentTime = 0;
        audioSirenaRef.current.play().catch(() => {});
        setTimeout(() => { if (!sonando && audioSirenaRef.current) { audioSirenaRef.current.pause(); audioSirenaRef.current.currentTime = 0; } }, 700);
      }
    } catch (e) {}
  }

  function detenerAlarma() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try { if (audioSirenaRef.current) { audioSirenaRef.current.pause(); audioSirenaRef.current.currentTime = 0; } } catch (e) {}
    setSonando(false);
  }

  function activarAlarma15Seg() {
    detenerAlarma(); setSonando(true);
    try { Vibration.vibrate(Array.of(600, 200, 600, 200, 800)); } catch (e) {}
    try { if (audioSirenaRef.current) { audioSirenaRef.current.currentTime = 0; audioSirenaRef.current.play().catch(() => {}); } } catch (e) {}
    timeoutRef.current = setTimeout(detenerAlarma, 15000);
  }
    function estiloEstado(est) {
    if (esPendiente(est)) return { badge: { borderColor: ROJO, backgroundColor: '#251216' }, txt: { color: ROJO } };
    if (est === 'Completado') return { badge: { borderColor: '#4CAF50', backgroundColor: '#0E2612' }, txt: { color: '#4CAF50' } };
    if (est === 'Cancelado') return { badge: { borderColor: '#6B7280', backgroundColor: '#1F1F28' }, txt: { color: '#9CA3AF' } };
    return { badge: { borderColor: '#38BDF8', backgroundColor: '#0E2433' }, txt: { color: '#38BDF8' } };
  }

  async function elegirFoto(destino) {
    try {
      setSubiendoImg(true);
      const url = await subirImagenGaleria();
      if (!url) return;
      if (destino === 'prod') setEditProd(prev => ({ ...prev, imagen_url: url }));
      if (destino === 'promo') setEditPromo(prev => ({ ...prev, imagen_url: url }));
      mostrarAviso('Foto cargada', 'La imagen se subió correctamente.');
    } catch (e) { mostrarAviso('Error al subir', e.message); } finally { setSubiendoImg(false); }
  }

  async function cargarTodoAdmin(forzarCfg = false) {
    try {
      const [p, r, pr, c, sc, rd] = await Promise.all([
        obtenerCatalogo(false), obtenerRecompensas(false), obtenerPromociones(false), obtenerConfigPagos(), obtenerSolicitudesCanje(), obtenerRidersAdmin()
      ]);
      setProductos(p || []); setRecompensas(r || []); setPromociones(pr || []); setSolicitudesCanje(sc || []); setRiders(rd || []);
      if (!cfgCargadaRef.current || forzarCfg) {
        const cfg = c || {};
        setCfgPagos(prev => ({ ...prev, ...cfg }));
        if (cfg.manana_inicio) setHMananaIni(cfg.manana_inicio);
        if (cfg.manana_fin) setHMananaFin(cfg.manana_fin);
        if (cfg.noche_inicio) setHNocheIni(cfg.noche_inicio);
        if (cfg.noche_fin) setHNocheFin(cfg.noche_fin);
        cfgCargadaRef.current = true;
      }
    } catch (e) {}
  }

  function capturarGpsLocal() {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      return mostrarAviso('GPS no disponible', 'Ingresa la latitud y longitud del local manualmente.');
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCfgPagos(prev => ({ ...prev, local_lat: pos.coords.latitude.toFixed(6), local_lng: pos.coords.longitude.toFixed(6) }));
        mostrarAviso('Ubicación del local lista', 'Coordenadas GPS capturadas. Pulsa Guardar Tarifas.');
      },
      () => mostrarAviso('Permiso GPS', 'Activa la ubicación en tu navegador para capturar las coordenadas del local.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function guardarProd() { if (editProd?.nombre?.trim()) try { await guardarProductoAdmin(editProd); setEditProd(null); cargarTodoAdmin(); mostrarAviso('Guardado', 'Producto actualizado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function borrarProd(id) { try { await eliminarProductoAdmin(id); cargarTodoAdmin(); mostrarAviso('Eliminado', 'Plato eliminado del menú.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarRider() { if (editRider?.nombre_completo?.trim() && editRider?.telefono?.trim()) try { await guardarRiderAdmin(editRider); setEditRider(null); cargarTodoAdmin(); mostrarAviso('Guardado', 'Repartidor guardado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function borrarRider(id) { try { await eliminarRiderAdmin(id); cargarTodoAdmin(); mostrarAviso('Eliminado', 'Repartidor eliminado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function cambiarHorarioRapido(prod, nuevoTurno, nuevaDisp) { try { await guardarProductoAdmin({ ...prod, turno: nuevoTurno, disponible: nuevaDisp }); cargarTodoAdmin(); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarRec() { if (editRec?.titulo?.trim() && Number(editRec.puntos_requeridos) > 0) try { await guardarRecompensaAdmin(editRec); setEditRec(null); cargarTodoAdmin(); mostrarAviso('Guardado', 'Premio actualizado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarPromo() { if (editPromo?.titulo?.trim()) try { await guardarPromocionAdmin(editPromo); setEditPromo(null); cargarTodoAdmin(); mostrarAviso('Guardado', 'Publicado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function entregarCanje(id) { try { await confirmarEntregaCanje(id); cargarTodoAdmin(); mostrarAviso('Entregado', 'Canje confirmado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarPagos() {
    try {
      const payload = { ...cfgPagos, manana_inicio: hMananaIni.trim() || '06:50', manana_fin: hMananaFin.trim() || '11:00', noche_inicio: hNocheIni.trim() || '18:30', noche_fin: hNocheFin.trim() || '23:50' };
      await guardarConfigPagos(payload);
      setCfgPagos(payload);
      mostrarAviso('Guardado', 'Horarios, tarifas delivery y pagos guardados correctamente.');
    } catch (e) { mostrarAviso('Error', e.message); }
  }
    const infoPeru = obtenerInfoHoraPeru();
  const completados = (pedidos || []).filter(p => p.estado === 'Completado');
  const pendientesCount = (pedidos || []).filter(p => esPendiente(p.estado)).length;
  const totalVentas = completados.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ventasPorDia = Object.values((pedidos || []).reduce((acc, p) => {
    const fecha = (p.creado_en || '').slice(0, 10) || 'Sin fecha';
    if (!acc[fecha]) acc[fecha] = { fecha, ventas: 0, devoluciones: 0, cantComp: 0, cantCanc: 0 };
    if (p.estado === 'Completado') { acc[fecha].ventas += Number(p.total || 0); acc[fecha].cantComp += 1; }
    if (p.estado === 'Cancelado') { acc[fecha].devoluciones += Number(p.total || 0); acc[fecha].cantCanc += 1; }
    return acc;
  }, {}));

  const modulosAdmin = [
    { id: 'pedidos', icono: '📦', titulo: `Pedidos (${pendientesCount})` },
    { id: 'menu', icono: '🍔', titulo: 'Productos' },
    { id: 'promos', icono: '🔥', titulo: 'Promociones' },
    { id: 'ofertas', icono: '🏷️', titulo: 'Ofertas' },
    { id: 'canjes', icono: '🎁', titulo: 'Premios y canjes' },
    { id: 'riders', icono: '🛵', titulo: `Motorizados (${riders.length})` },
    { id: 'qr pagos', icono: '💳', titulo: 'Métodos de pago' },
    { id: 'horarios', icono: '⚙️', titulo: 'Config. negocio' },
    { id: 'ventas', icono: '📊', titulo: 'Historial ventas' }
  ];

  const estiloHoraAzul = { width: 85, height: 34, backgroundColor: '#16161D', borderColor: ROJO, borderWidth: 1.5, borderRadius: 8, color: '#FFFFFF', fontSize: 13, fontWeight: '900', textAlign: 'center', paddingHorizontal: 6 };

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior
        regresar={tab !== 'panel' ? () => { setEditProd(null); setEditRec(null); setEditPromo(null); setEditRider(null); setTab('panel'); } : null}
        irAInicio={() => setTab('panel')}
      />

      {sonando && (
        <TouchableOpacity onPress={detenerAlarma} style={{ backgroundColor: ROJO, padding: 14, borderRadius: 12, marginBottom: 10, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: '900' }}>🚨 NUEVO PEDIDO - TOCA PARA SILENCIAR</Text>
        </TouchableOpacity>
      )}

      <View style={styles.filaSaludo}>
        <View>
          <Text style={styles.saludo}>Panel de administración ({infoPeru.hora})</Text>
          <Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { backgroundColor: audioListo ? '#16A34A' : '#2A2A35' }]} onPress={alternarSonido}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>{audioListo ? '🔔 ON' : '🔕 OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE }]} onPress={() => { recargar(); cargarTodoAdmin(); }}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'panel' && (
        <View>
          <View style={styles.cuadricula3}>
            {modulosAdmin.map(m => (
              <TouchableOpacity key={m.id} style={styles.itemCuadricula} onPress={() => setTab(m.id)}>
                <View style={styles.iconoCuadriculaBox}>
                  <Text style={{ fontSize: 20, color: ROJO }}>{m.icono}</Text>
                </View>
                <Text style={styles.textoCuadricula}>{m.titulo}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#252530', marginTop: 18 }]} onPress={cerrarSesion}>
            <Text style={styles.textoBoton}>🚪 Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === 'riders' && (
        <View>
          <View style={styles.filaSaludo}>
            <Text style={styles.titulo}>MOTORIZADOS ({riders.length})</Text>
            <TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditRider({ nombre_completo: '', telefono: '', password: '', placa: '', hora_entrada: '18:30', hora_salida: '23:50', dias_libres: 'Lunes', activo: true })}>
              <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO</Text>
            </TouchableOpacity>
          </View>
          {editRider && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={styles.campo} placeholder="Nombre del motorizado" placeholderTextColor="#6B7280" value={editRider.nombre_completo} onChangeText={v => setEditRider({ ...editRider, nombre_completo: v })} />
              <TextInput style={styles.campo} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" value={editRider.telefono} onChangeText={v => setEditRider({ ...editRider, telefono: v })} />
              <TextInput style={styles.campo} placeholder="Contraseña" placeholderTextColor="#6B7280" value={editRider.password} onChangeText={v => setEditRider({ ...editRider, password: v })} />
              <TextInput style={styles.campo} placeholder="Placa (ej. ABC-123)" placeholderTextColor="#6B7280" value={editRider.placa || ''} onChangeText={v => setEditRider({ ...editRider, placa: v })} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.campo, { flex: 1 }]} placeholder="Entrada (18:30)" placeholderTextColor="#6B7280" value={editRider.hora_entrada || ''} onChangeText={v => setEditRider({ ...editRider, hora_entrada: v })} />
                <TextInput style={[styles.campo, { flex: 1 }]} placeholder="Salida (23:50)" placeholderTextColor="#6B7280" value={editRider.hora_salida || ''} onChangeText={v => setEditRider({ ...editRider, hora_salida: v })} />
              </View>
              <TextInput style={styles.campo} placeholder="Días libres (ej. Lunes)" placeholderTextColor="#6B7280" value={editRider.dias_libres || ''} onChangeText={v => setEditRider({ ...editRider, dias_libres: v })} />
              <TouchableOpacity style={styles.boton} onPress={guardarRider}><Text style={styles.textoBoton}>GUARDAR RIDER</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRider(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
              {editRider.id && (
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#7F1D1D', marginTop: 8 }]} onPress={() => { borrarRider(editRider.id); setEditRider(null); }}>
                  <Text style={styles.textoBoton}>ELIMINAR RIDER</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {riders.map(r => {
            const entConfirmadas = (pedidos || []).filter(p => p.rider_id === r.id && p.estado === 'Completado');
            const gananciaConfirmada = entConfirmadas.reduce((acc, p) => acc + Number(p.costo_delivery || 0), 0);
            const abierto = riderHistId === r.id;
            return (
              <View key={r.id} style={styles.tarjetaPedido}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreProducto}>{r.nombre_completo}</Text>
                    <Text style={styles.descripcionPedido}>Tel: {r.telefono} • Clave: {r.password}</Text>
                    <Text style={[styles.descripcionPedido, { color: ROJO }]}>Horario: {r.hora_entrada || '18:30'} - {r.hora_salida || '23:50'} • {r.dias_libres || 'Sin días libres'}</Text>
                    <Text style={[styles.descripcionPedido, { color: '#4CAF50', fontWeight: '900', marginTop: 2 }]}>Entregas: {entConfirmadas.length} • Ganancia: S/ {gananciaConfirmada.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditRider(r)}>
                    <Text style={styles.textoAgregar}>EDITAR</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.boton, styles.botonSecundario, { marginTop: 8, paddingVertical: 8 }]} onPress={() => setRiderHistId(abierto ? null : r.id)}>
                  <Text style={[styles.textoBoton, { fontSize: 11 }]}>{abierto ? '▲ OCULTAR HISTORIAL' : `VER HISTORIAL (${entConfirmadas.length})`}</Text>
                </TouchableOpacity>
                {abierto && entConfirmadas.map(p => (
                  <View key={p.id} style={{ borderTopWidth: 1, borderTopColor: BORDE, paddingTop: 6, marginTop: 6 }}>
                    <Text style={[styles.descripcionPedido, { color: '#FFF', fontWeight: '700' }]}>{p.numero_pedido} • {(p.creado_en || '').slice(0, 10)}</Text>
                    <Text style={styles.descripcionPedido}>Delivery: S/ {Number(p.costo_delivery || 0).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
              {tab === 'horarios' && (
        <View>
          <View style={[styles.tarjetaSaldo, { paddingVertical: 10, marginBottom: 10 }]}>
            <Text style={styles.etiquetaSaldo}>HORA PERÚ: {infoPeru.hora} • {infoPeru.turno}</Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              const nuevoEstado = !cfgPagos.local_cerrado;
              const payload = { ...cfgPagos, manana_inicio: hMananaIni || '06:50', manana_fin: hMananaFin || '11:00', noche_inicio: hNocheIni || '18:30', noche_fin: hNocheFin || '23:50', local_cerrado: nuevoEstado };
              try {
                await guardarConfigPagos(payload);
                setCfgPagos(payload);
                mostrarAviso(nuevoEstado ? 'Local Cerrado' : 'Local Abierto', nuevoEstado ? 'Hoy los clientes verán que el local está cerrado.' : 'El local vuelve a estar abierto.');
              } catch (e) { mostrarAviso('Error', e.message); }
            }}
            style={{ backgroundColor: cfgPagos.local_cerrado ? ROJO : '#16A34A', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>
              {cfgPagos.local_cerrado ? '🔒 LOCAL CERRADO HOY (TOCA PARA ABRIR)' : '🟢 LOCAL ABIERTO (TOCA PARA CERRAR HOY)'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>TARIFAS DE DELIVERY POR DISTANCIA</Text>
          <View style={styles.tarjetaPedido}>
            <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8, paddingVertical: 10 }]} onPress={capturarGpsLocal}>
              <Text style={styles.textoBoton}>📍 CAPTURAR UBICACIÓN GPS DEL LOCAL</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4 }}>LATITUD LOCAL</Text>
                <TextInput style={styles.campo} value={String(cfgPagos.local_lat || '')} onChangeText={v => setCfgPagos({ ...cfgPagos, local_lat: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4 }}>LONGITUD LOCAL</Text>
                <TextInput style={styles.campo} value={String(cfgPagos.local_lng || '')} onChangeText={v => setCfgPagos({ ...cfgPagos, local_lng: v })} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4 }}>TARIFA BASE (S/)</Text>
                <TextInput style={styles.campo} keyboardType="numeric" value={String(cfgPagos.tarifa_base || '4.00')} onChangeText={v => setCfgPagos({ ...cfgPagos, tarifa_base: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4 }}>POR KM (S/ KM)</Text>
                <TextInput style={styles.campo} keyboardType="numeric" value={String(cfgPagos.tarifa_km || '1.50')} onChangeText={v => setCfgPagos({ ...cfgPagos, tarifa_km: v })} />
              </View>
            </View>
            <TouchableOpacity style={styles.boton} onPress={guardarPagos}>
              <Text style={styles.textoBoton}>GUARDAR TARIFAS DELIVERY</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.titulo}>APERTURA Y CIERRE DEL LOCAL</Text>
          <View style={styles.tarjetaPedido}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>MAÑANA:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput style={estiloHoraAzul} placeholder="06:50" placeholderTextColor="#6B7280" value={hMananaIni} onChangeText={setHMananaIni} />
                <Text style={{ color: '#FFF', fontWeight: '900' }}>a</Text>
                <TextInput style={estiloHoraAzul} placeholder="11:00" placeholderTextColor="#6B7280" value={hMananaFin} onChangeText={setHMananaFin} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>NOCHE:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput style={estiloHoraAzul} placeholder="18:30" placeholderTextColor="#6B7280" value={hNocheIni} onChangeText={setHNocheIni} />
                <Text style={{ color: '#FFF', fontWeight: '900' }}>a</Text>
                <TextInput style={estiloHoraAzul} placeholder="23:50" placeholderTextColor="#6B7280" value={hNocheFin} onChangeText={setHNocheFin} />
              </View>
            </View>
            <TouchableOpacity style={styles.boton} onPress={guardarPagos}>
              <Text style={styles.textoBoton}>GUARDAR HORARIOS</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.titulo}>TURNOS POR PRODUCTO</Text>
          {productos.map(prod => (
            <View key={prod.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{prod.nombre} ({prod.categoria})</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                {[{ id: 'manana', txt: 'MAÑANA' }, { id: 'noche', txt: 'NOCHE' }, { id: 'ambos', txt: 'AMBOS' }].map(h => (
                  <TouchableOpacity key={h.id} style={[styles.opcionEntrega, (prod.turno || 'ambos') === h.id && styles.opcionEntregaActiva, { flex: 1, paddingVertical: 6 }]} onPress={() => cambiarHorarioRapido(prod, h.id, prod.disponible !== false)}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', textAlign: 'center' }}>{h.txt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
                    {tab === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>GESTIÓN DE PEDIDOS</Text>
          {!(pedidos || []).length ? (
            <View style={styles.tarjetaVacia}>
              <Text style={styles.textoVacio}>Aún no hay pedidos registrados.</Text>
            </View>
          ) : (
            (pedidos || []).map(p => {
              const col = estiloEstado(p.estado);
              const delCalculado = Number(p.costo_delivery || 0);
              return (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>Pedido {p.numero_pedido} — {p.clientes?.nombre_completo || 'Cliente'} ({p.clientes?.telefono || ''})</Text>
                  <View style={[styles.estadoPedido, col.badge]}>
                    <Text style={[styles.textoEstado, col.txt]}>
                      {p.recibido_cliente && p.estado !== 'Completado' ? 'Cliente confirmó • Falta cierre Rider' : p.estado}
                    </Text>
                  </View>
                  {(p.pedido_detalles || []).map(d => {
                    const montoLinea = Number(d.total_linea ?? d.subtotal ?? (Number(d.precio_unitario || 0) * Number(d.cantidad || 1)));
                    return (
                      <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto} (S/ {montoLinea.toFixed(2)})</Text>
                    );
                  })}
                  {p.tipo_entrega === 'DELIVERY' && <Text style={styles.descripcionPedido}>Distrito: {p.distrito} - {p.direccion}</Text>}
                  {p.tipo_entrega === 'DELIVERY' && <Text style={[styles.descripcionPedido, { color: '#38BDF8' }]}>Delivery: S/ {delCalculado.toFixed(2)}</Text>}
                  {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#38BDF8', fontWeight: '800' }]}>Rider: {p.rider_nombre} ({p.estado_rider})</Text>}
                  {!!p.notas && <Text style={[styles.descripcionPedido, { color: ROJO }]}>Nota: {p.notas}</Text>}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)} ({p.metodo_pago})</Text>
                  {esPendiente(p.estado) && p.tipo_entrega === 'DELIVERY' && (
                    <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder={`Delivery: S/ ${delCalculado.toFixed(2)} (opcional ajustar)`} placeholderTextColor="#6B7280" keyboardType="numeric" value={costosDel[p.id] ?? ''} onChangeText={v => setCostosDel({ ...costosDel, [p.id]: v })} />
                  )}
                  {esPendiente(p.estado) && (
                    <TouchableOpacity style={styles.boton} onPress={() => onConfirmarAdmin(p, costosDel[p.id] !== undefined && costosDel[p.id] !== '' ? costosDel[p.id] : delCalculado)} disabled={cargando}>
                      <Text style={styles.textoBoton}>CONFIRMAR Y ENVIAR A RIDERS</Text>
                    </TouchableOpacity>
                  )}
                  {p.estado === 'Confirmado por local' && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A' }]} onPress={() => onCompletar(p)} disabled={cargando}>
                      <Text style={styles.textoBoton}>MARCAR ENTREGADO Y DAR PUNTOS</Text>
                    </TouchableOpacity>
                  )}
                  {p.estado !== 'Cancelado' && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#252530', marginTop: 6 }]} onPress={() => onCancelar(p)} disabled={cargando}>
                      <Text style={[styles.textoBoton, { color: ROJO }]}>CANCELAR PEDIDO Y DESCONTAR PUNTOS</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {(tab === 'promos' || tab === 'ofertas') && (
        <View>
          <View style={styles.filaSaludo}>
            <Text style={styles.titulo}>{tab === 'promos' ? 'PROMOCIONES' : 'OFERTAS DEL DÍA'}</Text>
            <TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditPromo({ titulo: '', descripcion: '', precio: '', stock: '10', tipo: tab === 'promos' ? 'promocion' : 'oferta', imagen_url: '', activa: true })}>
              <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO</Text>
            </TouchableOpacity>
          </View>
          {editPromo && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={styles.campo} placeholder="Título" placeholderTextColor="#6B7280" value={editPromo.titulo} onChangeText={v => setEditPromo({ ...editPromo, titulo: v })} />
              <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={editPromo.descripcion || ''} onChangeText={v => setEditPromo({ ...editPromo, descripcion: v })} />
              <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editPromo.precio)} onChangeText={v => setEditPromo({ ...editPromo, precio: v })} />
              <TextInput style={styles.campo} placeholder="Stock disponible" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editPromo.stock ?? 10)} onChangeText={v => setEditPromo({ ...editPromo, stock: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B' }]} onPress={() => elegirFoto('promo')} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : 'SUBIR FOTO'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={guardarPromo}><Text style={styles.textoBoton}>GUARDAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditPromo(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {promociones.filter(x => x.tipo === (tab === 'promos' ? 'promocion' : 'oferta')).map(pr => (
            <View key={pr.id} style={styles.producto}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{pr.titulo} (Stock: {pr.stock ?? 10})</Text>
                <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditPromo(pr)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {tab === 'canjes' && (
        <View>
          <Text style={styles.titulo}>SOLICITUDES DE CANJES</Text>
          {solicitudesCanje.map(sc => (
            <View key={sc.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{sc.recompensa_titulo} ({sc.puntos_usados} pts)</Text>
              <View style={[styles.estadoPedido, sc.estado === 'Entregado' && { borderColor: '#4CAF50' }]}>
                <Text style={[styles.textoEstado, sc.estado === 'Entregado' && { color: '#4CAF50' }]}>{sc.estado}</Text>
              </View>
              {sc.estado === 'Pendiente de entrega' && (
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A' }]} onPress={() => entregarCanje(sc.id)}>
                  <Text style={styles.textoBoton}>CONFIRMAR ENTREGA</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={[styles.filaSaludo, { marginTop: 14 }]}>
            <Text style={styles.titulo}>PREMIOS Y STOCK</Text>
            <TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditRec({ titulo: '', descripcion: '', puntos_requeridos: '', stock: '5', activa: true })}>
              <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO</Text>
            </TouchableOpacity>
          </View>
          {editRec && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={styles.campo} placeholder="Título del premio" placeholderTextColor="#6B7280" value={editRec.titulo} onChangeText={v => setEditRec({ ...editRec, titulo: v })} />
              <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={editRec.descripcion || ''} onChangeText={v => setEditRec({ ...editRec, descripcion: v })} />
              <TextInput style={styles.campo} placeholder="Puntos requeridos" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editRec.puntos_requeridos)} onChangeText={v => setEditRec({ ...editRec, puntos_requeridos: v })} />
              <TextInput style={styles.campo} placeholder="Stock" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editRec.stock ?? 5)} onChangeText={v => setEditRec({ ...editRec, stock: v })} />
              <TouchableOpacity style={styles.boton} onPress={guardarRec}><Text style={styles.textoBoton}>GUARDAR PREMIO</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRec(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {recompensas.map(r => (
            <View key={r.id} style={styles.producto}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{r.titulo}</Text>
                <Text style={styles.precioProducto}>{r.puntos_requeridos} PTS • Stock: {r.stock ?? 5}</Text>
              </View>
              <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditRec(r)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {tab === 'menu' && (
        <View>
          <View style={styles.filaSaludo}>
            <Text style={styles.titulo}>PRODUCTOS Y STOCK</Text>
            <TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditProd({ nombre: '', ingredientes: '', categoria: 'Hamburguesas', precio: '', stock: '10', imagen_url: '', turno: 'ambos', disponible: true })}>
              <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO</Text>
            </TouchableOpacity>
          </View>
          {editProd && (
            <View style={styles.tarjetaPedido}>
              <Text style={[styles.nombreProducto, { marginBottom: 8 }]}>{editProd.id ? 'Editar Plato' : 'Nuevo Plato'}</Text>
              <TextInput style={styles.campo} placeholder="Nombre del plato" placeholderTextColor="#6B7280" value={editProd.nombre} onChangeText={v => setEditProd({ ...editProd, nombre: v })} />
              <TextInput style={styles.campo} placeholder="Ingredientes" placeholderTextColor="#6B7280" value={editProd.ingredientes || ''} onChangeText={v => setEditProd({ ...editProd, ingredientes: v })} />
              <TextInput style={styles.campo} placeholder="Categoría" placeholderTextColor="#6B7280" value={editProd.categoria} onChangeText={v => setEditProd({ ...editProd, categoria: v })} />
              <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editProd.precio)} onChangeText={v => setEditProd({ ...editProd, precio: v })} />
              <TextInput style={styles.campo} placeholder="Stock" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editProd.stock ?? 10)} onChangeText={v => setEditProd({ ...editProd, stock: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B' }]} onPress={() => elegirFoto('prod')} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : 'SUBIR FOTO'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={guardarProd}><Text style={styles.textoBoton}>GUARDAR PLATO</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditProd(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {productos.map(prod => (
            <View key={prod.id} style={styles.producto}>
              <Image source={prod.imagen_url && prod.imagen_url.includes('supabase.co') ? { uri: prod.imagen_url } : LOGO} style={styles.fotoProducto} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{prod.nombre} ({prod.categoria})</Text>
                <Text style={styles.precioProducto}>S/ {Number(prod.precio).toFixed(2)} • Stock: {prod.stock ?? 10}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditProd(prod)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.botonAgregar, { backgroundColor: '#252530' }]} onPress={() => borrarProd(prod.id)}><Text style={styles.textoAgregar}>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {tab === 'qr pagos' && (
        <View>
          <Text style={styles.titulo}>MÉTODOS DE PAGO (QR YAPE / PLIN)</Text>
          <View style={styles.tarjetaPedido}>
            <TextInput style={styles.campo} placeholder="Titular de cuenta" placeholderTextColor="#6B7280" value={cfgPagos.titularLimpio || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, titularLimpio: v })} />
            <TextInput style={styles.campo} placeholder="URL imagen QR Yape" placeholderTextColor="#6B7280" value={cfgPagos.qr_yape || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, qr_yape: v })} />
            <TextInput style={styles.campo} placeholder="URL imagen QR Plin" placeholderTextColor="#6B7280" value={cfgPagos.qr_plin || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, qr_plin: v })} />
            <TouchableOpacity style={styles.boton} onPress={guardarPagos}><Text style={styles.textoBoton}>GUARDAR QR</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {tab === 'ventas' && (
        <View>
          <View style={[styles.tarjetaSaldo, { borderColor: ROJO }]}>
            <Text style={styles.etiquetaSaldo}>TOTAL VENTAS COMPLETADAS</Text>
            <Text style={styles.numeroSaldo}>S/ {totalVentas.toFixed(2)}</Text>
            <Text style={[styles.etiquetaSaldo, { marginTop: 6 }]}>{completados.length} pedidos completados</Text>
          </View>
          <Text style={styles.titulo}>HISTORIAL DIARIO DE VENTAS</Text>
          {ventasPorDia.map(d => (
            <View key={d.fecha} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>Fecha: {d.fecha}</Text>
              <Text style={[styles.descripcionPedido, { color: '#4CAF50' }]}>Ventas ({d.cantComp}): S/ {d.ventas.toFixed(2)}</Text>
              <Text style={[styles.descripcionPedido, { color: ROJO }]}>Cancelados ({d.cantCanc}): S/ {d.devoluciones.toFixed(2)}</Text>
              <Text style={styles.totalPedidoTexto}>Neto del día: S/ {(d.ventas - d.devoluciones).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
                }
            
