import React, { useState, useEffect } from 'react';
import { SafeAreaView, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import {
  obtenerCatalogo, obtenerRecompensas, obtenerDatosCliente,
  obtenerPedidosAdmin, registrarUsuario, ingresarUsuario,
  crearNuevoPedido, confirmarAdminPedido, confirmarRecepcionYDarPuntos,
  cancelarPedidoYDescontar, canjearRecompensaCliente, obtenerConfigPagos
} from './servicios';
import { VistaBienvenida, VistaRegistro, VistaIngreso } from './pantallas';
import { VistaInicio } from './vistas';
import { VistaCarrito, VistaPanel } from './avisos';
import { VistaAdmin } from './admin';

const CLAVE_SESION = 'club_sazon_sesion_v2';

export default function App() {
  const [pantalla, setPantalla] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [tipoUsuario, setTipoUsuario] = useState(null);
  const [datos, setDatos] = useState({ puntos: 0, historial: [], pedidos: [], canjes: [] });
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [productos, setProductos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titular: 'Club Sazón' });
  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [cargando, setCargando] = useState(false);

  useEffect(() => { iniciarApp(); }, []);

  async function iniciarApp() {
    await cargarCatalogos();
    try {
      const guardada = await AsyncStorage.getItem(CLAVE_SESION);
      if (guardada) {
        const s = JSON.parse(guardada);
        if (s?.perfil && s?.tipo) {
          setUsuario(s.perfil);
          setTipoUsuario(s.tipo);
          if (s.tipo === 'administrador') {
            setPedidosAdmin(await obtenerPedidosAdmin());
            setPantalla('admin');
          } else {
            setDatos(await obtenerDatosCliente(s.perfil.id));
            setPantalla('inicio');
          }
        }
      }
    } catch (e) {}
  }

  async function cargarCatalogos() {
    try {
      const [p, r, c] = await Promise.all([obtenerCatalogo(true), obtenerRecompensas(true), obtenerConfigPagos()]);
      setProductos(p || []);
      setRecompensas(r || []);
      setCfgPagos(c);
    } catch (e) {}
  }

  async function refrescarDatos(u = usuario, t = tipoUsuario) {
    if (!u) return;
    try {
      if (t === 'administrador') setPedidosAdmin(await obtenerPedidosAdmin());
      else setDatos(await obtenerDatosCliente(u.id));
    } catch (e) {}
  }

  async function manejarRegistro(form) {
    setCargando(true);
    try {
      const res = await registrarUsuario(form);
      setUsuario(res.perfil);
      setTipoUsuario('cliente');
      await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify({ tipo: 'cliente', perfil: res.perfil }));
      setDatos(await obtenerDatosCliente(res.perfil.id));
      setPantalla('inicio');
      Alert.alert('¡Bienvenido!', res.mensaje);
    } catch (e) { Alert.alert('Aviso', e.message); }
    setCargando(false);
  }

  async function manejarIngreso(form) {
    setCargando(true);
    try {
      const res = await ingresarUsuario(form);
      setUsuario(res.perfil);
      setTipoUsuario(res.tipo);
      await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify({ tipo: res.tipo, perfil: res.perfil }));
      if (res.tipo === 'administrador') {
        setPedidosAdmin(await obtenerPedidosAdmin());
        setPantalla('admin');
      } else {
        setDatos(await obtenerDatosCliente(res.perfil.id));
        setPantalla('inicio');
      }
    } catch (e) { Alert.alert('Error', e.message); }
    setCargando(false);
  }

  async function manejarCrearPedido(pedidoData) {
    setCargando(true);
    try {
      const ped = await crearNuevoPedido(pedidoData, carrito);
      setCarrito([]);
      await refrescarDatos();
      setPantalla('inicio');
      Alert.alert('Pedido enviado', 'Tu pedido ' + ped.numero_pedido + ' fue registrado.');
    } catch (e) { Alert.alert('Error', e.message); }
    setCargando(false);
  }

  async function manejarCanje(rec) {
    setCargando(true);
    try {
      await canjearRecompensaCliente(usuario.id, rec);
      await refrescarDatos();
      Alert.alert('¡Canje solicitado!', 'Tu premio "' + rec.titulo + '" quedó registrado. Muéstralo en caja o recíbelo en tu entrega.');
    } catch (e) { Alert.alert('Error', e.message); }
    setCargando(false);
  }

  async function manejarConfirmarAdmin(ped, costoDel) {
    setCargando(true);
    try { await confirmarAdminPedido(ped, costoDel); await refrescarDatos(); } catch (e) { Alert.alert('Error', e.message); }
    setCargando(false);
  }

  async function manejarCompletar(ped) {
    setCargando(true);
    try {
      const pts = await confirmarRecepcionYDarPuntos(ped);
      await refrescarDatos();
      if (pts > 0) Alert.alert('¡Listo!', 'Pedido completado. Se sumaron ' + pts + ' puntos.');
    } catch (e) { Alert.alert('Error', e.message); }
    setCargando(false);
  }

  async function manejarCancelar(ped) {
    setCargando(true);
    try {
      const desc = await cancelarPedidoYDescontar(ped);
      await refrescarDatos();
      Alert.alert('Pedido cancelado', desc > 0 ? 'Se descontaron ' + desc + ' puntos al cliente.' : 'El pedido fue cancelado.');
    } catch (e) { Alert.alert('Error', e.message); }
    setCargando(false);
  }

  async function cerrarSesion() {
    try { await AsyncStorage.removeItem(CLAVE_SESION); } catch (e) {}
    setUsuario(null);
    setTipoUsuario(null);
    setCarrito([]);
    setPantalla('bienvenida');
  }

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      {pantalla === 'bienvenida' && <VistaBienvenida irARegistro={() => setPantalla('registro')} irAIngreso={() => setPantalla('ingreso')} />}
      {pantalla === 'registro' && <VistaRegistro onRegistrar={manejarRegistro} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
      {pantalla === 'ingreso' && <VistaIngreso onIngresar={manejarIngreso} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
      {pantalla === 'inicio' && (
        <VistaInicio
          usuario={usuario} datos={datos} productos={productos} recompensas={recompensas}
          carrito={carrito} setCarrito={setCarrito} categoriaActiva={categoriaActiva}
          setCategoriaActiva={setCategoriaActiva} onCanjear={manejarCanje}
          onRecibido={manejarCompletar} cerrarSesion={cerrarSesion}
          irAPanel={() => setPantalla('panel')} irACarrito={() => setPantalla('carrito')}
          cargando={cargando}
        />
      )}
      {pantalla === 'carrito' && (
        <VistaCarrito
          usuario={usuario} carrito={carrito} setCarrito={setCarrito} cfgPagos={cfgPagos}
          onConfirmarPedido={manejarCrearPedido} regresar={() => setPantalla('inicio')}
          cargando={cargando}
        />
      )}
      {pantalla === 'panel' && <VistaPanel usuario={usuario} datos={datos} regresar={() => setPantalla('inicio')} />}
      {pantalla === 'admin' && (
        <VistaAdmin
          usuario={usuario} pedidos={pedidosAdmin} recargar={() => refrescarDatos()}
          onConfirmarAdmin={manejarConfirmarAdmin} onCompletar={manejarCompletar}
          onCancelar={manejarCancelar} cerrarSesion={cerrarSesion} cargando={cargando}
        />
      )}
    </SafeAreaView>
  );
}
