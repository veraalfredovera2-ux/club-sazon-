import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { styles } from './estilos';
import { NavegacionSuperior, LOGO } from './pantallas';
import { obtenerCatalogo, guardarProductoAdmin, obtenerRecompensas, guardarRecompensaAdmin, obtenerConfigPagos, guardarConfigPagos, obtenerSolicitudesCanje, confirmarEntregaCanje } from './servicios';

export function VistaAdmin({ usuario, pedidos, recargar, onConfirmarAdmin, onCompletar, onCancelar, cerrarSesion, cargando }) {
  const [tab, setTab] = useState('pedidos');
  const [productos, setProductos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [solicitudesCanje, setSolicitudesCanje] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titular: '' });
  const [costosDel, setCostosDel] = useState({});
  const [editProd, setEditProd] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [sonando, setSonando] = useState(false);
  const [audioListo, setAudioListo] = useState(false);
  const conocidosRef = useRef(null);
  const ctxAudioRef = useRef(null);

  useEffect(() => { cargarTodoAdmin(); }, []);
  useEffect(() => { const t = setInterval(() => { recargar(); cargarTodoAdmin(); }, 5000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const pendientes = (pedidos || []).filter(p => p.estado === 'Pendiente de confirmación');
    if (conocidosRef.current === null) { conocidosRef.current = pendientes.map(p => p.id); return; }
    if (pendientes.some(p => !conocidosRef.current.includes(p.id))) activarAlarma10Seg();
    conocidosRef.current = pendientes.map(p => p.id);
  }, [pedidos]);

  function tocarPitidoWeb() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!ctxAudioRef.current) ctxAudioRef.current = new Ctx();
        if (ctxAudioRef.current.state === 'suspended') ctxAudioRef.current.resume();
        const osc = ctxAudioRef.current.createOscillator();
        const gain = ctxAudioRef.current.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctxAudioRef.current.currentTime);
        osc.frequency.setValueAtTime(1100, ctxAudioRef.current.currentTime + 0.18);
        gain.gain.setValueAtTime(0.4, ctxAudioRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctxAudioRef.current.currentTime + 0.45);
        osc.connect(gain); gain.connect(ctxAudioRef.current.destination);
        osc.start(); osc.stop(ctxAudioRef.current.currentTime + 0.45);
      }
    } catch (e) {}
  }

  async function activarAlarma10Seg() {
    if (sonando) return;
    setSonando(true);
    try { Vibration.vibrate(); } catch (e) {}
    tocarPitidoWeb();
    const intervalo = setInterval(() => tocarPitidoWeb(), 900);
    let soundObj = null;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: 'https://mixkit.co' }, { shouldPlay: true, isLooping: true });
      soundObj = sound;
    } catch (e) {}
    setTimeout(async () => {
      clearInterval(intervalo);
      if (soundObj) { try { await soundObj.stopAsync(); await soundObj.unloadAsync(); } catch (e) {} }
      setSonando(false);
    }, 10000);
  }

  async function cargarTodoAdmin() {
    try {
      const [p, r, c, sc] = await Promise.all([obtenerCatalogo(false), obtenerRecompensas(false), obtenerConfigPagos(), obtenerSolicitudesCanje()]);
      setProductos(p || []); setRecompensas(r || []); setCfgPagos(c); setSolicitudesCanje(sc || []);
    } catch (e) {}
  }

  async function guardarProd() {
    if (!editProd.nombre.trim()) return;
    try { await guardarProductoAdmin(editProd); setEditProd(null); await cargarTodoAdmin(); Alert.alert('Guardado', 'Producto actualizado.'); } catch (e) { Alert.alert('Error', e.message); }
  }

  async function guardarRec() {
    if (!editRec.titulo.trim() || !String(editRec.puntos_requeridos).trim()) return Alert.alert('Faltan datos', 'Escribe título y puntos.');
    try { await guardarRecompensaAdmin(editRec); setEditRec(null); await cargarTodoAdmin(); Alert.alert('Guardado', 'Premio actualizado.'); } catch (e) { Alert.alert('Error', e.message); }
  }

  async function entregarCanje(id) {
    try { await confirmarEntregaCanje(id); await cargarTodoAdmin(); Alert.alert('Entregado', 'Canje marcado como entregado.'); } catch (e) { Alert.alert('Error', e.message); }
  }

  async function guardarPagos() {
    try { await guardarConfigPagos(cfgPagos); Alert.alert('Guardado', 'QR de Yape y Plin actualizados.'); } catch (e) { Alert.alert('Error', e.message); }
  }
  const completados = (pedidos || []).filter(p => p.estado === 'Completado');
  const totalVentas = completados.reduce((acc, p) => acc + Number(p.total || 0), 0);

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={() => { setEditProd(null); setEditRec(null); setTab('pedidos'); }} irAInicio={() => { setEditProd(null); setEditRec(null); setTab('pedidos'); }} />
      {sonando && <View style={{ backgroundColor: '#B81D24', padding: 14, borderRadius: 12, marginBottom: 14, alignItems: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>🔔 ¡NUEVO PEDIDO ENTRANTE!</Text></View>}
      <View style={styles.filaSaludo}>
        <View><Text style={styles.saludo}>Panel Administrador,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { backgroundColor: audioListo ? '#2E7D32' : '#C8860A' }]} onPress={() => { tocarPitidoWeb(); setAudioListo(true); }}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>{audioListo ? '🔔 TIMBRE OK' : '🔕 ACTIVAR SONIDO'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => { recargar(); cargarTodoAdmin(); }}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>ACTUALIZAR</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
        {['pedidos', 'canjes', 'menu', 'qr pagos', 'ventas'].map(t => <TouchableOpacity key={t} style={[styles.categoria, tab === t && styles.categoriaActiva]} onPress={() => setTab(t)}><Text style={styles.textoCategoria}>{t.toUpperCase()}</Text></TouchableOpacity>)}
      </ScrollView>

      {tab === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>GESTIÓN DE PEDIDOS</Text>
          {(!pedidos?.length) ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos registrados.</Text></View> : pedidos.map(p => (
            <View key={p.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>Pedido {p.numero_pedido} — {p.clientes?.nombre_completo} ({p.clientes?.telefono})</Text>
              <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado} {p.pago_confirmado ? '• PAGO CONFIRMADO ✅' : ''}</Text></View>
              {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>{d.cantidad}x {d.nombre_producto} (S/ {d.precio_unitario})</Text>)}
              {p.tipo_entrega === 'DELIVERY' && <Text style={[styles.descripcionPedido, { color: '#F5B041' }]}>📍 {p.distrito} — {p.direccion}</Text>}
              <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)} ({p.metodo_pago} - {p.tipo_entrega})</Text>
              {p.estado === 'Pendiente de confirmación' && p.tipo_entrega === 'DELIVERY' && (
                <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Costo Delivery S/ (ej. 5)" placeholderTextColor="#777" keyboardType="numeric" value={costosDel[p.id] ?? ''} onChangeText={v => setCostosDel({ ...costosDel, [p.id]: v })} />
              )}
              {p.estado === 'Pendiente de confirmación' && <TouchableOpacity style={styles.boton} onPress={() => onConfirmarAdmin(p, costosDel[p.id] || 0)} disabled={cargando}><Text style={styles.textoBoton}>1. CONFIRMAR PEDIDO EN LOCAL</Text></TouchableOpacity>}
              {p.estado === 'Confirmado por local' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onCompletar(p)} disabled={cargando}><Text style={styles.textoBoton}>2. MARCAR ENTREGADO Y DAR PUNTOS</Text></TouchableOpacity>}
              {p.estado !== 'Cancelado' && <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => onCancelar(p)} disabled={cargando}><Text style={styles.textoBoton}>CANCELAR Y DESCONTAR PUNTOS</Text></TouchableOpacity>}
            </View>
          ))}
        </View>
      )}
             {tab === 'canjes' && (
        <View>
          <Text style={styles.titulo}>SOLICITUDES E HISTORIAL DE CANJES</Text>
          {solicitudesCanje.length === 0 ? <View style={[styles.tarjetaVacia, { marginBottom: 14 }]}><Text style={styles.textoVacio}>Aún no hay canjes solicitados por clientes.</Text></View> : solicitudesCanje.map(sc => (
            <View key={sc.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>🎁 {sc.recompensa_titulo} ({sc.puntos_usados} pts)</Text>
              <Text style={styles.descripcionPedido}>Cliente: {sc.clientes?.nombre_completo} ({sc.clientes?.telefono})</Text>
              <View style={[styles.estadoPedido, sc.estado === 'Entregado' && { borderColor: '#4CAF50', backgroundColor: '#132615' }]}><Text style={[styles.textoEstado, sc.estado === 'Entregado' && { color: '#4CAF50' }]}>{sc.estado}</Text></View>
              {sc.estado === 'Pendiente de entrega' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => entregarCanje(sc.id)}><Text style={styles.textoBoton}>✅ CONFIRMAR ENTREGA DE CANJE</Text></TouchableOpacity>}
            </View>
          ))}

          <View style={[styles.filaSaludo, { marginTop: 18 }]}><Text style={styles.titulo}>PREMIOS DISPONIBLES</Text><TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditRec({ titulo: '', descripcion: '', puntos_requeridos: '150', activa: true })}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO PREMIO</Text></TouchableOpacity></View>
          {editRec && (
            <View style={styles.tarjetaPedido}>
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Título" placeholderTextColor="#777" value={editRec.titulo} onChangeText={v => setEditRec({ ...editRec, titulo: v })} />
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Descripción" placeholderTextColor="#777" value={editRec.descripcion || ''} onChangeText={v => setEditRec({ ...editRec, descripcion: v })} />
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Puntos" placeholderTextColor="#777" keyboardType="numeric" value={String(editRec.puntos_requeridos)} onChangeText={v => setEditRec({ ...editRec, puntos_requeridos: v })} />
              <TouchableOpacity style={styles.boton} onPress={guardarRec}><Text style={styles.textoBoton}>GUARDAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRec(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {recompensas.map(r => (
            <View key={r.id} style={styles.producto}>
              <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{r.titulo}</Text><Text style={styles.precioProducto}>{r.puntos_requeridos} PUNTOS</Text></View>
              <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditRec(r)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {tab === 'menu' && (
        <View>
          <View style={styles.filaSaludo}><Text style={styles.titulo}>EDITAR MENÚ</Text><TouchableOpacity style={[styles.boton, styles.botonPequeno]} onPress={() => setEditProd({ nombre: '', categoria: 'Hamburguesas', precio: '10', ingredientes: '', imagen_url: '', disponible: true })}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>+ NUEVO PLATO</Text></TouchableOpacity></View>
          {editProd && (
            <View style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{editProd.id ? 'Editar Plato' : 'Nuevo Plato'}</Text>
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Nombre" placeholderTextColor="#777" value={editProd.nombre} onChangeText={v => setEditProd({ ...editProd, nombre: v })} />
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Categoría" placeholderTextColor="#777" value={editProd.categoria} onChangeText={v => setEditProd({ ...editProd, categoria: v })} />
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Precio" placeholderTextColor="#777" keyboardType="numeric" value={String(editProd.precio)} onChangeText={v => setEditProd({ ...editProd, precio: v })} />
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="URL Imagen (Supabase Storage)" placeholderTextColor="#777" value={editProd.imagen_url || ''} onChangeText={v => setEditProd({ ...editProd, imagen_url: v })} />
              <TextInput style={[styles.campo, styles.campoMultilinea, { marginTop: 8 }]} placeholder="Ingredientes" placeholderTextColor="#777" multiline value={editProd.ingredientes || ''} onChangeText={v => setEditProd({ ...editProd, ingredientes: v })} />
              <TouchableOpacity style={[styles.opcionEntrega, editProd.disponible && styles.opcionEntregaActiva]} onPress={() => setEditProd({ ...editProd, disponible: !editProd.disponible })}><Text style={styles.textoOpcionEntrega}>{editProd.disponible ? 'VISIBLE (ACTIVO)' : 'OCULTO'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={guardarProd}><Text style={styles.textoBoton}>GUARDAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditProd(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {productos.map(prod => (
            <View key={prod.id} style={styles.producto}>
              <Image source={prod.imagen_url && prod.imagen_url.includes('supabase.co') ? { uri: prod.imagen_url } : LOGO} style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#222' }} />
              <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{prod.nombre} {!prod.disponible ? '(OCULTO)' : ''}</Text><Text style={styles.precioProducto}>S/ {Number(prod.precio).toFixed(2)}</Text></View>
              <TouchableOpacity style={styles.botonAgregar} onPress={() => setEditProd(prod)}><Text style={styles.textoAgregar}>EDITAR</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {tab === 'qr pagos' && (
        <View>
          <Text style={styles.titulo}>QR YAPE Y PLIN</Text>
          <View style={styles.tarjetaPedido}>
            <TextInput style={[styles.campo, { marginBottom: 10 }]} placeholder="Titular y teléfono" placeholderTextColor="#777" value={cfgPagos.titular || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, titular: v })} />
            <TextInput style={[styles.campo, { marginBottom: 10 }]} placeholder="URL imagen QR Yape" placeholderTextColor="#777" value={cfgPagos.qr_yape || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, qr_yape: v })} />
            <TextInput style={[styles.campo, { marginBottom: 10 }]} placeholder="URL imagen QR Plin" placeholderTextColor="#777" value={cfgPagos.qr_plin || ''} onChangeText={v => setCfgPagos({ ...cfgPagos, qr_plin: v })} />
            <TouchableOpacity style={styles.boton} onPress={guardarPagos}><Text style={styles.textoBoton}>GUARDAR QR</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {tab === 'ventas' && (
        <View style={styles.tarjetaSaldo}><Text style={styles.etiquetaSaldo}>TOTAL VENTAS COMPLETADAS</Text><Text style={styles.numeroSaldo}>S/ {totalVentas.toFixed(2)}</Text><Text style={[styles.etiquetaSaldo, { marginTop: 8 }]}>{completados.length} PEDIDOS</Text></View>
      )}

      <TouchableOpacity style={[styles.boton, styles.botonSecundario, { marginTop: 20 }]} onPress={cerrarSesion}><Text style={styles.textoBoton}>CERRAR SESIÓN</Text></TouchableOpacity>
    </ScrollView>
  );
            }
            
