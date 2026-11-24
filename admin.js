import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Modal, Platform } from 'react-native';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { LOGO } from './pantallas';
import { mostrarAviso } from './avisos';
import {
  categorias, obtenerCatalogo, guardarProductoAdmin, eliminarProductoAdmin,
  obtenerPromociones, guardarPromocionAdmin, eliminarPromocionAdmin,
  obtenerRecompensas, guardarRecompensaAdmin, eliminarRecompensaAdmin,
  obtenerConfigPagos, guardarConfigPagos,
  obtenerMotorizados, crearMotorizadoAdmin, eliminarMotorizadoAdmin,
  subirImagenGaleria, actualizarHorarioRiderAdmin, obtenerClientesAdmin,
  cambiarClaveClienteAdmin, actualizarEstadoPedidoAdmin
} from './servicios';

function IconoAdmin({ tipo }) {
  if (Platform.OS === 'web') {
    const paths = {
      pedidos: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
      productos: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
      promos: 'M12 2l2.39 1.65 2.89-.39.84 2.79 2.53 1.44-.88 2.78 1.24 2.63-2.29 1.81-.29 2.9-2.88.45-1.69 2.36-2.76-.94-2.76.94-1.69-2.36-2.88-.45-.29-2.9-2.29-1.81 1.24-2.63-.88-2.78 2.53-1.44.84-2.79 2.89.39L12 2zm-2.5 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm5 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm.3-5.8l-7.1 7.1 1.4 1.4 7.1-7.1-1.4-1.4z',
      ofertas: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
      novedades: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
      premios: 'M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z',
      riders: 'M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1zM5 6h5v2H5V6zm14 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
      pagos: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
      config: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
      historial: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
      clientes: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
    };
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill={ROJO}>
        <path d={paths[tipo] || paths.pedidos} />
      </svg>
    );
  }
  return <Text style={{ fontSize: 22, color: ROJO, fontWeight: '900' }}>★</Text>;
}
export function VistaAdmin({ usuario, pedidos, recargar, onConfirmarAdmin, onCompletar, onCancelar, cerrarSesion, cargando }) {
  const [sec, setSec] = useState('inicio');
  const [horaActual, setHoraActual] = useState('');
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [riders, setRiders] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [busquedaCli, setBusquedaCli] = useState('');
  const [nuevaClaveCli, setNuevaClaveCli] = useState({});
  const [horarioRiderEdit, setHorarioRiderEdit] = useState({});
  const [subiendo, setSubiendo] = useState(false);

  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('20');
  const [cat, setCat] = useState('Hamburguesas');
  const [turno, setTurno] = useState('Ambos');
  const [ing, setIng] = useState('');
  const [img, setImg] = useState('');
  const [disponible, setDisponible] = useState(true);

  const [editPromoId, setEditPromoId] = useState(null);
  const [tituloP, setTituloP] = useState('');
  const [descP, setDescP] = useState('');
  const [precioP, setPrecioP] = useState('');
  const [imgP, setImgP] = useState('');
  const [activaP, setActivaP] = useState(true);

  const [editRecId, setEditRecId] = useState(null);
  const [tituloR, setTituloR] = useState('');
  const [descR, setDescR] = useState('');
  const [ptsR, setPtsR] = useState('');
  const [stockR, setStockR] = useState('10');
  const [imgR, setImgR] = useState('');
  const [activaR, setActivaR] = useState(true);

  const [nomRider, setNomRider] = useState('');
  const [telRider, setTelRider] = useState('');
  const [passRider, setPassRider] = useState('');
  const [horarioNuevoRider, setHorarioNuevoRider] = useState('Lun a Dom: 12:00 pm - 10:00 pm');

  const [titular, setTitular] = useState('');
  const [qrYape, setQrYape] = useState('');
  const [qrPlin, setQrPlin] = useState('');
  const [latLocal, setLatLocal] = useState('-12.089700');
  const [lngLocal, setLngLocal] = useState('-77.003100');
  const [tarifaBase, setTarifaBase] = useState('4.00');
  const [tarifaKm, setTarifaKm] = useState('1.50');
  const [localCerrado, setLocalCerrado] = useState(false);
  const [notifActivas, setNotifActivas] = useState(true);
  const [filtroMes, setFiltroMes] = useState(() => new Date().toISOString().slice(0, 7));
  const conteoPrevioRef = useRef(null);

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      setHoraActual(ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    actualizarHora();
    const timer = setInterval(actualizarHora, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const lista = Array.isArray(pedidos) ? pedidos : [];
    const pendientes = lista.filter(p => p && p.estado === 'Pendiente').length;
    if (conteoPrevioRef.current !== null && pendientes > conteoPrevioRef.current && notifActivas) {
      reproducirTimbreAlerta();
    }
    conteoPrevioRef.current = pendientes;
  }, [pedidos, notifActivas]);

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    try {
      const [c, p, r, cfg, rds, clis] = await Promise.all([
        obtenerCatalogo(false), obtenerPromociones(false), obtenerRecompensas(false), obtenerConfigPagos(),
        obtenerMotorizados(), obtenerClientesAdmin()
      ]);
      setCatalogo(Array.isArray(c) ? c : []);
      setPromos(Array.isArray(p) ? p : []);
      setRecompensas(Array.isArray(r) ? r : []);
      const listaRds = Array.isArray(rds) ? rds : [];
      setRiders(listaRds);
      setClientesList(Array.isArray(clis) ? clis : []);
      const mapHorarios = {};
      listaRds.forEach(m => { mapHorarios[m.id] = m.direccion_predeterminada || 'Lun a Dom: 12:00 pm - 10:00 pm'; });
      setHorarioRiderEdit(mapHorarios);
      if (cfg) {
        setTitular(cfg.titularLimpio || '');
        setQrYape(cfg.qr_yape || '');
        setQrPlin(cfg.qr_plin || '');
        setLatLocal(cfg.local_lat || '-12.089700');
        setLngLocal(cfg.local_lng || '-77.003100');
        setTarifaBase(cfg.tarifa_base || '4.00');
        setTarifaKm(cfg.tarifa_km || '1.50');
        setLocalCerrado(Boolean(cfg.local_cerrado));
      }
    } catch (e) {}
  }
  async function guardarHorarioRider(riderOb) {
    const textoHorario = (horarioRiderEdit[riderOb.id] || '').trim();
    try {
      await actualizarHorarioRiderAdmin(riderOb.id, textoHorario);
      await cargarTodo();
      mostrarAviso('Horario guardado', `Turno semanal actualizado para ${riderOb.nombre_completo}.`);
    } catch (e) { mostrarAviso('Error', e.message); }
  }

  async function restablecerClaveCliente(cli) {
    const nueva = (nuevaClaveCli[cli.id] || '').trim();
    if (nueva.length < 4) return mostrarAviso('Clave corta', 'Escribe una contraseña de al menos 4 caracteres.');
    try {
      await cambiarClaveClienteAdmin(cli.id, nueva);
      setNuevaClaveCli(prev => ({ ...prev, [cli.id]: '' }));
      mostrarAviso('Clave actualizada', `La nueva contraseña de ${cli.nombre_completo} es: ${nueva}`);
    } catch (e) { mostrarAviso('Error', e.message); }
  }

  async function subirFoto(destino) {
    setSubiendo(true);
    try {
      const url = await subirImagenGaleria();
      if (url) {
        if (destino === 'producto') setImg(url);
        if (destino === 'promo') setImgP(url);
        if (destino === 'premio') setImgR(url);
        if (destino === 'yape') setQrYape(url);
        if (destino === 'plin') setQrPlin(url);
        mostrarAviso('Foto subida', 'Imagen guardada correctamente.');
      }
    } catch (e) { mostrarAviso('Error al subir', e.message); } finally { setSubiendo(false); }
  }

  async function guardarProd() {
    try {
      await guardarProductoAdmin({ id: editId, nombre, precio, stock, categoria: cat, turno, ingredientes: ing, imagen_url: img, disponible });
      setEditId(null); setNombre(''); setPrecio(''); setStock('20'); setTurno('Ambos'); setIng(''); setImg(''); setDisponible(true);
      await cargarTodo(); await recargar();
      mostrarAviso('Listo', 'Producto guardado.');
    } catch (e) { mostrarAviso('Error', e.message); }
  }

  async function guardarPromo(tipo = 'promocion') {
    try {
      const precioFinal = tipo === 'novedad' ? 0 : precioP;
      await guardarPromocionAdmin({ id: editPromoId, titulo: tituloP, descripcion: descP, precio: precioFinal, imagen_url: imgP, activa: activaP, tipo });
      setEditPromoId(null); setTituloP(''); setDescP(''); setPrecioP(''); setImgP(''); setActivaP(true);
      await cargarTodo(); await recargar();
      mostrarAviso('Listo', tipo === 'novedad' ? 'Novedad publicada.' : tipo === 'oferta' ? 'Oferta guardada.' : 'Promoción guardada.');
    } catch (e) { mostrarAviso('Error', e.message); }
  }

  async function guardarRec() {
    try {
      await guardarRecompensaAdmin({ id: editRecId, titulo: tituloR, descripcion: descR, puntos_requeridos: ptsR, stock: stockR, imagen_url: imgR, activa: activaR });
      setEditRecId(null); setTituloR(''); setDescR(''); setPtsR(''); setStockR('10'); setImgR(''); setActivaR(true);
      await cargarTodo(); await recargar();
      mostrarAviso('Listo', 'Premio guardado.');
    } catch (e) { mostrarAviso('Error', e.message); }
  }

  async function guardarPagos(cerradoOverride) {
    const estadoCierre = typeof cerradoOverride === 'boolean' ? cerradoOverride : localCerrado;
    try {
      await guardarConfigPagos({
        titularLimpio: titular, qr_yape: qrYape, qr_plin: qrPlin,
        local_lat: latLocal, local_lng: lngLocal, tarifa_base: tarifaBase, tarifa_km: tarifaKm, local_cerrado: estadoCierre
      });
      setLocalCerrado(estadoCierre);
      await recargar();
      mostrarAviso('Guardado', estadoCierre ? 'El local ahora figura como CERRADO.' : 'Configuración actualizada.');
    } catch (e) { mostrarAviso('Error', e.message); }
  }

  async function cambiarEstadoLocal(p, nuevoEstado) {
    const ejecutar = async () => {
      try {
        await actualizarEstadoPedidoAdmin(p, nuevoEstado);
        await recargar();
        mostrarAviso('Estado actualizado', nuevoEstado === 'Listo' && p.tipo_entrega === 'DELIVERY' ? 'Pedido marcado como LISTO y enviado a los repartidores disponibles.' : `El pedido ahora está: ${nuevoEstado}`);
      } catch (e) { mostrarAviso('Error', e.message); }
    };
    if (nuevoEstado === 'Listo') {
      pedirConfirmacion(
        'Confirmar pedido listo',
        p.tipo_entrega === 'DELIVERY'
          ? `¿Confirmas que el pedido ${p.numero_pedido} está terminado y listo para ser publicado a los repartidores?`
          : `¿Confirmas que el pedido ${p.numero_pedido} está listo para entrega en local?`,
        ejecutar
      );
    } else {
      await ejecutar();
    }
  }

  function solicitarCancelacionPedido(p) {
    const pts = Math.floor(Number(p.subtotal || p.total || 0) * 10);
    const detallePuntos = p.recibido_cliente && pts > 0
      ? ` Se descontarán automáticamente ${pts} puntos del saldo del cliente.`
      : '';
    pedirConfirmacion(
      'Confirmar cancelación de pedido',
      `¿Confirmas la cancelación definitiva del pedido ${p.numero_pedido}?${detallePuntos}`,
      () => onCancelar(p)
    );
  }

  function confirmarLiquidacionRider(item) {
    pedirConfirmacion(
      'Confirmar efectivo recibido en caja',
      `¿Confirmas que recibiste S/ ${item.monto.toFixed(2)} en efectivo de ${item.nombre} (${item.cantidad} pedidos)?`,
      async () => {
        try {
          await liquidarEfectivoRiderAdmin(item.id);
          await recargar();
          mostrarAviso('Caja liquidada', `El efectivo pendiente de ${item.nombre} quedó en S/ 0.00.`);
        } catch (e) { mostrarAviso('Error', e.message); }
      }
    );
  }

  function extraerComprobante(notasStr) {
    const txt = String(notasStr || '');
    if (!txt.includes('COMPROBANTE:')) return null;
    const parte = txt.split('COMPROBANTE:').at(1) || '';
    return parte.split('|').at(0).trim();
  }
    const listaPedidosSegura = Array.isArray(pedidos) ? pedidos : [];
  const activos = listaPedidosSegura.filter(p => p && p.estado !== 'Completado' && p.estado !== 'Cancelado');
  const completados = listaPedidosSegura.filter(p => p && p.estado === 'Completado');
  const hoyStr = new Date().toISOString().slice(0, 10);
  const completadosHoy = completados.filter(p => String(p.creado_en || '').startsWith(hoyStr));
  const ventasHoy = completadosHoy.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ventasHoyEfectivo = completadosHoy.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ventasHoyYape = completadosHoy.filter(p => p.metodo_pago === 'Yape').reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ventasHoyPlin = completadosHoy.filter(p => p.metodo_pago === 'Plin').reduce((acc, p) => acc + Number(p.total || 0), 0);
  const pedidosHoyCount = listaPedidosSegura.filter(p => p && String(p.creado_en || '').startsWith(hoyStr) && p.estado !== 'Cancelado').length;
  const historialFiltrado = completados.filter(p => String(p.creado_en || '').startsWith(filtroMes));
  const totalMes = historialFiltrado.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const totalDeliveryMes = historialFiltrado.reduce((acc, p) => acc + Number(p.costo_delivery || 0), 0);

  const efectivoPorRiderMap = {};
  completados
    .filter(p => p.metodo_pago === 'Efectivo' && p.rider_id && p.estado_rider !== 'Liquidado en caja')
    .forEach(p => {
      if (!efectivoPorRiderMap[p.rider_id]) {
        efectivoPorRiderMap[p.rider_id] = { id: p.rider_id, nombre: p.rider_nombre || 'Repartidor', monto: 0, cantidad: 0 };
      }
      efectivoPorRiderMap[p.rider_id].monto += Number(p.total || 0);
      efectivoPorRiderMap[p.rider_id].cantidad += 1;
    });
  const listaEfectivoRiders = Object.values(efectivoPorRiderMap);

  const tarjetasMenuAdmin = [
    { id: 'pedidos', tipo: 'pedidos', titulo: 'Pedidos', badge: activos.length },
    { id: 'productos', tipo: 'productos', titulo: 'Productos', badge: 0 },
    { id: 'promos', tipo: 'promos', titulo: 'Promociones', badge: 0 },
    { id: 'ofertas', tipo: 'ofertas', titulo: 'Ofertas', badge: 0 },
    { id: 'novedades', tipo: 'novedades', titulo: 'Novedades', badge: promos.filter(x => x && x.tipo === 'novedad').length },
    { id: 'premios', tipo: 'premios', titulo: 'Premios y canjes', badge: 0 },
    { id: 'riders', tipo: 'riders', titulo: 'Motorizados', badge: riders.length },
    { id: 'clientes', tipo: 'clientes', titulo: 'Clientes / Claves', badge: clientesList.length },
    { id: 'pagos', tipo: 'pagos', titulo: 'Métodos de pago', badge: 0 },
    { id: 'config', tipo: 'config', titulo: 'Config. negocio', badge: 0 },
    { id: 'historial', tipo: 'historial', titulo: 'Historial ventas', badge: listaEfectivoRiders.length }
  ];

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Modal transparent animationType="fade" visible={Boolean(comprobanteModal)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: TARJETA, borderWidth: 1.5, borderColor: ROJO, borderRadius: 18, padding: 14 }}>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 10 }}>COMPROBANTE DE PAGO</Text>
            {comprobanteModal && (
              <Image source={{ uri: comprobanteModal }} style={{ width: '100%', height: 340, borderRadius: 12, backgroundColor: '#000' }} resizeMode="contain" />
            )}
            <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={() => setComprobanteModal(null)}>
              <Text style={styles.textoBoton}>Cerrar comprobante</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.cabeceraTop}>
        <View style={{ width: 82, alignItems: 'flex-start' }}>
          {sec !== 'inicio' && (
            <TouchableOpacity onPress={() => setSec('inicio')} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: TARJETA, borderRadius: 10, borderWidth: 1, borderColor: BORDE }}>
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>←</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setSec('inicio')} style={{ alignItems: 'center' }}>
          <Image source={LOGO} style={styles.logoHeaderCentro} />
        </TouchableOpacity>
        <View style={{ width: 82, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
          <TouchableOpacity
            onPress={() => {
              const nuevo = !notifActivas;
              setNotifActivas(nuevo);
              if (nuevo) {
                reproducirTimbreAlerta();
                mostrarAviso('Alerta sonora activada', 'El timbre sonará automáticamente cuando ingrese un pedido nuevo.');
              }
            }}
            style={{ backgroundColor: notifActivas ? '#16A34A' : '#374151', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 10 }}
          >
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>{notifActivas ? '🔔 ON' : '🔕'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { recargar(); cargarTodo(); }} style={{ backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 10 }}>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {sec === 'inicio' && (
        <View>
          <View style={styles.tarjetaPerfilHero}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F3F4F6', fontSize: 12, fontWeight: '800' }}>PANEL DE ADMINISTRACIÓN • {horaActual}</Text>
              <Text style={styles.nombreDoradoHero}>{usuario?.nombre_completo || 'Alfredo Vera'}</Text>
              <Text style={{ color: localCerrado ? ROJO : '#22C55E', fontSize: 11, fontWeight: '900', marginTop: 3 }}>
                {localCerrado ? '🔴 LOCAL CERRADO' : '🟢 LOCAL ABIERTO Y RECIBIENDO PEDIDOS'}
              </Text>
            </View>
            <TouchableOpacity style={styles.badgePuntosHero} onPress={() => setSec('pedidos')}>
              <Text style={{ color: DORADO, fontSize: 18, fontWeight: '900' }}>{activos.length}</Text>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Activos</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>PEDIDOS HOY</Text>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 2 }}>{pedidosHoyCount}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>PENDIENTES</Text>
              <Text style={{ color: ROJO, fontSize: 18, fontWeight: '900', marginTop: 2 }}>{activos.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>VENTAS HOY</Text>
              <Text style={{ color: DORADO, fontSize: 17, fontWeight: '900', marginTop: 2 }}>S/ {ventasHoy.toFixed(0)}</Text>
            </View>
          </View>

          <View style={styles.cuadricula3}>
            {tarjetasMenuAdmin.map(t => (
              <TouchableOpacity key={t.id} style={[styles.itemCuadricula, { position: 'relative' }]} onPress={() => setSec(t.id)}>
                {t.badge > 0 && (
                  <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: ROJO, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{t.badge}</Text>
                  </View>
                )}
                <View style={styles.iconoCuadriculaBox}>
                  <IconoAdmin tipo={t.tipo} />
                </View>
                <Text style={styles.textoCuadricula}>{t.titulo}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E1E28', borderWidth: 1, borderColor: BORDE, marginTop: 14 }]} onPress={cerrarSesion}>
            <Text style={styles.textoBoton}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}
                  {sec === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>PEDIDOS EN TIEMPO REAL ({activos.length})</Text>
          {activos.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos pendientes.</Text></View>
          ) : (
            activos.map(p => {
              const compUrl = extraerComprobante(p.notas);
              const notasLimpias = String(p.notas || '').split('| COMPROBANTE:').at(0).trim();
              const detalles = Array.isArray(p.pedido_detalles) ? p.pedido_detalles : [];
              return (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'} ({p.perfiles?.telefono || ''})</Text>
                  <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
                  <Text style={styles.descripcionPedido}>Entrega: {p.tipo_entrega} | Pago: {p.metodo_pago}</Text>
                  {p.tipo_entrega === 'DELIVERY' && <Text style={styles.descripcionPedido}>Destino: {p.distrito} - {p.direccion}</Text>}
                  {!!notasLimpias && <Text style={[styles.descripcionPedido, { color: DORADO }]}>Nota: {notasLimpias}</Text>}
                  {detalles.map(d => (
                    <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto} (S/ {Number(d.subtotal || 0).toFixed(2)})</Text>
                  ))}
                  {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#38BDF8', fontWeight: '800' }]}>Motorizado: {p.rider_nombre} ({p.estado_rider})</Text>}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total || 0).toFixed(2)} (Delivery: S/ {Number(p.costo_delivery || 0).toFixed(2)})</Text>

                  {compUrl && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#742284', marginTop: 8 }]} onPress={() => setComprobanteModal(compUrl)}>
                      <Text style={styles.textoBoton}>🧾 VER CAPTURA DE PAGO ({String(p.metodo_pago || '').toUpperCase()})</Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'Pendiente' && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 10 }]} onPress={() => cambiarEstadoLocal(p, 'Aceptado por el local')} disabled={cargando}>
                      <Text style={styles.textoBoton}>✅ ACEPTAR PEDIDO</Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'Aceptado por el local' && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#D97706', marginTop: 10 }]} onPress={() => cambiarEstadoLocal(p, 'En preparación')} disabled={cargando}>
                      <Text style={styles.textoBoton}>👨‍🍳 MARCAR EN PREPARACIÓN</Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'En preparación' && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#0284C7', marginTop: 10 }]} onPress={() => cambiarEstadoLocal(p, 'Listo')} disabled={cargando}>
                      <Text style={styles.textoBoton}>
                        {p.tipo_entrega === 'DELIVERY' ? '📦 MARCAR COMO LISTO (AVISAR RIDERS)' : '📦 MARCAR COMO LISTO PARA RECOJO'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'Listo' && p.tipo_entrega === 'DELIVERY' && !p.rider_id && (
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 10, padding: 10, marginTop: 10 }}>
                      <Text style={{ color: DORADO, fontSize: 12, fontWeight: '900', textAlign: 'center' }}>
                        📡 Pedido publicado • Esperando que un repartidor lo acepte
                      </Text>
                    </View>
                  )}

                  {p.estado === 'Listo' && p.tipo_entrega !== 'DELIVERY' && (
                    <TouchableOpacity
                      style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 10 }]}
                      onPress={() => pedirConfirmacion('Confirmar entrega en local', `¿Confirmas que el cliente recibió el pedido ${p.numero_pedido} en el local?`, () => onCompletar(p))}
                      disabled={cargando}
                    >
                      <Text style={styles.textoBoton}>✅ ENTREGADO EN LOCAL Y DAR PUNTOS</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={[styles.boton, { backgroundColor: '#7F1D1D', marginTop: 8 }]} onPress={() => solicitarCancelacionPedido(p)} disabled={cargando}>
                    <Text style={styles.textoBoton}>CANCELAR PEDIDO</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}
                          {sec === 'productos' && (
        <View>
          <Text style={styles.titulo}>{editId ? 'EDITAR PRODUCTO' : 'AGREGAR PRODUCTO'}</Text>
          <TextInput style={styles.campo} placeholder="Nombre del plato" placeholderTextColor="#6B7280" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.campo} placeholder="Precio (ej. 18.00)" placeholderTextColor="#6B7280" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
          <TextInput style={styles.campo} placeholder="Stock disponible" placeholderTextColor="#6B7280" keyboardType="numeric" value={stock} onChangeText={setStock} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
            {categorias.filter(x => x !== 'Todas').map(c => (
              <TouchableOpacity key={c} style={[styles.categoria, cat === c && styles.categoriaActiva]} onPress={() => setCat(c)}>
                <Text style={styles.textoCategoria}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {['Mañana', 'Tarde/Noche', 'Ambos'].map(t => (
              <TouchableOpacity key={t} style={[styles.opcionEntrega, turno === t && styles.opcionEntregaActiva, { flex: 1, alignItems: 'center' }]} onPress={() => setTurno(t)}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.campo} placeholder="Ingredientes o descripción" placeholderTextColor="#6B7280" value={ing} onChangeText={setIng} />
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 10 }]} onPress={() => subirFoto('producto')} disabled={subiendo}>
            <Text style={styles.textoBoton}>{subiendo ? 'SUBIENDO...' : '📸 SUBIR FOTO DEL PLATO'}</Text>
          </TouchableOpacity>
          <TextInput style={styles.campo} placeholder="URL de imagen" placeholderTextColor="#6B7280" value={img} onChangeText={setImg} />
          <TouchableOpacity style={[styles.opcionEntrega, disponible && styles.opcionEntregaActiva]} onPress={() => setDisponible(!disponible)}>
            <Text style={{ color: '#FFF', fontWeight: '800' }}>{disponible ? '🟢 Disponible en carta' : '🔴 Agotado'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boton} onPress={guardarProd}><Text style={styles.textoBoton}>GUARDAR PRODUCTO</Text></TouchableOpacity>

          <Text style={styles.titulo}>PRODUCTOS REGISTRADOS ({catalogo.length})</Text>
          {catalogo.map(p => (
            <View key={p.id} style={styles.producto}>
              <Image source={p.imagen_url && p.imagen_url.includes('http') ? { uri: p.imagen_url } : LOGO} style={styles.fotoProducto} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{p.nombre} ({p.categoria})</Text>
                <Text style={styles.precioProducto}>S/ {Number(p.precio || 0).toFixed(2)} • Stock: {p.stock}</Text>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity style={[styles.botonAgregar, { backgroundColor: '#1E293B' }]} onPress={() => {
                  setEditId(p.id); setNombre(p.nombre); setPrecio(String(p.precio)); setStock(String(p.stock ?? 20)); setCat(p.categoria || 'Hamburguesas'); setTurno(p.turno || 'Ambos'); setIng(p.ingredientes || ''); setImg(p.imagen_url || ''); setDisponible(Boolean(p.disponible));
                }}>
                  <Text style={styles.textoAgregar}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.botonAgregar, { backgroundColor: '#7F1D1D' }]} onPress={async () => { await eliminarProductoAdmin(p.id); await cargarTodo(); await recargar(); }}>
                  <Text style={styles.textoAgregar}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
                    {(sec === 'promos' || sec === 'ofertas' || sec === 'novedades') && (
        <View>
          <Text style={styles.titulo}>{sec === 'novedades' ? 'PUBLICAR NOVEDAD' : sec === 'ofertas' ? 'GESTIÓN DE OFERTAS' : 'GESTIÓN DE PROMOCIONES'}</Text>
          <TextInput style={styles.campo} placeholder="Título" placeholderTextColor="#6B7280" value={tituloP} onChangeText={setTituloP} />
          <TextInput style={styles.campo} placeholder="Mensaje o descripción" placeholderTextColor="#6B7280" value={descP} onChangeText={setDescP} />
          {sec !== 'novedades' && (
            <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="numeric" value={precioP} onChangeText={setPrecioP} />
          )}
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 10 }]} onPress={() => subirFoto('promo')} disabled={subiendo}>
            <Text style={styles.textoBoton}>{subiendo ? 'SUBIENDO...' : '📸 SUBIR IMAGEN'}</Text>
          </TouchableOpacity>
          <TextInput style={styles.campo} placeholder="URL de imagen" placeholderTextColor="#6B7280" value={imgP} onChangeText={setImgP} />
          <TouchableOpacity style={[styles.opcionEntrega, activaP && styles.opcionEntregaActiva]} onPress={() => setActivaP(!activaP)}>
            <Text style={{ color: '#FFF', fontWeight: '800' }}>{activaP ? '🟢 Visible al cliente' : '🔴 Oculta'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boton} onPress={() => guardarPromo(sec === 'novedades' ? 'novedad' : sec === 'ofertas' ? 'oferta' : 'promocion')}>
            <Text style={styles.textoBoton}>GUARDAR</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>PUBLICADAS</Text>
          {promos
            .filter(pr => sec === 'novedades' ? pr.tipo === 'novedad' : sec === 'ofertas' ? pr.tipo === 'oferta' : (pr.tipo !== 'oferta' && pr.tipo !== 'novedad'))
            .map(pr => (
              <View key={pr.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>{pr.titulo} {pr.tipo === 'novedad' ? '' : `• S/ ${Number(pr.precio || 0).toFixed(2)}`}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', flex: 1 }]} onPress={() => {
                    setEditPromoId(pr.id); setTituloP(pr.titulo); setDescP(pr.descripcion || ''); setPrecioP(String(pr.precio || 0)); setImgP(pr.imagen_url || ''); setActivaP(Boolean(pr.activa));
                  }}>
                    <Text style={styles.textoBoton}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.boton, { backgroundColor: '#7F1D1D', flex: 1 }]} onPress={async () => { await eliminarPromocionAdmin(pr.id); await cargarTodo(); await recargar(); }}>
                    <Text style={styles.textoBoton}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}

      {sec === 'premios' && (
        <View>
          <Text style={styles.titulo}>PREMIOS Y CANJES</Text>
          <TextInput style={styles.campo} placeholder="Nombre del premio" placeholderTextColor="#6B7280" value={tituloR} onChangeText={setTituloR} />
          <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={descR} onChangeText={setDescR} />
          <TextInput style={styles.campo} placeholder="Puntos requeridos (ej. 500)" placeholderTextColor="#6B7280" keyboardType="numeric" value={ptsR} onChangeText={setPtsR} />
          <TextInput style={styles.campo} placeholder="Stock disponible" placeholderTextColor="#6B7280" keyboardType="numeric" value={stockR} onChangeText={setStockR} />
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 10 }]} onPress={() => subirFoto('premio')} disabled={subiendo}>
            <Text style={styles.textoBoton}>{subiendo ? 'SUBIENDO...' : '📸 SUBIR FOTO DEL PREMIO'}</Text>
          </TouchableOpacity>
          <TextInput style={styles.campo} placeholder="URL imagen" placeholderTextColor="#6B7280" value={imgR} onChangeText={setImgR} />
          <TouchableOpacity style={styles.boton} onPress={guardarRec}><Text style={styles.textoBoton}>GUARDAR PREMIO</Text></TouchableOpacity>

          <Text style={styles.titulo}>PREMIOS ACTIVOS ({recompensas.length})</Text>
          {recompensas.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.titulo} • {r.puntos_requeridos} pts (Stock: {r.stock})</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', flex: 1 }]} onPress={() => {
                  setEditRecId(r.id); setTituloR(r.titulo); setDescR(r.descripcion || ''); setPtsR(String(r.puntos_requeridos)); setStockR(String(r.stock ?? 10)); setImgR(r.imagen_url || ''); setActivaR(Boolean(r.activa));
                }}>
                  <Text style={styles.textoBoton}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#7F1D1D', flex: 1 }]} onPress={async () => { await eliminarRecompensaAdmin(r.id); await cargarTodo(); await recargar(); }}>
                  <Text style={styles.textoBoton}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
                            {sec === 'riders' && (
        <View>
          <Text style={styles.titulo}>REGISTRAR MOTORIZADO</Text>
          <TextInput style={styles.campo} placeholder="Nombre completo" placeholderTextColor="#6B7280" value={nomRider} onChangeText={setNomRider} />
          <TextInput style={styles.campo} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" value={telRider} onChangeText={setTelRider} />
          <TextInput style={styles.campo} placeholder="Contraseña" placeholderTextColor="#6B7280" value={passRider} onChangeText={setPassRider} />
          <TextInput style={styles.campo} placeholder="Horario semanal (ej. Lun a Dom: 12pm - 10pm)" placeholderTextColor="#6B7280" value={horarioNuevoRider} onChangeText={setHorarioNuevoRider} />
          <TouchableOpacity style={styles.boton} onPress={async () => { try { await crearMotorizadoAdmin({ nombre_completo: nomRider, telefono: telRider, password: passRider, direccion_predeterminada: horarioNuevoRider }); setNomRider(''); setTelRider(''); setPassRider(''); await cargarTodo(); mostrarAviso('Listo', 'Motorizado registrado.'); } catch (e) { mostrarAviso('Error', e.message); } }}>
            <Text style={styles.textoBoton}>GUARDAR MOTORIZADO</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>EQUIPO Y HORARIOS SEMANALES ({riders.length})</Text>
          {riders.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.nombreProducto}>{r.nombre_completo} ({r.telefono})</Text>
                <TouchableOpacity style={[styles.botonAgregar, { backgroundColor: '#7F1D1D' }]} onPress={async () => { await eliminarMotorizadoAdmin(r.id); await cargarTodo(); }}>
                  <Text style={styles.textoAgregar}>Eliminar</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.descripcionPedido, { color: DORADO, marginBottom: 4 }]}>Horario semanal asignado:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.campo, { flex: 1, marginBottom: 0, paddingVertical: 9 }]}
                  value={horarioRiderEdit[r.id] || ''}
                  onChangeText={(txt) => setHorarioRiderEdit(prev => ({ ...prev, [r.id]: txt }))}
                />
                <TouchableOpacity style={[styles.boton, { marginTop: 0, paddingVertical: 10, backgroundColor: '#16A34A' }]} onPress={() => guardarHorarioRider(r)}>
                  <Text style={styles.textoBoton}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'clientes' && (
        <View>
          <Text style={styles.titulo}>CLIENTES Y RESTABLECER CLAVES ({clientesList.length})</Text>
          <TextInput
            style={styles.campo}
            placeholder="🔍 Buscar cliente por nombre o teléfono..."
            placeholderTextColor="#6B7280"
            value={busquedaCli}
            onChangeText={setBusquedaCli}
          />
          {clientesList
            .filter(c => !busquedaCli.trim() || (c.nombre_completo || '').toLowerCase().includes(busquedaCli.toLowerCase()) || (c.telefono || '').includes(busquedaCli))
            .map(c => (
              <View key={c.id} style={styles.tarjetaPedido}>
                <Text style={[styles.nombreProducto, { color: DORADO }]}>{c.nombre_completo}</Text>
                <Text style={styles.descripcionPedido}>📱 Teléfono: {c.telefono} • ★ {c.puntos || 0} pts</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TextInput
                    style={[styles.campo, { flex: 1, marginBottom: 0, paddingVertical: 9 }]}
                    placeholder="Nueva contraseña..."
                    placeholderTextColor="#6B7280"
                    value={nuevaClaveCli[c.id] || ''}
                    onChangeText={(txt) => setNuevaClaveCli(prev => ({ ...prev, [c.id]: txt }))}
                  />
                  <TouchableOpacity style={[styles.boton, { marginTop: 0, paddingVertical: 10 }]} onPress={() => restablecerClaveCliente(c)}>
                    <Text style={styles.textoBoton}>Cambiar clave</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}
                  {sec === 'pagos' && (
        <View>
          <Text style={styles.titulo}>MÉTODOS DE PAGO (YAPE / PLIN)</Text>
          <TextInput style={styles.campo} placeholder="Nombre del titular" placeholderTextColor="#6B7280" value={titular} onChangeText={setTitular} />
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#742284', marginBottom: 8 }]} onPress={() => subirFoto('yape')} disabled={subiendo}>
            <Text style={styles.textoBoton}>📸 SUBIR QR YAPE</Text>
          </TouchableOpacity>
          {!!qrYape && <Image source={{ uri: qrYape }} style={{ width: 140, height: 140, alignSelf: 'center', marginBottom: 10, borderRadius: 10 }} />}
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#00B2E3', marginBottom: 8 }]} onPress={() => subirFoto('plin')} disabled={subiendo}>
            <Text style={styles.textoBoton}>📸 SUBIR QR PLIN</Text>
          </TouchableOpacity>
          {!!qrPlin && <Image source={{ uri: qrPlin }} style={{ width: 140, height: 140, alignSelf: 'center', marginBottom: 10, borderRadius: 10 }} />}
          <TouchableOpacity style={styles.boton} onPress={() => guardarPagos()}><Text style={styles.textoBoton}>GUARDAR MÉTODOS DE PAGO</Text></TouchableOpacity>
        </View>
      )}

      {sec === 'config' && (
        <View>
          <Text style={styles.titulo}>ESTADO DEL LOCAL Y DELIVERY</Text>
          <View style={[styles.tarjetaPedido, { borderColor: localCerrado ? ROJO : '#16A34A' }]}>
            <Text style={[styles.nombreProducto, { marginBottom: 6 }]}>Estado actual: {localCerrado ? '🔴 CERRADO' : '🟢 ABIERTO'}</Text>
            <TouchableOpacity style={[styles.boton, { backgroundColor: localCerrado ? '#16A34A' : ROJO }]} onPress={() => guardarPagos(!localCerrado)}>
              <Text style={styles.textoBoton}>{localCerrado ? 'ABRIR LOCAL AHORA' : 'CERRAR LOCAL TEMPORALMENTE'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.titulo}>TARIFAS DE DELIVERY GPS</Text>
          <TextInput style={styles.campo} placeholder="Latitud del local" placeholderTextColor="#6B7280" value={latLocal} onChangeText={setLatLocal} />
          <TextInput style={styles.campo} placeholder="Longitud del local" placeholderTextColor="#6B7280" value={lngLocal} onChangeText={setLngLocal} />
          <TextInput style={styles.campo} placeholder="Tarifa base S/" placeholderTextColor="#6B7280" keyboardType="numeric" value={tarifaBase} onChangeText={setTarifaBase} />
          <TextInput style={styles.campo} placeholder="Tarifa por km S/" placeholderTextColor="#6B7280" keyboardType="numeric" value={tarifaKm} onChangeText={setTarifaKm} />
          <TouchableOpacity style={styles.boton} onPress={() => guardarPagos()}><Text style={styles.textoBoton}>GUARDAR CONFIGURACIÓN</Text></TouchableOpacity>
        </View>
      )}

      {sec === 'historial' && (
        <View>
          <Text style={styles.titulo}>EFECTIVO PENDIENTE POR MOTORIZADO ({listaEfectivoRiders.length})</Text>
          {listaEfectivoRiders.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Ningún motorizado tiene efectivo pendiente por rendir.</Text></View>
          ) : (
            listaEfectivoRiders.map(item => (
              <View key={item.id} style={[styles.tarjetaPedido, { borderColor: DORADO }]}>
                <Text style={[styles.nombreProducto, { color: DORADO }]}>🛵 {item.nombre}</Text>
                <Text style={styles.descripcionPedido}>Pedidos cobrados en efectivo sin rendir: {item.cantidad}</Text>
                <Text style={styles.totalPedidoTexto}>Monto por entregar en caja: S/ {item.monto.toFixed(2)}</Text>
                <TouchableOpacity
                  style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 10 }]}
                  onPress={() => confirmarLiquidacionRider(item)}
                >
                  <Text style={styles.textoBoton}>✅ CONFIRMAR EFECTIVO RECIBIDO EN CAJA</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <Text style={styles.titulo}>CIERRE DE CAJA DE HOY ({hoyStr})</Text>
          <View style={styles.tarjetaPedido}>
            <Text style={[styles.nombreProducto, { color: DORADO, marginBottom: 6 }]}>Total cobrado hoy: S/ {ventasHoy.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>💵 Efectivo: S/ {ventasHoyEfectivo.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>🟣 Yape: S/ {ventasHoyYape.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>🔵 Plin: S/ {ventasHoyPlin.toFixed(2)}</Text>
          </View>

          <Text style={styles.titulo}>HISTORIAL DE VENTAS MENSUAL</Text>
          <TextInput style={styles.campo} placeholder="Mes (AAAA-MM)" placeholderTextColor="#6B7280" value={filtroMes} onChangeText={setFiltroMes} />
          <View style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>Total vendido ({filtroMes}): S/ {totalMes.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>Pedidos completados: {historialFiltrado.length} • Total delivery: S/ {totalDeliveryMes.toFixed(2)}</Text>
          </View>
          {historialFiltrado.map(p => (
            <View key={p.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
              <Text style={styles.descripcionPedido}>Total: S/ {Number(p.total || 0).toFixed(2)} ({p.metodo_pago})</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
