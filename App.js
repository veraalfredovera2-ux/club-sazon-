import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, ROJO, TARJETA, BORDE } from './estilos';
import { NavegacionSuperior, BarraInferiorCliente, PantallaBienvenida, PantallaLogin, PantallaRegistro, PantallaRecuperar, LOGO, BANNER_COMIDA } from './pantallas';
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

export default function App() {
  const [pantallaAuth, setPantallaAuth] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
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
      }
    });
    cargarBase();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    cargarTodoUsuario();
    const t = setInterval(cargarTodoUsuario, 5000);
    return () => clearInterval(t);
  }, [usuario?.id, rol]);

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
    { id: 'menu', icono: '🍴', titulo: 'Menú' },
    { id: 'promos', icono: '🔥', titulo: 'Promociones' },
    { id: 'ofertas', icono: '🏷️', titulo: 'Ofertas' },
    { id: 'puntos', icono: '★', titulo: 'Puntos' },
    { id: 'canjes', icono: '🎁', titulo: 'Canjes' },
    { id: 'carrito', icono: '🛒', titulo: `Carrito (${carrito.reduce((a, x) => a + x.cantidad, 0)})` },
    { id: 'pedidos', icono: '📋', titulo: 'Pedidos' },
    { id: 'cuenta', icono: '👤', titulo: 'Mi cuenta' },
    { id: 'salir', icono: '🚪', titulo: 'Cerrar sesión' }
  ];

  const prodFiltrados = catActiva === 'Todas'
    ? catalogo
    : catalogo.filter(p => (p.categoria || '').toLowerCase() === catActiva.toLowerCase());

  const cantTotalCarrito = carrito.reduce((a, x) => a + x.cantidad, 0);

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <VentanaAviso />
      <ScrollView contentContainerStyle={styles.contenido}>
        <NavegacionSuperior
          regresar={vista !== 'inicio' ? () => setVista('inicio') : null}
          irAInicio={() => setVista('inicio')}
          puntos={datosCli.puntos}
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
            <View style={styles.filaSaludo}>
              <View>
                <Text style={styles.saludo}>Hola, {usuario.nombre_completo?.split(' ').at(0) || 'Cliente'} 👋</Text>
                <Text style={styles.nombreCliente}>¿Qué se te antoja hoy?</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.bannerHero} onPress={() => setVista('promos')}>
              <Image source={BANNER_COMIDA} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(11,11,15,0.78)', padding: 10 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>EL SAZÓN ORIENTAL • Comida rápida y casera</Text>
                <Text style={{ color: ROJO, fontWeight: '800', fontSize: 11 }}>Toca aquí para ver promociones del día →</Text>
              </View>
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
                    <Text style={{ fontSize: 20, color: ROJO }}>{item.icono}</Text>
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
                      style={{ width: '100%', height: 140 }}
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
              <Text style={styles.numeroSaldo}>{datosCli.puntos} pts</Text>
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
                    <Text style={[styles.precioProducto, { color: ROJO }]}>{rec.puntos_requeridos} pts • Stock: {rec.stock ?? 5}</Text>
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
                  <Text style={{ color: Number(h.cantidad) >= 0 ? '#4CAF50' : ROJO, fontWeight: '900' }}>
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
            <View style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{usuario.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Teléfono: {usuario.telefono}</Text>
              <Text style={[styles.precioProducto, { color: ROJO, marginTop: 8 }]}>Saldo actual: {datosCli.puntos} puntos</Text>
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
