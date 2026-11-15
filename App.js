import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import { VistaBienvenida, VistaRegistro } from './pantallas';
import { VistaInicio } from './vistas';
import { VistaCarrito, VistaPanel, BannerAviso, registrarAvisoGlobal, mostrarAviso } from './avisos';
import { VistaAdmin } from './admin';
import {
  obtenerCatalogo, obtenerRecompensas, obtenerDatosCliente,
  obtenerPedidosAdmin, registrarUsuario, ingresarUsuario,
  crearNuevoPedido, confirmarAdminPedido, confirmarRecepcionYDarPuntos,
  cancelarPedidoYDescontar, canjearRecompensaCliente, obtenerConfigPagos
} from './servicios';

export default function App() {
  const [aviso, setAviso] = useState(null);
  const [pantalla, setPantalla] = useState('bienvenida');
  const [navInfo, setNavInfo] = useState({ tab: 'inicio', seq: 0 });
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

  useEffect(() => { registrarAvisoGlobal(setAviso); iniciar(); }, []);

  async function iniciar() {
    try {
      const [cat, rec, cfg, ses] = await Promise.all([obtenerCatalogo(false), obtenerRecompensas(false), obtenerConfigPagos(), AsyncStorage.getItem('sesion_club_sazon')]);
      setProductos(cat || []); setRecompensas(rec || []);
      if (cfg) setCfgPagos(cfg);
      if (ses) {
        const s = JSON.parse(ses);
        if (s?.perfil && s?.tipo) {
          setUsuario(s.perfil); setTipoUsuario(s.tipo);
          if (s.tipo === 'administrador') { setPedidosAdmin(await obtenerPedidosAdmin()); setPantalla('admin'); }
          else { setDatos(await obtenerDatosCliente(s.perfil.id)); irATabCliente('inicio'); }
        }
      }
    } catch (e) {}
  }

  async function recargarTodo() {
    try {
      const [cat, rec, cfg] = await Promise.all([obtenerCatalogo(false), obtenerRecompensas(false), obtenerConfigPagos()]);
      setProductos(cat || []); setRecompensas(rec || []);
      if (cfg) setCfgPagos(cfg);
      if (tipoUsuario === 'administrador') setPedidosAdmin(await obtenerPedidosAdmin());
      else if (usuario?.id) setDatos(await obtenerDatosCliente(usuario.id));
    } catch (e) {}
  }

  function irATabCliente(tab) { setNavInfo(prev => ({ tab, seq: prev.seq + 1 })); setPantalla('inicio'); }

  async function manejarRegistro(form) {
    setCargando(true);
    try {
      const r = await registrarUsuario(form);
      await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify({ tipo: 'cliente', perfil: r.perfil }));
      setUsuario(r.perfil); setTipoUsuario('cliente');
      setDatos(await obtenerDatosCliente(r.perfil.id));
      irATabCliente('inicio'); mostrarAviso('¡Bienvenido!', r.mensaje);
    } catch (e) { throw e; } finally { setCargando(false); }
  }

  async function manejarIngreso(form) {
    setCargando(true);
    try {
      const r = await ingresarUsuario(form);
      await AsyncStorage.setItem('sesion_club_sazon', JSON.stringify(r));
      setUsuario(r.perfil); setTipoUsuario(r.tipo);
      if (r.tipo === 'administrador') { setPedidosAdmin(await obtenerPedidosAdmin()); setPantalla('admin'); }
      else { setDatos(await obtenerDatosCliente(r.perfil.id)); irATabCliente('inicio'); }
    } catch (e) { throw e; } finally { setCargando(false); }
  }

  async function manejarCanje(rec) {
    setCargando(true);
    try { await canjearRecompensaCliente(usuario.id, rec); await recargarTodo(); mostrarAviso('¡Canje solicitado!', 'Tu canje quedó registrado.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarPedido(pedidoData) {
    setCargando(true);
    try { await crearNuevoPedido({ ...pedidoData, cliente_id: usuario.id }, carrito); setCarrito([]); await recargarTodo(); irATabCliente('pedidos'); mostrarAviso('¡Pedido enviado!', 'Tu pedido fue enviado al local.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarConfirmarAdmin(ped, del) {
    setCargando(true);
    try { await confirmarAdminPedido(ped, del); await recargarTodo(); } catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarCompletar(ped) {
    setCargando(true);
    try { const pts = await confirmarRecepcionYDarPuntos(ped); await recargarTodo(); mostrarAviso('¡Completado!', pts > 0 ? 'Se acreditaron +' + pts + ' puntos.' : 'Pedido completado.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function manejarCancelar(ped) {
    setCargando(true);
    try { const restados = await cancelarPedidoYDescontar(ped); await recargarTodo(); mostrarAviso('Pedido cancelado', restados > 0 ? 'Se descontaron ' + restados + ' puntos.' : 'Pedido cancelado.'); }
    catch (e) { mostrarAviso('Error', e.message); } finally { setCargando(false); }
  }

  async function cerrarSesion() {
    try { await AsyncStorage.removeItem('sesion_club_sazon'); } catch (e) {}
    setUsuario(null); setTipoUsuario(null); setCarrito([]); setPantalla('bienvenida');
  }

  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);
  const mostrarBarraCliente = tipoUsuario === 'cliente' && ['inicio', 'carrito', 'panel'].includes(pantalla);

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <View style={{ flex: 1 }}>
        {pantalla === 'bienvenida' && <VistaBienvenida irARegistro={() => setPantalla('registro')} onIngresar={manejarIngreso} cargando={cargando} />}
        {pantalla === 'registro' && <VistaRegistro onRegistrar={manejarRegistro} regresar={() => setPantalla('bienvenida')} cargando={cargando} />}
        {pantalla === 'inicio' && <VistaInicio usuario={usuario} datos={datos} productos={productos} recompensas={recompensas} carrito={carrito} setCarrito={setCarrito} categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} navInfo={navInfo} onCanjear={manejarCanje} onRecibido={manejarCompletar} cerrarSesion={cerrarSesion} irACarrito={() => setPantalla('carrito')} irATab={irATabCliente} cargando={cargando} />}
        {pantalla === 'panel' && <VistaPanel usuario={usuario} datos={datos} regresar={() => irATabCliente('menu')} irAInicio={() => irATabCliente('inicio')} irACanjes={() => irATabCliente('canjear')} irAPedidos={() => irATabCliente('pedidos')} />}
        {pantalla === 'carrito' && <VistaCarrito usuario={usuario} carrito={carrito} setCarrito={setCarrito} cfgPagos={cfgPagos} onConfirmarPedido={manejarPedido} regresar={() => irATabCliente('menu')} irAInicio={() => irATabCliente('inicio')} cargando={cargando} />}
        {pantalla === 'admin' && <VistaAdmin usuario={usuario} pedidos={pedidosAdmin} recargar={recargarTodo} onConfirmarAdmin={manejarConfirmarAdmin} onCompletar={manejarCompletar} onCancelar={manejarCancelar} cerrarSesion={cerrarSesion} cargando={cargando} />}
      </View>

      {mostrarBarraCliente && (
        <View style={{ flexDirection: 'row', backgroundColor: '#141414', borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingVertical: 8, paddingHorizontal: 2, zIndex: 50 }}>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }} onPress={() => irATabCliente('menu')}><Text style={{ fontSize: 15 }}>🍔</Text><Text style={{ color: pantalla === 'inicio' && navInfo.tab === 'menu' ? '#F5B041' : '#AAA', fontSize: 9, fontWeight: '700' }}>MENÚ</Text></TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }} onPress={() => setPantalla('carrito')}><Text style={{ fontSize: 15 }}>🛒</Text><Text style={{ color: pantalla === 'carrito' ? '#F5B041' : '#AAA', fontSize: 9, fontWeight: '700' }}>CARRITO{totalItems > 0 ? ` (${totalItems})` : ''}</Text></TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }} onPress={() => irATabCliente('pedidos')}><Text style={{ fontSize: 15 }}>📋</Text><Text style={{ color: pantalla === 'inicio' && navInfo.tab === 'pedidos' ? '#F5B041' : '#AAA', fontSize: 9, fontWeight: '700' }}>PEDIDOS</Text></TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }} onPress={() => setPantalla('panel')}><Text style={{ fontSize: 15 }}>⭐</Text><Text style={{ color: pantalla === 'panel' ? '#F5B041' : '#AAA', fontSize: 9, fontWeight: '700' }}>PUNTOS</Text></TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }} onPress={() => irATabCliente('canjear')}><Text style={{ fontSize: 15 }}>🎁</Text><Text style={{ color: pantalla === 'inicio' && navInfo.tab === 'canjear' ? '#F5B041' : '#AAA', fontSize: 9, fontWeight: '700' }}>CANJES</Text></TouchableOpacity>
        </View>
      )}
      <BannerAviso aviso={aviso} onCerrar={() => setAviso(null)} />
    </SafeAreaView>
  );
}
