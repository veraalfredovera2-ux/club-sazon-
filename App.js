import React, { useState, useEffect } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './estilos';
import * as S from './servicios';
import { VistaBienvenida, VistaRegistro } from './pantallas';
import { VistaInicio } from './vistas';
import { VistaAdmin } from './admin';
import { BannerAviso, mostrarAviso, registrarAvisoGlobal } from './avisos';

const TELEFONOS_ADMIN = ['967738806', '967142393'];

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [proc, setProc] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [navInfo, setNavInfo] = useState({ tab: 'inicio', t: 0 });
  const [datos, setDatos] = useState({ prods: [], recs: [], promos: [], puntos: 0, historial: [], canjes: [], pedidos: [], adminPeds: [], cfgPagos: {} });

  useEffect(() => {
    registrarAvisoGlobal(setAviso);
    iniciar();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    const t = setInterval(() => {
      if (esAdmin) cargarAdmin();
      else cargarCliente(usuario.id);
    }, 5000);
    return () => clearInterval(t);
  }, [usuario?.id, esAdmin]);

  async function iniciar() {
    try {
      const u = await AsyncStorage.getItem('club_sazon_usuario');
      if (u) {
        const user = JSON.parse(u);
        const adm = TELEFONOS_ADMIN.includes(String(user.telefono || '').replace(/\D/g, ''));
        setUsuario(user); setEsAdmin(adm);
        if (adm) { setPantalla('admin'); await cargarAdmin(); }
        else { setPantalla('inicio'); await cargarCliente(user.id); }
      }
    } catch (e) {}
    setCargando(false);
  }

  async function cargarCliente(id) {
    try {
      const [prods, d, recs, promos, cfg] = await Promise.all([
        S.obtenerCatalogo(true), S.obtenerDatosCliente(id), S.obtenerRecompensas(true), S.obtenerPromociones(true), S.obtenerConfigPagos()
      ]);
      setDatos(prev => ({
        ...prev, prods: prods || [], recs: recs || [], promos: promos || [], cfgPagos: cfg || {},
        puntos: d.puntos || 0, historial: d.historial || [], canjes: d.canjes || [], pedidos: d.pedidos || []
      }));
    } catch (e) {}
  }

  async function cargarAdmin() {
    try {
      const adminPeds = await S.obtenerPedidosAdmin();
      setDatos(prev => ({ ...prev, adminPeds: adminPeds || [] }));
    } catch (e) {}
  }

  async function manejarIngreso({ telefono, password }) {
    setProc(true);
    try {
      const r = await S.ingresarUsuario({ telefono, password });
      const perfil = r.perfil;
      const adm = r.tipo === 'administrador' || TELEFONOS_ADMIN.includes(String(perfil.telefono || telefono).replace(/\D/g, ''));
      await AsyncStorage.setItem('club_sazon_usuario', JSON.stringify(perfil));
      setUsuario(perfil); setEsAdmin(adm);
      if (adm) { await cargarAdmin(); setPantalla('admin'); }
      else { await cargarCliente(perfil.id); setPantalla('inicio'); }
    } finally { setProc(false); }
  }

  async function manejarRegistro({ nombreCompleto, telefono, password }) {
    setProc(true);
    try {
      const r = await S.registrarCliente({ nombreCompleto, telefono, password });
      const perfil = r.perfil;
      const adm = TELEFONOS_ADMIN.includes(String(perfil.telefono || telefono).replace(/\D/g, ''));
      await AsyncStorage.setItem('club_sazon_usuario', JSON.stringify(perfil));
      setUsuario(perfil); setEsAdmin(adm);
      if (adm) { await cargarAdmin(); setPantalla('admin'); }
      else { await cargarCliente(perfil.id); setPantalla('inicio'); }
      mostrarAviso('¡Bienvenido!', r.mensaje || 'Cuenta creada con éxito.');
    } finally { setProc(false); }
  }

  async function salir() {
    await AsyncStorage.removeItem('club_sazon_usuario');
    setUsuario(null); setEsAdmin(false); setCarrito([]); setPantalla('bienvenida');
  }
  async function confirmarPedido(pedidoBase, items) {
    setProc(true);
    try {
      await S.crearNuevoPedido(pedidoBase, items);
      setCarrito([]);
      await cargarCliente(usuario.id);
      setNavInfo({ tab: 'pedidos', t: Date.now() });
      mostrarAviso('¡Pedido enviado!', 'Tu pedido fue registrado. Espera la confirmación del local.');
    } catch (e) { mostrarAviso('Error al pedir', e.message); }
    setProc(false);
  }

  async function canjear(rec) {
    setProc(true);
    try {
      await S.canjearRecompensaCliente(usuario.id, rec);
      await cargarCliente(usuario.id);
      mostrarAviso('¡Canje exitoso!', 'Solicitaste: ' + rec.titulo);
    } catch (e) { mostrarAviso('No disponible', e.message); }
    setProc(false);
  }

  async function recibirPedido(ped, desdeAdmin) {
    setProc(true);
    try {
      const p = await S.confirmarRecepcionYDarPuntos(ped);
      if (desdeAdmin) await cargarAdmin(); else await cargarCliente(usuario.id);
      mostrarAviso('¡Pedido completado!', 'Se acreditaron ' + p + ' puntos.');
    } catch (e) { mostrarAviso('Error', e.message); }
    setProc(false);
  }

  async function cancelarPedido(ped, desdeAdmin) {
    setProc(true);
    try {
      const desc = await S.cancelarPedidoYDescontar(ped);
      if (desdeAdmin) await cargarAdmin(); else await cargarCliente(usuario.id);
      mostrarAviso('Pedido cancelado', desc > 0 ? 'Se descontaron ' + desc + ' puntos.' : 'Pedido cancelado.');
    } catch (e) { mostrarAviso('Error', e.message); }
    setProc(false);
  }

  async function confirmarAdmin(ped, costoDel) {
    setProc(true);
    try {
      await S.confirmarAdminPedido(ped, costoDel);
      await cargarAdmin();
      mostrarAviso('Confirmado', 'Pedido aceptado y enviado a cocina/riders.');
    } catch (e) { mostrarAviso('Error', e.message); }
    setProc(false);
  }

  const categorias = ['Todas', ...new Set((datos.prods || []).map(p => p.categoria).filter(Boolean))];

  if (cargando) {
    return (
      <SafeAreaView style={[styles.pantallaCompleta, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F5B041" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantallaCompleta}>
      <BannerAviso aviso={aviso} cerrar={() => setAviso(null)} />
      {pantalla === 'bienvenida' && (
        <VistaBienvenida irARegistro={() => setPantalla('registro')} onIngresar={manejarIngreso} cargando={proc} />
      )}
      {pantalla === 'registro' && (
        <VistaRegistro onRegistrar={manejarRegistro} regresar={() => setPantalla('bienvenida')} cargando={proc} />
      )}
      {pantalla === 'inicio' && (
        <VistaInicio
          usuario={usuario}
          datos={datos}
          productos={datos.prods}
          categorias={categorias}
          recompensas={datos.recs}
          promociones={datos.promos}
          cfgPagos={datos.cfgPagos}
          carrito={carrito}
          setCarrito={setCarrito}
          navInfo={navInfo}
          irA={tab => setNavInfo({ tab, t: Date.now() })}
          onConfirmarPedido={confirmarPedido}
          onCanjear={canjear}
          onRecibirPedido={p => recibirPedido(p, false)}
          onCancelarPedido={p => cancelarPedido(p, false)}
          cerrarSesion={salir}
          cargando={proc}
        />
      )}
      {pantalla === 'admin' && (
        <VistaAdmin
          usuario={usuario}
          pedidos={datos.adminPeds}
          recargar={cargarAdmin}
          onConfirmarAdmin={confirmarAdmin}
          onCompletar={p => recibirPedido(p, true)}
          onCancelar={p => cancelarPedido(p, true)}
          cerrarSesion={salir}
          cargando={proc}
        />
      )}
    </SafeAreaView>
  );
            }
