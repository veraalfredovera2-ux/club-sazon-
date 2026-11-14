import React, { useState, useEffect } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import { PantallaBienvenida, PantallaRegistro, PantallaIngreso, PantallaPanel, PantallaCarrito } from './pantallas';
import { VistaInicio } from './vistas';
import { VistaAdmin } from './admin';
import { obtenerCatalogo, obtenerRecompensas, obtenerDatosCliente, obtenerPedidosAdmin, registrarUsuario, ingresarUsuario, crearNuevoPedido, confirmarAdminPedido, confirmarRecepcionYDarPuntos, cancelarPedidoYDescontar } from './servicios';

export default function App() {
  const [pantalla, setPantalla] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [tipoUsuario, setTipoUsuario] = useState(null);
  const [productos, setProductos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [datos, setDatos] = useState({ puntos: 0, historial: [], pedidos: [], canjes: [] });
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [cargando, setCargando] = useState(false);

  useEffect(() => { iniciar(); }, []);

  async function iniciar() {
    try {
      const [cat, rec, ses] = await Promise.all([obtenerCatalogo(true), obtenerRecompensas(true), AsyncStorage.getItem('sesion_club_sazon')]);
      setProductos(cat || []);
      setRecompensas(rec || []);
      if (ses) {
        const s = JSON.parse(ses);
        setUsuario(s.perfil);
        setTipoUsuario(s.tipo);
        if (s.tipo === 'administrador') { setPedidosAdmin(await obtenerPedidosAdmin()); setPantalla('admin'); }
        else { setDatos(await obtenerDatosCliente(s.perfil.id)); setPantalla('inicio'); }
      }
    } catch (e) {}
  }

  async function recargarTodo() {
    try {
      const [cat, rec] = await Promise.all([obtenerCatalogo(true), obtenerRecompensas(true)]);
      setProductos(cat || []);
      setRecompensas(rec || []);
      if (tipoUsuario === 'administrador') setPedidosAdmin(await obtenerPedidosAdmin());
      else if (usuario?.id) setDatos(await obtenerDatosCliente(usuario.id));
    } catch (e) {}
  }

  async function manejarRegistro(form) {
    setCargando(true);
    try {
      const r = await registrarUsuario(form);
      await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify({ tipo: 'cliente', perfil: r.perfil }));
      setUsuario(r.perfil); setTipoUsuario('cliente');
      setDatos(await obtenerDatosCliente(r.perfil.id));
      setPantalla('inicio');
      Alert.alert('¡Bienvenido!', r.mensaje);
    } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarIngreso(form) {
    setCargando(true);
    try {
      const r = await ingresarUsuario(form);
      await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify(r));
      setUsuario(r.perfil); setTipoUsuario(r.tipo);
      if (r.tipo === 'administrador') { setPedidosAdmin(await obtenerPedidosAdmin()); setPantalla('admin'); }
      else { setDatos(await obtenerDatosCliente(r.perfil.id)); setPantalla('inicio'); }
    } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarCanje(rec) {
    setCargando(true);
    try {
      const { canjearRecompensaCliente } = require('./servicios');
      await canjearRecompensaCliente(usuario.id, rec);
      await recargarTodo();
      Alert.alert('¡Canje solicitado!', 'Muestra este canje en el local para recibir tu premio.');
    } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarPedido(pedidoData) {
    setCargando(true);
    try {
      await crearNuevoPedido({ ...pedidoData, cliente_id: usuario.id }, carrito);
      setCarrito([]);
      await recargarTodo();
      setPantalla('inicio');
      Alert.alert('¡Pedido enviado!', 'Tu pedido fue enviado al local.');
    } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarConfirmarAdmin(ped, del) {
    setCargando(true);
    try { await confirmarAdminPedido(ped, del); await recargarTodo(); } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarCompletar(ped) {
    setCargando(true);
    try {
      const pts = await confirmarRecepcionYDarPuntos(ped);
      await recargarTodo();
      Alert.alert('¡Completado!', pts > 0 ? 'Se acreditaron +' + pts + ' puntos al cliente.' : 'Pedido completado.');
    } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarCancelar(ped) {
    setCargando(true);
    try {
      const restados = await cancelarPedidoYDescontar(ped);
      await recargarTodo();
      Alert.alert('Pedido cancelado', restados > 0 ? 'Se descontaron ' + restados + ' puntos al cliente.' : 'Pedido cancelado correctamente.');
    } catch (e) { Alert.alert('Error', e.message); } finally { setCargando(false); }
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('sesion_club_sazon');
    setUsuario(null); setTipoUsuario(null); setCarrito([]); setPantalla('bienvenida');
  }

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      {pantalla === 'bienvenida' && <PantallaBienvenida irARegistro={() => setPantalla('registro')} irAIngreso={() => setPantalla('ingreso')} />}
      {pantalla === 'registro' && <PantallaRegistro onRegistrar={manejarRegistro} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
      {pantalla === 'ingreso' && <PantallaIngreso onIngresar={manejarIngreso} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
      {pantalla === 'inicio' && <VistaInicio usuario={usuario} datos={datos} productos={productos} recompensas={recompensas} carrito={carrito} setCarrito={setCarrito} categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} onCanjear={manejarCanje} onRecibido={manejarCompletar} cerrarSesion={cerrarSesion} irAPanel={() => setPantalla('panel')} irACarrito={() => setPantalla('carrito')} cargando={cargando} />}
      {pantalla === 'panel' && <PantallaPanel usuario={usuario} datos={datos} regresar={() => setPantalla('inicio')} />}
      {pantalla === 'carrito' && <PantallaCarrito carrito={carrito} setCarrito={setCarrito} onConfirmarPedido={manejarPedido} regresar={() => setPantalla('inicio')} cargando={cargando} />}
      {pantalla === 'admin' && <VistaAdmin usuario={usuario} pedidos={pedidosAdmin} recargar={recargarTodo} onConfirmarAdmin={manejarConfirmarAdmin} onCompletar={manejarCompletar} onCancelar={manejarCancelar} cerrarSesion={cerrarSesion} cargando={cargando} />}
    </SafeAreaView>
  );
}
