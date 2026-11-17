import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import * as S from './servicios';
import { VistaBienvenida, VistaRegistro, VistaIngreso, VistaInicioCliente, VistaMenu } from './pantallas';
import { VistaCarrito, VistaPedidos, VistaPuntos, VistaCuenta, BarraInferior } from './vistas';
import { VistaAdmin } from './admin';

const TELEFONOS_ADMIN = ['967738806', '967142393'];

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState('bienvenida');
  const [hist, setHist] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [proc, setProc] = useState(false);
  const [form, setForm] = useState({ nombre: '', tel: '', pass: '', distrito: '', dir: '' });
  const [datos, setDatos] = useState({ prods: [], recs: [], pts: 0, movs: [], peds: [], adminPeds: [], cfgPagos: {} });
  const [cat, setCat] = useState('Todas');
  const [carrito, setCarrito] = useState([]);
  const [entrega, setEntrega] = useState('DELIVERY');
  const [pago, setPago] = useState('Yape');

  useEffect(() => { iniciar(); }, []);

  async function iniciar() {
    try {
      const u = await AsyncStorage.getItem('club_sazon_usuario');
      const a = await AsyncStorage.getItem('club_sazon_admin');
      if (u) {
        const user = JSON.parse(u);
        const adm = a === 'true' || TELEFONOS_ADMIN.includes(String(user.telefono || '').replace(/\D/g, ''));
        setUsuario(user); setEsAdmin(adm);
        if (adm) { setPantalla('admin'); await cargarAdmin(); }
        else { setPantalla('inicio'); await cargarCliente(user.id); }
      }
    } catch (e) {}
    setCargando(false);
  }

  async function cargarCliente(id) {
    const [prods, d, recs, cfg] = await Promise.all([S.obtenerCatalogo(true), S.obtenerDatosCliente(id), S.obtenerRecompensas(true), S.obtenerConfigPagos()]);
    setDatos(prev => ({ ...prev, prods: prods || [], pts: d.puntos || 0, movs: d.historial || [], peds: d.pedidos || [], recs: recs || [], cfgPagos: cfg || {} }));
  }

  async function cargarAdmin() {
    const adminPeds = await S.obtenerPedidosAdmin();
    setDatos(prev => ({ ...prev, adminPeds: adminPeds || [] }));
  }

  const ir = (p) => { setHist(h => [...h, pantalla]); setPantalla(p); };
  const atras = () => { if (hist.length) { setPantalla(hist.at(-1)); setHist(h => h.slice(0, -1)); } else setPantalla(usuario ? (esAdmin ? 'admin' : 'inicio') : 'bienvenida'); };

  async function registrar() {
    if (!form.nombre.trim() || !form.tel.trim() || !form.pass.trim()) return Alert.alert('Faltan datos', 'Completa todos los campos.');
    setProc(true);
    try {
      const r = await S.registrarCliente({ nombreCompleto: form.nombre.trim(), telefono: form.tel.trim(), password: form.pass.trim() });
      const adm = TELEFONOS_ADMIN.includes(String(r.perfil?.telefono || '').replace(/\D/g, ''));
      await AsyncStorage.setItem('club_sazon_usuario', JSON.stringify(r.perfil));
      await AsyncStorage.setItem('club_sazon_admin', adm ? 'true' : 'false');
      setUsuario(r.perfil); setEsAdmin(adm); setForm({ nombre: '', tel: '', pass: '', distrito: '', dir: '' });
      if (adm) { await cargarAdmin(); setPantalla('admin'); }
      else { await cargarCliente(r.perfil.id); setPantalla('inicio'); }
      Alert.alert('¡Bienvenido!', r.mensaje);
    } catch (e) { Alert.alert('Error', e.message); }
    setProc(false);
  }

  async function ingresar() {
    if (!form.tel.trim() || !form.pass.trim()) return Alert.alert('Faltan datos', 'Ingresa teléfono y contraseña.');
    setProc(true);
    try {
      const r = await S.ingresarUsuario({ telefono: form.tel.trim(), password: form.pass.trim() });
      const telLimpio = String(r.perfil?.telefono || form.tel).replace(/\D/g, '');
      const adm = r.tipo === 'administrador' || TELEFONOS_ADMIN.includes(telLimpio);
      await AsyncStorage.setItem('club_sazon_usuario', JSON.stringify(r.perfil));
      await AsyncStorage.setItem('club_sazon_admin', adm ? 'true' : 'false');
      setUsuario(r.perfil); setEsAdmin(adm); setForm({ nombre: '', tel: '', pass: '', distrito: '', dir: '' });
      if (adm) { await cargarAdmin(); setPantalla('admin'); }
      else { await cargarCliente(r.perfil.id); setPantalla('inicio'); }
    } catch (e) { Alert.alert('Acceso denegado', e.message); }
    setProc(false);
  }

  async function salir() {
    await AsyncStorage.multiRemove(['club_sazon_usuario', 'club_sazon_admin']);
    setUsuario(null); setEsAdmin(false); setCarrito([]); setPantalla('bienvenida');
  }
  const agregar = (p) => {
    setCarrito(c => c.find(i => i.id === p.id) ? c.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...c, { ...p, cantidad: 1 }]);
    Alert.alert('Agregado', p.nombre + ' añadido al carrito.');
  };

  const cant = (id, d) => setCarrito(c => c.map(i => i.id === id ? { ...i, cantidad: i.cantidad + d } : i).filter(i => i.cantidad > 0));

  async function pedir(pagoConfirmado) {
    if (!carrito.length) return;
    if (entrega === 'DELIVERY' && (!form.distrito.trim() || !form.dir.trim())) return Alert.alert('Falta dirección', 'Ingresa distrito y dirección.');
    setProc(true);
    try {
      const sub = carrito.reduce((a, i) => a + Number(i.precio) * i.cantidad, 0);
      const num = 'CS-' + Math.floor(100000 + Math.random() * 900000);
      await S.crearNuevoPedido({
        numero_pedido: num, cliente_id: usuario.id, tipo_entrega: entrega,
        distrito: entrega === 'DELIVERY' ? form.distrito : null,
        direccion: entrega === 'DELIVERY' ? form.dir : null,
        metodo_pago: pago, pago_confirmado: Boolean(pagoConfirmado),
        subtotal: sub, costo_delivery: 0, total: sub, estado: 'Pendiente de confirmación'
      }, carrito);
      setCarrito([]); await cargarCliente(usuario.id); setPantalla('pedidos');
      Alert.alert('¡Pedido enviado!', 'Pedido ' + num + ' recibido. Espera confirmación del local.');
    } catch (e) { Alert.alert('Error', e.message); }
    setProc(false);
  }

  async function canjear(rec) {
    if (datos.pts < rec.puntos_requeridos) return Alert.alert('Puntos insuficientes', 'Necesitas ' + rec.puntos_requeridos + ' puntos.');
    setProc(true);
    try {
      await S.canjearRecompensaCliente(usuario.id, rec);
      await cargarCliente(usuario.id);
      Alert.alert('¡Canje exitoso!', 'Canjeaste: ' + rec.titulo);
    } catch (e) { Alert.alert('Error', e.message); }
    setProc(false);
  }

  async function confirmarAdmin(ped, costoDel) {
    setProc(true);
    try {
      await S.confirmarAdminPedido(ped, costoDel);
      await cargarAdmin();
      Alert.alert('Confirmado', 'Pedido confirmado y monto actualizado.');
    } catch (e) { Alert.alert('Error', e.message); }
    setProc(false);
  }

  async function recibirYDarPuntos(ped, desdeAdmin) {
    setProc(true);
    try {
      const p = await S.confirmarRecepcionYDarPuntos(ped);
      if (desdeAdmin) await cargarAdmin(); else await cargarCliente(usuario.id);
      Alert.alert('¡Pedido completado!', 'Se acreditaron ' + p + ' puntos.');
    } catch (e) { Alert.alert('Error', e.message); }
    setProc(false);
  }

  async function cancelar(ped, desdeAdmin) {
    setProc(true);
    try {
      const desc = await S.cancelarPedidoYDescontar(ped);
      if (desdeAdmin) await cargarAdmin(); else await cargarCliente(usuario.id);
      Alert.alert('Pedido cancelado', desc > 0 ? 'Se descontaron ' + desc + ' puntos por la cancelación.' : 'El pedido fue cancelado.');
    } catch (e) { Alert.alert('Error', e.message); }
    setProc(false);
  }

  if (cargando) return <View style={[styles.fondo, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#B81D24" /></View>;

  return (
    <View style={styles.fondo}>
      {pantalla === 'bienvenida' && <VistaBienvenida irARegistro={() => ir('registro')} irAIngreso={() => ir('ingreso')} />}
      {pantalla === 'registro' && <VistaRegistro nombre={form.nombre} setNombre={v => setForm({ ...form, nombre: v })} telefono={form.tel} setTelefono={v => setForm({ ...form, tel: v })} password={form.pass} setPassword={v => setForm({ ...form, pass: v })} onRegistrar={registrar} irAIngreso={() => ir('ingreso')} regresar={atras} irAInicio={() => setPantalla('bienvenida')} cargando={proc} />}
      {pantalla === 'ingreso' && <VistaIngreso telefono={form.tel} setTelefono={v => setForm({ ...form, tel: v })} password={form.pass} setPassword={v => setForm({ ...form, pass: v })} onIngresar={ingresar} irARegistro={() => ir('registro')} regresar={atras} irAInicio={() => setPantalla('bienvenida')} cargando={proc} />}
      {pantalla === 'inicio' && <VistaInicioCliente usuario={usuario} puntos={datos.pts} irA={ir} cerrarSesion={salir} />}
      {pantalla === 'menu' && <VistaMenu productos={datos.prods} categoriaActiva={cat} setCategoriaActiva={setCat} agregarAlCarrito={agregar} regresar={atras} irAInicio={() => setPantalla('inicio')} />}
      {pantalla === 'carrito' && <VistaCarrito carrito={carrito} cambiarCantidad={cant} entrega={entrega} setEntrega={setEntrega} distrito={form.distrito} setDistrito={v => setForm({ ...form, distrito: v })} direccion={form.dir} setDireccion={v => setForm({ ...form, dir: v })} pago={pago} setPago={setPago} cfgPagos={datos.cfgPagos} confirmarPedido={pedir} cargando={proc} regresar={atras} irAInicio={() => setPantalla('inicio')} />}
      {pantalla === 'pedidos' && <VistaPedidos pedidos={datos.peds} onRecibirPedido={p => recibirYDarPuntos(p, false)} onCancelarPedido={p => cancelar(p, false)} cargando={proc} regresar={atras} irAInicio={() => setPantalla('inicio')} />}
      {pantalla === 'puntos' && <VistaPuntos puntos={datos.pts} historial={datos.movs} recompensas={datos.recs} onCanjear={canjear} cargando={proc} regresar={atras} irAInicio={() => setPantalla('inicio')} />}
      {pantalla === 'cuenta' && <VistaCuenta usuario={usuario} cerrarSesion={salir} regresar={atras} irAInicio={() => setPantalla('inicio')} />}
      {pantalla === 'admin' && <VistaAdmin usuario={usuario} pedidos={datos.adminPeds} recargar={cargarAdmin} onConfirmarAdmin={confirmarAdmin} onCompletar={p => recibirYDarPuntos(p, true)} onCancelar={p => cancelar(p, true)} cerrarSesion={salir} cargando={proc} />}
      {usuario && !esAdmin && ['inicio', 'menu', 'carrito', 'pedidos', 'puntos', 'cuenta'].includes(pantalla) && <BarraInferior pantalla={pantalla} irA={ir} cantidadCarrito={carrito.reduce((a, i) => a + i.cantidad, 0)} />}
    </View>
  );
       }
        
