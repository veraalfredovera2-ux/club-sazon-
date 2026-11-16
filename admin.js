import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import { NavegacionSuperior, LOGO } from './pantallas';
import { mostrarAviso } from './avisos';
import { obtenerCatalogo, guardarProductoAdmin, eliminarProductoAdmin, obtenerRecompensas, guardarRecompensaAdmin, obtenerPromociones, guardarPromocionAdmin, obtenerConfigPagos, guardarConfigPagos, obtenerSolicitudesCanje, confirmarEntregaCanje, subirImagenGaleria, obtenerRidersAdmin, guardarRiderAdmin, eliminarRiderAdmin } from './servicios';

function obtenerInfoHoraPeru() {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const peru = new Date(utc - 5 * 3600000);
  const hh = String(peru.getHours()).padStart(2, '0'), mm = String(peru.getMinutes()).padStart(2, '0');
  const min = peru.getHours() * 60 + peru.getMinutes();
  const turno = (min >= 410 && min <= 660) ? 'TURNO MAÑANA (6:50am - 11:00am)' : (min >= 1110 && min <= 1430) ? 'TURNO NOCHE (6:30pm - 11:50pm)' : 'LOCAL CERRADO';
  return { hora: `${hh}:${mm}`, turno };
}

export function VistaAdmin({ usuario, pedidos, recargar, onConfirmarAdmin, onCompletar, onCancelar, cerrarSesion, cargando }) {
  const [tab, setTab] = useState('pedidos');
  const [productos, setProductos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [solicitudesCanje, setSolicitudesCanje] = useState([]);
  const [riders, setRiders] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titular: '' });
  const [costosDel, setCostosDel] = useState({});
  const [editProd, setEditProd] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [editRider, setEditRider] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [audioListo, setAudioListo] = useState(true);
  const conocidosRef = useRef(null), ctxAudioRef = useRef(null), timerRef = useRef(null), timeoutRef = useRef(null), wakeRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('admin_sonido_activo').then(v => { if (v !== null) setAudioListo(v === '1'); });
    cargarTodoAdmin();
    const t = setInterval(() => { recargar(); cargarTodoAdmin(); }, 5000);
    return () => { clearInterval(t); liberarWakeLock(); };
  }, []);

  useEffect(() => { if (audioListo) activarWakeLock(); else { liberarWakeLock(); detenerAlarma(); } }, [audioListo]);

  async function activarWakeLock() { try { if (Platform.OS === 'web' && navigator?.wakeLock && !wakeRef.current) wakeRef.current = await navigator.wakeLock.request('screen'); } catch (e) {} }
  function liberarWakeLock() { try { if (wakeRef.current) { wakeRef.current.release(); wakeRef.current = null; } } catch (e) {} }

  async function alternarSonido() {
    const nuevo = !audioListo; setAudioListo(nuevo);
    await AsyncStorage.setItem('admin_sonido_activo', nuevo ? '1' : '0');
    if (nuevo) {
      tocarPitidoWeb();
      try { if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); } catch (e) {}
    } else detenerAlarma();
  }
  const esPendiente = (est) => est === 'Pendiente' || est === 'Pendiente de confirmación';

  useEffect(() => {
    const pendientes = (pedidos || []).filter(p => esPendiente(p.estado));
    if (conocidosRef.current === null) { conocidosRef.current = pendientes.map(p => p.id); return; }
    if (pendientes.some(p => !conocidosRef.current.includes(p.id)) && audioListo) activarAlarma10Seg();
    if (pendientes.length === 0) detenerAlarma();
    conocidosRef.current = pendientes.map(p => p.id);
  }, [pedidos, audioListo]);

  function tocarPitidoWeb() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!ctxAudioRef.current) ctxAudioRef.current = new Ctx();
        if (ctxAudioRef.current.state === 'suspended') ctxAudioRef.current.resume();
        const osc = ctxAudioRef.current.createOscillator(), gain = ctxAudioRef.current.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(880, ctxAudioRef.current.currentTime); osc.frequency.setValueAtTime(1100, ctxAudioRef.current.currentTime + 0.18);
        gain.gain.setValueAtTime(0.6, ctxAudioRef.current.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctxAudioRef.current.currentTime + 0.45);
        osc.connect(gain); gain.connect(ctxAudioRef.current.destination); osc.start(); osc.stop(ctxAudioRef.current.currentTime + 0.45);
      }
    } catch (e) {}
  }

  function detenerAlarma() { if (timerRef.current) clearInterval(timerRef.current); if (timeoutRef.current) clearTimeout(timeoutRef.current); timerRef.current = null; timeoutRef.current = null; setSonando(false); }
  function activarAlarma10Seg() {
    detenerAlarma(); setSonando(true);
    try { Vibration.vibrate(); } catch (e) {}
    try { if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') new Notification('🔔 Club Sazón', { body: '¡Llegó un nuevo pedido!' }); } catch (e) {}
    tocarPitidoWeb();
    timerRef.current = setInterval(tocarPitidoWeb, 900);
    timeoutRef.current = setTimeout(detenerAlarma, 10000);
  }

  function estiloEstado(est) {
    if (esPendiente(est)) return { badge: { borderColor: '#F5B041', backgroundColor: '#2B210B' }, texto: { color: '#F5B041' } };
    if (est === 'Completado') return { badge: { borderColor: '#4CAF50', backgroundColor: '#132615' }, texto: { color: '#4CAF50' } };
    if (est === 'Cancelado') return { badge: { borderColor: '#E53935', backgroundColor: '#2A1215' }, texto: { color: '#E53935' } };
    return { badge: { borderColor: '#29B6F6', backgroundColor: '#0E2433' }, texto: { color: '#29B6F6' } };
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

  async function cargarTodoAdmin() { try { const [p, r, pr, c, sc, rd] = await Promise.all([obtenerCatalogo(false), obtenerRecompensas(false), obtenerPromociones(false), obtenerConfigPagos(), obtenerSolicitudesCanje(), obtenerRidersAdmin()]); setProductos(p || []); setRecompensas(r || []); setPromociones(pr || []); setCfgPagos(c); setSolicitudesCanje(sc || []); setRiders(rd || []); } catch (e) {} }
  async function guardarProd() { if (editProd.nombre.trim()) try { await guardarProductoAdmin(editProd); setEditProd(null); await cargarTodoAdmin(); mostrarAviso('Guardado', 'Producto actualizado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function borrarProd(id) { try { await eliminarProductoAdmin(id); setEditProd(null); await cargarTodoAdmin(); mostrarAviso('Eliminado', 'Plato eliminado del menú.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarRider() { if (!editRider.nombre_completo.trim() || !editRider.telefono.trim() || !editRider.password.trim()) return mostrarAviso('Faltan datos', 'Completa nombre, teléfono y contraseña.'); try { await guardarRiderAdmin(editRider); setEditRider(null); await cargarTodoAdmin(); mostrarAviso('Guardado', 'Repartidor actualizado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function borrarRider(id) { try { await eliminarRiderAdmin(id); setEditRider(null); await cargarTodoAdmin(); mostrarAviso('Eliminado', 'Repartidor eliminado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function cambiarHorarioRapido(prod, nuevoTurno, nuevaDisp) { try { await guardarProductoAdmin({ ...prod, turno: nuevoTurno, disponible: nuevaDisp }); await cargarTodoAdmin(); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarRec() { if (!editRec.titulo.trim() || !String(editRec.puntos_requeridos).trim()) return mostrarAviso('Faltan datos', 'Escribe título y puntos.'); try { await guardarRecompensaAdmin(editRec); setEditRec(null); await cargarTodoAdmin(); mostrarAviso('Guardado', 'Premio actualizado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarPromo() { if (!editPromo.titulo.trim()) return mostrarAviso('Faltan datos', 'Escribe el título.'); try { await guardarPromocionAdmin(editPromo); setEditPromo(null); await cargarTodoAdmin(); mostrarAviso('Guardado', 'Guardado correctamente.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function entregarCanje(id) { try { await confirmarEntregaCanje(id); await cargarTodoAdmin(); mostrarAviso('Entregado', 'Canje entregado.'); } catch (e) { mostrarAviso('Error', e.message); } }
  async function guardarPagos() { try { await guardarConfigPagos(cfgPagos); mostrarAviso('Guardado', 'QR actualizados.'); } catch (e) { mostrarAviso('Error', e.message); } }
  const infoPeru = obtenerInfoHoraPeru();
  const completados = (pedidos || []).filter(p => p.estado === 'Completado'), cancelados = (pedidos || []).filter(p => p.estado === 'Cancelado');
  const totalVentas = completados.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ventasPorDia = Object.values((pedidos || []).reduce((acc, p) => {
    const fecha = (p.creado_en || '').slice(0, 10) || 'Sin fecha';
    if (!acc[fecha]) acc[fecha] = { fecha, ventas: 0, devoluciones: 0, cantVentas: 0, cantDev: 0 };
    if (p.estado === 'Completado') { acc[fecha].ventas += Number(p.total || 0); acc[fecha].cantVentas += 1; }
    if (p.estado === 'Cancelado') { acc[fecha].devoluciones += Number(p.total || 0); acc[fecha].cantDev += 1; }
    return acc;
  }, {}));

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={() => { setEditProd(null); setEditRec(null); setEditPromo(null); setEditRider(null); setTab('pedidos'); }} irAInicio={() => { setEditProd(null); setEditRec(null); setEditPromo(null); setEditRider(null); setTab('pedidos'); }} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
        <TouchableOpacity onPress={cerrarSesion} style={{ backgroundColor: '#B71C1C', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}>
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </View>
      {sonando && <TouchableOpacity onPress={detenerAlarma} style={{ backgroundColor: '#B81D24', padding: 14, borderRadius: 12, marginBottom: 14, alignItems: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>🔔 ¡NUEVO PEDIDO ENTRANTE! (TOCA PARA SILENCIAR)</Text></TouchableOpacity>}
      <View style={styles.filaSaludo}>
        <View><Text style={styles.saludo}>Panel Administrador,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { backgroundColor: audioListo ? '#2E7D32' : '#555' }]} onPress={alternarSonido}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>{audioListo ? '🔔 SONIDO ON' : '🔕 SONIDO OFF'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => { recargar(); cargarTodoAdmin(); }}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>ACTUALIZAR</Text></TouchableOpacity>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
        {['pedidos', 'riders', 'horarios', 'promos', 'ofertas', 'canjes', 'menu', 'qr pagos', 'ventas'].map(t => <TouchableOpacity key={t} style={[styles.categoria, tab === t && styles.categoriaActiva]} onPress={() => setTab(t)}><Text style={styles.textoCategoria}>{t.toUpperCase()}</Text></TouchableOpacity>)}
      </ScrollView>
      {tab === 'riders' && (
        <View>
          <View style={styles.filaSaludo}><Text style={styles.titulo}>ORIENTAL RIDERS ({riders.length})</Text><TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditRider({ nombre_completo: '', telefono: '', password: '', placa_vehiculo: '', disponible: true })}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ RIDER</Text></TouchableOpacity></View>
          {editRider && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Nombre completo" placeholderTextColor="#777" value={editRider.nombre_completo} onChangeText={v => setEditRider({ ...editRider, nombre_completo: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Teléfono (9 dígitos)" placeholderTextColor="#777" keyboardType="phone-pad" value={editRider.telefono} onChangeText={v => setEditRider({ ...editRider, telefono: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Contraseña" placeholderTextColor="#777" value={editRider.password} onChangeText={v => setEditRider({ ...editRider, password: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Placa o vehículo (ej. Moto ABC-123)" placeholderTextColor="#777" value={editRider.placa_vehiculo || ''} onChangeText={v => setEditRider({ ...editRider, placa_vehiculo: v })} />
              <TouchableOpacity style={styles.boton} onPress={guardarRider}><Text style={styles.textoBoton}>GUARDAR RIDER</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRider(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
              {editRider.id && <TouchableOpacity style={[styles.boton, { backgroundColor: '#B71C1C' }]} onPress={() => borrarRider(editRider.id)}><Text style={styles.textoBoton}>🗑️ ELIMINAR RIDER</Text></TouchableOpacity>}
            </View>
          )}
          {riders.map(r => (
            <View key={r.id} style={styles.producto}>
              <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{r.nombre_completo} {r.disponible ? '🟢' : '🔴'}</Text><Text style={styles.precioProducto}>Tel: {r.telefono} • {r.placa_vehiculo || 'Sin placa'}</Text></View>
              <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditRider(r)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}
              {tab === 'horarios' && (
        <View>
          <View style={[styles.tarjetaSaldo, { paddingVertical: 12, marginBottom: 12 }]}><Text style={styles.etiquetaSaldo}>🇵🇪 HORA PERÚ-LIMA: {infoPeru.hora}</Text><Text style={{ color: '#F5B041', fontWeight: '900', fontSize: 14, textAlign: 'center', marginTop: 4 }}>{infoPeru.turno}</Text></View>
          <Text style={styles.titulo}>CONTROL DE PRODUCTOS POR HORARIO</Text>
          {productos.map(prod => (
            <View key={prod.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{prod.nombre} ({prod.categoria})</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                {[{ id: 'manana', txt: '🌅 MAÑANA' }, { id: 'noche', txt: '🌙 NOCHE' }, { id: 'ambos', txt: '🔄 AMBOS' }].map(h => (
                  <TouchableOpacity key={h.id} onPress={() => cambiarHorarioRapido(prod, h.id, prod.disponible)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: (prod.turno || 'ambos') === h.id ? '#F5B041' : '#222' }]}>
                    <Text style={{ color: (prod.turno || 'ambos') === h.id ? '#111' : '#FFF', fontSize: 10, fontWeight: '900' }}>{h.txt}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => cambiarHorarioRapido(prod, prod.turno || 'ambos', !prod.disponible)} style={[styles.boton, styles.botonPequeno, { backgroundColor: prod.disponible ? '#2E7D32' : '#B71C1C' }]}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{prod.disponible ? 'ACTIVO' : 'OCULTO'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      {tab === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>GESTIÓN DE PEDIDOS</Text>
          {(!pedidos?.length) ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos registrados.</Text></View> : pedidos.map(p => { const col = estiloEstado(p.estado); return (
            <View key={p.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>Pedido {p.numero_pedido} — {p.clientes?.nombre_completo} ({p.clientes?.telefono})</Text>
              <View style={[styles.estadoPedido, col.badge]}><Text style={[styles.textoEstado, col.texto]}>{p.estado}</Text></View>
              {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>{d.cantidad}x {d.nombre_producto} (S/ {d.precio_unitario})</Text>)}
              {p.tipo_entrega === 'DELIVERY' && <Text style={[styles.descripcionPedido, { color: '#F5B041' }]}>📍 {p.distrito} — {p.direccion}</Text>}
              {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#29B6F6', fontWeight: '700' }]}>🛵 Rider: {p.rider_nombre} ({p.rider_telefono}) — {p.estado_rider}</Text>}
              {!!p.notas && <Text style={[styles.descripcionPedido, { color: '#F5B041' }]}>📝 {p.notas}</Text>}
              <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)} ({p.metodo_pago} - {p.tipo_entrega})</Text>
              {esPendiente(p.estado) && p.tipo_entrega === 'DELIVERY' && <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Costo Delivery S/ (ej. 5)" placeholderTextColor="#777" keyboardType="numeric" value={costosDel[p.id] ?? String(p.costo_delivery || '')} onChangeText={v => setCostosDel({ ...costosDel, [p.id]: v })} />}
              {esPendiente(p.estado) && <TouchableOpacity style={[styles.boton, { backgroundColor: '#F5B041' }]} onPress={() => { detenerAlarma(); onConfirmarAdmin(p, costosDel[p.id] ?? p.costo_delivery ?? 0); }} disabled={cargando}><Text style={[styles.textoBoton, { color: '#111' }]}>1. ACEPTAR Y CONFIRMAR PEDIDO</Text></TouchableOpacity>}
              {p.estado === 'Confirmado por local' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onCompletar(p)} disabled={cargando}><Text style={styles.textoBoton}>2. MARCAR ENTREGADO Y DAR PUNTOS</Text></TouchableOpacity>}
              {p.estado !== 'Cancelado' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#B71C1C' }]} onPress={() => onCancelar(p)} disabled={cargando}><Text style={styles.textoBoton}>CANCELAR Y DESCONTAR PUNTOS</Text></TouchableOpacity>}
            </View>
          ); })}
        </View>
      )}
                        {(tab === 'promos' || tab === 'ofertas') && (
        <View>
          <View style={styles.filaSaludo}><Text style={styles.titulo}>{tab === 'promos' ? 'PROMOCIONES' : 'OFERTAS'}</Text><TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditPromo({ tipo: tab === 'promos' ? 'promocion' : 'oferta', titulo: '', descripcion: '', precio: '15', stock: '10', imagen_url: '', activa: true })}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVA</Text></TouchableOpacity></View>
          {editPromo && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Título" placeholderTextColor="#777" value={editPromo.titulo} onChangeText={v => setEditPromo({ ...editPromo, titulo: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Descripción" placeholderTextColor="#777" value={editPromo.descripcion || ''} onChangeText={v => setEditPromo({ ...editPromo, descripcion: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Precio S/" placeholderTextColor="#777" keyboardType="numeric" value={String(editPromo.precio)} onChangeText={v => setEditPromo({ ...editPromo, precio: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Stock disponible" placeholderTextColor="#777" keyboardType="numeric" value={String(editPromo.stock ?? 10)} onChangeText={v => setEditPromo({ ...editPromo, stock: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1565C0', marginTop: 8 }]} onPress={() => elegirFoto('promo')} disabled={subiendoImg}><Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO FOTO...' : '📸 SUBIR FOTO DESDE MI CELULAR'}</Text></TouchableOpacity>
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="URL Imagen (automática)" placeholderTextColor="#777" value={editPromo.imagen_url || ''} onChangeText={v => setEditPromo({ ...editPromo, imagen_url: v })} />
              <TouchableOpacity style={[styles.opcionEntrega, editPromo.activa && styles.opcionEntregaActiva]} onPress={() => setEditPromo({ ...editPromo, activa: !editPromo.activa })}><Text style={styles.textoOpcionEntrega}>{editPromo.activa ? 'ACTIVA (VISIBLE)' : 'OCULTA'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={guardarPromo}><Text style={styles.textoBoton}>GUARDAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditPromo(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {promociones.filter(x => x.tipo === (tab === 'promos' ? 'promocion' : 'oferta')).map(pr => (
            <View key={pr.id} style={styles.producto}>
              <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{pr.titulo} {!pr.activa ? '(OCULTA)' : ''}</Text><Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)} • Stock: {pr.stock ?? 10}</Text></View>
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
              <Text style={styles.nombreProducto}>🎁 {sc.recompensa_titulo} ({sc.puntos_usados} pts) — {sc.clientes?.nombre_completo}</Text>
              <View style={[styles.estadoPedido, sc.estado === 'Entregado' && { borderColor: '#4CAF50', backgroundColor: '#132615' }]}><Text style={[styles.textoEstado, sc.estado === 'Entregado' && { color: '#4CAF50' }]}>{sc.estado}</Text></View>
              {sc.estado === 'Pendiente de entrega' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => entregarCanje(sc.id)}><Text style={styles.textoBoton}>✅ CONFIRMAR ENTREGA</Text></TouchableOpacity>}
            </View>
          ))}
          <View style={[styles.filaSaludo, { marginTop: 14 }]}><Text style={styles.titulo}>PREMIOS Y STOCK</Text><TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditRec({ titulo: '', descripcion: '', puntos_requeridos: '150', stock: '5', activa: true })}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO</Text></TouchableOpacity></View>
          {editRec && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Título" placeholderTextColor="#777" value={editRec.titulo} onChangeText={v => setEditRec({ ...editRec, titulo: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Descripción" placeholderTextColor="#777" value={editRec.descripcion || ''} onChangeText={v => setEditRec({ ...editRec, descripcion: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Puntos" placeholderTextColor="#777" keyboardType="numeric" value={String(editRec.puntos_requeridos)} onChangeText={v => setEditRec({ ...editRec, puntos_requeridos: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Stock disponible" placeholderTextColor="#777" keyboardType="numeric" value={String(editRec.stock ?? 5)} onChangeText={v => setEditRec({ ...editRec, stock: v })} />
              <TouchableOpacity style={styles.boton} onPress={guardarRec}><Text style={styles.textoBoton}>GUARDAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRec(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {recompensas.map(r => <View key={r.id} style={styles.producto}><View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{r.titulo}</Text><Text style={styles.precioProducto}>{r.puntos_requeridos} PTS • Stock: {r.stock ?? 5} uds</Text></View><TouchableOpacity style={styles.botonAgregar} onPress={() => setEditRec(r)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity></View>)}
        </View>
      )}
      {tab === 'menu' && (
        <View>
          <View style={styles.filaSaludo}><Text style={styles.titulo}>MENÚ, HORARIOS Y STOCK</Text><TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditProd({ nombre: '', categoria: 'Hamburguesas', precio: '10', stock: '10', turno: 'ambos', ingredientes: '', imagen_url: '', disponible: true })}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ PLATO</Text></TouchableOpacity></View>
          {editProd && (
            <View style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{editProd.id ? 'Editar Plato' : 'Nuevo Plato'}</Text>
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Nombre" placeholderTextColor="#777" value={editProd.nombre} onChangeText={v => setEditProd({ ...editProd, nombre: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Categoría" placeholderTextColor="#777" value={editProd.categoria} onChangeText={v => setEditProd({ ...editProd, categoria: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Precio S/" placeholderTextColor="#777" keyboardType="numeric" value={String(editProd.precio)} onChangeText={v => setEditProd({ ...editProd, precio: v })} />
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Stock disponible" placeholderTextColor="#777" keyboardType="numeric" value={String(editProd.stock ?? 10)} onChangeText={v => setEditProd({ ...editProd, stock: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1565C0', marginTop: 8 }]} onPress={() => elegirFoto('prod')} disabled={subiendoImg}><Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO FOTO...' : '📸 SUBIR FOTO DESDE MI CELULAR'}</Text></TouchableOpacity>
              <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="URL Imagen (automática)" placeholderTextColor="#777" value={editProd.imagen_url || ''} onChangeText={v => setEditProd({ ...editProd, imagen_url: v })} />
              <TextInput style={[styles.campo, styles.campoMultilinea, { marginTop: 8, color: '#FFF' }]} placeholder="Ingredientes" placeholderTextColor="#777" multiline value={editProd.ingredientes || ''} onChangeText={v => setEditProd({ ...editProd, ingredientes: v })} />
              <TouchableOpacity style={[styles.opcionEntrega, editProd.disponible && styles.opcionEntregaActiva]} onPress={() => setEditProd({ ...editProd, disponible: !editProd.disponible })}><Text style={styles.textoOpcionEntrega}>{editProd.disponible ? 'VISIBLE EN MENÚ' : 'OCULTO'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={guardarProd}><Text style={styles.textoBoton}>GUARDAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditProd(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
              {editProd.id && <TouchableOpacity style={[styles.boton, { backgroundColor: '#B71C1C' }]} onPress={() => borrarProd(editProd.id)}><Text style={styles.textoBoton}>🗑️ ELIMINAR PLATO</Text></TouchableOpacity>}
            </View>
          )}
          {productos.map(prod => <View key={prod.id} style={styles.producto}><Image source={prod.imagen_url && prod.imagen_url.includes('supabase.co') ? { uri: prod.imagen_url } : LOGO} style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#222' }} /><View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{prod.nombre} {!prod.disponible ? '(OCULTO)' : ''}</Text><Text style={styles.precioProducto}>S/ {Number(prod.precio).toFixed(2)} • Stock: {prod.stock ?? 10}</Text></View><TouchableOpacity style={styles.botonAgregar} onPress={() => setEditProd(prod)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity></View>)}
        </View>
      )}
      {tab === 'qr pagos' && <View><Text style={styles.titulo}>QR YAPE Y PLIN</Text><View style={styles.tarjetaPedido}><TextInput style={[styles.campo, { marginBottom: 10, color: '#FFF' }]} placeholder="Titular y teléfono" placeholderTextColor="#777" value={cfgPagos.titular || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, titular: v })} /><TextInput style={[styles.campo, { marginBottom: 10, color: '#FFF' }]} placeholder="URL imagen QR Yape" placeholderTextColor="#777" value={cfgPagos.qr_yape || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, qr_yape: v })} /><TextInput style={[styles.campo, { marginBottom: 10, color: '#FFF' }]} placeholder="URL imagen QR Plin" placeholderTextColor="#777" value={cfgPagos.qr_plin || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, qr_plin: v })} /><TouchableOpacity style={styles.boton} onPress={guardarPagos}><Text style={styles.textoBoton}>GUARDAR QR</Text></TouchableOpacity></View></View>}
      {tab === 'ventas' && (
        <View>
          <View style={styles.tarjetaSaldo}><Text style={styles.etiquetaSaldo}>TOTAL VENTAS COMPLETADAS</Text><Text style={styles.numeroSaldo}>S/ {totalVentas.toFixed(2)}</Text><Text style={[styles.etiquetaSaldo, { marginTop: 6 }]}>{completados.length} VENTAS • {cancelados.length} DEVOLUCIONES</Text></View>
          <Text style={styles.titulo}>HISTORIAL DIARIO DE VENTAS Y DEVOLUCIONES</Text>
          {ventasPorDia.map(d => (
            <View key={d.fecha} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>📅 Fecha: {d.fecha}</Text>
              <Text style={[styles.descripcionPedido, { color: '#4CAF50', fontWeight: '700' }]}>✅ Ventas ({d.cantVentas}): S/ {d.ventas.toFixed(2)}</Text>
              <Text style={[styles.descripcionPedido, { color: '#E53935', fontWeight: '700' }]}>❌ Devoluciones / Cancelados ({d.cantDev}): S/ {d.devoluciones.toFixed(2)}</Text>
              <Text style={styles.totalPedidoTexto}>Neto del día: S/ {(d.ventas - d.devoluciones).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
        }
            
