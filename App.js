import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform, Modal, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { LOGO, PantallaBienvenida, PantallaLogin, PantallaRegistro, PantallaRecuperar } from './pantallas';
import { VistaAdmin } from './admin';
import { VistaRider } from './rider';
import { VistaCanjes, VistaMas } from './vistas';
import { VentanaAviso, mostrarAviso, pedirConfirmacion, reproducirTimbreAlerta } from './avisos';
import { iniciarOneSignalWeb, pedirPermisoPushWeb, estadoPermisoPushWeb } from './push';
import {
  categorias, obtenerCatalogo, obtenerPromociones, obtenerRecompensas,
  obtenerPedidosUsuario, obtenerHistorialPuntos, obtenerConfigPagos,
  ingresarUsuario, registrarUsuario, recuperarClaveUsuario,
  crearNuevoPedido, confirmarRecepcionYDarPuntos, canjearRecompensaCliente,
  actualizarEstadoPedidoAdmin, completarPedidoYDarPuntos, cancelarPedidoYDescontar,
  subirImagenGaleria
} from './servicios';

function IconoTab({ tipo, activo }) {
  const color = activo ? ROJO : '#71717A';
  if (Platform.OS === 'web') {
    const paths = {
      inicio: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      pedidos: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      puntos: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
      promos: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
      mas: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
    };
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
        <path d={paths[tipo]} />
      </svg>
    );
  }
  return <Text style={{ color, fontSize: 16, fontWeight: '900' }}>●</Text>;
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const rad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [modoRiderActivo, setModoRiderActivo] = useState(true);
  const [pantallaAuth, setPantallaAuth] = useState('bienvenida');
  const [vista, setVista] = useState('inicio');
  const [catActiva, setCatActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [histPuntos, setHistPuntos] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ titularLimpio: 'Club Sazón', qr_yape: '', qr_plin: '', local_lat: '-12.089700', local_lng: '-77.003100', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false });
  const [carrito, setCarrito] = useState([]);
  const [tipoEntrega, setTipoEntrega] = useState('DELIVERY');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [gpsCliente, setGpsCliente] = useState(null);
  const [calculandoRuta, setCalculandoRuta] = useState(false);
  const [notas, setNotas] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [subiendoComp, setSubiendoComp] = useState(false);
  const [qrGrande, setQrGrande] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [permisoPush, setPermisoPush] = useState(() => estadoPermisoPushWeb());
  const avisosPuertaRef = useRef(new Set());

  const rol = String(usuario?.rol || 'cliente').trim().toLowerCase();
  const esStaff = rol === 'administrador' || rol === 'repartidor';

  useEffect(() => {
    AsyncStorage.getItem('sesion_club_sazon').then(s => {
      if (s) setUsuario(JSON.parse(s));
    });
    cargarPublico();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    iniciarOneSignalWeb(usuario).then(() => setPermisoPush(estadoPermisoPushWeb()));
    cargarTodoUsuario();
    const timer = setInterval(cargarTodoUsuario, 6000);
    return () => clearInterval(timer);
  }, [usuario?.id]);

  async function cargarPublico() {
    try {
      const [c, pr, rec, cPagos] = await Promise.all([
        obtenerCatalogo(true), obtenerPromociones(true), obtenerRecompensas(true), obtenerConfigPagos()
      ]);
      setCatalogo(c); setPromos(pr); setRecompensas(rec);
      if (cPagos) setCfgPagos(prev => ({ ...prev, ...cPagos }));
    } catch (e) {}
  }

  async function cargarTodoUsuario() {
    if (!usuario?.id) return;
    try {
      const [c, pr, rec, peds, hPts, cPagos] = await Promise.all([
        obtenerCatalogo(true), obtenerPromociones(true), obtenerRecompensas(true),
        obtenerPedidosUsuario(usuario.id, esStaff),
        obtenerHistorialPuntos(usuario.id),
        obtenerConfigPagos()
      ]);
      setCatalogo(c); setPromos(pr); setRecompensas(rec);
      setPedidos(peds); setHistPuntos(hPts);
      if (cPagos) setCfgPagos(prev => ({ ...prev, ...cPagos }));

      (peds || []).forEach(p => {
        if (p.cliente_id === usuario.id && p.estado_rider === 'En la puerta' && !p.recibido_cliente && !avisosPuertaRef.current.has(p.id)) {
          avisosPuertaRef.current.add(p.id);
          reproducirTimbreAlerta();
          mostrarAviso('🛵 ¡Tu repartidor ya llegó!', `El motorizado ${p.rider_nombre || ''} está en la puerta con tu pedido ${p.numero_pedido}.`);
        }
      });
    } catch (e) {}
  }

  async function guardarSesion(u) {
    setUsuario(u);
    if (u?.rol === 'repartidor') setModoRiderActivo(true);
    await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify(u));
    if (u?.id) {
      iniciarOneSignalWeb(u).then(() => setPermisoPush(estadoPermisoPushWeb()));
    }
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('sesion_club_sazon');
    setUsuario(null);
    setModoRiderActivo(true);
    setPantallaAuth('bienvenida');
    setVista('inicio');
    setCarrito([]);
  }

  async function manejarLogin(tel, pass) {
    setCargando(true);
    try {
      const u = await ingresarUsuario(tel, pass);
      await guardarSesion(u);
    } catch (e) {
      mostrarAviso('No se pudo ingresar', e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarRegistro(datos) {
    setCargando(true);
    try {
      const u = await registrarUsuario(datos);
      await guardarSesion(u);
      mostrarAviso('¡Bienvenido al Club!', 'Tu cuenta fue creada con éxito.');
    } catch (e) {
      mostrarAviso('Error al registrarse', e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarRecuperar(tel, nueva) {
    setCargando(true);
    try {
      await recuperarClaveUsuario(tel, nueva);
      setPantallaAuth('login');
      mostrarAviso('Contraseña actualizada', 'Ya puedes ingresar con tu nueva clave.');
    } catch (e) {
      mostrarAviso('Error', e.message);
    } finally {
      setCargando(false);
    }
  }
    function agregarAlCarrito(item, esPromo = false) {
    if (cfgPagos.local_cerrado) {
      return mostrarAviso('Local cerrado', 'En este momento no estamos recibiendo pedidos. Vuelve pronto.');
    }
    const idReal = esPromo ? `promo-${item.id}` : item.id;
    const nombreReal = esPromo ? item.titulo : item.nombre;
    const existe = carrito.find(x => x.id === idReal);
    if (existe) {
      setCarrito(carrito.map(x => x.id === idReal ? { ...x, cantidad: x.cantidad + 1 } : x));
    } else {
      setCarrito([...carrito, { id: idReal, nombre: nombreReal, precio: Number(item.precio || 0), cantidad: 1 }]);
    }
    mostrarAviso('Agregado', `${nombreReal} se añadió a tu carrito.`);
  }

  function cambiarCantidad(id, delta) {
    setCarrito(prev => prev.map(x => x.id === id ? { ...x, cantidad: x.cantidad + delta } : x).filter(x => x.cantidad > 0));
  }

  function obtenerUbicacionCliente() {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      return mostrarAviso('GPS no disponible', 'Ingresa tu distrito y dirección manualmente.');
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsCliente({ lat, lng });
        if (!direccion.trim()) setDireccion(`Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        mostrarAviso('Ubicación actual capturada', 'Tu dirección GPS se usará para calcular el delivery y guiar al repartidor.');
      },
      () => mostrarAviso('Permiso GPS', 'Activa la ubicación en tu navegador para detectar tu dirección actual.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function calcularRutaDireccionManual() {
    const consulta = `${direccion.trim()} ${distrito.trim()} Peru`.trim();
    if (consulta.length < 6) {
      return mostrarAviso('Falta dirección', 'Escribe primero tu calle/avenida y distrito.');
    }
    setCalculandoRuta(true);
    try {
      const q = encodeURIComponent(consulta);
      let lat = null;
      let lng = null;

      try {
        const resPh = await fetch(`https://komoot.io{q}&limit=1`);
        const dataPh = await resPh.json();
        const coords = dataPh?.features?.at(0)?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          lng = parseFloat(coords.at(0));
          lat = parseFloat(coords.at(1));
        }
      } catch (e) {}

      if (lat === null || lng === null) {
        const resNom = await fetch(`https://openstreetmap.org{q}`);
        const dataNom = await resNom.json();
        if (Array.isArray(dataNom) && dataNom.length > 0) {
          lat = parseFloat(dataNom.at(0).lat);
          lng = parseFloat(dataNom.at(0).lon);
        }
      }

      if (lat !== null && lng !== null) {
        setGpsCliente({ lat, lng });
        const km = calcularDistanciaKm(Number(cfgPagos.local_lat || -12.0897), Number(cfgPagos.local_lng || -77.0031), lat, lng);
        const costo = Number((Number(cfgPagos.tarifa_base || 4) + km * Number(cfgPagos.tarifa_km || 1.5)).toFixed(2));
        mostrarAviso('Distancia calculada', `Distancia estimada: ${km.toFixed(1)} km • Costo delivery: S/ ${costo.toFixed(2)}`);
      } else {
        mostrarAviso('Dirección no ubicada en mapa', 'Verifica el nombre de la calle o usa el botón GPS. Se aplicará la tarifa base.');
      }
    } catch (e) {
      mostrarAviso('Aviso', 'No se pudo consultar el mapa en este momento.');
    } finally {
      setCalculandoRuta(false);
    }
  }

  const subtotal = carrito.reduce((acc, x) => acc + Number(x.precio) * x.cantidad, 0);
  const distanciaKm = (tipoEntrega === 'DELIVERY' && gpsCliente)
    ? calcularDistanciaKm(Number(cfgPagos.local_lat || -12.0897), Number(cfgPagos.local_lng || -77.0031), gpsCliente.lat, gpsCliente.lng)
    : 0;
  const costoDelivery = tipoEntrega === 'DELIVERY'
    ? Number((Number(cfgPagos.tarifa_base || 4) + distanciaKm * Number(cfgPagos.tarifa_km || 1.5)).toFixed(2))
    : 0;
  const totalFinal = subtotal + costoDelivery;

  async function enviarPedido() {
    if (!carrito.length) return mostrarAviso('Carrito vacío', 'Agrega productos antes de pedir.');
    if (tipoEntrega === 'DELIVERY' && !direccion.trim() && !gpsCliente) {
      return mostrarAviso('Falta dirección', 'Usa tu ubicación GPS actual o escribe tu dirección de entrega.');
    }
    if ((metodoPago === 'Yape' || metodoPago === 'Plin') && !comprobanteUrl) {
      return mostrarAviso('Falta captura de pago', `Por favor adjunta la captura de transferencia ${metodoPago} antes de confirmar tu pedido.`);
    }
    setCargando(true);
    try {
      const textoDir = `${direccion.trim()}${distrito.trim() ? ', ' + distrito.trim() : ''}`.trim();
      const mapsHost = 'https://google.com';
      const linkMaps = gpsCliente
        ? `${mapsHost}/search/?api=1&query=${gpsCliente.lat},${gpsCliente.lng}`
        : `${mapsHost}/search/?api=1&query=${encodeURIComponent(textoDir)}`;
      const dirCompleta = tipoEntrega === 'DELIVERY' ? `${direccion.trim() || 'Ubicación GPS'} | ${linkMaps}` : 'Recojo en local';
      await crearNuevoPedido({
        cliente_id: usuario.id,
        tipo_entrega: tipoEntrega,
        metodo_pago: metodoPago,
        distrito: tipoEntrega === 'DELIVERY' ? (distrito.trim() || 'Delivery GPS') : 'Local',
        direccion: dirCompleta,
        subtotal,
        costo_delivery: costoDelivery,
        total: totalFinal,
        notas: `${notas.trim()}${comprobanteUrl ? ` | COMPROBANTE: ${comprobanteUrl}` : ''}`.trim()
      }, carrito);
      setCarrito([]);
      setNotas('');
      setComprobanteUrl('');
      await cargarTodoUsuario();
      setVista('pedidos');
      mostrarAviso('¡Pedido enviado!', 'Tu pedido fue recibido por El Sazón Oriental.');
    } catch (e) { mostrarAviso('Error al pedir', e.message); } finally { setCargando(false); }
  }
    function clienteConfirmaRecepcion(ped) {
    pedirConfirmacion(
      'Confirmar recepción de pedido',
      `¿Confirmas que recibiste correctamente tu pedido ${ped.numero_pedido}? Se acreditarán tus puntos ganados y se habilitará el cierre al repartidor.`,
      async () => {
        setCargando(true);
        try {
          const pts = await confirmarRecepcionYDarPuntos(ped);
          await cargarTodoUsuario();
          mostrarAviso('¡Pedido recibido!', pts > 0 ? `Sumaste +${pts} puntos a tu cuenta.` : 'Recepción confirmada.');
        } catch (e) { mostrarAviso('Aviso', e.message); } finally { setCargando(false); }
      }
    );
  }

  function clienteCanjea(rec) {
    pedirConfirmacion(
      'Confirmar canje de recompensa',
      `¿Confirmas el canje de "${rec.titulo}" por ${rec.puntos_requeridos} puntos?`,
      async () => {
        setCargando(true);
        try {
          await canjearRecompensaCliente(usuario.id, rec);
          await cargarTodoUsuario();
          mostrarAviso('¡Canje solicitado!', `Has canjeado: ${rec.titulo}`);
        } catch (e) { mostrarAviso('No disponible', e.message); } finally { setCargando(false); }
      }
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <VentanaAviso />
        {pantallaAuth === 'bienvenida' && (
          <PantallaBienvenida irALogin={() => setPantallaAuth('login')} irARegistro={() => setPantallaAuth('registro')} />
        )}
        {pantallaAuth === 'login' && (
          <PantallaLogin
            onIngresar={manejarLogin}
            irARegistro={() => setPantallaAuth('registro')}
            irARecuperar={() => setPantallaAuth('recuperar')}
            irABienvenida={() => setPantallaAuth('bienvenida')}
            cargando={cargando}
          />
        )}
        {pantallaAuth === 'registro' && (
          <PantallaRegistro onRegistrar={manejarRegistro} irALogin={() => setPantallaAuth('login')} cargando={cargando} />
        )}
        {pantallaAuth === 'recuperar' && (
          <PantallaRecuperar irALogin={() => setPantallaAuth('login')} />
        )}
      </SafeAreaView>
    );
  }

  if (rol === 'administrador') {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <VentanaAviso />
        <VistaAdmin
          usuario={usuario}
          pedidos={pedidos}
          recargar={cargarTodoUsuario}
          onConfirmarAdmin={async (p, esDel) => { await actualizarEstadoPedidoAdmin(p, esDel ? 'Listo' : 'Aceptado por el local'); await cargarTodoUsuario(); }}
          onCompletar={async (p) => { await completarPedidoYDarPuntos(p); await cargarTodoUsuario(); mostrarAviso('Entregado', 'Pedido completado y puntos acreditados.'); }}
          onCancelar={async (p) => { await cancelarPedidoYDescontar(p); await cargarTodoUsuario(); mostrarAviso('Cancelado', 'Pedido anulado y puntos revertidos si correspondía.'); }}
          cerrarSesion={cerrarSesion}
          cargando={cargando}
        />
      </SafeAreaView>
    );
  }

  if (rol === 'repartidor' && modoRiderActivo) {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <VentanaAviso />
        <VistaRider
          usuario={usuario}
          pedidos={pedidos}
          recargar={cargarTodoUsuario}
          cerrarSesion={cerrarSesion}
          irAModoCliente={() => setModoRiderActivo(false)}
        />
      </SafeAreaView>
    );
  }

  const menuFiltrado = catalogo.filter(p => {
    const okCat = catActiva === 'Todas' || p.categoria === catActiva;
    const okBusq = !busqueda.trim() || (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase());
    return okCat && okBusq;
  });

  const promosList = promos.filter(pr => pr.tipo !== 'novedad');
  const novedadesList = promos.filter(pr => pr.tipo === 'novedad');
              return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <VentanaAviso />

      <Modal transparent animationType="fade" visible={Boolean(qrGrande)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: TARJETA, borderRadius: 16, borderWidth: 1.5, borderColor: DORADO, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: DORADO, fontWeight: '900', fontSize: 16, marginBottom: 6 }}>ESCANEA QR PARA PAGAR</Text>
            <Text style={{ color: '#FFF', fontSize: 12, marginBottom: 10 }}>Titular: {cfgPagos.titularLimpio}</Text>
            {!!qrGrande && <Image source={{ uri: qrGrande }} style={{ width: 260, height: 260, borderRadius: 12, backgroundColor: '#FFF' }} resizeMode="contain" />}
            <TouchableOpacity style={[styles.boton, { width: '100%', marginTop: 14 }]} onPress={() => setQrGrande(null)}>
              <Text style={styles.textoBoton}>Cerrar QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.barraSuperior}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Image source={LOGO} style={{ width: 42, height: 42, borderRadius: 10 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.tituloBarra}>EL SAZÓN ORIENTAL</Text>
              <Text style={{ color: DORADO, fontSize: 11, fontWeight: '800' }} numberOfLines={1}>Hola, {usuario.nombre_completo} • {usuario.puntos || 0} pts</Text>
            </View>
          </View>
          {carrito.length > 0 && vista !== 'carrito' && (
            <TouchableOpacity onPress={() => setVista('carrito')} style={{ backgroundColor: ROJO, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>🛒 {carrito.reduce((a, b) => a + b.cantidad, 0)}</Text>
            </TouchableOpacity>
          )}
        </View>

        {rol === 'repartidor' && (
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#1E1E28', borderWidth: 1.5, borderColor: DORADO, marginBottom: 10, paddingVertical: 10 }]}
            onPress={() => setModoRiderActivo(true)}
          >
            <Text style={[styles.textoBoton, { color: DORADO }]}>🛵 VOLVER A ORIENTAL RIDERS (REPARTOS)</Text>
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && permisoPush !== 'granted' && permisoPush !== 'no-soportado' && (
          <TouchableOpacity
            style={{ backgroundColor: '#1E1E28', borderWidth: 1, borderColor: DORADO, borderRadius: 12, padding: 10, marginBottom: 10, alignItems: 'center' }}
            onPress={async () => {
              await pedirPermisoPushWeb(usuario);
              setPermisoPush(estadoPermisoPushWeb());
            }}
          >
            <Text style={{ color: DORADO, fontWeight: '900', fontSize: 12 }}>🔔 ACTIVAR NOTIFICACIONES DE TU PEDIDO</Text>
          </TouchableOpacity>
        )}

        {vista === 'inicio' && (
          <View>
            {cfgPagos.local_cerrado && (
              <View style={[styles.tarjetaPedido, { borderColor: ROJO, backgroundColor: '#2A1012' }]}>
                <Text style={{ color: '#FCA5A5', fontWeight: '900', fontSize: 13 }}>🔴 LOCAL CERRADO TEMPORALMENTE</Text>
                <Text style={{ color: '#E5E7EB', fontSize: 12, marginTop: 2 }}>Puedes explorar nuestra carta, pero los pedidos se habilitarán apenas abramos.</Text>
              </View>
            )}

            <TextInput
              style={styles.campo}
              placeholder="Buscar hamburguesas, broaster, salchipapas..."
              placeholderTextColor="#6B7280"
              value={busqueda}
              onChangeText={setBusqueda}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 10 }} contentContainerStyle={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {categorias.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoria, catActiva === c && styles.categoriaActiva]}
                  onPress={() => setCatActiva(c)}
                >
                  <Text style={styles.textoCategoria}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {menuFiltrado.map(item => (
              <View key={item.id} style={styles.producto}>
                <Image source={item.imagen_url && item.imagen_url.includes('http') ? { uri: item.imagen_url } : LOGO} style={styles.fotoProducto} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombreProducto}>{item.nombre}</Text>
                  <Text style={styles.descripcionPedido} numberOfLines={2}>{item.ingredientes}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={styles.precioProducto}>S/ {Number(item.precio).toFixed(2)}</Text>
                    <TouchableOpacity
                      style={{ backgroundColor: ROJO, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 }}
                      onPress={() => agregarAlCarrito(item, false)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>+ Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {vista === 'promos' && (
          <View>
            <Text style={styles.titulo}>PROMOCIONES Y OFERTAS</Text>
            {promosList.length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay promociones activas por ahora.</Text></View>
            ) : (
              promosList.map(pr => (
                <View key={pr.id} style={styles.tarjetaPedido}>
                  {!!pr.imagen_url && pr.imagen_url.includes('http') && (
                    <Image source={{ uri: pr.imagen_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
                  )}
                  <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                  <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)}</Text>
                    <TouchableOpacity
                      style={{ backgroundColor: ROJO, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
                      onPress={() => agregarAlCarrito(pr, true)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>Pedir Promo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {novedadesList.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.titulo}>NOVEDADES DEL CLUB</Text>
                {novedadesList.map(nv => (
                  <View key={nv.id} style={[styles.tarjetaPedido, { borderColor: DORADO }]}>
                    {!!nv.imagen_url && nv.imagen_url.includes('http') && (
                      <Image source={{ uri: nv.imagen_url }} style={{ width: '100%', height: 140, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
                    )}
                    <Text style={styles.nombreProducto}>{nv.titulo}</Text>
                    <Text style={styles.descripcionPedido}>{nv.descripcion}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
                    {vista === 'carrito' && (
          <View>
            <Text style={styles.titulo}>TU CARRITO DE COMPRAS</Text>
            {carrito.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Tu carrito está vacío.</Text>
                <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={() => setVista('inicio')}>
                  <Text style={styles.textoBoton}>Ver Carta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {carrito.map(x => (
                  <View key={x.id} style={styles.tarjetaPedido}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.nombreProducto}>{x.nombre}</Text>
                      <Text style={styles.precioProducto}>S/ {(Number(x.precio) * x.cantidad).toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <TouchableOpacity style={{ backgroundColor: '#27272A', width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} onPress={() => cambiarCantidad(x.id, -1)}>
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>{x.cantidad}</Text>
                      <TouchableOpacity style={{ backgroundColor: ROJO, width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} onPress={() => cambiarCantidad(x.id, 1)}>
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <Text style={styles.titulo}>TIPO DE ENTREGA</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {['DELIVERY', 'RECOJO EN LOCAL'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: tipoEntrega === t ? ROJO : TARJETA, borderWidth: 1, borderColor: tipoEntrega === t ? ROJO : BORDE }}
                      onPress={() => setTipoEntrega(t)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {tipoEntrega === 'DELIVERY' && (
                  <View style={styles.tarjetaPedido}>
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#0284C7', marginTop: 0, marginBottom: 8 }]} onPress={obtenerUbicacionCliente}>
                      <Text style={styles.textoBoton}>📍 USAR MI UBICACIÓN ACTUAL (GPS)</Text>
                    </TouchableOpacity>
                    <TextInput style={styles.campo} placeholder="Distrito (ej. Pachacamac, Lurín...)" placeholderTextColor="#6B7280" value={distrito} onChangeText={setDistrito} />
                    <TextInput style={styles.campo} placeholder="Calle / Av. / Mz / Lt / Referencia" placeholderTextColor="#6B7280" value={direccion} onChangeText={setDireccion} />
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                      <TouchableOpacity
                        style={[styles.boton, { flex: 1, backgroundColor: '#6D28D9', marginTop: 0, paddingVertical: 10 }]}
                        onPress={calcularRutaDireccionManual}
                        disabled={calculandoRuta}
                      >
                        <Text style={[styles.textoBoton, { fontSize: 11 }]}>{calculandoRuta ? 'CALCULANDO...' : '📏 CALCULAR KM / COSTO'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.boton, { flex: 1, backgroundColor: '#0F766E', marginTop: 0, paddingVertical: 10 }]}
                        onPress={() => {
                          const q = encodeURIComponent(`${direccion || ''}, ${distrito || ''}, Lima, Peru`.trim());
                          const urlMaps = gpsCliente
                            ? `https://google.com{gpsCliente.lat},${gpsCliente.lng}`
                            : `https://google.com{q}`;
                          Linking.openURL(urlMaps);
                        }}
                      >
                        <Text style={[styles.textoBoton, { fontSize: 11 }]}>🗺️ VER EN MAPS</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: DORADO, fontSize: 12, fontWeight: '800' }}>
                      {gpsCliente
                        ? `Distancia: ${distanciaKm.toFixed(1)} km • Costo delivery: S/ ${costoDelivery.toFixed(2)}`
                        : `Costo delivery: S/ ${costoDelivery.toFixed(2)} (Tarifa base)`}
                    </Text>
                  </View>
                )}

                <Text style={styles.titulo}>MÉTODO DE PAGO</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {['Efectivo', 'Yape', 'Plin'].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: metodoPago === m ? ROJO : TARJETA, borderWidth: 1, borderColor: metodoPago === m ? ROJO : BORDE }}
                      onPress={() => setMetodoPago(m)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {(metodoPago === 'Yape' || metodoPago === 'Plin') && (
                  <View style={[styles.tarjetaPedido, { borderColor: DORADO, alignItems: 'center' }]}>
                    <Text style={{ color: DORADO, fontWeight: '900', fontSize: 13 }}>PAGA CON {metodoPago.toUpperCase()}</Text>
                    <Text style={{ color: '#FFF', fontSize: 12, marginBottom: 8 }}>Titular: {cfgPagos.titularLimpio}</Text>
                    {!!(metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin) && (
                      <TouchableOpacity onPress={() => setQrGrande(metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin)}>
                        <Image
                          source={{ uri: metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin }}
                          style={{ width: 170, height: 170, borderRadius: 10, backgroundColor: '#FFF', marginBottom: 8 }}
                          resizeMode="contain"
                        />
                        <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>Toca el QR para ampliarlo</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.boton, { width: '100%', backgroundColor: comprobanteUrl ? '#16A34A' : '#7C3AED' }]}
                      onPress={async () => {
                        setSubiendoComp(true);
                        try {
                          const url = await subirImagenGaleria();
                          if (url) { setComprobanteUrl(url); mostrarAviso('Captura lista', 'Tu comprobante fue adjuntado correctamente.'); }
                        } catch (e) { mostrarAviso('Error', e.message); } finally { setSubiendoComp(false); }
                      }}
                      disabled={subiendoComp}
                    >
                      <Text style={styles.textoBoton}>
                        {subiendoComp ? 'SUBIENDO CAPTURA...' : comprobanteUrl ? '✅ CAPTURA ADJUNTADA (CAMBIAR)' : `📷 SUBIR CAPTURA DE PAGO ${metodoPago.toUpperCase()}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TextInput
                  style={styles.campo}
                  placeholder="Notas adicionales (sin ají, cubiertos, etc.)"
                  placeholderTextColor="#6B7280"
                  value={notas}
                  onChangeText={setNotas}
                />

                <View style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.descripcionPedido}>Subtotal + Delivery</Text>
                    <Text style={styles.descripcionPedido}>S/ {subtotal.toFixed(2)} + S/ {costoDelivery.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Total</Text>
                    <Text style={{ color: DORADO, fontSize: 20, fontWeight: '900' }}>S/ {totalFinal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={enviarPedido} disabled={cargando}>
                    <Text style={styles.textoBoton}>{cargando ? 'ENVIANDO PEDIDO...' : 'REALIZAR PEDIDO'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
                      {vista === 'pedidos' && (
          <View>
            <Text style={styles.titulo}>MIS PEDIDOS</Text>
            {pedidos.length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no has realizado pedidos.</Text></View>
            ) : (
              pedidos.map(p => (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.nombreProducto}>{p.numero_pedido}</Text>
                    <View style={[styles.estadoPedido, p.estado === 'Cancelado' && { backgroundColor: '#7F1D1D' }]}>
                      <Text style={styles.textoEstado}>{p.estado_rider === 'En la puerta' ? '🛵 En la puerta' : p.estado}</Text>
                    </View>
                  </View>
                  <Text style={styles.descripcionPedido}>{new Date(p.creado_en).toLocaleString()} • {p.tipo_entrega} • {p.metodo_pago}</Text>
                  {(p.pedido_detalles || []).map(d => (
                    <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto}</Text>
                  ))}
                  {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#38BDF8', fontWeight: '800' }]}>Repartidor: {p.rider_nombre}</Text>}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>

                  {(p.estado_rider === 'En la puerta' || p.estado === 'En camino' || (p.tipo_entrega !== 'DELIVERY' && p.estado === 'Listo')) && !p.recibido_cliente && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 8 }]} onPress={() => clienteConfirmaRecepcion(p)} disabled={cargando}>
                      <Text style={styles.textoBoton}>✅ PEDIDO RECIBIDO (ACREDITAR PUNTOS)</Text>
                    </TouchableOpacity>
                  )}
                  {p.recibido_cliente && (
                    <Text style={{ color: '#22C55E', fontWeight: '800', fontSize: 12, marginTop: 6 }}>✅ Recepción confirmada • Puntos acreditados</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {vista === 'puntos' && (
          <VistaCanjes usuario={usuario} recompensas={recompensas} historial={histPuntos} onCanjear={clienteCanjea} />
        )}

        {vista === 'mas' && (
          <VistaMas usuario={usuario} onCerrarSesion={cerrarSesion} />
        )}
      </ScrollView>

      <View style={styles.barraInferior}>
        {[
          { id: 'inicio', tipo: 'inicio', label: 'Inicio' },
          { id: 'pedidos', tipo: 'pedidos', label: 'Pedidos' },
          { id: 'puntos', tipo: 'puntos', label: 'Puntos' },
          { id: 'promos', tipo: 'promos', label: 'Promociones' },
          { id: 'mas', tipo: 'mas', label: 'Más' }
        ].map(t => (
          <TouchableOpacity key={t.id} style={styles.tabInferior} onPress={() => setVista(t.id)}>
            <IconoTab tipo={t.tipo} activo={vista === t.id} />
            <Text style={[styles.textoTab, vista === t.id && styles.textoTabActivo]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
                    }
