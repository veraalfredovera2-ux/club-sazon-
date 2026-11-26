import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform, Modal, Linking } from 'react-native';
import * as Location from 'expo-location';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { LOGO } from './pantallas';
import { mostrarAviso, pedirConfirmacion, reproducirTimbreAlerta } from './avisos';
import { mostrarNotificacionLocalNativa } from './push';
import {
  categorias, obtenerCatalogo, guardarProductoAdmin, eliminarProductoAdmin,
  obtenerPromociones, guardarPromocionAdmin, eliminarPromocionAdmin,
  obtenerRecompensas, guardarRecompensaAdmin, eliminarRecompensaAdmin,
  obtenerMotorizados, crearMotorizadoAdmin, eliminarMotorizadoAdmin, actualizarHorarioRiderAdmin,
  obtenerClientesAdmin, cambiarClaveClienteAdmin, liquidarEfectivoRiderAdmin, liquidarPedidoIndividualAdmin,
  actualizarEstadoPedidoAdmin,
  obtenerConfigPagos, guardarConfigPagos, subirImagenGaleria
} from './servicios';

function IconoAdminGrid({ tipo }) {
  if (Platform.OS === 'web') {
    const paths = {
      pedidos: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
      platos: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
      promos: 'M12 2l2.39 4.84 5.34.78-3.86 3.77.91 5.32L12 14.2l-4.78 2.51.91-5.32-3.86-3.77 5.34-.78L12 2z',
      ofertas: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
      novedades: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
      puntos: 'M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z',
      riders: 'M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1zm12-1c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM11 6H6v2h5V6z',
      clientes: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      pagos: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
      config: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
      historial: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z'
    };
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={ROJO}>
        <path d={paths[tipo] || paths.pedidos} />
      </svg>
    );
  }
  const iconosNativos = {
    pedidos: '📦', platos: '🍔', promos: '🎁', ofertas: '🏷️', novedades: '📢',
    puntos: '🏆', riders: '🛵', clientes: '👥', pagos: '💳', config: '⚙️', historial: '📊'
  };
  return <Text style={{ fontSize: 22 }}>{iconosNativos[tipo] || '📦'}</Text>;
}

export function VistaAdmin({ usuario, pedidos, recargar, onConfirmarAdmin, onCompletar, onCancelar, cerrarSesion, cargando }) {
  const [sec, setSec] = useState('inicio');
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [riders, setRiders] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqCli, setBusqCli] = useState('');
  const [clavesNuevas, setClavesNuevas] = useState({});
  const [horariosEdit, setHorariosEdit] = useState({});
  const [nuevoRider, setNuevoRider] = useState({ nombre_completo: '', telefono: '', password: '', direccion_predeterminada: 'Lun a Dom: 12:00 pm - 10:00 pm' });
  const [cfg, setCfg] = useState({ titularLimpio: 'Club Sazón', qr_yape: '', qr_plin: '', local_lat: '-12.069706', local_lng: '-77.033827', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false, puntos_rider: '10' });
  const [editProd, setEditProd] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [horaActual, setHoraActual] = useState('');
  const idsConocidosRef = useRef(null);

  useEffect(() => {
    cargarTablas();
    const actualizarHora = () => {
      const d = new Date();
      setHoraActual(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    actualizarHora();
    const tHora = setInterval(actualizarHora, 15000);
    return () => clearInterval(tHora);
  }, []);
  useEffect(() => {
    const lista = pedidos || [];
    if (idsConocidosRef.current === null) {
      idsConocidosRef.current = new Set(lista.map(p => p.id));
      return;
    }
    const nuevos = lista.filter(p => !idsConocidosRef.current.has(p.id) && p.estado === 'Pendiente');
    lista.forEach(p => idsConocidosRef.current.add(p.id));
    if (nuevos.length > 0 && sonidoActivo) {
      reproducirTimbreAlerta();
      mostrarNotificacionLocalNativa(
        '¡Nuevo pedido en Club Sazón!',
        `Pedido ${nuevos.at(0).numero_pedido} por S/ ${Number(nuevos.at(0).total || 0).toFixed(2)}`
      );
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('¡Nuevo pedido en Club Sazón!', {
            body: `Pedido ${nuevos.at(0).numero_pedido} por S/ ${Number(nuevos.at(0).total || 0).toFixed(2)}`
          });
        } catch (e) {}
      }
    }
  }, [pedidos, sonidoActivo]);

  async function cargarTablas() {
    try {
      const [c, pr, rec, cPagos, rds, clis] = await Promise.all([
        obtenerCatalogo(false), obtenerPromociones(false), obtenerRecompensas(false),
        obtenerConfigPagos(), obtenerMotorizados(), obtenerClientesAdmin()
      ]);
      setCatalogo(c); setPromos(pr); setRecompensas(rec);
      setRiders(rds); setClientes(clis);
      if (cPagos) setCfg(prev => ({ ...prev, ...cPagos }));
    } catch (e) {}
  }

  async function manejarSubida(alCompletar) {
    setSubiendoImg(true);
    try {
      const url = await subirImagenGaleria();
      if (url) { alCompletar(url); mostrarAviso('Imagen cargada', 'La foto se comprimió y quedó lista para guardar.'); }
    } catch (e) { mostrarAviso('Error al subir', e.message); } finally { setSubiendoImg(false); }
  }

  async function capturarGpsLocal() {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return mostrarAviso('Permiso GPS', 'Activa el permiso de ubicación en tu teléfono.');
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCfg(prev => ({ ...prev, local_lat: pos.coords.latitude.toFixed(6), local_lng: pos.coords.longitude.toFixed(6) }));
        mostrarAviso('Ubicación capturada', 'Coordenadas del local listas. Pulsa Guardar.');
      } catch (e) {
        mostrarAviso('GPS no disponible', 'Ingresa latitud y longitud manualmente.');
      }
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return mostrarAviso('GPS no disponible', 'Ingresa latitud y longitud manualmente.');
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCfg(prev => ({ ...prev, local_lat: pos.coords.latitude.toFixed(6), local_lng: pos.coords.longitude.toFixed(6) }));
        mostrarAviso('Ubicación capturada', 'Coordenadas del local listas. Pulsa Guardar.');
      },
      () => mostrarAviso('Permiso denegado', 'Activa el GPS en tu navegador para capturar la ubicación del local.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function confirmarEliminar(titulo, mensaje, accion) {
    pedirConfirmacion(titulo, mensaje, async () => {
      try { await accion(); await cargarTablas(); mostrarAviso('Eliminado', 'El registro fue eliminado.'); }
      catch (e) { mostrarAviso('Error', e.message); }
    });
  }

  function abrirWhatsAppDirecto(telefono, texto) {
    const limpio = String(telefono || '').replace(/\D/g, '');
    if (!limpio) return mostrarAviso('Sin teléfono', 'No hay número registrado.');
    const telFinal = limpio.length === 9 ? '51' + limpio : limpio;
    const baseWa = 'https://wa.me';
    Linking.openURL(`${baseWa}${telFinal}?text=${encodeURIComponent(texto)}`);
  }
    const hoyStr = new Date().toDateString();
  const activos = (pedidos || []).filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado');
  const pendientes = (pedidos || []).filter(p => p.estado === 'Pendiente');
  const pedidosHoy = (pedidos || []).filter(p => new Date(p.creado_en).toDateString() === hoyStr);
  const ventasHoy = pedidosHoy.filter(p => p.estado === 'Completado').reduce((a, p) => a + Number(p.total || 0), 0);
  const historial = (pedidos || []).filter(p => p.estado === 'Completado' || p.estado === 'Cancelado');
  const completados = historial.filter(p => p.estado === 'Completado');
  const ventasTotales = completados.reduce((acc, p) => acc + Number(p.total || 0), 0);

  const botonesGrid = [
    { id: 'pedidos', tipo: 'pedidos', label: 'Pedidos' },
    { id: 'platos', tipo: 'platos', label: 'Productos' },
    { id: 'promos', tipo: 'promos', label: 'Promociones' },
    { id: 'ofertas', tipo: 'ofertas', label: 'Ofertas' },
    { id: 'novedades', tipo: 'novedades', label: 'Novedades' },
    { id: 'puntos', tipo: 'puntos', label: 'Premios y canjes' },
    { id: 'riders', tipo: 'riders', label: 'Motorizados' },
    { id: 'clientes', tipo: 'clientes', label: 'Clientes / Claves' },
    { id: 'pagos', tipo: 'pagos', label: 'Métodos de pago' },
    { id: 'config', tipo: 'config', label: 'Config. negocio' },
    { id: 'historial', tipo: 'historial', label: 'Historial ventas' }
  ];

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Modal transparent animationType="fade" visible={Boolean(imgPreview)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: TARJETA, borderRadius: 16, borderWidth: 1.5, borderColor: DORADO, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: DORADO, fontWeight: '900', fontSize: 15, marginBottom: 10 }}>COMPROBANTE DE PAGO</Text>
            {!!imgPreview && <Image source={{ uri: imgPreview }} style={{ width: '100%', height: 340, borderRadius: 10, backgroundColor: '#000' }} resizeMode="contain" />}
            <TouchableOpacity style={[styles.boton, { width: '100%', marginTop: 12 }]} onPress={() => setImgPreview(null)}>
              <Text style={styles.textoBoton}>Cerrar vista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        {sec !== 'inicio' ? (
          <TouchableOpacity
            onPress={() => setSec('inicio')}
            style={{ backgroundColor: '#1E1E28', borderWidth: 1, borderColor: DORADO, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ color: DORADO, fontWeight: '900', fontSize: 12 }}>← Panel Principal</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={LOGO} style={{ width: 38, height: 38, borderRadius: 10 }} resizeMode="contain" />
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>EL SAZÓN ORIENTAL</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={async () => {
            const nuevoEstado = !sonidoActivo;
            setSonidoActivo(nuevoEstado);
            if (nuevoEstado) {
              reproducirTimbreAlerta();
              if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                try { await Notification.requestPermission(); } catch (e) {}
              }
              mostrarAviso('🔔 Alertas sonoras activadas', 'Acabas de escuchar el timbre de prueba. Cada nuevo pedido sonará automáticamente.');
            }
          }}
          style={{ backgroundColor: sonidoActivo ? '#16A34A' : '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        >
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>{sonidoActivo ? '🔔 SONIDO ON' : '🔕 SONIDO OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: TARJETA, borderWidth: 1.5, borderColor: ROJO, borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '800' }}>PANEL DE ADMINISTRACIÓN • {horaActual}</Text>
          <Text style={{ color: DORADO, fontSize: 22, fontWeight: '900', marginVertical: 2 }} numberOfLines={1}>{usuario.nombre_completo}</Text>
          <Text style={{ color: cfg.local_cerrado ? '#EF4444' : '#22C55E', fontSize: 11, fontWeight: '900' }}>
            {cfg.local_cerrado ? '🔴 LOCAL CERRADO TEMPORALMENTE' : '🟢 LOCAL ABIERTO Y RECIBIENDO PEDIDOS'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setSec('pedidos')}
          style={{ backgroundColor: ROJO, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', minWidth: 74 }}
        >
          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', lineHeight: 24 }}>{activos.length}</Text>
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>Activos</Text>
        </TouchableOpacity>
      </View>
                    {sec === 'inicio' && (
        <View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>PEDIDOS HOY</Text>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 2 }}>{pedidosHoy.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>PENDIENTES</Text>
              <Text style={{ color: ROJO, fontSize: 20, fontWeight: '900', marginTop: 2 }}>{pendientes.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>VENTAS HOY</Text>
              <Text style={{ color: DORADO, fontSize: 18, fontWeight: '900', marginTop: 2 }}>S/ {ventasHoy.toFixed(0)}</Text>
            </View>
          </View>

          <View style={styles.cuadricula3}>
            {botonesGrid.map(b => (
              <TouchableOpacity
                key={b.id}
                style={styles.itemCuadricula}
                onPress={() => setSec(b.id)}
              >
                <View style={styles.iconoCuadriculaBox}>
                  <IconoAdminGrid tipo={b.tipo} />
                </View>
                <Text style={styles.textoCuadricula}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#1E1E28', borderWidth: 1, borderColor: BORDE, marginTop: 12 }]}
            onPress={cerrarSesion}
          >
            <Text style={styles.textoBoton}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {sec === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>PEDIDOS EN TIEMPO REAL ({activos.length})</Text>
          {activos.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos pendientes en este momento.</Text></View>
          ) : (
            activos.map(p => {
              const esDel = p.tipo_entrega === 'DELIVERY';
              const partsComp = String(p.notas || '').split('| COMPROBANTE:');
              const notaLimpia = (partsComp.at(0) || '').trim();
              const urlComp = partsComp.length > 1 ? partsComp.at(1).trim() : '';
              const telCliente = p.perfiles?.telefono || '';
              return (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                    <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
                  </View>
                  <Text style={styles.descripcionPedido}>Tel: {telCliente} • {p.tipo_entrega} • Pago: {p.metodo_pago}</Text>
                  <Text style={[styles.descripcionPedido, { color: DORADO, fontWeight: '800' }]}>
                    {p.recibido_cliente ? '✅ Recepción confirmada por cliente' : '⏳ Pendiente de recepción por cliente'}
                  </Text>
                  {esDel && <Text style={styles.descripcionPedido}>Dir: {p.distrito} - {String(p.direccion || '').split('|').at(0)}</Text>}
                  {!!notaLimpia && <Text style={[styles.descripcionPedido, { color: DORADO }]}>Nota: {notaLimpia}</Text>}
                  {!!urlComp && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#7C3AED', marginTop: 6, paddingVertical: 8 }]} onPress={() => setImgPreview(urlComp)}>
                      <Text style={styles.textoBoton}>🖼️ VER CAPTURA DE PAGO ({p.metodo_pago.toUpperCase()})</Text>
                    </TouchableOpacity>
                  )}
                  {(p.pedido_detalles || []).map(d => (
                    <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto} (S/ {Number(d.subtotal).toFixed(2)})</Text>
                  ))}
                  {!!p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#93C5FD', fontWeight: '800' }]}>Motorizado: {p.rider_nombre} ({p.estado_rider})</Text>}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
                  {!!telCliente && (
                    <TouchableOpacity
                      style={[styles.boton, { backgroundColor: '#128C7E', marginTop: 8, paddingVertical: 9 }]}
                      onPress={() => abrirWhatsAppDirecto(telCliente, `Hola ${p.perfiles?.nombre_completo || ''}, te escribimos de El Sazón Oriental sobre tu pedido ${p.numero_pedido}.`)}
                    >
                      <Text style={styles.textoBoton}>💬 WHATSAPP AL CLIENTE</Text>
                    </TouchableOpacity>
                  )}
                                        {p.estado === 'Pendiente' && (
                    <TouchableOpacity
                      style={styles.boton}
                      onPress={async () => {
                        await actualizarEstadoPedidoAdmin(p, 'Aceptado por el local');
                        await recargar();
                        mostrarAviso('Pedido aceptado', 'El cliente fue notificado.');
                      }}
                      disabled={cargando}
                    >
                      <Text style={styles.textoBoton}>✅ ACEPTAR PEDIDO</Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'Aceptado por el local' && (
                    <TouchableOpacity
                      style={[styles.boton, { backgroundColor: '#D97706', marginTop: 6 }]}
                      onPress={async () => {
                        await actualizarEstadoPedidoAdmin(p, 'En preparación');
                        await recargar();
                        mostrarAviso('En preparación', 'Se notificó al cliente que su pedido se está preparando.');
                      }}
                      disabled={cargando}
                    >
                      <Text style={styles.textoBoton}>🍳 MARCAR EN PREPARACIÓN</Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'En preparación' && (
                    <TouchableOpacity
                      style={[styles.boton, { backgroundColor: '#0284C7', marginTop: 6 }]}
                      onPress={async () => {
                        await actualizarEstadoPedidoAdmin(p, 'Listo');
                        await recargar();
                        mostrarAviso(
                          esDel ? 'Listo para recoger' : 'Listo en local',
                          esDel ? 'Se notificó a los repartidores.' : 'Se notificó al cliente que puede recoger su pedido.'
                        );
                      }}
                      disabled={cargando}
                    >
                      <Text style={styles.textoBoton}>
                        {esDel ? '🛵 LISTO PARA RECOGER (AVISAR RIDERS)' : '🛍️ LISTO PARA RECOJO EN LOCAL'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {p.estado !== 'Pendiente' && (!esDel || p.recibido_cliente) && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 6 }]} onPress={() => onCompletar(p)} disabled={cargando}>
                      <Text style={styles.textoBoton}>✅ MARCAR ENTREGADO Y DAR PUNTOS</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.boton, styles.botonSecundario]}
                    onPress={() => pedirConfirmacion(
                      'Cancelar y anular pedido',
                      `¿Seguro que deseas cancelar el pedido ${p.numero_pedido}? Si ya había acreditado puntos al cliente, se descontarán automáticamente.`,
                      () => onCancelar(p)
                    )}
                    disabled={cargando}
                  >
                    <Text style={styles.textoBoton}>❌ CANCELAR PEDIDO / ANULAR</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}
                              {sec === 'historial' && (
        <View>
          <View style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>RESUMEN DE VENTAS COMPLETADAS</Text>
            <Text style={[styles.precioProducto, { fontSize: 22, color: '#22C55E', marginTop: 4 }]}>S/ {ventasTotales.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>Pedidos completados: {completados.length} • Cancelados: {historial.length - completados.length}</Text>
          </View>

          <Text style={styles.titulo}>DESGLOSE DE EFECTIVO POR MOTORIZADO</Text>
          {riders.map(r => {
            const pedsEfectivoPendientes = completados.filter(
              p => p.rider_id === r.id && p.metodo_pago === 'Efectivo' && p.estado_rider !== 'Liquidado en caja'
            );
            const totalPendiente = pedsEfectivoPendientes.reduce((a, p) => a + Number(p.total || 0), 0);
            return (
              <View key={r.id} style={styles.tarjetaPedido}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.nombreProducto}>{r.nombre_completo}</Text>
                  <Text style={{ color: totalPendiente > 0 ? '#EF4444' : '#22C55E', fontWeight: '900', fontSize: 15 }}>
                    {totalPendiente > 0 ? `Debe: S/ ${totalPendiente.toFixed(2)}` : 'Al día ✅'}
                  </Text>
                </View>
                <Text style={styles.descripcionPedido}>Pedidos en efectivo sin liquidar: {pedsEfectivoPendientes.length}</Text>

                {pedsEfectivoPendientes.map(pe => (
                  <View
                    key={pe.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#13131A',
                      borderWidth: 1,
                      borderColor: BORDE,
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 8
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
                        {pe.numero_pedido} • S/ {Number(pe.total || 0).toFixed(2)}
                      </Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                        Cliente: {pe.perfiles?.nombre_completo || 'Cliente'} • {new Date(pe.creado_en).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}
                      onPress={() => pedirConfirmacion(
                        'Liquidar pedido individual',
                        `¿Confirmas que ${r.nombre_completo} entregó los S/ ${Number(pe.total || 0).toFixed(2)} del pedido ${pe.numero_pedido}?`,
                        async () => {
                          await liquidarPedidoIndividualAdmin(pe.id);
                          await recargar();
                          mostrarAviso('Liquidado', `Pedido ${pe.numero_pedido} marcado como recibido en caja.`);
                        }
                      )}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>💵 Recibido</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {totalPendiente > 0 && (
                  <TouchableOpacity
                    style={[styles.boton, { backgroundColor: '#0284C7', marginTop: 10, paddingVertical: 9 }]}
                    onPress={() => pedirConfirmacion(
                      'Liquidar todo el efectivo del repartidor',
                      `¿Confirmas que ${r.nombre_completo} entregó el total completo de S/ ${totalPendiente.toFixed(2)}?`,
                      async () => {
                        await liquidarEfectivoRiderAdmin(r.id);
                        await recargar();
                        mostrarAviso('Caja al día', `Se liquidó todo el efectivo pendiente de ${r.nombre_completo}.`);
                      }
                    )}
                  >
                    <Text style={styles.textoBoton}>💵 LIQUIDAR TODO EL BLOQUE (S/ {totalPendiente.toFixed(2)})</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
                                  <Text style={styles.titulo}>HISTORIAL DE VENTAS ({historial.length})</Text>
          {historial.map(p => (
            <View key={p.id} style={styles.tarjetaPedido}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                <View style={[styles.estadoPedido, p.estado === 'Cancelado' && { backgroundColor: '#471D1D' }]}><Text style={styles.textoEstado}>{p.estado}</Text></View>
              </View>
              <Text style={styles.descripcionPedido}>{new Date(p.creado_en).toLocaleString()} • {p.metodo_pago} ({p.tipo_entrega})</Text>
              {!!p.rider_nombre && <Text style={[styles.descripcionPedido, { color: DORADO }]}>Motorizado: {p.rider_nombre} ({p.estado_rider})</Text>}
              <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
              {p.estado === 'Completado' && (
                <TouchableOpacity
                  style={[styles.boton, styles.botonSecundario, { marginTop: 8 }]}
                  onPress={() => pedirConfirmacion(
                    'Anular venta y descontar puntos',
                    `¿El cliente devolvió el pedido ${p.numero_pedido}? Se cambiará a Cancelado y se le descontarán los puntos ganados en esta compra.`,
                    () => onCancelar(p)
                  )}
                  disabled={cargando}
                >
                  <Text style={styles.textoBoton}>❌ ANULAR PEDIDO Y DESCONTAR PUNTOS</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {sec === 'platos' && (
        <View>
          <TouchableOpacity style={styles.boton} onPress={() => setEditProd({ nombre: '', precio: '', stock: '20', categoria: 'Hamburguesas', turno: 'Ambos', ingredientes: '', imagen_url: '', disponible: true })}>
            <Text style={styles.textoBoton}>+ AGREGAR NUEVO PLATO</Text>
          </TouchableOpacity>
          {editProd && (
            <View style={[styles.tarjetaPedido, { marginTop: 10, borderColor: DORADO }]}>
              <Text style={styles.nombreProducto}>{editProd.id ? 'EDITAR PLATO' : 'NUEVO PLATO'}</Text>
              <TextInput style={styles.campo} placeholder="Nombre del plato" placeholderTextColor="#6B7280" value={editProd.nombre} onChangeText={v => setEditProd({ ...editProd, nombre: v })} />
              <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(editProd.precio)} onChangeText={v => setEditProd({ ...editProd, precio: v })} />
              <TextInput style={styles.campo} placeholder="Stock disponible" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editProd.stock)} onChangeText={v => setEditProd({ ...editProd, stock: v })} />
              <TextInput style={styles.campo} placeholder="Ingredientes / descripción" placeholderTextColor="#6B7280" value={editProd.ingredientes} onChangeText={v => setEditProd({ ...editProd, ingredientes: v })} />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Horario / Turno disponible:</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {['Día', 'Noche', 'Ambos'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.categoria, editProd.turno === t && styles.categoriaActiva, { flex: 1, alignItems: 'center', marginRight: 0 }]}
                    onPress={() => setEditProd({ ...editProd, turno: t })}
                  >
                    <Text style={styles.textoCategoria}>{t === 'Día' ? '☀️ Día' : t === 'Noche' ? '🌙 Noche' : '🕒 Ambos'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8 }]} onPress={() => manejarSubida(url => setEditProd({ ...editProd, imagen_url: url }))} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : '📷 SUBIR FOTO DESDE GALERÍA'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.campo} placeholder="O pega URL de imagen (opcional)" placeholderTextColor="#6B7280" value={editProd.imagen_url} onChangeText={v => setEditProd({ ...editProd, imagen_url: v })} />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Categoría:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {categorias.filter(c => c !== 'Todas').map(c => (
                  <TouchableOpacity key={c} style={[styles.categoria, editProd.categoria === c && styles.categoriaActiva]} onPress={() => setEditProd({ ...editProd, categoria: c })}>
                    <Text style={styles.textoCategoria}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.boton, { backgroundColor: editProd.disponible ? '#16A34A' : '#374151', marginBottom: 6 }]} onPress={() => setEditProd({ ...editProd, disponible: !editProd.disponible })}>
                <Text style={styles.textoBoton}>{editProd.disponible ? '✅ DISPONIBLE EN MENÚ' : '⛔ AGOTADO / OCULTO'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={async () => { await guardarProductoAdmin(editProd); setEditProd(null); await cargarTablas(); mostrarAviso('Guardado', 'Plato actualizado.'); }}>
                <Text style={styles.textoBoton}>GUARDAR PLATO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditProd(null)}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          {catalogo.map(p => (
            <View key={p.id} style={styles.producto}>
              <Image source={p.imagen_url && p.imagen_url.includes('http') ? { uri: p.imagen_url } : LOGO} style={styles.fotoProducto} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{p.nombre} {!p.disponible ? '(AGOTADO)' : ''}</Text>
                <Text style={styles.descripcionPedido}>{p.categoria} • Turno: {p.turno || 'Ambos'} • Stock: {p.stock ?? 0}</Text>
                <Text style={styles.precioProducto}>S/ {Number(p.precio).toFixed(2)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => setEditProd(p)}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => confirmarEliminar('Eliminar plato', `¿Eliminar "${p.nombre}"?`, () => eliminarProductoAdmin(p.id))}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
              {(sec === 'promos' || sec === 'ofertas' || sec === 'novedades') && (
        <View>
          <TouchableOpacity
            style={styles.boton}
            onPress={() => setEditPromo({
              titulo: '',
              descripcion: '',
              precio: '0',
              imagen_url: '',
              activa: true,
              tipo: sec === 'ofertas' ? 'oferta' : sec === 'novedades' ? 'novedad' : 'promocion'
            })}
          >
            <Text style={styles.textoBoton}>
              {sec === 'ofertas' ? '+ NUEVA OFERTA' : sec === 'novedades' ? '+ NUEVA NOVEDAD' : '+ NUEVA PROMOCIÓN'}
            </Text>
          </TouchableOpacity>
          {editPromo && (
            <View style={[styles.tarjetaPedido, { marginTop: 10, borderColor: DORADO }]}>
              <TextInput style={styles.campo} placeholder="Título" placeholderTextColor="#6B7280" value={editPromo.titulo} onChangeText={v => setEditPromo({ ...editPromo, titulo: v })} />
              <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={editPromo.descripcion} onChangeText={v => setEditPromo({ ...editPromo, descripcion: v })} />
              {editPromo.tipo !== 'novedad' && (
                <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(editPromo.precio)} onChangeText={v => setEditPromo({ ...editPromo, precio: v })} />
              )}
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8 }]} onPress={() => manejarSubida(url => setEditPromo({ ...editPromo, imagen_url: url }))} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : '📷 SUBIR FOTO DESDE GALERÍA'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.campo} placeholder="O pega URL imagen (opcional)" placeholderTextColor="#6B7280" value={editPromo.imagen_url} onChangeText={v => setEditPromo({ ...editPromo, imagen_url: v })} />
              <TouchableOpacity style={styles.boton} onPress={async () => { await guardarPromocionAdmin(editPromo); setEditPromo(null); await cargarTablas(); mostrarAviso('Guardado', 'Publicado con éxito.'); }}>
                <Text style={styles.textoBoton}>GUARDAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditPromo(null)}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          {promos
            .filter(pr => sec === 'novedades' ? pr.tipo === 'novedad' : sec === 'ofertas' ? pr.tipo === 'oferta' : (pr.tipo !== 'oferta' && pr.tipo !== 'novedad'))
            .map(pr => (
              <View key={pr.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>
                {pr.tipo !== 'novedad' && <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => setEditPromo(pr)}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => confirmarEliminar('Eliminar', `¿Eliminar "${pr.titulo}"?`, () => eliminarPromocionAdmin(pr.id))}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}

      {sec === 'puntos' && (
        <View>
          <TouchableOpacity style={styles.boton} onPress={() => setEditRec({ titulo: '', descripcion: '', puntos_requeridos: '500', stock: '10', imagen_url: '', activa: true })}>
            <Text style={styles.textoBoton}>+ NUEVO PREMIO CANJEABLE</Text>
          </TouchableOpacity>
          {editRec && (
            <View style={[styles.tarjetaPedido, { marginTop: 10, borderColor: DORADO }]}>
              <TextInput style={styles.campo} placeholder="Nombre del premio" placeholderTextColor="#6B7280" value={editRec.titulo} onChangeText={v => setEditRec({ ...editRec, titulo: v })} />
              <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={editRec.descripcion} onChangeText={v => setEditRec({ ...editRec, descripcion: v })} />
              <TextInput style={styles.campo} placeholder="Puntos requeridos" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editRec.puntos_requeridos)} onChangeText={v => setEditRec({ ...editRec, puntos_requeridos: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8 }]} onPress={() => manejarSubida(url => setEditRec({ ...editRec, imagen_url: url }))} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : '📷 SUBIR FOTO DESDE GALERÍA'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.campo} placeholder="O pega URL imagen (opcional)" placeholderTextColor="#6B7280" value={editRec.imagen_url} onChangeText={v => setEditRec({ ...editRec, imagen_url: v })} />
              <TouchableOpacity style={styles.boton} onPress={async () => { await guardarRecompensaAdmin(editRec); setEditRec(null); await cargarTablas(); mostrarAviso('Guardado', 'Recompensa actualizada.'); }}>
                <Text style={styles.textoBoton}>GUARDAR PREMIO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRec(null)}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
                      {recompensas.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.titulo}</Text>
              <Text style={[styles.precioProducto, { color: DORADO }]}>{r.puntos_requeridos} puntos</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <TouchableOpacity style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => setEditRec(r)}>
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => confirmarEliminar('Eliminar premio', `¿Eliminar "${r.titulo}"?`, () => eliminarRecompensaAdmin(r.id))}>
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'riders' && (
        <View>
          <View style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>REGISTRAR NUEVO MOTORIZADO</Text>
            <TextInput style={styles.campo} placeholder="Nombre completo" placeholderTextColor="#6B7280" value={nuevoRider.nombre_completo} onChangeText={v => setNuevoRider({ ...nuevoRider, nombre_completo: v })} />
            <TextInput style={styles.campo} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" value={nuevoRider.telefono} onChangeText={v => setNuevoRider({ ...nuevoRider, telefono: v })} />
            <TextInput style={styles.campo} placeholder="Contraseña de acceso" placeholderTextColor="#6B7280" value={nuevoRider.password} onChangeText={v => setNuevoRider({ ...nuevoRider, password: v })} />
            <TextInput style={styles.campo} placeholder="Horario asignado" placeholderTextColor="#6B7280" value={nuevoRider.direccion_predeterminada} onChangeText={v => setNuevoRider({ ...nuevoRider, direccion_predeterminada: v })} />
            <TouchableOpacity style={styles.boton} onPress={async () => { try { await crearMotorizadoAdmin(nuevoRider); setNuevoRider({ nombre_completo: '', telefono: '', password: '', direccion_predeterminada: 'Lun a Dom: 12:00 pm - 10:00 pm' }); await cargarTablas(); mostrarAviso('Registrado', 'Motorizado creado.'); } catch (e) { mostrarAviso('Error', e.message); } }}>
              <Text style={styles.textoBoton}>CREAR MOTORIZADO</Text>
            </TouchableOpacity>
          </View>
          {riders.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Tel: {r.telefono} • Clave: {r.password_hash}</Text>
              <TextInput style={[styles.campo, { marginTop: 8 }]} value={horariosEdit[r.id] !== undefined ? horariosEdit[r.id] : (r.direccion_predeterminada || '')} onChangeText={v => setHorariosEdit({ ...horariosEdit, [r.id]: v })} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.boton, { flex: 1, backgroundColor: '#16A34A' }]} onPress={async () => { await actualizarHorarioRiderAdmin(r.id, horariosEdit[r.id] ?? r.direccion_predeterminada); await cargarTablas(); mostrarAviso('Guardado', 'Horario actualizado.'); }}>
                  <Text style={styles.textoBoton}>Guardar horario</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#991B1B', paddingHorizontal: 14 }]} onPress={() => confirmarEliminar('Eliminar motorizado', `¿Eliminar a ${r.nombre_completo}?`, () => eliminarMotorizadoAdmin(r.id))}>
                  <Text style={styles.textoBoton}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'clientes' && (
        <View>
          <TextInput style={styles.campo} placeholder="Buscar cliente por nombre o teléfono..." placeholderTextColor="#6B7280" value={busqCli} onChangeText={setBusqCli} />
          {clientes.filter(c => (c.nombre_completo || '').toLowerCase().includes(busqCli.toLowerCase()) || (c.telefono || '').includes(busqCli)).map(c => (
            <View key={c.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{c.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Tel: {c.telefono} • Puntos: {c.puntos || 0}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput style={[styles.campo, { flex: 1, marginBottom: 0 }]} placeholder="Nueva contraseña..." placeholderTextColor="#6B7280" value={clavesNuevas[c.id] || ''} onChangeText={v => setClavesNuevas({ ...clavesNuevas, [c.id]: v })} />
                <TouchableOpacity style={[styles.boton, { marginTop: 0, paddingHorizontal: 14 }]} onPress={async () => { if (!clavesNuevas[c.id] || clavesNuevas[c.id].length < 4) return mostrarAviso('Clave corta', 'Mínimo 4 caracteres.'); await cambiarClaveClienteAdmin(c.id, clavesNuevas[c.id].trim()); setClavesNuevas({ ...clavesNuevas, [c.id]: '' }); mostrarAviso('Actualizada', 'Contraseña cambiada con éxito.'); }}>
                  <Text style={styles.textoBoton}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'pagos' && (
        <View style={styles.tarjetaPedido}>
          <Text style={styles.nombreProducto}>CUENTAS Y QR DE PAGO</Text>
          <TextInput style={styles.campo} placeholder="Nombre del titular" placeholderTextColor="#6B7280" value={cfg.titularLimpio} onChangeText={v => setCfg({ ...cfg, titularLimpio: v })} />
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#742284', marginBottom: 8 }]} onPress={() => manejarSubida(url => setCfg({ ...cfg, qr_yape: url }))} disabled={subiendoImg}>
            <Text style={styles.textoBoton}>SUBIR QR YAPE DESDE GALERÍA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#00D2E3', marginBottom: 8 }]} onPress={() => manejarSubida(url => setCfg({ ...cfg, qr_plin: url }))} disabled={subiendoImg}>
            <Text style={styles.textoBoton}>SUBIR QR PLIN DESDE GALERÍA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boton} onPress={async () => { await guardarConfigPagos(cfg); mostrarAviso('Guardado', 'Métodos de pago actualizados.'); }}>
            <Text style={styles.textoBoton}>GUARDAR MÉTODOS DE PAGO</Text>
          </TouchableOpacity>
        </View>
      )}

      {sec === 'config' && (
        <View style={styles.tarjetaPedido}>
          <Text style={styles.nombreProducto}>ESTADO DEL LOCAL</Text>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: cfg.local_cerrado ? '#991B1B' : '#16A34A', marginBottom: 14 }]}
            onPress={async () => {
              const nuevoEstadoCerrado = !cfg.local_cerrado;
              const cfgActualizada = { ...cfg, local_cerrado: nuevoEstadoCerrado };
              setCfg(cfgActualizada);
              await guardarConfigPagos(cfgActualizada);
              await recargar();
              mostrarAviso(
                nuevoEstadoCerrado ? '🔴 Local cerrado' : '🟢 Local abierto',
                nuevoEstadoCerrado ? 'Los clientes ahora verán el local cerrado.' : 'El local está abierto y recibiendo pedidos al instante.'
              );
            }}
          >
            <Text style={styles.textoBoton}>{cfg.local_cerrado ? '🔴 LOCAL CERRADO (TOCA PARA ABRIR)' : '🟢 LOCAL ABIERTO (TOCA PARA CERRAR)'}</Text>
          </TouchableOpacity>
          <Text style={styles.nombreProducto}>UBICACIÓN, TARIFAS Y BONO REPARTIDOR</Text>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#0284C7', marginBottom: 8 }]} onPress={capturarGpsLocal}>
            <Text style={styles.textoBoton}>📍 USAR MI UBICACIÓN ACTUAL COMO LOCAL</Text>
          </TouchableOpacity>
          <TextInput style={styles.campo} placeholder="Latitud local" placeholderTextColor="#6B7280" value={String(cfg.local_lat)} onChangeText={v => setCfg({ ...cfg, local_lat: v })} />
          <TextInput style={styles.campo} placeholder="Longitud local" placeholderTextColor="#6B7280" value={String(cfg.local_lng)} onChangeText={v => setCfg({ ...cfg, local_lng: v })} />
          <TextInput style={styles.campo} placeholder="Tarifa base delivery (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(cfg.tarifa_base)} onChangeText={v => setCfg({ ...cfg, tarifa_base: v })} />
          <TextInput style={styles.campo} placeholder="Costo por kilómetro adicional (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(cfg.tarifa_km)} onChangeText={v => setCfg({ ...cfg, tarifa_km: v })} />
          <Text style={{ color: DORADO, fontSize: 12, fontWeight: '800', marginTop: 4, marginBottom: 4 }}>Puntos regalo al repartidor por entrega:</Text>
          <TextInput style={styles.campo} placeholder="Puntos regalo al repartidor (ej. 10)" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(cfg.puntos_rider ?? '10')} onChangeText={v => setCfg({ ...cfg, puntos_rider: v })} />
          <TouchableOpacity style={styles.boton} onPress={async () => { await guardarConfigPagos(cfg); await recargar(); mostrarAviso('Guardado', 'Configuración del negocio actualizada.'); }}>
            <Text style={styles.textoBoton}>GUARDAR CONFIGURACIÓN DEL NEGOCIO</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
                                                                                                                                                                                                                                                                                                                                                           }
