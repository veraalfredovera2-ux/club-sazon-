import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform, Modal, Linking } from 'react-native';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { LOGO } from './pantallas';
import { mostrarAviso, pedirConfirmacion, reproducirTimbreAlerta } from './avisos';
import {
  categorias, obtenerCatalogo, guardarProductoAdmin, eliminarProductoAdmin,
  obtenerPromociones, guardarPromocionAdmin, eliminarPromocionAdmin,
  obtenerRecompensas, guardarRecompensaAdmin, eliminarRecompensaAdmin,
  obtenerMotorizados, crearMotorizadoAdmin, eliminarMotorizadoAdmin, actualizarHorarioRiderAdmin,
  obtenerClientesAdmin, cambiarClaveClienteAdmin, liquidarEfectivoRiderAdmin, liquidarPedidoIndividualAdmin, actualizarEstadoPedidoAdmin,
  obtenerConfigPagos, guardarConfigPagos, subirImagenGaleria
} from './servicios';

export function VistaAdmin({ usuario, pedidos, recargar, onConfirmarAdmin, onCompletar, onCancelar, cerrarSesion, cargando }) {
  const [sec, setSec] = useState('pedidos');
  const [subPromos, setSubPromos] = useState('promociones');
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [riders, setRiders] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqCli, setBusqCli] = useState('');
  const [clavesNuevas, setClavesNuevas] = useState({});
  const [horariosEdit, setHorariosEdit] = useState({});
  const [nuevoRider, setNuevoRider] = useState({ nombre_completo: '', telefono: '', password: '', direccion_predeterminada: 'Lun a Dom: 12:00 pm - 10:00 pm' });
  const [cfg, setCfg] = useState({ titularLimpio: 'Club Sazón', qr_yape: '', qr_plin: '', local_lat: '-12.089700', local_lng: '-77.003100', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false });
  const [editProd, setEditProd] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const idsConocidosRef = useRef(null);

  useEffect(() => { cargarTablas(); }, []);

  useEffect(() => {
    const lista = pedidos || [];
    if (idsConocidosRef.current === null) {
      idsConocidosRef.current = new Set(lista.map(p => p.id));
      return;
    }
    const nuevos = lista.filter(p => !idsConocidosRef.current.has(p.id) && p.estado === 'Pendiente');
    lista.forEach(p => idsConocidosRef.current.add(p.id));
    if (nuevos.length > 0 && sonidoActivo) {
      reproducirTimbreAlerta();
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🍔 ¡Nuevo pedido en Club Sazón!', {
            body: `Pedido ${nuevos.at(0).numero_pedido} por S/ ${Number(nuevos.at(0).total || 0).toFixed(2)}`
          });
        } catch (e) {}
      }
    }
  }, [pedidos, sonidoActivo]);

  async function cargarTablas() {
    try {
      const [c, pr, rec, cPagos, rds, clis] = await Promise.all([
        obtenerCatalogo(false), obtenerPromociones(false), obtenerRecompensas(false),
        obtenerConfigPagos(), obtenerMotorizados(), obtenerClientesAdmin()
      ]);
      setCatalogo(c); setPromos(pr); setRecompensas(rec);
      setRiders(rds); setClientes(clis);
      if (cPagos) setCfg(prev => ({ ...prev, ...cPagos }));
    } catch (e) {}
  }

  async function manejarSubida(alCompletar) {
    setSubiendoImg(true);
    try {
      const url = await subirImagenGaleria();
      if (url) { alCompletar(url); mostrarAviso('Imagen cargada', 'La foto se comprimió y quedó lista para guardar.'); }
    } catch (e) { mostrarAviso('Error al subir', e.message); } finally { setSubiendoImg(false); }
  }

  function capturarGpsLocal() {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      return mostrarAviso('GPS no disponible', 'Ingresa latitud y longitud manualmente.');
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCfg(prev => ({ ...prev, local_lat: pos.coords.latitude.toFixed(6), local_lng: pos.coords.longitude.toFixed(6) }));
        mostrarAviso('Ubicación capturada', 'Coordenadas del local listas. Pulsa Guardar.');
      },
      () => mostrarAviso('Permiso denegado', 'Activa el GPS en tu navegador para capturar la ubicación del local.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function confirmarEliminar(titulo, mensaje, accion) {
    pedirConfirmacion(titulo, mensaje, async () => {
      try { await accion(); await cargarTablas(); mostrarAviso('Eliminado', 'El registro fue eliminado.'); }
      catch (e) { mostrarAviso('Error', e.message); }
    });
  }

  function abrirWhatsAppDirecto(telefono, texto) {
    const limpio = String(telefono || '').replace(/\D/g, '');
    if (!limpio) return mostrarAviso('Sin teléfono', 'No hay número registrado.');
    const telFinal = limpio.length === 9 ? '51' + limpio : limpio;
    const baseWa = 'https://wa.me';
    Linking.openURL(`${baseWa}${telFinal}?text=${encodeURIComponent(texto)}`);
  }

  const activos = (pedidos || []).filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado');
  const historial = (pedidos || []).filter(p => p.estado === 'Completado' || p.estado === 'Cancelado');
  const completados = historial.filter(p => p.estado === 'Completado');
  const ventasTotales = completados.reduce((acc, p) => acc + Number(p.total || 0), 0);

  const tabs = [
    { id: 'pedidos', label: `Pedidos (${activos.length})` },
    { id: 'historial', label: 'Historial / Caja' },
    { id: 'platos', label: 'Platos' },
    { id: 'promos', label: 'Promos / Ofertas' },
    { id: 'puntos', label: 'Puntos' },
    { id: 'riders', label: 'Motorizados' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'pagos', label: 'Pagos y Delivery' }
  ];
  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Modal transparent animationType="fade" visible={Boolean(imgPreview)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: TARJETA, borderRadius: 16, borderWidth: 1.5, borderColor: DORADO, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: DORADO, fontWeight: '900', fontSize: 15, marginBottom: 10 }}>COMPROBANTE DE PAGO</Text>
            {!!imgPreview && <Image source={{ uri: imgPreview }} style={{ width: '100%', height: 340, borderRadius: 10, backgroundColor: '#000' }} resizeMode="contain" />}
            <TouchableOpacity style={[styles.boton, { width: '100%', marginTop: 12 }]} onPress={() => setImgPreview(null)}>
              <Text style={styles.textoBoton}>Cerrar vista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.barraSuperior}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={LOGO} style={styles.logoBarra} />
          <View>
            <Text style={styles.tituloBarra}>PANEL ADMINISTRACIÓN</Text>
            <Text style={{ color: DORADO, fontSize: 11, fontWeight: '700' }}>{usuario.nombre_completo}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={async () => {
              const nuevoEstado = !sonidoActivo;
              setSonidoActivo(nuevoEstado);
              if (nuevoEstado) {
                reproducirTimbreAlerta();
                if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                  try { await Notification.requestPermission(); } catch (e) {}
                }
                mostrarAviso('🔔 Alertas sonoras activadas', 'Acabas de escuchar el timbre de prueba. Cada nuevo pedido sonará automáticamente.');
              }
            }}
            style={{ backgroundColor: sonidoActivo ? '#16A34A' : '#374151', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{sonidoActivo ? '🔔 ON' : '🔕 OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={cerrarSesion} style={{ backgroundColor: '#252530', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tabs.map(t => (
            <TouchableOpacity key={t.id} style={[styles.categoria, sec === t.id && styles.categoriaActiva]} onPress={() => setSec(t.id)}>
              <Text style={styles.textoCategoria}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {sec === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>PEDIDOS EN TIEMPO REAL ({activos.length})</Text>
          {activos.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos pendientes en este momento.</Text></View>
          ) : (
            activos.map(p => {
              const esDel = p.tipo_entrega === 'DELIVERY';
              const partsComp = String(p.notas || '').split('| COMPROBANTE:');
              const notaLimpia = (partsComp.at(0) || '').trim();
              const urlComp = partsComp.length > 1 ? partsComp.at(1).trim() : '';
              const telCliente = p.perfiles?.telefono || '';
              return (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                    <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
                  </View>
                  <Text style={styles.descripcionPedido}>Tel: {telCliente} • {p.tipo_entrega} • Pago: {p.metodo_pago}</Text>
                  <Text style={[styles.descripcionPedido, { color: DORADO, fontWeight: '800' }]}>
                    {p.recibido_cliente ? '✅ Recepción confirmada por cliente' : '⏳ Pendiente de recepción por cliente'}
                  </Text>
                  {esDel && <Text style={styles.descripcionPedido}>Dir: {p.distrito} - {String(p.direccion || '').split('|').at(0)}</Text>}
                  {!!notaLimpia && <Text style={[styles.descripcionPedido, { color: DORADO }]}>Nota: {notaLimpia}</Text>}
                  {!!urlComp && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#7C3AED', marginTop: 6, paddingVertical: 8 }]} onPress={() => setImgPreview(urlComp)}>
                      <Text style={styles.textoBoton}>🧾 VER CAPTURA DE PAGO ({p.metodo_pago.toUpperCase()})</Text>
                    </TouchableOpacity>
                  )}
                  {(p.pedido_detalles || []).map(d => (
                    <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto} (S/ {Number(d.subtotal).toFixed(2)})</Text>
                  ))}
                  {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: '#38BDF8', fontWeight: '800' }]}>Motorizado: {p.rider_nombre} ({p.estado_rider})</Text>}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>

                  {!!telCliente && (
                    <TouchableOpacity
                      style={[styles.boton, { backgroundColor: '#128C7E', marginTop: 8, paddingVertical: 9 }]}
                      onPress={() => abrirWhatsAppDirecto(telCliente, `Hola ${p.perfiles?.nombre_completo || ''}, te escribimos de El Sazón Oriental sobre tu pedido ${p.numero_pedido}.`)}
                    >
                      <Text style={styles.textoBoton}>💬 WHATSAPP AL CLIENTE</Text>
                    </TouchableOpacity>
                  )}

                  {p.estado === 'Pendiente' && (
                    <TouchableOpacity style={styles.boton} onPress={() => onConfirmarAdmin(p, esDel)} disabled={cargando}>
                      <Text style={styles.textoBoton}>{esDel ? 'LISTO PARA RECOJO POR REPARTIDOR' : 'CONFIRMAR PEDIDO (EN LOCAL)'}</Text>
                    </TouchableOpacity>
                  )}
                  {p.estado !== 'Pendiente' && esDel && p.estado_rider !== 'Disponible' && !p.rider_id && (
                    <TouchableOpacity
                      style={[styles.boton, { backgroundColor: '#0284C7', marginTop: 6 }]}
                      onPress={async () => {
                        await actualizarEstadoPedidoAdmin(p, 'Listo');
                        await recargar();
                        mostrarAviso('Enviado a Riders', 'El pedido ya aparece disponible para todos los motorizados.');
                      }}
                    >
                      <Text style={styles.textoBoton}>🛵 PUBLICAR PARA REPARTIDORES</Text>
                    </TouchableOpacity>
                  )}
                  {p.estado !== 'Pendiente' && (!esDel || p.recibido_cliente) && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 6 }]} onPress={() => onCompletar(p)} disabled={cargando}>
                      <Text style={styles.textoBoton}>MARCAR ENTREGADO Y DAR PUNTOS</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.boton, styles.botonSecundario]}
                    onPress={() => pedirConfirmacion(
                      'Cancelar y anular pedido',
                      `¿Seguro que deseas cancelar el pedido ${p.numero_pedido}? Si ya había acreditado puntos al cliente, se descontarán automáticamente.`,
                      () => onCancelar(p)
                    )}
                    disabled={cargando}
                  >
                    <Text style={styles.textoBoton}>❌ CANCELAR PEDIDO / ANULAR</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}
                  {sec === 'historial' && (
        <View>
          <View style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>RESUMEN DE VENTAS COMPLETADAS</Text>
            <Text style={[styles.precioProducto, { fontSize: 22, color: '#22C55E', marginTop: 4 }]}>S/ {ventasTotales.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>Pedidos completados: {completados.length} • Cancelados: {historial.length - completados.length}</Text>
          </View>

          <Text style={styles.titulo}>DESGLOSE DE EFECTIVO POR MOTORIZADO</Text>
          {riders.map(r => {
            const pedsEfectivoPendientes = completados.filter(
              p => p.rider_id === r.id && p.metodo_pago === 'Efectivo' && p.estado_rider !== 'Liquidado en caja'
            );
            const totalPendiente = pedsEfectivoPendientes.reduce((a, p) => a + Number(p.total || 0), 0);
            return (
              <View key={r.id} style={styles.tarjetaPedido}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.nombreProducto}>🛵 {r.nombre_completo}</Text>
                  <Text style={{ color: totalPendiente > 0 ? '#EF4444' : '#22C55E', fontWeight: '900', fontSize: 15 }}>
                    {totalPendiente > 0 ? `Debe: S/ ${totalPendiente.toFixed(2)}` : 'Al día ✅'}
                  </Text>
                </View>
                <Text style={styles.descripcionPedido}>Pedidos en efectivo sin liquidar: {pedsEfectivoPendientes.length}</Text>

                {pedsEfectivoPendientes.map(pe => (
                  <View
                    key={pe.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#13131A',
                      borderWidth: 1,
                      borderColor: BORDE,
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 8
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
                        {pe.numero_pedido} • S/ {Number(pe.total || 0).toFixed(2)}
                      </Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                        Cliente: {pe.perfiles?.nombre_completo || 'Cliente'} • {new Date(pe.creado_en).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}
                      onPress={() => pedirConfirmacion(
                        'Liquidar pedido individual',
                        `¿Confirmas que ${r.nombre_completo} entregó los S/ ${Number(pe.total || 0).toFixed(2)} del pedido ${pe.numero_pedido}?`,
                        async () => {
                          await liquidarPedidoIndividualAdmin(pe.id);
                          await recargar();
                          mostrarAviso('Liquidado', `Pedido ${pe.numero_pedido} marcado como recibido en caja.`);
                        }
                      )}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>✅ Recibido</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {totalPendiente > 0 && (
                  <TouchableOpacity
                    style={[styles.boton, { backgroundColor: '#0284C7', marginTop: 10, paddingVertical: 9 }]}
                    onPress={() => pedirConfirmacion(
                      'Liquidar todo el efectivo del repartidor',
                      `¿Confirmas que ${r.nombre_completo} entregó el total completo de S/ ${totalPendiente.toFixed(2)}?`,
                      async () => {
                        await liquidarEfectivoRiderAdmin(r.id);
                        await recargar();
                        mostrarAviso('Caja al día', `Se liquidó todo el efectivo pendiente de ${r.nombre_completo}.`);
                      }
                    )}
                  >
                    <Text style={styles.textoBoton}>💵 LIQUIDAR TODO EL BLOQUE (S/ {totalPendiente.toFixed(2)})</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <Text style={styles.titulo}>HISTORIAL DE VENTAS ({historial.length})</Text>
          {historial.map(p => (
            <View key={p.id} style={styles.tarjetaPedido}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                <View style={[styles.estadoPedido, p.estado === 'Cancelado' && { backgroundColor: '#7F1D1D' }]}>
                  <Text style={styles.textoEstado}>{p.estado}</Text>
                </View>
              </View>
              <Text style={styles.descripcionPedido}>{new Date(p.creado_en).toLocaleString()} • {p.metodo_pago} ({p.tipo_entrega})</Text>
              {p.rider_nombre && <Text style={[styles.descripcionPedido, { color: DORADO }]}>Motorizado: {p.rider_nombre} ({p.estado_rider})</Text>}
              <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
              {p.estado === 'Completado' && (
                <TouchableOpacity
                  style={[styles.boton, styles.botonSecundario, { marginTop: 8 }]}
                  onPress={() => pedirConfirmacion(
                    'Anular venta y descontar puntos',
                    `¿El cliente devolvió el pedido ${p.numero_pedido}? Se cambiará a Cancelado y se le descontarán los puntos ganados en esta compra.`,
                    () => onCancelar(p)
                  )}
                  disabled={cargando}
                >
                  <Text style={styles.textoBoton}>❌ ANULAR PEDIDO Y DESCONTAR PUNTOS</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
                            {sec === 'platos' && (
        <View>
          <TouchableOpacity style={styles.boton} onPress={() => setEditProd({ nombre: '', precio: '', stock: '20', categoria: 'Hamburguesas', turno: 'Ambos', ingredientes: '', imagen_url: '', disponible: true })}>
            <Text style={styles.textoBoton}>+ AGREGAR NUEVO PLATO</Text>
          </TouchableOpacity>
          {editProd && (
            <View style={[styles.tarjetaPedido, { marginTop: 10, borderColor: DORADO }]}>
              <Text style={styles.nombreProducto}>{editProd.id ? 'EDITAR PLATO' : 'NUEVO PLATO'}</Text>
              <TextInput style={styles.campo} placeholder="Nombre del plato" placeholderTextColor="#6B7280" value={editProd.nombre} onChangeText={v => setEditProd({ ...editProd, nombre: v })} />
              <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(editProd.precio)} onChangeText={v => setEditProd({ ...editProd, precio: v })} />
              <TextInput style={styles.campo} placeholder="Stock disponible" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editProd.stock)} onChangeText={v => setEditProd({ ...editProd, stock: v })} />
              <TextInput style={styles.campo} placeholder="Ingredientes / descripción" placeholderTextColor="#6B7280" value={editProd.ingredientes} onChangeText={v => setEditProd({ ...editProd, ingredientes: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8 }]} onPress={() => manejarSubida(url => setEditProd({ ...editProd, imagen_url: url }))} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : '📷 SUBIR FOTO DESDE GALERÍA'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.campo} placeholder="O pega URL de imagen (opcional)" placeholderTextColor="#6B7280" value={editProd.imagen_url} onChangeText={v => setEditProd({ ...editProd, imagen_url: v })} />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Categoría:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {categorias.filter(c => c !== 'Todas').map(c => (
                  <TouchableOpacity key={c} style={[styles.categoria, editProd.categoria === c && styles.categoriaActiva]} onPress={() => setEditProd({ ...editProd, categoria: c })}>
                    <Text style={styles.textoCategoria}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.boton, { backgroundColor: editProd.disponible ? '#16A34A' : '#374151', marginBottom: 6 }]} onPress={() => setEditProd({ ...editProd, disponible: !editProd.disponible })}>
                <Text style={styles.textoBoton}>{editProd.disponible ? '✅ DISPONIBLE EN MENÚ' : '⛔ AGOTADO / OCULTO'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.boton} onPress={async () => { await guardarProductoAdmin(editProd); setEditProd(null); await cargarTablas(); mostrarAviso('Guardado', 'Plato actualizado.'); }}>
                <Text style={styles.textoBoton}>GUARDAR PLATO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditProd(null)}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          {catalogo.map(p => (
            <View key={p.id} style={styles.producto}>
              <Image source={p.imagen_url && p.imagen_url.includes('http') ? { uri: p.imagen_url } : LOGO} style={styles.fotoProducto} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{p.nombre} {!p.disponible ? '(AGOTADO)' : ''}</Text>
                <Text style={styles.descripcionPedido}>{p.categoria} • Stock: {p.stock ?? 0}</Text>
                <Text style={styles.precioProducto}>S/ {Number(p.precio).toFixed(2)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => setEditProd(p)}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => confirmarEliminar('Eliminar plato', `¿Eliminar "${p.nombre}"?`, () => eliminarProductoAdmin(p.id))}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'promos' && (
        <View>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
            {[
              { id: 'promociones', label: 'Promociones' },
              { id: 'ofertas', label: 'Ofertas' },
              { id: 'novedades', label: 'Novedades' }
            ].map(sp => (
              <TouchableOpacity key={sp.id} style={[styles.categoria, subPromos === sp.id && styles.categoriaActiva, { flex: 1, alignItems: 'center' }]} onPress={() => setSubPromos(sp.id)}>
                <Text style={styles.textoCategoria}>{sp.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.boton}
            onPress={() => setEditPromo({
              titulo: '',
              descripcion: '',
              precio: '0',
              imagen_url: '',
              activa: true,
              tipo: subPromos === 'ofertas' ? 'oferta' : subPromos === 'novedades' ? 'novedad' : 'promocion'
            })}
          >
            <Text style={styles.textoBoton}>
              {subPromos === 'ofertas' ? '+ NUEVA OFERTA' : subPromos === 'novedades' ? '+ NUEVA NOVEDAD' : '+ NUEVA PROMOCIÓN'}
            </Text>
          </TouchableOpacity>
          {editPromo && (
            <View style={[styles.tarjetaPedido, { marginTop: 10, borderColor: DORADO }]}>
              <TextInput style={styles.campo} placeholder="Título" placeholderTextColor="#6B7280" value={editPromo.titulo} onChangeText={v => setEditPromo({ ...editPromo, titulo: v })} />
              <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={editPromo.descripcion} onChangeText={v => setEditPromo({ ...editPromo, descripcion: v })} />
              {editPromo.tipo !== 'novedad' && (
                <TextInput style={styles.campo} placeholder="Precio (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(editPromo.precio)} onChangeText={v => setEditPromo({ ...editPromo, precio: v })} />
              )}
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8 }]} onPress={() => manejarSubida(url => setEditPromo({ ...editPromo, imagen_url: url }))} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : '📷 SUBIR FOTO DESDE GALERÍA'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.campo} placeholder="O pega URL imagen" placeholderTextColor="#6B7280" value={editPromo.imagen_url} onChangeText={v => setEditPromo({ ...editPromo, imagen_url: v })} />
              <TouchableOpacity style={styles.boton} onPress={async () => { await guardarPromocionAdmin(editPromo); setEditPromo(null); await cargarTablas(); mostrarAviso('Guardado', 'Publicado con éxito.'); }}>
                <Text style={styles.textoBoton}>GUARDAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditPromo(null)}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          {promos
            .filter(pr => subPromos === 'novedades' ? pr.tipo === 'novedad' : subPromos === 'ofertas' ? pr.tipo === 'oferta' : (pr.tipo !== 'oferta' && pr.tipo !== 'novedad'))
            .map(pr => (
              <View key={pr.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>
                {pr.tipo !== 'novedad' && <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => setEditPromo(pr)}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => confirmarEliminar('Eliminar', `¿Eliminar "${pr.titulo}"?`, () => eliminarPromocionAdmin(pr.id))}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}
                                    {sec === 'puntos' && (
        <View>
          <TouchableOpacity style={styles.boton} onPress={() => setEditRec({ titulo: '', descripcion: '', puntos_requeridos: '500', stock: '10', imagen_url: '', activa: true })}>
            <Text style={styles.textoBoton}>+ NUEVO PREMIO CANJEABLE</Text>
          </TouchableOpacity>
          {editRec && (
            <View style={[styles.tarjetaPedido, { marginTop: 10, borderColor: DORADO }]}>
              <TextInput style={styles.campo} placeholder="Nombre del premio" placeholderTextColor="#6B7280" value={editRec.titulo} onChangeText={v => setEditRec({ ...editRec, titulo: v })} />
              <TextInput style={styles.campo} placeholder="Descripción" placeholderTextColor="#6B7280" value={editRec.descripcion} onChangeText={v => setEditRec({ ...editRec, descripcion: v })} />
              <TextInput style={styles.campo} placeholder="Puntos requeridos" placeholderTextColor="#6B7280" keyboardType="numeric" value={String(editRec.puntos_requeridos)} onChangeText={v => setEditRec({ ...editRec, puntos_requeridos: v })} />
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginBottom: 8 }]} onPress={() => manejarSubida(url => setEditRec({ ...editRec, imagen_url: url }))} disabled={subiendoImg}>
                <Text style={styles.textoBoton}>{subiendoImg ? 'SUBIENDO...' : '📷 SUBIR FOTO DESDE GALERÍA'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.campo} placeholder="O pega URL imagen" placeholderTextColor="#6B7280" value={editRec.imagen_url} onChangeText={v => setEditRec({ ...editRec, imagen_url: v })} />
              <TouchableOpacity style={styles.boton} onPress={async () => { await guardarRecompensaAdmin(editRec); setEditRec(null); await cargarTablas(); mostrarAviso('Guardado', 'Recompensa actualizada.'); }}>
                <Text style={styles.textoBoton}>GUARDAR PREMIO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setEditRec(null)}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          {recompensas.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.titulo}</Text>
              <Text style={[styles.precioProducto, { color: DORADO }]}>{r.puntos_requeridos} puntos</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <TouchableOpacity style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => setEditRec(r)}>
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }} onPress={() => confirmarEliminar('Eliminar premio', `¿Eliminar "${r.titulo}"?`, () => eliminarRecompensaAdmin(r.id))}>
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'riders' && (
        <View>
          <View style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>REGISTRAR NUEVO MOTORIZADO</Text>
            <TextInput style={styles.campo} placeholder="Nombre completo" placeholderTextColor="#6B7280" value={nuevoRider.nombre_completo} onChangeText={v => setNuevoRider({ ...nuevoRider, nombre_completo: v })} />
            <TextInput style={styles.campo} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" value={nuevoRider.telefono} onChangeText={v => setNuevoRider({ ...nuevoRider, telefono: v })} />
            <TextInput style={styles.campo} placeholder="Contraseña de acceso" placeholderTextColor="#6B7280" value={nuevoRider.password} onChangeText={v => setNuevoRider({ ...nuevoRider, password: v })} />
            <TextInput style={styles.campo} placeholder="Horario asignado" placeholderTextColor="#6B7280" value={nuevoRider.direccion_predeterminada} onChangeText={v => setNuevoRider({ ...nuevoRider, direccion_predeterminada: v })} />
            <TouchableOpacity style={styles.boton} onPress={async () => { try { await crearMotorizadoAdmin(nuevoRider); setNuevoRider({ nombre_completo: '', telefono: '', password: '', direccion_predeterminada: 'Lun a Dom: 12:00 pm - 10:00 pm' }); await cargarTablas(); mostrarAviso('Registrado', 'Motorizado creado.'); } catch (e) { mostrarAviso('Error', e.message); } }}>
              <Text style={styles.textoBoton}>CREAR MOTORIZADO</Text>
            </TouchableOpacity>
          </View>
          {riders.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Tel: {r.telefono} • Clave: {r.password_hash}</Text>
              <TextInput style={[styles.campo, { marginTop: 6 }]} value={horariosEdit[r.id] !== undefined ? horariosEdit[r.id] : (r.direccion_predeterminada || '')} onChangeText={v => setHorariosEdit({ ...horariosEdit, [r.id]: v })} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.boton, { flex: 1, backgroundColor: '#16A34A' }]} onPress={async () => { await actualizarHorarioRiderAdmin(r.id, horariosEdit[r.id] ?? r.direccion_predeterminada); await cargarTablas(); mostrarAviso('Guardado', 'Horario actualizado.'); }}>
                  <Text style={styles.textoBoton}>Guardar horario</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#991B1B', paddingHorizontal: 14 }]} onPress={() => confirmarEliminar('Eliminar motorizado', `¿Eliminar a ${r.nombre_completo}?`, () => eliminarMotorizadoAdmin(r.id))}>
                  <Text style={styles.textoBoton}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
                                            {sec === 'clientes' && (
        <View>
          <TextInput style={styles.campo} placeholder="Buscar cliente por nombre o teléfono..." placeholderTextColor="#6B7280" value={busqCli} onChangeText={setBusqCli} />
          {clientes.filter(c => (c.nombre_completo || '').toLowerCase().includes(busqCli.toLowerCase()) || (c.telefono || '').includes(busqCli)).map(c => (
            <View key={c.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{c.nombre_completo}</Text>
              <Text style={styles.descripcionPedido}>Tel: {c.telefono} • Puntos: {c.puntos || 0}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput style={[styles.campo, { flex: 1, marginBottom: 0 }]} placeholder="Nueva contraseña..." placeholderTextColor="#6B7280" value={clavesNuevas[c.id] || ''} onChangeText={v => setClavesNuevas({ ...clavesNuevas, [c.id]: v })} />
                <TouchableOpacity style={[styles.boton, { marginTop: 0, paddingHorizontal: 14 }]} onPress={async () => { if (!clavesNuevas[c.id] || clavesNuevas[c.id].length < 4) return mostrarAviso('Clave corta', 'Mínimo 4 caracteres.'); await cambiarClaveClienteAdmin(c.id, clavesNuevas[c.id].trim()); setClavesNuevas({ ...clavesNuevas, [c.id]: '' }); mostrarAviso('Actualizada', 'Contraseña cambiada con éxito.'); }}>
                  <Text style={styles.textoBoton}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {sec === 'pagos' && (
        <View style={styles.tarjetaPedido}>
          <Text style={styles.nombreProducto}>ESTADO DEL LOCAL</Text>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: cfg.local_cerrado ? '#991B1B' : '#16A34A', marginBottom: 14 }]}
            onPress={() => setCfg({ ...cfg, local_cerrado: !cfg.local_cerrado })}
          >
            <Text style={styles.textoBoton}>{cfg.local_cerrado ? '🔒 LOCAL CERRADO (TOCA PARA ABRIR)' : '🟢 LOCAL ABIERTO (TOCA PARA CERRAR)'}</Text>
          </TouchableOpacity>

          <Text style={styles.nombreProducto}>UBICACIÓN Y TARIFAS DELIVERY</Text>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#0284C7', marginBottom: 8 }]} onPress={capturarGpsLocal}>
            <Text style={styles.textoBoton}>📍 USAR MI UBICACIÓN ACTUAL COMO LOCAL</Text>
          </TouchableOpacity>
          <TextInput style={styles.campo} placeholder="Latitud local" placeholderTextColor="#6B7280" value={String(cfg.local_lat)} onChangeText={v => setCfg({ ...cfg, local_lat: v })} />
          <TextInput style={styles.campo} placeholder="Longitud local" placeholderTextColor="#6B7280" value={String(cfg.local_lng)} onChangeText={v => setCfg({ ...cfg, local_lng: v })} />
          <TextInput style={styles.campo} placeholder="Tarifa base delivery (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(cfg.tarifa_base)} onChangeText={v => setCfg({ ...cfg, tarifa_base: v })} />
          <TextInput style={styles.campo} placeholder="Costo por kilómetro adicional (S/)" placeholderTextColor="#6B7280" keyboardType="decimal-pad" value={String(cfg.tarifa_km)} onChangeText={v => setCfg({ ...cfg, tarifa_km: v })} />

          <Text style={[styles.nombreProducto, { marginTop: 10 }]}>CUENTAS Y QR DE PAGO</Text>
          <TextInput style={styles.campo} placeholder="Nombre del titular" placeholderTextColor="#6B7280" value={cfg.titularLimpio} onChangeText={v => setCfg({ ...cfg, titularLimpio: v })} />
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#742284', marginBottom: 8 }]} onPress={() => manejarSubida(url => setCfg({ ...cfg, qr_yape: url }))} disabled={subiendoImg}>
            <Text style={styles.textoBoton}>📷 SUBIR QR YAPE DESDE GALERÍA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#00B2E3', marginBottom: 8 }]} onPress={() => manejarSubida(url => setCfg({ ...cfg, qr_plin: url }))} disabled={subiendoImg}>
            <Text style={styles.textoBoton}>📷 SUBIR QR PLIN DESDE GALERÍA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boton} onPress={async () => { await guardarConfigPagos(cfg); mostrarAviso('Guardado', 'Configuración actualizada en la nube.'); }}>
            <Text style={styles.textoBoton}>GUARDAR TODA LA CONFIGURACIÓN</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
        }
