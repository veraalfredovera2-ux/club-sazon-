import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { NavegacionSuperior, BarraInferiorCliente, PantallaBienvenida, PantallaLogin, PantallaRegistro, PantallaRecuperar, SiluetaBlanca, LOGO, BANNER_COMIDA } from './pantallas';
import { VentanaAviso, mostrarAviso, pedirConfirmacion, reproducirTimbreAlerta } from './avisos';
import { VistaAdmin } from './admin';
import { VistaRider } from './rider';
import { iniciarOneSignalWeb, pedirPermisoPushWeb, mostrarNotificacionLocalNativa } from './push';
import {
  categorias, obtenerCatalogo, obtenerPromociones, obtenerRecompensas, obtenerConfigPagos,
  obtenerDatosCliente, obtenerPedidosAdmin, registrarUsuario, ingresarUsuario, actualizarFotoPerfilNube,
  crearNuevoPedido, actualizarEstadoPedidoAdmin, confirmarRecepcionYDarPuntos, cancelarPedidoYDescontar,
  canjearRecompensaCliente, subirImagenGaleria
} from './servicios';

function DegradadoOscuroCard() {
  const capas = new Array(
    'rgba(7,7,9,0.00)',
    'rgba(7,7,9,0.12)',
    'rgba(7,7,9,0.34)',
    'rgba(7,7,9,0.62)',
    'rgba(7,7,9,0.86)',
    'rgba(7,7,9,0.97)'
  );
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {capas.map((bg, idx) => (
        <View key={idx} style={{ flex: 1, backgroundColor: bg }} />
      ))}
    </View>
  );
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function seleccionarYComprimirAvatar() {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('Permite el acceso a la galería para cambiar tu foto.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: new Array(1, 1),
      quality: 0.65,
      base64: true
    });
    if (res.canceled || !res.assets?.length) return null;
    const asset = res.assets.at(0);
    return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
  }
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target.files?.item(0);
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 260;
          const scale = Math.min(max / img.width, max / img.height, 1);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(ev.target?.result || null);
        img.src = ev.target?.result;
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  });
}

function IconoRojo({ tipo }) {
  const mapaIconos = {
    menu: 'restaurant-outline',
    promos: 'gift-outline',
    ofertas: 'pricetag-outline',
    novedades: 'megaphone-outline',
    puntos: 'star-outline',
    canjes: 'trophy-outline',
    carrito: 'cart-outline',
    pedidos: 'receipt-outline',
    cuenta: 'person-outline',
    salir: 'log-out-outline'
  };
  return (
    <View style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#22090C',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 23, 23, 0.45)',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Ionicons name={mapaIconos[tipo] || 'apps-outline'} size={24} color={ROJO} />
    </View>
  );
}
export default function App() {
  const [pantallaAuth, setPantallaAuth] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [modoClienteRider, setModoClienteRider] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [filtroPedCli, setFiltroPedCli] = useState('Activos');
  const [catActiva, setCatActiva] = useState('Todas');
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [promoDetalle, setPromoDetalle] = useState(null);
  const [verHistorialPts, setVerHistorialPts] = useState(false);
  const [cfgPagos, setCfgPagos] = useState({
    qr_yape: '', qr_plin: '', titularLimpio: 'Club Sazón',
    local_lat: '-12.069706', local_lng: '-77.033827',
    tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false,
    hora_apertura: '12:00', hora_cierre: '23:00'
  });
  const [datosCli, setDatosCli] = useState({ puntos: 0, historial: [], pedidos: [], canjes: [] });
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [tipoEntrega, setTipoEntrega] = useState('DELIVERY');
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [gpsCliente, setGpsCliente] = useState(null);
  const [calculandoRuta, setCalculandoRuta] = useState(false);
  const [notas, setNotas] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [subiendoComp, setSubiendoComp] = useState(false);
  const [cargando, setCargando] = useState(false);
  const puertaAvisadaRef = useRef({});

  useEffect(() => {
    AsyncStorage.getItem('session_club_sazon').then(s => {
      if (s) {
        const parsed = JSON.parse(s);
        setUsuario(parsed.perfil);
        setRol(parsed.tipo);
        iniciarOneSignalWeb({ ...parsed.perfil, rol: parsed.tipo });
        if (parsed.perfil?.foto_url) {
          setFotoPerfil(parsed.perfil.foto_url);
        } else if (parsed.perfil?.id) {
          AsyncStorage.getItem(`foto_perfil_${parsed.perfil.id}`).then(f => { if (f) setFotoPerfil(f); });
        }
      }
    });
    cargarBase();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    iniciarOneSignalWeb({ ...usuario, rol: rol || usuario.rol || 'cliente' });
    if (usuario.foto_url) setFotoPerfil(usuario.foto_url);
    cargarTodoUsuario();
    const t = setInterval(cargarTodoUsuario, 5000);
    return () => clearInterval(t);
  }, [usuario?.id, rol, modoClienteRider]);

  useEffect(() => {
    const lista = datosCli.pedidos || [];
    lista.forEach(p => {
      if (p.estado_rider === 'En la puerta' && !p.recibido_cliente && !puertaAvisadaRef.current[p.id]) {
        puertaAvisadaRef.current[p.id] = true;
        reproducirTimbreAlerta();
        mostrarNotificacionLocalNativa('¡Tu repartidor está en la puerta!', `${p.rider_nombre || 'Tu motorizado'} llegó con tu pedido ${p.numero_pedido}.`);
        mostrarAviso('🛵 ¡Tu repartidor está en la puerta!', `${p.rider_nombre || 'Tu motorizado'} ha llegado con tu pedido ${p.numero_pedido}. Por favor sal a recibirlo.`);
      }
    });
  }, [datosCli.pedidos]);

  async function cambiarFotoPerfil() {
    try {
      const dataUrl = await seleccionarYComprimirAvatar();
      if (!dataUrl) return;
      setFotoPerfil(dataUrl);
      if (usuario?.id) {
        await AsyncStorage.setItem(`foto_perfil_${usuario.id}`, dataUrl);
        await actualizarFotoPerfilNube(usuario.id, dataUrl);
        const actualizado = { ...usuario, foto_url: dataUrl };
        setUsuario(actualizado);
        await AsyncStorage.setItem('session_club_sazon', JSON.stringify({ tipo: rol, perfil: actualizado }));
      }
      mostrarAviso('Foto actualizada', 'Tu foto de perfil se guardó en la nube para cualquier dispositivo.');
    } catch (e) {
      mostrarAviso('Error al subir', e.message || 'Intenta con otra imagen más ligera.');
    }
  }
    async function cargarBase() {
    try {
      const [cat, pr, rec, cfg] = await Promise.all([obtenerCatalogo(true), obtenerPromociones(true), obtenerRecompensas(true), obtenerConfigPagos()]);
      setCatalogo(cat || []);
      setPromos(pr || []);
      setRecompensas(rec || []);
      if (cfg) setCfgPagos(prev => ({ ...prev, ...cfg }));
    } catch (e) {}
  }

  async function cargarTodoUsuario() {
    try {
      await cargarBase();
      if (rol === 'administrador' || rol === 'repartidor') {
        const pAdm = await obtenerPedidosAdmin();
        setPedidosAdmin(pAdm || []);
      }
      if (usuario?.id && (rol === 'cliente' || modoClienteRider)) {
        const d = await obtenerDatosCliente(usuario.id);
        setDatosCli(d);
        if (d.foto_url) setFotoPerfil(d.foto_url);
      }
    } catch (e) {}
  }

  async function manejarLogin(cred) {
    setCargando(true);
    try {
      const res = await ingresarUsuario(cred);
      setUsuario(res.perfil);
      setRol(res.tipo);
      setModoClienteRider(true);
      setFotoPerfil(res.perfil?.foto_url || null);
      await AsyncStorage.setItem('session_club_sazon', JSON.stringify(res));
      await pedirPermisoPushWeb({ ...res.perfil, rol: res.tipo });
    } catch (e) {
      mostrarAviso('Error al ingresar', e.message);
    } finally {
      setCargando(false);
    }
  }

  async function manejarRegistro(datos) {
    setCargando(true);
    try {
      const res = await registrarUsuario(datos);
      setUsuario(res.perfil);
      setRol('cliente');
      setFotoPerfil(null);
      await AsyncStorage.setItem('session_club_sazon', JSON.stringify({ tipo: 'cliente', perfil: res.perfil }));
      await pedirPermisoPushWeb({ ...res.perfil, rol: 'cliente' });
      mostrarAviso('¡Bienvenido!', res.mensaje);
    } catch (e) {
      mostrarAviso('Error al registrar', e.message);
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('session_club_sazon');
    setUsuario(null);
    setRol(null);
    setModoClienteRider(true);
    setFotoPerfil(null);
    setVista('inicio');
    setPantallaAuth('login');
  }

  function agregarAlCarrito(item, esPromo = false) {
    setCarrito(prev => {
      const idx = prev.findIndex(x => x.id === item.id && Boolean(x.es_promo) === esPromo);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
        return copia;
      }
      return [...prev, { id: item.id, nombre: item.nombre || item.titulo, precio: Number(item.precio), cantidad: 1, stock: item.stock, es_promo: esPromo, imagen_url: item.imagen_url || '' }];
    });
    mostrarAviso(
      cfgPagos.local_cerrado ? 'Guardado en carrito' : 'Agregado',
      cfgPagos.local_cerrado
        ? `${item.nombre || item.titulo} se guardó en tu carrito para cuando abramos (${cfgPagos.hora_apertura || '12:00'} - ${cfgPagos.hora_cierre || '23:00'}).`
        : `${item.nombre || item.titulo} añadido al carrito.`
    );
  }
    function cambiarCantidad(idx, delta) {
    setCarrito(prev => {
      const copia = [...prev];
      const nueva = copia[idx].cantidad + delta;
      if (nueva <= 0) { copia.splice(idx, 1); return copia; }
      copia[idx] = { ...copia[idx], cantidad: nueva };
      return copia;
    });
  }

  function eliminarDelCarrito(idx) {
    setCarrito(prev => prev.filter((_, i) => i !== idx));
  }

  async function obtenerUbicacionCliente() {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return mostrarAviso('Permiso GPS', 'Activa el permiso de ubicación en tu teléfono para calcular tu delivery.');
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsCliente({ lat, lng });
        if (!direccion.trim()) setDireccion(`Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        mostrarAviso('Ubicación actual capturada', 'Tu dirección GPS se usará para calcular el delivery y guiar al repartidor.');
      } catch (e) {
        mostrarAviso('GPS no disponible', 'Activa el GPS del teléfono o ingresa tu distrito y dirección manualmente.');
      }
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
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
    if (consulta.length < 8) {
      return mostrarAviso('Falta dirección', 'Escribe primero tu calle/avenida y distrito.');
    }
    setCalculandoRuta(true);
    try {
      const urlGeo = 'https://openstreetmap.org' + encodeURIComponent(consulta);
      const res = await fetch(urlGeo);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data.at(0).lat);
        const lng = parseFloat(data.at(0).lon);
        setGpsCliente({ lat, lng });
        const km = calcularDistanciaKm(Number(cfgPagos.local_lat || -12.0697), Number(cfgPagos.local_lng || -77.0338), lat, lng);
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
    ? calcularDistanciaKm(Number(cfgPagos.local_lat || -12.0697), Number(cfgPagos.local_lng || -77.0338), gpsCliente.lat, gpsCliente.lng)
    : 0;
  const costoDelivery = tipoEntrega === 'DELIVERY'
    ? Number((Number(cfgPagos.tarifa_base || 4) + distanciaKm * Number(cfgPagos.tarifa_km || 1.5)).toFixed(2))
    : 0;
  const totalFinal = subtotal + costoDelivery;

  async function enviarPedido() {
    if (cfgPagos.local_cerrado) {
      return mostrarAviso(
        '🔴 Local cerrado',
        `En este momento estamos cerrados. Nuestro horario de atención es de ${cfgPagos.hora_apertura || '12:00'} a ${cfgPagos.hora_cierre || '23:00'}. ¡Tu carrito queda guardado!`
      );
    }
    if (!carrito.length) return mostrarAviso('Carrito vacío', 'Agrega productos antes de pedir.');
        if (tipoEntrega === 'DELIVERY' && !direccion.trim() && !gpsCliente) {
      return mostrarAviso('Falta dirección', 'Usa tu ubicación GPS actual o escribe tu dirección de entrega.');
    }
    if ((metodoPago === 'Yape' || metodoPago === 'Plin') && !comprobanteUrl) {
      return mostrarAviso('Falta captura de pago', `Por favor adjunta la captura de transferencia ${metodoPago} antes de realizar el pedido.`);
    }
    setCargando(true);
    try {
      const textoDir = `${direccion.trim()}${distrito.trim() ? ' - ' + distrito.trim() : ''}`.trim();
      const mapsHost = 'https://google.com';
      const linkMaps = gpsCliente
        ? `${mapsHost}?q=${gpsCliente.lat},${gpsCliente.lng}`
        : `${mapsHost}/search/?api=1&query=${encodeURIComponent(textoDir)}`;
      const dirCompleta = tipoEntrega === 'DELIVERY' ? `${direccion.trim() || 'Ubicación GPS'}|${linkMaps}` : 'Recojo en local';
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
    } catch (e) {
      mostrarAviso('Error al pedir', e.message);
    } finally {
      setCargando(false);
    }
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
    const req = Number(rec.puntos_requeridos || 0);
    const saldoRestante = Math.max(0, Number(datosCli.puntos || 0) - req);
    pedirConfirmacion(
      'Confirmar canje de recompensa',
      `¿Confirmas el canje de "${rec.titulo}"?\n\n• Se descontarán: ${req} puntos\n• Saldo restante: ${saldoRestante} puntos`,
      async () => {
        setCargando(true);
        try {
          await canjearRecompensaCliente(usuario.id, rec);
          await cargarTodoUsuario();
          mostrarAviso('¡Canje solicitado!', `Has canjeado: ${rec.titulo}. Muestra este canje en el local o en tu pedido.`);
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
          pedidos={pedidosAdmin}
          recargar={cargarTodoUsuario}
          onConfirmarAdmin={async (p, del) => { await actualizarEstadoPedidoAdmin(p, del ? 'Listo' : 'Aceptado por el local'); await cargarTodoUsuario(); }}
          onCompletar={async (p) => { await confirmarRecepcionYDarPuntos(p); await cargarTodoUsuario(); }}
          onCancelar={async (p) => { await cancelarPedidoYDescontar(p); await cargarTodoUsuario(); }}
          cerrarSesion={cerrarSesion}
          cargando={cargando}
        />
      </SafeAreaView>
    );
  }

  if (rol === 'repartidor' && !modoClienteRider) {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <VentanaAviso />
        <VistaRider
          usuario={usuario}
          pedidos={pedidosAdmin}
          recargar={cargarTodoUsuario}
          cerrarSesion={cerrarSesion}
          irAModoCliente={() => setModoClienteRider(true)}
        />
      </SafeAreaView>
    );
  }

  const accesosInicio = [
    { id: 'menu', tipo: 'menu', titulo: 'Menú' },
    { id: 'promos', tipo: 'promos', titulo: 'Promociones' },
    { id: 'ofertas', tipo: 'ofertas', titulo: 'Ofertas' },
    { id: 'novedades', tipo: 'novedades', titulo: 'Novedades' },
    { id: 'puntos', tipo: 'puntos', titulo: 'Puntos' },
    { id: 'canjes', tipo: 'canjes', titulo: 'Canjes' },
    { id: 'carrito', tipo: 'carrito', titulo: 'Carrito' },
    { id: 'pedidos', tipo: 'pedidos', titulo: 'Pedidos' },
    { id: 'cuenta', tipo: 'cuenta', titulo: 'Mi cuenta' }
  ];

  const horaAhora = new Date().getHours();
  const turnoActual = (horaAhora >= 6 && horaAhora < 18) ? 'Día' : 'Noche';
  const prodPorTurno = catalogo.filter(p => {
    const t = (p.turno || 'Ambos').trim();
    return t === 'Ambos' || t === turnoActual;
  });
  const prodFiltrados = catActiva === 'Todas'
    ? prodPorTurno
    : prodPorTurno.filter(p => (p.categoria || '').toLowerCase() === catActiva.toLowerCase());

  const cantTotalCarrito = carrito.reduce((a, x) => a + x.cantidad, 0);
  const pedidosActivos = (datosCli.pedidos || []).filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado');
  const fuenteElegante = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : 'serif';

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <VentanaAviso />
      <Modal transparent animationType="fade" visible={Boolean(promoDetalle)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {promoDetalle && (
            <View style={{ width: '100%', maxWidth: 380, backgroundColor: TARJETA, borderWidth: 1.5, borderColor: ROJO, borderRadius: 18, overflow: 'hidden' }}>
              <Image
                source={promoDetalle.imagen_url && promoDetalle.imagen_url.includes('http') ? { uri: promoDetalle.imagen_url } : BANNER_COMIDA}
                style={{ width: '100%', height: 190 }}
                resizeMode="cover"
              />
              <View style={{ padding: 16 }}>
                <Text style={{ color: '#FFF', fontSize: 19, fontWeight: '900', marginBottom: 6 }}>{promoDetalle.titulo}</Text>
                <Text style={{ color: '#D1D5DB', fontSize: 13, marginBottom: 12 }}>{promoDetalle.descripcion || 'Especialidad preparada al momento en El Sazón Oriental.'}</Text>
                {promoDetalle.tipo !== 'novedad' && (
                  <View>
                    <Text style={{ color: ROJO, fontSize: 22, fontWeight: '900', marginBottom: 14 }}>S/ {Number(promoDetalle.precio).toFixed(2)}</Text>
                    <TouchableOpacity style={styles.boton} onPress={() => { agregarAlCarrito(promoDetalle, true); setPromoDetalle(null); }}>
                      <Text style={styles.textoBoton}>Agregar al carrito</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setPromoDetalle(null)}>
                  <Text style={styles.textoBoton}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.contenido}>
        <NavegacionSuperior
          regresar={vista !== 'inicio' ? () => setVista('inicio') : null}
          irAInicio={() => setVista('inicio')}
          cantidadNotif={pedidosActivos.length}
          abrirNotificaciones={() => setVista('notificaciones')}
          cantidadCarrito={cantTotalCarrito}
          abrirCarrito={() => setVista('carrito')}
        />

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cfgPagos.local_cerrado ? '#261013' : '#0E2417',
          borderWidth: 1,
          borderColor: cfgPagos.local_cerrado ? ROJO : '#16A34A',
          borderRadius: 12,
          paddingVertical: 7,
          paddingHorizontal: 12,
          marginBottom: 10
        }}>
          <Text style={{ color: cfgPagos.local_cerrado ? '#FCA5A5' : '#86EFAC', fontWeight: '900', fontSize: 11, textAlign: 'center' }}>
            {cfgPagos.local_cerrado
              ? `🔴 LOCAL CERRADO • Horario: ${cfgPagos.hora_apertura || '12:00'} - ${cfgPagos.hora_cierre || '23:00'}`
              : `🟢 LOCAL ABIERTO • Horario: ${cfgPagos.hora_apertura || '12:00'} - ${cfgPagos.hora_cierre || '23:00'}`}
          </Text>
        </View>

        {vista === 'inicio' && (
          <View>
            {rol === 'repartidor' && (
              <TouchableOpacity
                style={[styles.boton, { backgroundColor: '#1E1E28', borderWidth: 1.5, borderColor: DORADO, marginBottom: 10, paddingVertical: 10 }]}
                onPress={() => setModoClienteRider(false)}
              >
                <Text style={[styles.textoBoton, { color: DORADO }]}>🛵 VOLVER A MI PANEL ORIENTAL RIDERS</Text>
              </TouchableOpacity>
            )}

            <View style={styles.tarjetaPerfilHero}>
              <TouchableOpacity style={styles.avatarClienteBox} onPress={cambiarFotoPerfil}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <SiluetaBlanca size={36} />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>Bienvenido(a),</Text>
                <Text style={styles.nombreDoradoHero} numberOfLines={1}>{usuario.nombre_completo}!</Text>
                <Text style={{ color: '#F3F4F6', fontSize: 11, marginTop: 2 }}>Gracias por ser parte del Club Sazón</Text>
                <TouchableOpacity onPress={cambiarFotoPerfil}>
                  <Text style={{ color: DORADO, fontSize: 10, fontWeight: '800', marginTop: 2 }}>📷 Toca la foto para cambiar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.badgePuntosHero} onPress={() => setVista('puntos')}>
                <Text style={{ fontSize: 22, color: DORADO }}>★</Text>
                <Text style={styles.numeroPuntosDorado}>{datosCli.puntos}</Text>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>puntos</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ width: '100%', height: 195, position: 'relative', marginBottom: 12, overflow: 'hidden', borderRadius: 16 }} onPress={() => setVista('menu')}>
              <Image source={BANNER_COMIDA} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <DegradadoOscuroCard />
              <Text style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#FFFFFF', fontSize: 21, fontStyle: 'italic', fontWeight: '600', fontFamily: fuenteElegante }}>
                ¡Sabor que enamora!
              </Text>
            </TouchableOpacity>

            <View style={styles.cuadricula3}>
              {accesosInicio.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCuadricula}
                  onPress={() => setVista(item.id)}
                >
                  <View style={styles.iconoCuadriculaBox}>
                    <IconoRojo tipo={item.tipo} />
                  </View>
                  <Text style={styles.textoCuadricula}>{item.titulo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
                      {vista === 'menu' && (
          <View>
            <Text style={styles.titulo}>MENÚ DE PRODUCTOS</Text>
            <Text style={{ color: DORADO, fontSize: 12, fontWeight: '800', marginBottom: 8 }}>
              {turnoActual === 'Día' ? '☀️ Horario Turno Día (06:00 - 18:00)' : '🌙 Horario Turno Noche (18:00 - 06:00)'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
              {categorias.map(c => (
                <TouchableOpacity key={c} style={[styles.categoria, catActiva === c && styles.categoriaActiva]} onPress={() => setCatActiva(c)}>
                  <Text style={styles.textoCategoria}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {prodFiltrados.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>No hay platos disponibles en esta categoría para este turno.</Text>
              </View>
            ) : (
              prodFiltrados.map(prod => (
                <View key={prod.id} style={styles.producto}>
                  <Image
                    source={prod.imagen_url && prod.imagen_url.includes('http') ? { uri: prod.imagen_url } : LOGO}
                    style={styles.fotoProducto}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreProducto}>{prod.nombre}</Text>
                    {!!prod.ingredientes && <Text style={styles.descripcionPedido}>{prod.ingredientes}</Text>}
                    <Text style={styles.precioProducto}>S/ {Number(prod.precio).toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={styles.botonAgregar} onPress={() => agregarAlCarrito(prod, false)}>
                    <Text style={[styles.textoAgregar, { fontSize: 18 }]}>+</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {(vista === 'promos' || vista === 'ofertas' || vista === 'novedades') && (
          <View>
            <Text style={[styles.titulo, { fontSize: 20 }]}>
              {vista === 'novedades' ? 'Novedades' : vista === 'promos' ? 'Promociones' : 'Ofertas'}
            </Text>
            {promos.filter(pr => vista === 'novedades' ? pr.tipo === 'novedad' : vista === 'promos' ? (pr.tipo !== 'oferta' && pr.tipo !== 'novedad') : pr.tipo === 'oferta').length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>
                  {vista === 'novedades' ? 'Pronto publicaremos novedades aquí.' : vista === 'promos' ? 'Pronto publicaremos promociones aquí.' : 'Pronto publicaremos ofertas aquí.'}
                </Text>
              </View>
            ) : (
              promos
                .filter(pr => vista === 'novedades' ? pr.tipo === 'novedad' : vista === 'promos' ? (pr.tipo !== 'oferta' && pr.tipo !== 'novedad') : pr.tipo === 'oferta')
                .map(pr => (
                  <View key={pr.id} style={[styles.tarjetaPromo, { height: 220, position: 'relative', borderWidth: 1.5, borderColor: BORDE }]}>
                    <Image
                      source={pr.imagen_url && pr.imagen_url.includes('http') ? { uri: pr.imagen_url } : BANNER_COMIDA}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <DegradadoOscuroCard />
                    <View style={[styles.etiquetaPromo, { top: 12, left: 12, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 }]}>
                      <Text style={[styles.textoEtiquetaPromo, { fontSize: 11 }]}>
                        {vista === 'novedades' ? 'NOVEDAD' : vista === 'promos' ? 'PROMOCIÓN' : 'OFERTA'}
                      </Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 3 }} numberOfLines={2}>{pr.titulo}</Text>
                        {vista === 'novedades' ? (
                          <Text style={{ color: '#E5E7EB', fontSize: 12 }} numberOfLines={2}>{pr.descripcion}</Text>
                        ) : (
                          <Text style={{ color: ROJO, fontSize: 22, fontWeight: '900' }}>S/ {Number(pr.precio).toFixed(2)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: ROJO, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20 }}
                        onPress={() => setPromoDetalle(pr)}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>Ver más</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>
        )}
        {(vista === 'puntos' || vista === 'canjes') && (
          <View>
            <View style={{ borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: ROJO, backgroundColor: '#9E0611', position: 'relative', overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 34, color: DORADO }}>★</Text>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#F3F4F6', fontSize: 13, fontWeight: '800' }}>Tus puntos</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '900', lineHeight: 40 }}>{datosCli.puntos}</Text>
                </View>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginTop: 8 }}>¡Sigue acumulando puntos!</Text>
            </View>

            <View style={styles.tarjetaPedido}>
              <Text style={[styles.nombreProducto, { fontSize: 15, marginBottom: 8 }]}>Cómo ganar puntos</Text>
              <Text style={[styles.descripcionPedido, { color: '#E5E7EB', marginBottom: 4 }]}>★ 10 puntos por cada S/ 1 en compras elegibles.</Text>
              <Text style={[styles.descripcionPedido, { color: '#E5E7EB', marginBottom: 12 }]}>★ 100 puntos de bienvenida (una sola vez).</Text>
              <TouchableOpacity style={[styles.boton, { marginTop: 0, paddingVertical: 11 }]} onPress={() => setVerHistorialPts(!verHistorialPts)}>
                <Text style={styles.textoBoton}>{verHistorialPts ? 'Ocultar historial de puntos' : 'Ver historial de puntos'}</Text>
              </TouchableOpacity>
              {verHistorialPts && (
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: BORDE, paddingTop: 8 }}>
                  {(datosCli.historial || []).length === 0 ? (
                    <Text style={styles.descripcionPedido}>Aún no tienes movimientos registrados.</Text>
                  ) : (
                    (datosCli.historial || []).slice(0, 15).map((h, i) => (
                      <View key={h.id || i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1E1E28' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.descripcionPedido, { color: '#FFF', fontWeight: '700' }]}>{h.descripcion}</Text>
                          {!!h.creado_en && <Text style={{ color: '#6B7280', fontSize: 10 }}>{new Date(h.creado_en).toLocaleString()}</Text>}
                        </View>
                        <Text style={{ color: Number(h.cantidad) >= 0 ? '#22C55E' : ROJO, fontWeight: '900' }}>
                          {Number(h.cantidad) >= 0 ? `+${h.cantidad}` : h.cantidad} pts
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
              <Text style={[styles.titulo, { marginVertical: 0 }]}>Canjea tus puntos</Text>
              <Text style={{ color: ROJO, fontSize: 12, fontWeight: '800' }}>{recompensas.length} premios</Text>
            </View>

            {recompensas.length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay premios disponibles por ahora.</Text></View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                {recompensas.map(rec => {
                  const req = Number(rec.puntos_requeridos || 0);
                  const alcanza = Number(datosCli.puntos || 0) >= req;
                  const faltan = Math.max(0, req - Number(datosCli.puntos || 0));
                  return (
                    <View key={rec.id} style={{ width: '48%', backgroundColor: TARJETA, borderWidth: 1.5, borderColor: alcanza ? '#16A34A' : BORDE, borderRadius: 16, overflow: 'hidden', marginBottom: 4 }}>
                      <Image source={rec.imagen_url && rec.imagen_url.includes('http') ? { uri: rec.imagen_url } : LOGO} style={{ width: '100%', height: 105, backgroundColor: '#0A0A0E' }} resizeMode="cover" />
                      <View style={{ padding: 10 }}>
                        <Text style={[styles.nombreProducto, { fontSize: 14 }]} numberOfLines={1}>{rec.titulo}</Text>
                        <Text style={{ color: DORADO, fontSize: 13, fontWeight: '900', marginTop: 2 }}>{req} pts</Text>
                        {alcanza ? (
                          <TouchableOpacity style={{ backgroundColor: '#16A34A', paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginTop: 8 }} onPress={() => clienteCanjea(rec)} disabled={cargando}>
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>★ Canjear ahora</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={{ backgroundColor: '#2A0D11', borderWidth: 1, borderColor: ROJO, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', marginTop: 8 }}>
                            <Text style={{ color: ROJO, fontSize: 11, fontWeight: '900', textAlign: 'center' }}>Te faltan {faltan} pts</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={[styles.titulo, { marginTop: 16 }]}>HISTORIAL DE CANJES ({(datosCli.canjes || []).length})</Text>
            {(datosCli.canjes || []).length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no has canjeado ningún premio.</Text></View>
            ) : (
              (datosCli.canjes || []).map(cj => (
                <View key={cj.id} style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.nombreProducto}>🎁 {cj.recompensas?.titulo || 'Premio canjeado'}</Text>
                    <Text style={{ color: ROJO, fontWeight: '900', fontSize: 13 }}>-{cj.puntos_usados} pts</Text>
                  </View>
                  <Text style={styles.descripcionPedido}>
                    {new Date(cj.creado_en).toLocaleString()} • Estado: {cj.estado || 'Solicitado'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
                                                  {vista === 'carrito' && (
          <View>
            <Text style={[styles.titulo, { fontSize: 19 }]}>Carrito</Text>
            {carrito.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Tu carrito está vacío. Agrega platos desde el Menú.</Text>
                <TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={() => setVista('menu')}>
                  <Text style={styles.textoBoton}>Ir al Menú</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {carrito.map((item, idx) => (
                  <View key={`${item.id}-${idx}`} style={[styles.producto, { padding: 12 }]}>
                    <Image
                      source={item.imagen_url && item.imagen_url.includes('http') ? { uri: item.imagen_url } : LOGO}
                      style={{ width: 66, height: 66, borderRadius: 12, backgroundColor: '#1F1F28' }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nombreProducto}>{item.nombre}</Text>
                      <Text style={[styles.precioProducto, { color: '#D1D5DB', marginBottom: 6 }]}>S/ {(Number(item.precio) * item.cantidad).toFixed(2)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#22222C', alignItems: 'center', justifyContent: 'center' }} onPress={() => cambiarCantidad(idx, -1)}>
                          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>-</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{item.cantidad}</Text>
                        <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#22222C', alignItems: 'center', justifyContent: 'center' }} onPress={() => cambiarCantidad(idx, 1)}>
                          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => eliminarDelCarrito(idx)} style={{ padding: 8 }}>
                      <Text style={{ fontSize: 18, color: ROJO }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.titulo}>Entrega y ubicación</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {['DELIVERY', 'RECOJO EN LOCAL'].map(tipo => (
                    <TouchableOpacity
                      key={tipo}
                      style={[styles.opcionEntrega, tipoEntrega === tipo && styles.opcionEntregaActiva, { flex: 1, alignItems: 'center' }]}
                      onPress={() => setTipoEntrega(tipo)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{tipo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {tipoEntrega === 'DELIVERY' && (
                  <View style={styles.tarjetaPedido}>
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginBottom: 10, paddingVertical: 11 }]} onPress={obtenerUbicacionCliente}>
                      <Text style={styles.textoBoton}>📍 USAR MI UBICACIÓN ACTUAL (GPS)</Text>
                    </TouchableOpacity>
                    <TextInput style={styles.campo} placeholder="Distrito (ej. San Borja, Surquillo...)" placeholderTextColor="#6B7280" value={distrito} onChangeText={setDistrito} />
                    <TextInput style={styles.campo} placeholder="Dirección exacta o referencia" placeholderTextColor="#6B7280" value={direccion} onChangeText={setDireccion} />
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity
                        style={[styles.boton, { flex: 1, backgroundColor: '#7C3AED', marginTop: 0, paddingVertical: 10 }]}
                        disabled={calculandoRuta}
                        onPress={calcularRutaDireccionManual}
                      >
                        <Text style={[styles.textoBoton, { fontSize: 11 }]}>
                          {calculandoRuta ? 'CALCULANDO...' : '📏 CALCULAR KM / COSTO'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.boton, { flex: 1, backgroundColor: '#0284C7', marginTop: 0, paddingVertical: 10 }]}
                        onPress={() => {
                          const q = encodeURIComponent(`${direccion.trim()} ${distrito.trim()}`.trim());
                          const mapsHost = 'https://google.com';
                          Linking.openURL(`${mapsHost}/search/?api=1&query=${q}`);
                        }}
                      >
                        <Text style={[styles.textoBoton, { fontSize: 11 }]}>🗺️ VER EN MAPS</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: DORADO, fontWeight: '800', fontSize: 12 }}>
                      Costo delivery: S/ {costoDelivery.toFixed(2)} {gpsCliente ? `(${distanciaKm.toFixed(1)} km)` : '(Tarifa base)'}
                    </Text>
                  </View>
                )}
                                  <Text style={styles.titulo}>Método de pago</Text>
                <View style={styles.tarjetaPedido}>
                  {[
                    { id: 'Yape', bg: '#742284', tag: 'yape', label: 'Yape' },
                    { id: 'Plin', bg: '#00D2E3', tag: 'plin', label: 'Plin' },
                    { id: 'Efectivo', bg: '#0D9488', tag: '💵', label: 'Efectivo' }
                  ].map(mp => {
                    const sel = metodoPago === mp.id;
                    return (
                      <TouchableOpacity
                        key={mp.id}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#22222C', gap: 12 }}
                        onPress={() => setMetodoPago(mp.id)}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? ROJO : '#6B7280', alignItems: 'center', justifyContent: 'center' }}>
                          {sel && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ROJO }} />}
                        </View>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: mp.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>{mp.tag}</Text>
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{mp.label}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {(metodoPago === 'Yape' || metodoPago === 'Plin') && (
                    <View style={{ marginTop: 10, alignItems: 'center', width: '100%' }}>
                      <Text style={{ color: DORADO, fontWeight: '800', fontSize: 12, marginBottom: 4 }}>Titular: {cfgPagos.titularLimpio || 'Club Sazón'}</Text>
                      {!!(metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin) && (
                        <Image source={{ uri: metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin }} style={{ width: 150, height: 150, borderRadius: 10, marginVertical: 6 }} />
                      )}
                      <TouchableOpacity
                        style={[styles.boton, { backgroundColor: comprobanteUrl ? '#16A34A' : '#1E293B', width: '100%', paddingVertical: 10 }]}
                        disabled={subiendoComp}
                        onPress={async () => {
                          setSubiendoComp(true);
                          try {
                            const url = await subirImagenGaleria();
                            if (url) { setComprobanteUrl(url); mostrarAviso('Comprobante listo', 'Captura adjuntada al pedido.'); }
                          } catch (e) { mostrarAviso('Error', e.message); } finally { setSubiendoComp(false); }
                        }}
                      >
                        <Text style={styles.textoBoton}>
                          {subiendoComp ? 'SUBIENDO CAPTURA...' : comprobanteUrl ? '✅ CAPTURA DE PAGO ADJUNTADA' : `📎 ADJUNTAR CAPTURA DE PAGO ${metodoPago.toUpperCase()}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TextInput style={styles.campo} placeholder="Notas adicionales (sin ají, cubiertos, etc.)" placeholderTextColor="#6B7280" value={notas} onChangeText={setNotas} />

                <View style={styles.tarjetaPedido}>
                  {tipoEntrega === 'DELIVERY' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.descripcionPedido}>Subtotal + Delivery</Text>
                      <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>S/ {subtotal.toFixed(2)} + S/ {costoDelivery.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Total</Text>
                    <Text style={{ color: ROJO, fontSize: 22, fontWeight: '900' }}>S/ {totalFinal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.boton, { marginTop: 0 }, cfgPagos.local_cerrado && { backgroundColor: '#374151' }]}
                    onPress={enviarPedido}
                    disabled={cargando}
                  >
                    <Text style={styles.textoBoton}>
                      {cfgPagos.local_cerrado
                        ? `🔴 LOCAL CERRADO (ABRE ${cfgPagos.hora_apertura || '12:00'})`
                        : cargando ? 'Enviando pedido...' : 'Realizar pedido'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        {vista === 'pedidos' && (() => {
          const listaTodos = datosCli.pedidos || [];
          const listaComp = listaTodos.filter(p => p.estado === 'Completado');
          const listaCanc = listaTodos.filter(p => p.estado === 'Cancelado');
          const listaFiltrada = filtroPedCli === 'Activos'
            ? pedidosActivos
            : filtroPedCli === 'Completados'
              ? listaComp
              : filtroPedCli === 'Cancelados'
                ? listaCanc
                : listaTodos;

          return (
            <View>
              <Text style={styles.titulo}>MIS PEDIDOS ({listaTodos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
                {[
                  { id: 'Activos', label: `Activos (${pedidosActivos.length})` },
                  { id: 'Completados', label: `Completados (${listaComp.length})` },
                  { id: 'Cancelados', label: `Cancelados (${listaCanc.length})` },
                  { id: 'Todos', label: `Todos (${listaTodos.length})` }
                ].map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.categoria, filtroPedCli === f.id && styles.categoriaActiva]}
                    onPress={() => setFiltroPedCli(f.id)}
                  >
                    <Text style={styles.textoCategoria}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {listaFiltrada.length === 0 ? (
                <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos en esta sección.</Text></View>
              ) : (
                listaFiltrada.map(p => (
                  <View
                    key={p.id}
                    style={[
                      styles.tarjetaPedido,
                      p.estado === 'Completado' && { borderColor: '#16A34A' },
                      p.estado === 'Cancelado' && { borderColor: '#991B1B' },
                      p.estado_rider === 'En la puerta' && !p.recibido_cliente && { borderColor: DORADO, borderWidth: 2 }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.nombreProducto}>{p.numero_pedido}</Text>
                      <View style={[
                        styles.estadoPedido,
                        p.estado === 'Completado' && { backgroundColor: '#14532D', borderColor: '#22C55E' },
                        p.estado === 'Cancelado' && { backgroundColor: '#450A0A', borderColor: '#EF4444' }
                      ]}>
                        <Text style={styles.textoEstado}>
                          {p.estado === 'Completado' ? '✅ Pedido completado' : p.estado === 'Cancelado' ? '❌ Pedido cancelado' : p.estado}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.descripcionPedido}>{new Date(p.creado_en).toLocaleString()}</Text>
                    {p.estado_rider === 'En la puerta' && !p.recibido_cliente && (
                      <Text style={{ color: DORADO, fontWeight: '900', fontSize: 12, marginTop: 4 }}>🛵 ¡REPARTIDOR EN LA PUERTA!</Text>
                    )}
                    {(p.pedido_detalles || []).map(d => (
                      <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto}</Text>
                    ))}
                    {!!p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#93C5FD', fontWeight: '800' }]}>Repartidor: {p.rider_nombre} ({p.estado_rider})</Text>}
                    <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)} ({p.metodo_pago})</Text>
                                              {(p.estado_rider === 'En la puerta' || p.estado === 'En camino' || (p.tipo_entrega !== 'DELIVERY' && p.estado === 'Listo')) && !p.recibido_cliente && (
                      <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 10 }]} onPress={() => clienteConfirmaRecepcion(p)} disabled={cargando}>
                        <Text style={styles.textoBoton}>✅ PEDIDO RECIBIDO (ACREDITAR PUNTOS)</Text>
                      </TouchableOpacity>
                    )}
                    {(p.estado === 'Completado' || p.estado === 'Cancelado') && (p.pedido_detalles || []).length > 0 && (
                      <TouchableOpacity
                        style={[styles.boton, { backgroundColor: '#1E293B', marginTop: 8 }]}
                        onPress={() => {
                          const itemsReorden = (p.pedido_detalles || []).map(d => ({
                            id: d.producto_id || d.id,
                            nombre: d.nombre_producto,
                            precio: Number(d.precio_unitario || 0),
                            cantidad: Number(d.cantidad || 1),
                            es_promo: !d.producto_id,
                            imagen_url: ''
                          }));
                          setCarrito(itemsReorden);
                          setVista('carrito');
                          mostrarAviso('Pedido cargado', 'Los productos de este pedido se añadieron a tu carrito.');
                        }}
                      >
                        <Text style={styles.textoBoton}>🔄 VOLVER A PEDIR</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          );
        })()}

        {vista === 'notificaciones' && (
          <View>
            <Text style={styles.titulo}>NOTIFICACIONES</Text>
            {(datosCli.pedidos || []).length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No tienes notificaciones recientes.</Text></View>
            ) : (
              (datosCli.pedidos || []).slice(0, 10).map(p => (
                <TouchableOpacity key={p.id} style={styles.tarjetaPedido} onPress={() => setVista('pedidos')}>
                  <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
                  <Text style={[styles.descripcionPedido, { color: DORADO, fontWeight: '800', marginTop: 4 }]}>
                    Estado: {p.estado_rider === 'En la puerta' ? '🛵 Repartidor en la puerta' : p.estado}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {vista === 'mas' && (
          <View>
            <Text style={styles.titulo}>MÁS OPCIONES</Text>
            <View style={styles.cuadricula3}>
              {[
                { id: 'novedades', tipo: 'novedades', titulo: 'Novedades' },
                { id: 'cuenta', tipo: 'cuenta', titulo: 'Mi cuenta' },
                { id: 'canjes', tipo: 'canjes', titulo: 'Canjes' },
                { id: 'ofertas', tipo: 'ofertas', titulo: 'Ofertas' },
                { id: 'carrito', tipo: 'carrito', titulo: `Carrito (${cantTotalCarrito})` },
                { id: 'salir', tipo: 'salir', titulo: 'Cerrar sesión' }
              ].map(op => (
                <TouchableOpacity
                  key={op.id}
                  style={styles.itemCuadricula}
                  onPress={() => {
                    if (op.id === 'salir') return cerrarSesion();
                    setVista(op.id);
                  }}
                >
                  <View style={styles.iconoCuadriculaBox}>
                    <IconoRojo tipo={op.tipo} />
                  </View>
                  <Text style={styles.textoCuadricula}>{op.titulo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {vista === 'cuenta' && (
          <View>
            <Text style={styles.titulo}>MI CUENTA</Text>
            <View style={[styles.tarjetaPedido, { alignItems: 'center' }]}>
              <TouchableOpacity style={[styles.avatarClienteBox, { width: 84, height: 84, borderRadius: 42, marginBottom: 10 }]} onPress={cambiarFotoPerfil}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <SiluetaBlanca size={46} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={cambiarFotoPerfil} style={{ marginBottom: 10 }}>
                <Text style={{ color: DORADO, fontWeight: '800' }}>📷 Cambiar foto de perfil</Text>
              </TouchableOpacity>
              <Text style={[styles.nombreProducto, { color: DORADO, fontSize: 18 }]}>{usuario.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Teléfono: {usuario.telefono}</Text>
              <Text style={[styles.precioProducto, { color: DORADO, marginTop: 8 }]}>Saldo actual: {datosCli.puntos} puntos</Text>
            </View>
            <TouchableOpacity
              style={[styles.boton, { backgroundColor: '#16A34A', marginBottom: 8 }]}
              onPress={async () => {
                const ok = await pedirPermisoPushWeb({ ...usuario, rol: rol || 'cliente' });
                mostrarAviso(
                  ok ? '🔔 Notificaciones activadas' : 'Permiso pendiente',
                  ok
                    ? 'Recibirás alertas en tu teléfono incluso con la pantalla apagada.'
                    : 'Permite las notificaciones en la barra de tu navegador o ajustes de la app.'
                );
              }}
            >
              <Text style={styles.textoBoton}>🔔 ACTIVAR NOTIFICACIONES PUSH</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.boton, { backgroundColor: '#252530' }]} onPress={cerrarSesion}>
              <Text style={styles.textoBoton}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BarraInferiorCliente vistaActual={vista} cambiarVista={setVista} />
    </SafeAreaView>
  );
                                                }
          
