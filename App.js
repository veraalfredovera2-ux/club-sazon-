import React, { useState, useEffect } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import { VistaBienvenida, VistaRegistro, VistaIngreso } from './pantallas';
import { VistaInicio } from './vistas';
import { VistaCarrito, VistaPanel } from './avisos';
import { VistaAdmin } from './admin';
import {
  obtenerCatalogo, obtenerRecompensas, obtenerDatosCliente,
  obtenerPedidosAdmin, registrarUsuario, ingresarUsuario,
  crearNuevoPedido, confirmarAdminPedido, confirmarRecepcionYDarPuntos,
  cancelarPedidoYDescontar, canjearRecompensaCliente, obtenerConfigPagos
} from './servicios';

export default function App() {
  const [pantalla, setPantalla] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [tipoUsuario, setTipoUsuario] = useState(null);
  const [productos, setProductos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titular: 'Club Sazón' });
  const [datos, setDatos] = useState({ puntos: 0, historial: [], pedidos: [], canjes: [] });
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [cargando, setCargando] = useState(false);

  useEffect(() => { iniciar(); }, []);

  async function iniciar() {
    try {
      const [cat, rec, cfg, ses] = await Promise.all([
        obtenerCatalogo(true), obtenerRecompensas(true), obtenerConfigPagos(),
        AsyncStorage.getItem('sesion_club_sazon')
      ]);
      setProductos(cat || []);
      setRecompensas(rec || []);
      if (cfg) setCfgPagos(cfg);
      if (ses) {
        const s = JSON.parse(ses);
        if (s?.perfil && s?.tipo) {
          setUsuario(s.perfil);
          setTipoUsuario(s.tipo);
          if (s.tipo === 'administrador') { setPedidosAdmin(await obtenerPedidosAdmin()); setPantalla('admin'); }
          else { setDatos(await obtenerDatosCliente(s.perfil.id)); setPantalla('inicio'); }
        }
      }
    } catch (e) {}
  }

  async function recargarTodo() {
    try {
      const [cat, rec, cfg] = await Promise.all([obtenerCatalogo(true), obtenerRecompensas(true), obtenerConfigPagos()]);
      setProductos(cat || []);
      setRecompensas(rec || []);
      if (cfg) setCfgPagos(cfg);
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
      await canjearRecompensaCliente(usuario.id, rec);
      await recargarTodo();
      Alert.alert('¡Canje solicitado!', 'Tu premio quedó registrado. Muéstralo en el local para recibirlo.');
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
    try { await AsyncStorage.removeItem('sesion_club_sazon'); } catch (e) {}
    setUsuario(null); setTipoUsuario(null); setCarrito([]); setPantalla('bienvenida');
  }

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      {pantalla === 'bienvenida' && <VistaBienvenida irARegistro={() => setPantalla('registro')} irAIngreso={() => setPantalla('ingreso')} />}
      {pantalla === 'registro' && <VistaRegistro onRegistrar={manejarRegistro} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
      {pantalla === 'ingreso' && <VistaIngreso onIngresar={manejarIngreso} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
      {pantalla === 'inicio' && <VistaInicio usuario={usuario} datos={datos} productos={productos} recompensas={recompensas} carrito={carrito} setCarrito={setCarrito} categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} onCanjear={manejarCanje} onRecibido={manejarCompletar} cerrarSesion={cerrarSesion} irAPanel={() => setPantalla('panel')} irACarrito={() => setPantalla('carrito')} cargando={cargando} />}
      {pantalla === 'panel' && <VistaPanel usuario={usuario} datos={datos} regresar={() => setPantalla('inicio')} />}
      {pantalla === 'carrito' && <VistaCarrito usuario={usuario} carrito={carrito} setCarrito={setCarrito} cfgPagos={cfgPagos} onConfirmarPedido={manejarPedido} regresar={() => setPantalla('inicio')} cargando={cargando} />}
      {pantalla === 'admin' && <VistaAdmin usuario={usuario} pedidos={pedidosAdmin} recargar={recargarTodo} onConfirmarAdmin={manejarConfirmarAdmin} onCompletar={manejarCompletar} onCancelar={manejarCancelar} cerrarSesion={cerrarSesion} cargando={cargando} />}
    </SafeAreaView>
  );
}
