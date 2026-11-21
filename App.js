import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { NavegacionSuperior, BarraInferiorCliente, PantallaBienvenida, PantallaLogin, PantallaRegistro, PantallaRecuperar, SiluetaBlanca, LOGO, BANNER_COMIDA } from './pantallas';
import { VentanaAviso, mostrarAviso } from './avisos';
import { VistaAdmin } from './admin';
import {
  categorias, obtenerCatalogo, obtenerPromociones, obtenerRecompensas, obtenerConfigPagos,
  obtenerDatosCliente, obtenerPedidosAdmin, registrarUsuario, ingresarUsuario,
  crearNuevoPedido, confirmarAdminPedido, confirmarRecepcionYDarPuntos, cancelarPedidoYDescontar, canjearRecompensaCliente
} from './servicios';

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function seleccionarYComprimirAvatar() {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return resolve(null);
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target?.files?.item(0);
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
  if (Platform.OS === 'web') {
    const paths = {
      menu: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
      promos: 'M12 2l2.39 1.65 2.89-.39.84 2.79 2.53 1.44-.88 2.78 1.24 2.63-2.29 1.81-.29 2.9-2.88.45-1.69 2.36-2.76-.94-2.76.94-1.69-2.36-2.88-.45-.29-2.9-2.29-1.81 1.24-2.63-.88-2.78 2.53-1.44.84-2.79 2.89.39L12 2zm-2.5 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm5 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm.3-5.8l-7.1 7.1 1.4 1.4 7.1-7.1-1.4-1.4z',
      ofertas: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
      puntos: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
      canjes: 'M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z',
      carrito: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
      pedidos: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      cuenta: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      salir: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
      foto: 'M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z'
    };
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill={ROJO}>
        <path d={paths[tipo] || paths.menu} />
      </svg>
    );
  }
  return <Text style={{ fontSize: 22, color: ROJO, fontWeight: '900' }}>★</Text>;
}

export default function App() {
  const [pantallaAuth, setPantallaAuth] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [catActiva, setCatActiva] = useState('Todas');
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titularLimpio: 'Club Sazón', local_lat: '-12.089700', local_lng: '-77.003100', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false });
  const [datosCli, setDatosCli] = useState({ puntos: 0, historial: [], pedidos: [], canjes: [] });
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [tipoEntrega, setTipoEntrega] = useState('RECOJO EN LOCAL');
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [gpsCliente, setGpsCliente] = useState(null);
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sesion_club_sazon').then(s => {
      if (s) {
        const parsed = JSON.parse(s);
        setUsuario(parsed.perfil);
        setRol(parsed.tipo);
        if (parsed.perfil?.id) {
          AsyncStorage.getItem(`foto_perfil_${parsed.perfil.id}`).then(f => { if (f) setFotoPerfil(f); });
        }
      }
    });
    cargarBase();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    AsyncStorage.getItem(`foto_perfil_${usuario.id}`).then(f => { if (f) setFotoPerfil(f); });
    cargarTodoUsuario();
    const t = setInterval(cargarTodoUsuario, 5000);
    return () => clearInterval(t);
  }, [usuario?.id, rol]);

  async function cambiarFotoPerfil() {
    try {
      const dataUrl = await seleccionarYComprimirAvatar();
      if (!dataUrl) return;
      setFotoPerfil(dataUrl);
      if (usuario?.id) await AsyncStorage.setItem(`foto_perfil_${usuario.id}`, dataUrl);
      mostrarAviso('Foto actualizada', 'Tu foto de perfil se guardó correctamente.');
    } catch (e) { mostrarAviso('Error al subir', 'Intenta con otra imagen más ligera.'); }
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
      if (rol === 'administrador') {
        const pAdm = await obtenerPedidosAdmin();
        setPedidosAdmin(pAdm || []);
      } else if (usuario?.id) {
        const d = await obtenerDatosCliente(usuario.id);
        setDatosCli(d);
      }
    } catch (e) {}
  }

  async function manejarLogin(cred) {
    setCargando(true);
    try {
      const res = await ingresarUsuario(cred);
      setUsuario(res.perfil);
      setRol(res.tipo);
      await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify(res));
    } catch (e) { mostrarAviso('Error al ingresar', e.message); } finally { setCargando(false); }
  }

  async function manejarRegistro(datos) {
    setCargando(true);
    try {
      const res = await registrarUsuario(datos);
      setUsuario(res.perfil);
      setRol('cliente');
      await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify({ tipo: 'cliente', perfil: res.perfil }));
      mostrarAviso('¡Bienvenido!', res.mensaje);
    } catch (e) { mostrarAviso('Error al registrar', e.message); } finally { setCargando(false); }
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('sesion_club_sazon');
    setUsuario(null);
    setRol(null);
    setFotoPerfil(null);
    setVista('inicio');
    setPantallaAuth('login');
  }

  function agregarAlCarrito(item, esPromo = false) {
    if (cfgPagos.local_cerrado) return mostrarAviso('Local cerrado', 'En este momento el local se encuentra cerrado.');
    setCarrito(prev => {
      const idx = prev.findIndex(x => x.id === item.id && Boolean(x.es_promo) === esPromo);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
        return copia;
      }
      return [...prev, { id: item.id, nombre: item.nombre || item.titulo, precio: Number(item.precio), cantidad: 1, stock: item.stock, es_promo: esPromo, imagen_url: item.imagen_url || '' }];
    });
    mostrarAviso('Agregado', `${item.nombre || item.titulo} añadido al carrito.`);
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

  function obtenerUbicacionCliente() {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      return mostrarAviso('GPS no disponible', 'Ingresa tu distrito y dirección manualmente.');
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCliente({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mostrarAviso('Ubicación lista', 'Calculamos el costo exacto de tu delivery.');
      },
      () => mostrarAviso('Permiso GPS', 'Activa la ubicación en tu navegador para calcular el delivery.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    if (tipoEntrega === 'DELIVERY' && (!distrito.trim() || !direccion.trim())) {
      return mostrarAviso('Falta dirección', 'Ingresa tu distrito y dirección de entrega.');
    }
    setCargando(true);
    try {
      const linkMaps = gpsCliente ? ` | https://google.com{gpsCliente.lat},${gpsCliente.lng}` : '';
      const dirCompleta = tipoEntrega === 'DELIVERY' ? `${direccion.trim()}${linkMaps}` : 'Recojo en local';
      await crearNuevoPedido({
        cliente_id: usuario.id,
        tipo_entrega: tipoEntrega,
        metodo_pago: metodoPago,
        distrito: tipoEntrega === 'DELIVERY' ? distrito.trim() : 'Local',
        direccion: dirCompleta,
        subtotal,
        costo_delivery: costoDelivery,
        total: totalFinal,
        notas: notas.trim()
      }, carrito);
      setCarrito([]);
      setNotas('');
      await cargarTodoUsuario();
      setVista('pedidos');
      mostrarAviso('¡Pedido enviado!', 'Tu pedido fue recibido por El Sazón Oriental.');
    } catch (e) { mostrarAviso('Error al pedir', e.message); } finally { setCargando(false); }
  }

  async function clienteConfirmaRecepcion(ped) {
    setCargando(true);
    try {
      const pts = await confirmarRecepcionYDarPuntos(ped);
      await cargarTodoUsuario();
      mostrarAviso('¡Gracias por confirmar!', pts > 0 ? `Sumaste +${pts} puntos a tu cuenta.` : 'Recepción confirmada.');
    } catch (e) { mostrarAviso('Aviso', e.message); } finally { setCargando(false); }
  }

  async function clienteCanjea(rec) {
    setCargando(true);
    try {
      await canjearRecompensaCliente(usuario.id, rec);
      await cargarTodoUsuario();
      mostrarAviso('¡Canje solicitado!', `Has canjeado: ${rec.titulo}`);
    } catch (e) { mostrarAviso('No disponible', e.message); } finally { setCargando(false); }
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
          onConfirmarAdmin={async (p, del) => { await confirmarAdminPedido(p, del); await cargarTodoUsuario(); }}
          onCompletar={async (p) => { await confirmarRecepcionYDarPuntos(p); await cargarTodoUsuario(); }}
          onCancelar={async (p) => { await cancelarPedidoYDescontar(p); await cargarTodoUsuario(); }}
          cerrarSesion={cerrarSesion}
          cargando={cargando}
        />
      </SafeAreaView>
    );
  }

  const accesosInicio = [
    { id: 'menu', tipo: 'menu', titulo: 'Menú' },
    { id: 'promos', tipo: 'promos', titulo: 'Promociones' },
    { id: 'ofertas', tipo: 'ofertas', titulo: 'Ofertas' },
    { id: 'puntos', tipo: 'puntos', titulo: 'Puntos' },
    { id: 'canjes', tipo: 'canjes', titulo: 'Canjes' },
    { id: 'carrito', tipo: 'carrito', titulo: 'Carrito' },
    { id: 'pedidos', tipo: 'pedidos', titulo: 'Pedidos' },
    { id: 'cuenta', tipo: 'cuenta', titulo: 'Mi cuenta' },
    { id: 'salir', tipo: 'salir', titulo: 'Cerrar sesión' }
  ];

  const prodFiltrados = catActiva === 'Todas'
    ? catalogo
    : catalogo.filter(p => (p.categoria || '').toLowerCase() === catActiva.toLowerCase());

  const cantTotalCarrito = carrito.reduce((a, x) => a + x.cantidad, 0);
  const pedidosActivos = (datosCli.pedidos || []).filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado');

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <VentanaAviso />
      <ScrollView contentContainerStyle={styles.contenido}>
        <NavegacionSuperior
          regresar={vista !== 'inicio' ? () => setVista('inicio') : null}
          irAInicio={() => setVista('inicio')}
          cantidadNotif={pedidosActivos.length}
          abrirNotificaciones={() => setVista('notificaciones')}
          cantidadCarrito={cantTotalCarrito}
          abrirCarrito={() => setVista('carrito')}
        />

        {cfgPagos.local_cerrado && (
          <View style={[styles.tarjetaPedido, { borderColor: ROJO, backgroundColor: '#251216' }]}>
            <Text style={{ color: '#FFF', fontWeight: '900', textAlign: 'center', fontSize: 12 }}>
              🔒 LOCAL CERRADO TEMPORALMENTE — Vuelve en nuestro horario de atención
            </Text>
          </View>
        )}

        {vista === 'inicio' && (
          <View>
            <View style={styles.tarjetaPerfilHero}>
              <TouchableOpacity style={styles.avatarClienteBox} onPress={cambiarFotoPerfil}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <SiluetaBlanca size={36} />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>¡Bienvenido(a),</Text>
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

            <TouchableOpacity style={styles.bannerHero} onPress={() => setVista('menu')}>
              <Image source={BANNER_COMIDA} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <Text style={styles.textoBannerEnamora}>¡Sabor que enamora!</Text>
            </TouchableOpacity>

            <View style={styles.cuadricula3}>
              {accesosInicio.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCuadricula}
                  onPress={() => {
                    if (item.id === 'salir') return cerrarSesion();
                    setVista(item.id);
                  }}
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

        {vista === 'notificaciones' && (
          <View>
            <Text style={styles.titulo}>NOTIFICACIONES DE PEDIDOS</Text>
            {!(datosCli.pedidos || []).length ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>No tienes notificaciones recientes.</Text>
              </View>
            ) : (
              (datosCli.pedidos || []).slice(0, 10).map(p => (
                <TouchableOpacity key={p.id} style={styles.tarjetaPedido} onPress={() => setVista('pedidos')}>
                  <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
                  <Text style={[styles.descripcionPedido, { color: DORADO, fontWeight: '800', marginTop: 4 }]}>Estado: {p.estado}</Text>
                  {p.rider_nombre && <Text style={styles.descripcionPedido}>Repartidor: {p.rider_nombre} ({p.estado_rider})</Text>}
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
                { id: 'cuenta', tipo: 'cuenta', titulo: 'Mi cuenta' },
                { id: 'canjes', tipo: 'canjes', titulo: 'Canjes' },
                { id: 'ofertas', tipo: 'ofertas', titulo: 'Ofertas' },
                { id: 'carrito', tipo: 'carrito', titulo: `Carrito (${cantTotalCarrito})` },
                { id: 'foto', tipo: 'foto', titulo: 'Subir foto' },
                { id: 'salir', tipo: 'salir', titulo: 'Cerrar sesión' }
              ].map(op => (
                <TouchableOpacity
                  key={op.id}
                  style={styles.itemCuadricula}
                  onPress={() => {
                    if (op.id === 'salir') return cerrarSesion();
                    if (op.id === 'foto') return cambiarFotoPerfil();
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
                    {vista === 'menu' && (
          <View>
            <Text style={styles.titulo}>MENÚ DE PRODUCTOS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
              {categorias.map(c => (
                <TouchableOpacity key={c} style={[styles.categoria, catActiva === c && styles.categoriaActiva]} onPress={() => setCatActiva(c)}>
                  <Text style={styles.textoCategoria}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {prodFiltrados.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>No hay platos disponibles en esta categoría.</Text>
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
                    {!!prod.ingredientes && <Text style={styles.descripcionPedido} numberOfLines={2}>{prod.ingredientes}</Text>}
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

        {(vista === 'promos' || vista === 'ofertas') && (
          <View>
            <Text style={styles.titulo}>{vista === 'promos' ? 'PROMOCIONES ESPECIALES' : 'OFERTAS DEL DÍA'}</Text>
            {promos.filter(pr => vista === 'promos' ? pr.tipo !== 'oferta' : pr.tipo === 'oferta').length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Pronto publicaremos nuevas promociones aquí.</Text>
              </View>
            ) : (
              promos
                .filter(pr => vista === 'promos' ? pr.tipo !== 'oferta' : pr.tipo === 'oferta')
                .map(pr => (
                  <View key={pr.id} style={styles.tarjetaPromo}>
                    <Image
                      source={pr.imagen_url && pr.imagen_url.includes('http') ? { uri: pr.imagen_url } : BANNER_COMIDA}
                      style={{ width: '100%', height: 145 }}
                      resizeMode="cover"
                    />
                    <View style={styles.etiquetaPromo}>
                      <Text style={styles.textoEtiquetaPromo}>{pr.tipo === 'oferta' ? 'OFERTA' : 'PROMOCIÓN'}</Text>
                    </View>
                    <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                        {!!pr.descripcion && <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>}
                        <Text style={[styles.precioProducto, { color: ROJO, fontSize: 16 }]}>S/ {Number(pr.precio).toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity style={styles.botonAgregar} onPress={() => agregarAlCarrito(pr, true)}>
                        <Text style={styles.textoAgregar}>Agregar +</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>
        )}

        {(vista === 'puntos' || vista === 'canjes') && (
          <View>
            <View style={[styles.tarjetaSaldo, { borderColor: ROJO, backgroundColor: '#1E0D11' }]}>
              <Text style={styles.etiquetaSaldo}>★ TUS PUNTOS ACUMULADOS</Text>
              <Text style={[styles.numeroSaldo, { color: DORADO }]}>{datosCli.puntos} pts</Text>
              <Text style={{ color: '#F3F4F6', fontSize: 12, fontWeight: '700' }}>¡Sigue acumulando puntos con cada pedido!</Text>
            </View>

            <View style={styles.tarjetaPedido}>
              <Text style={[styles.nombreProducto, { marginBottom: 6 }]}>¿Cómo ganar puntos?</Text>
              <Text style={styles.descripcionPedido}>• 10 puntos por cada S/ 1.00 en compras confirmadas.</Text>
              <Text style={styles.descripcionPedido}>• 100 puntos de bienvenida al registrarte.</Text>
            </View>

            <Text style={styles.titulo}>CANJEA TUS PUNTOS</Text>
            {recompensas.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>No hay premios disponibles por ahora.</Text>
              </View>
            ) : (
              recompensas.map(rec => (
                <View key={rec.id} style={styles.producto}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreProducto}>{rec.titulo}</Text>
                    {!!rec.descripcion && <Text style={styles.descripcionPedido}>{rec.descripcion}</Text>}
                    <Text style={[styles.precioProducto, { color: DORADO }]}>{rec.puntos_requeridos} pts • Stock: {rec.stock ?? 5}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.botonAgregar, datosCli.puntos < Number(rec.puntos_requeridos) && { backgroundColor: '#2A2A35' }]}
                    onPress={() => clienteCanjea(rec)}
                    disabled={cargando}
                  >
                    <Text style={styles.textoAgregar}>Canjear</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <Text style={styles.titulo}>HISTORIAL DE PUNTOS</Text>
            {(datosCli.historial || []).slice(0, 10).map((h, i) => (
              <View key={h.id || i} style={styles.tarjetaPedido}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.descripcionPedido, { color: '#FFF', flex: 1 }]}>{h.descripcion}</Text>
                  <Text style={{ color: Number(h.cantidad) >= 0 ? DORADO : ROJO, fontWeight: '900' }}>
                    {Number(h.cantidad) >= 0 ? `+${h.cantidad}` : h.cantidad} pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
                      {vista === 'carrito' && (
          <View>
            <Text style={styles.titulo}>TU CARRITO Y PAGO</Text>
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
                  <View key={`${item.id}-${idx}`} style={styles.producto}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nombreProducto}>{item.nombre}</Text>
                      <Text style={styles.precioProducto}>S/ {(Number(item.precio) * item.cantidad).toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity style={[styles.botonAgregar, { backgroundColor: '#252530', paddingHorizontal: 10 }]} onPress={() => cambiarCantidad(idx, -1)}>
                        <Text style={styles.textoAgregar}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{item.cantidad}</Text>
                      <TouchableOpacity style={[styles.botonAgregar, { paddingHorizontal: 10 }]} onPress={() => cambiarCantidad(idx, 1)}>
                        <Text style={styles.textoAgregar}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <Text style={styles.titulo}>TIPO DE ENTREGA</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {['RECOJO EN LOCAL', 'DELIVERY'].map(tipo => (
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
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 10, paddingVertical: 10 }]} onPress={obtenerUbicacionCliente}>
                      <Text style={styles.textoBoton}>📍 USAR MI UBICACIÓN GPS (CALCULAR ENVÍO)</Text>
                    </TouchableOpacity>
                    <TextInput style={styles.campo} placeholder="Distrito (ej. San Borja, Surquillo...)" placeholderTextColor="#6B7280" value={distrito} onChangeText={setDistrito} />
                    <TextInput style={styles.campo} placeholder="Dirección exacta y referencia" placeholderTextColor="#6B7280" value={direccion} onChangeText={setDireccion} />
                    <Text style={{ color: ROJO, fontWeight: '800', fontSize: 12 }}>
                      Costo delivery: S/ {costoDelivery.toFixed(2)} {gpsCliente ? `(${distanciaKm.toFixed(1)} km)` : '(Tarifa base)'}
                    </Text>
                  </View>
                )}

                <Text style={styles.titulo}>MÉTODO DE PAGO</Text>
                {['Yape', 'Plin', 'Efectivo'].map(mp => (
                  <TouchableOpacity
                    key={mp}
                    style={[styles.opcionEntrega, metodoPago === mp && styles.opcionEntregaActiva, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => setMetodoPago(mp)}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{mp === 'Yape' ? '🟣 Yape' : mp === 'Plin' ? '🔵 Plin' : '💵 Efectivo'}</Text>
                    <Text style={{ color: metodoPago === mp ? ROJO : '#6B7280', fontWeight: '900' }}>{metodoPago === mp ? '●' : '○'}</Text>
                  </TouchableOpacity>
                ))}

                {(metodoPago === 'Yape' || metodoPago === 'Plin') && (
                  <View style={styles.tarjetaPedido}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, marginBottom: 4 }}>Titular: {cfgPagos.titularLimpio || 'Club Sazón'}</Text>
                    {!!(metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin) && (
                      <Image source={{ uri: metodoPago === 'Yape' ? cfgPagos.qr_yape : cfgPagos.qr_plin }} style={{ width: 150, height: 150, alignSelf: 'center', borderRadius: 10, marginVertical: 6 }} />
                    )}
                    <Text style={styles.descripcionPedido}>Realiza el pago y envía tu pedido para confirmarlo al instante.</Text>
                  </View>
                )}

                <TextInput style={styles.campo} placeholder="Notas adicionales (sin ají, cubiertos, etc.)" placeholderTextColor="#6B7280" value={notas} onChangeText={setNotas} />

                <View style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.descripcionPedido}>Subtotal</Text>
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>S/ {subtotal.toFixed(2)}</Text>
                  </View>
                  {tipoEntrega === 'DELIVERY' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.descripcionPedido}>Delivery</Text>
                      <Text style={{ color: '#FFF', fontWeight: '800' }}>S/ {costoDelivery.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDE, paddingTop: 8, marginTop: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>Total</Text>
                    <Text style={{ color: ROJO, fontSize: 18, fontWeight: '900' }}>S/ {totalFinal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={enviarPedido} disabled={cargando}>
                    <Text style={styles.textoBoton}>{cargando ? 'Enviando pedido...' : 'Realizar pedido'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
                          {vista === 'pedidos' && (
          <View>
            <Text style={styles.titulo}>MIS PEDIDOS</Text>
            {!(datosCli.pedidos || []).length ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Aún no has realizado pedidos.</Text>
              </View>
            ) : (
              (datosCli.pedidos || []).map(p => (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
                  <View style={styles.estadoPedido}>
                    <Text style={styles.textoEstado}>{p.estado}</Text>
                  </View>
                  {(p.pedido_detalles || []).map(d => (
                    <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto}</Text>
                  ))}
                  {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#38BDF8', fontWeight: '800' }]}>Repartidor: {p.rider_nombre} ({p.estado_rider})</Text>}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)} ({p.metodo_pago})</Text>
                  {p.estado === 'Confirmado por local' && !p.recibido_cliente && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 10 }]} onPress={() => clienteConfirmaRecepcion(p)} disabled={cargando}>
                      <Text style={styles.textoBoton}>YA RECIBÍ MI PEDIDO (SUMAR PUNTOS)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
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
                <Text style={{ color: DORADO, fontSize: 12, fontWeight: '800' }}>📷 Cambiar foto de perfil</Text>
              </TouchableOpacity>
              <Text style={[styles.nombreProducto, { color: DORADO, fontSize: 18 }]}>{usuario.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Teléfono: {usuario.telefono}</Text>
              <Text style={[styles.precioProducto, { color: DORADO, marginTop: 8 }]}>Saldo actual: {datosCli.puntos} puntos</Text>
            </View>
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
