import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, ScrollView, Image, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import { VistaAdmin } from './admin';
import { PantallaBienvenida, PantallaAcceso, NavegacionSuperior, LOGO } from './pantallas';
import { BannerAviso, mostrarAviso, registrarAlerta } from './avisos';
import {
  obtenerCatalogo, obtenerRecompensas, obtenerPromociones, obtenerConfigPagos,
  crearPedidoCliente, obtenerPedidosCliente, obtenerTodosPedidos, obtenerMovimientosCliente, obtenerCanjesCliente,
  canjearRecompensa, confirmarPedidoAdmin, marcarCompletadoPedido, cancelarPedidoAdmin, obtenerPerfilActualizado
} from './servicios';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('bienvenida');
  const [pantalla, setPantalla] = useState('inicio');
  const [catalogo, setCatalogo] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titular: '' });
  const [pedidos, setPedidos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [tipoEntrega, setTipoEntrega] = useState('DELIVERY');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    registrarAlerta(setAviso);
    AsyncStorage.getItem('sesion_club_sazon').then(s => { if (s) { setUsuario(JSON.parse(s)); setVista('app'); } });
    cargarPublico();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    cargarDatosUsuario(usuario);
    const t = setInterval(() => cargarDatosUsuario(usuario), 5000);
    return () => clearInterval(t);
  }, [usuario?.id]);
  async function cargarPublico() {
    try {
      const [cat, rec, pro, cfg] = await Promise.all([obtenerCatalogo(true), obtenerRecompensas(true), obtenerPromociones(true), obtenerConfigPagos()]);
      setCatalogo(cat || []); setRecompensas(rec || []); setPromociones(pro || []); setCfgPagos(cfg);
    } catch (e) {}
  }

  async function cargarDatosUsuario(u) {
    try {
      const perf = await obtenerPerfilActualizado(u.id);
      if (perf) { setUsuario(perf); await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify(perf)); }
      if (u.rol === 'admin') setPedidos(await obtenerTodosPedidos());
      else {
        const [p, m, c] = await Promise.all([obtenerPedidosCliente(u.id), obtenerMovimientosCliente(u.id), obtenerCanjesCliente(u.id)]);
        setPedidos(p || []); setMovimientos(m || []); setCanjes(c || []);
      }
    } catch (e) {}
  }

  async function iniciarSesionOk(u) {
    await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify(u));
    setUsuario(u); setVista('app'); setPantalla('inicio');
    await cargarDatosUsuario(u);
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('sesion_club_sazon');
    setUsuario(null); setCarrito([]); setVista('bienvenida'); setPantalla('inicio');
  }

  function agregarCarrito(item, esPromo = false) {
    const stockMax = Number(item.stock ?? 10);
    if (stockMax <= 0) return mostrarAviso('Agotado', 'Este producto no tiene stock disponible.');
    setCarrito(prev => {
      const ex = prev.find(x => x.id === item.id && x.esPromo === esPromo);
      if (ex) {
        if (ex.cantidad >= stockMax) { mostrarAviso('Stock límite', `Solo quedan ${stockMax} unidades.`); return prev; }
        return prev.map(x => (x.id === item.id && x.esPromo === esPromo) ? { ...x, cantidad: x.cantidad + 1 } : x);
      }
      return [...prev, { id: item.id, nombre: esPromo ? item.titulo : item.nombre, precio: Number(item.precio), stock: stockMax, esPromo, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, esPromo, delta) {
    setCarrito(prev => prev.map(x => (x.id === id && x.esPromo === esPromo) ? { ...x, cantidad: Math.min(x.stock, x.cantidad + delta) } : x).filter(x => x.cantidad > 0));
  }

  async function enviarPedido() {
    if (!carrito.length) return;
    if (tipoEntrega === 'DELIVERY' && (!distrito.trim() || !direccion.trim())) return mostrarAviso('Faltan datos', 'Ingresa tu distrito y dirección exacta.');
    setCargando(true);
    try {
      const creado = await crearPedidoCliente({ cliente: usuario, items: carrito, tipoEntrega, distrito, direccion, metodoPago, notas });
      setCarrito([]); setNotas(''); setPantalla('pedidos');
      await Promise.all([cargarPublico(), cargarDatosUsuario(usuario)]);
      mostrarAviso('¡Pedido enviado!', `Código ${creado.numero_pedido} registrado. Espera la confirmación del local.`);
    } catch (e) { mostrarAviso('No se pudo enviar', e.message); } finally { setCargando(false); }
  }

  async function ejecutarCanje(rec) {
    setCargando(true);
    try { await canjearRecompensa(usuario, rec); await Promise.all([cargarPublico(), cargarDatosUsuario(usuario)]); mostrarAviso('¡Canje solicitado!', 'Revisa tus puntos y reclama tu premio en el local.'); }
    catch (e) { mostrarAviso('No disponible', e.message); } finally { setCargando(false); }
  }

  async function onConfirmarAdmin(ped, costoDel) {
    setCargando(true);
    try { await confirmarPedidoAdmin(ped, costoDel); await cargarDatosUsuario(usuario); mostrarAviso('Confirmado', 'Pedido aceptado y enviado a cocina/riders.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function onCompletar(ped) {
    setCargando(true);
    try { await marcarCompletadoPedido(ped); await cargarDatosUsuario(usuario); mostrarAviso('Entregado', 'Pedido completado y puntos acreditados al cliente.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function onCancelar(ped) {
    setCargando(true);
    try { await cancelarPedidoAdmin(ped); await Promise.all([cargarPublico(), cargarDatosUsuario(usuario)]); mostrarAviso('Cancelado', 'Pedido cancelado y puntos ajustados.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }
  const categorias = ['Todos', ...new Set(catalogo.map(p => p.categoria))];
  const platosFiltrados = categoriaSel === 'Todos' ? catalogo : catalogo.filter(p => p.categoria === categoriaSel);
  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  if (vista === 'bienvenida') {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <BannerAviso aviso={aviso} cerrar={() => setAviso(null)} />
        <PantallaBienvenida onIngresar={() => setVista('login')} onRegistrar={() => setVista('registro')} />
      </SafeAreaView>
    );
  }
  if (vista === 'login' || vista === 'registro') {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <BannerAviso aviso={aviso} cerrar={() => setAviso(null)} />
        <PantallaAcceso modo={vista} onCambiarModo={setVista} onRegresar={() => setVista('bienvenida')} onExito={iniciarSesionOk} />
      </SafeAreaView>
    );
  }
  if (usuario?.rol === 'admin') {
    return (
      <SafeAreaView style={styles.pantallaCompleta}>
        <BannerAviso aviso={aviso} cerrar={() => setAviso(null)} />
        <VistaAdmin usuario={usuario} pedidos={pedidos} recargar={() => cargarDatosUsuario(usuario)} onConfirmarAdmin={onConfirmarAdmin} onCompletar={onCompletar} onCancelar={onCancelar} cerrarSesion={cerrarSesion} cargando={cargando} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <BannerAviso aviso={aviso} cerrar={() => setAviso(null)} />
      <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
        <NavegacionSuperior regresar={() => setPantalla('inicio')} irAInicio={() => setPantalla('inicio')} />
        <View style={styles.filaSaludo}>
          <View>
            <Text style={styles.saludo}>Hola,</Text>
            <Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text>
          </View>
          <TouchableOpacity onPress={cerrarSesion} style={[styles.boton, styles.botonPequeno, { backgroundColor: '#B71C1C' }]}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>SALIR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tarjetaSaldo}>
          <Text style={styles.etiquetaSaldo}>TUS PUNTOS CLUB SAZÓN</Text>
          <Text style={styles.numeroSaldo}>{usuario?.puntos ?? 0} PTS</Text>
          <Text style={styles.textoSecundarioSaldo}>Gana 10 puntos por cada S/ 1 en tus compras</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
          {[
            { id: 'inicio', txt: '🍽️ MENÚ' },
            { id: 'promos', txt: '🔥 PROMOS' },
            { id: 'carrito', txt: `🛒 CARRITO (${carrito.reduce((a, b) => a + b.cantidad, 0)})` },
            { id: 'pedidos', txt: '📦 MIS PEDIDOS' },
            { id: 'puntos', txt: '🎁 CANJEAR' }
          ].map(m => (
            <TouchableOpacity key={m.id} style={[styles.categoria, pantalla === m.id && styles.categoriaActiva]} onPress={() => setPantalla(m.id)}>
              <Text style={styles.textoCategoria}>{m.txt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {pantalla === 'inicio' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
              {categorias.map(c => (
                <TouchableOpacity key={c} style={[styles.categoria, categoriaSel === c && styles.categoriaActiva]} onPress={() => setCategoriaSel(c)}>
                  <Text style={styles.textoCategoria}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {platosFiltrados.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Nuestro local está cerrado en este momento o no hay platos disponibles en este turno.</Text>
              </View>
            ) : (
              platosFiltrados.map(item => (
                <View key={item.id} style={styles.producto}>
                  <Image source={item.imagen_url && item.imagen_url.includes('supabase.co') ? { uri: item.imagen_url } : LOGO} style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#222' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreProducto}>{item.nombre}</Text>
                    {!!item.ingredientes && <Text style={styles.descripcionPedido}>{item.ingredientes}</Text>}
                    <Text style={styles.precioProducto}>S/ {Number(item.precio).toFixed(2)} • Stock: {item.stock ?? 10}</Text>
                  </View>
                  <TouchableOpacity style={styles.botonAgregar} onPress={() => agregarCarrito(item, false)}>
                    <Text style={styles.textoAgregar}>+ PEDIR</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
        {pantalla === 'promos' && (
          <View>
            <Text style={styles.titulo}>PROMOCIONES Y OFERTAS</Text>
            {promociones.map(pr => (
              <View key={pr.id} style={styles.tarjetaPedido}>
                {pr.imagen_url && pr.imagen_url.includes('supabase.co') && <Image source={{ uri: pr.imagen_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} />}
                <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                {!!pr.descripcion && <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>}
                <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)} • Stock: {pr.stock ?? 10}</Text>
                <TouchableOpacity style={styles.boton} onPress={() => agregarCarrito(pr, true)}>
                  <Text style={styles.textoBoton}>AGREGAR AL CARRITO</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
            {pantalla === 'carrito' && (
          <View>
            <Text style={styles.titulo}>TU PEDIDO</Text>
            {carrito.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Tu carrito está vacío.</Text>
              </View>
            ) : (
              <View>
                {carrito.map(it => (
                  <View key={it.id + String(it.esPromo)} style={styles.producto}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nombreProducto}>{it.nombre}</Text>
                      <Text style={styles.precioProducto}>S/ {(it.precio * it.cantidad).toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity style={styles.botonAgregar} onPress={() => cambiarCantidad(it.id, it.esPromo, -1)}>
                        <Text style={styles.textoAgregar}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.nombreProducto}>{it.cantidad}</Text>
                      <TouchableOpacity style={styles.botonAgregar} onPress={() => cambiarCantidad(it.id, it.esPromo, 1)}>
                        <Text style={styles.textoAgregar}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <Text style={styles.totalPedidoTexto}>Subtotal: S/ {totalCarrito.toFixed(2)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {['DELIVERY', 'RECOJO EN LOCAL'].map(t => (
                    <TouchableOpacity key={t} style={[styles.opcionEntrega, tipoEntrega === t && styles.opcionEntregaActiva, { flex: 1 }]} onPress={() => setTipoEntrega(t)}>
                      <Text style={styles.textoOpcionEntrega}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {tipoEntrega === 'DELIVERY' && (
                  <View>
                    <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Distrito (ej. San Juan de Lurigancho)" placeholderTextColor="#777" value={distrito} onChangeText={setDistrito} />
                    <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Dirección exacta y referencia" placeholderTextColor="#777" value={direccion} onChangeText={setDireccion} />
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {['Yape', 'Plin', 'Efectivo'].map(mp => (
                    <TouchableOpacity key={mp} style={[styles.opcionEntrega, metodoPago === mp && styles.opcionEntregaActiva, { flex: 1 }]} onPress={() => setMetodoPago(mp)}>
                      <Text style={styles.textoOpcionEntrega}>{mp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {(metodoPago === 'Yape' || metodoPago === 'Plin') && (
                  <View style={[styles.tarjetaPedido, { marginTop: 10, alignItems: 'center' }]}>
                    <Text style={styles.nombreProducto}>Titular: {cfgPagos.titular || 'Club Sazón'}</Text>
                    {metodoPago === 'Yape' && !!cfgPagos.qr_yape && <Image source={{ uri: cfgPagos.qr_yape }} style={{ width: 180, height: 180, borderRadius: 10, marginTop: 8 }} />}
                    {metodoPago === 'Plin' && !!cfgPagos.qr_plin && <Image source={{ uri: cfgPagos.qr_plin }} style={{ width: 180, height: 180, borderRadius: 10, marginTop: 8 }} />}
                  </View>
                )}
                <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Notas adicionales (opcional)" placeholderTextColor="#777" value={notas} onChangeText={setNotas} />
                <TouchableOpacity style={styles.boton} onPress={enviarPedido} disabled={cargando}>
                  <Text style={styles.textoBoton}>{cargando ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        {pantalla === 'pedidos' && (
          <View>
            <Text style={styles.titulo}>MIS PEDIDOS</Text>
            {pedidos.map(p => (
              <View key={p.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>Pedido {p.numero_pedido} — S/ {Number(p.total).toFixed(2)}</Text>
                <View style={styles.estadoPedido}>
                  <Text style={styles.textoEstado}>{p.estado}</Text>
                </View>
                {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#29B6F6', fontWeight: '700' }]}>🛵 Repartidor: {p.rider_nombre} ({p.estado_rider})</Text>}
                {(p.pedido_detalles || []).map(d => (
                  <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto}</Text>
                ))}
              </View>
            ))}
          </View>
        )}
        {pantalla === 'puntos' && (
          <View>
            <Text style={styles.titulo}>CANJEAR PUNTOS</Text>
            {recompensas.map(r => (
              <View key={r.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>🎁 {r.titulo} ({r.puntos_requeridos} PTS)</Text>
                {!!r.descripcion && <Text style={styles.descripcionPedido}>{r.descripcion}</Text>}
                <TouchableOpacity style={styles.boton} onPress={() => ejecutarCanje(r)} disabled={cargando}>
                  <Text style={styles.textoBoton}>CANJEAR PREMIO</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={[styles.titulo, { marginTop: 12 }]}>MIS CANJES Y MOVIMIENTOS</Text>
            {canjes.map(c => (
              <View key={c.id} style={styles.producto}>
                <Text style={styles.nombreProducto}>{c.recompensa_titulo}</Text>
                <Text style={styles.precioProducto}>{c.estado}</Text>
              </View>
            ))}
            {movimientos.map(m => (
              <View key={m.id} style={styles.producto}>
                <Text style={styles.descripcionPedido}>{m.descripcion}</Text>
                <Text style={styles.precioProducto}>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad} pts</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
                  }
                  
