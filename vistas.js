import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { styles } from './estilos';
import { categorias } from './servicios';
import { NavegacionSuperior, LOGO } from './pantallas';
import { mostrarAviso } from './avisos';

function aMinutos(hhmm, def) {
  const p = String(hhmm || def).split(':');
  return p.length === 2 ? Number(p) * 60 + Number(p) : 0;
}

function obtenerTurnoPeru(cfg) {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const peru = new Date(utc - 5 * 3600000);
  const min = peru.getHours() * 60 + peru.getMinutes();
  const mIni = aMinutos(cfg?.manana_inicio, '06:50'), mFin = aMinutos(cfg?.manana_fin, '11:00');
  const nIni = aMinutos(cfg?.noche_inicio, '18:30'), nFin = aMinutos(cfg?.noche_fin, '23:50');
  if (min >= mIni && min <= mFin) return 'manana';
  if (min >= nIni && min <= nFin) return 'noche';
  return 'cerrado';
}

export function VistaInicio({ usuario, datos, productos, recompensas, promociones, cfgPagos, navInfo, irA, carrito, setCarrito, categoriaActiva, setCategoriaActiva, onConfirmarPedido, onCanjear, onRecibirPedido, onCancelarPedido, cerrarSesion, cargando }) {
  const [subVista, setSubVista] = useState(navInfo?.tab || 'inicio');
  const [prodDetalle, setProdDetalle] = useState(null);
  const [canjeConfirmar, setCanjeConfirmar] = useState(null);
  const [confirmarPedModal, setConfirmarPedModal] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState('DELIVERY');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState('Yape');

  useEffect(() => { if (navInfo?.tab) { setProdDetalle(null); setCanjeConfirmar(null); setConfirmarPedModal(false); setSubVista(navInfo.tab); } }, [navInfo]);

  const listaCategorias = Array.isArray(categorias) && categorias.length ? ['Todas', ...categorias] : ['Todas', ...new Set((productos || []).map(p => p.categoria).filter(Boolean))];
  const catSel = categoriaActiva || 'Todas';
  const filtrados = catSel === 'Todas' ? (productos || []) : (productos || []).filter(p => p.categoria === catSel);
  const totalItems = (carrito || []).reduce((a, i) => a + i.cantidad, 0);
  const subtotal = (carrito || []).reduce((a, b) => a + Number(b.precio) * b.cantidad, 0);

  function agregar(p, esPromo = false) {
    if (obtenerTurnoPeru(cfgPagos) === 'cerrado') return mostrarAviso('Local cerrado', `Horario: ${cfgPagos?.manana_inicio || '06:50'} - ${cfgPagos?.manana_fin || '11:00'} y ${cfgPagos?.noche_inicio || '18:30'} - ${cfgPagos?.noche_fin || '23:50'}.`);
    const stockActual = p.stock != null ? Number(p.stock) : 10;
    const ex = (carrito || []).find(i => i.id === p.id);
    if (stockActual <= 0 || (ex ? ex.cantidad : 0) + 1 > stockActual) return mostrarAviso('Sin stock', 'No hay más unidades disponibles.');
    const item = esPromo ? { ...p, nombre: p.titulo, es_promo: true } : p;
    setCarrito(ex ? carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...(carrito || []), { ...item, cantidad: 1 }]);
    mostrarAviso('Agregado', `${item.nombre} añadido al carrito.`);
  }

  function intentarCanjear(r) {
    if (obtenerTurnoPeru(cfgPagos) === 'cerrado') return mostrarAviso('Local cerrado', 'Solo puedes canjear en horario de atención.');
    setCanjeConfirmar(r);
  }
  const barraInferior = (
    <View style={{ backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
      {totalItems > 0 && subVista !== 'carrito' && (
        <TouchableOpacity onPress={() => setSubVista('carrito')} style={{ backgroundColor: '#D32F2F', alignSelf: 'center', marginTop: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>🛒 CARRITO ({totalItems})</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>S/ {subtotal.toFixed(2)} →</Text>
        </TouchableOpacity>
      )}
      <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 2, justifyContent: 'space-around' }}>
        {[
          { id: 'menu', ico: '🍽️', txt: 'Menú' },
          { id: 'pedidos', ico: '📦', txt: 'Pedido' },
          { id: 'puntos', ico: '⭐', txt: 'Puntos' },
          { id: 'canjear', ico: '🎁', txt: 'Canjes' },
          { id: 'ofertas', ico: '⚡', txt: 'Ofertas' },
          { id: 'promos', ico: '🔥', txt: 'Promos' }
        ].map(b => (
          <TouchableOpacity key={b.id} onPress={() => { setProdDetalle(null); setCanjeConfirmar(null); setConfirmarPedModal(false); setSubVista(b.id); }} style={{ alignItems: 'center', flex: 1, paddingVertical: 4, borderRadius: 8, backgroundColor: subVista === b.id ? '#241B08' : 'transparent' }}>
            <Text style={{ fontSize: 15 }}>{b.ico}</Text>
            <Text style={{ color: subVista === b.id ? '#F5B041' : '#CCCCCC', fontSize: 10, fontWeight: '800', marginTop: 2 }}>{b.txt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (subVista === 'inicio') {
    return (
      <View style={styles.pantallaCompleta}>
        <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { alignItems: 'center', paddingBottom: 24 }]}>
          <Image source={LOGO} style={{ width: 150, height: 150, borderRadius: 75, marginBottom: 12, borderWidth: 2, borderColor: '#F5B041' }} />
          <Text style={{ color: '#F5B041', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>¡Bienvenido, {usuario?.nombre_completo}!</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 4 }}>Tienes {datos?.puntos ?? 0} PUNTOS acumulados</Text>
          <Text style={{ color: '#CCCCCC', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 18 }}>Elige una opción abajo o explora nuestros platos</Text>
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {[
              { id: 'menu', txt: '🍽️ MENÚ', color: '#F5B041', texto: '#111' },
              { id: 'pedidos', txt: '📦 PEDIDO', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'puntos', txt: '⭐ PUNTOS', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'canjear', txt: '🎁 CANJES', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'ofertas', txt: '⚡ OFERTAS', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'promos', txt: '🔥 PROMOCIONES', color: '#1E1E1E', texto: '#F5B041' }
            ].map(btn => (
              <TouchableOpacity key={btn.id} onPress={() => setSubVista(btn.id)} style={{ width: '48%', backgroundColor: btn.color, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F5B041' }}>
                <Text style={{ color: btn.texto, fontSize: 13, fontWeight: '900' }}>{btn.txt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={cerrarSesion} style={{ marginTop: 22, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#B71C1C' }}>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </ScrollView>
        {barraInferior}
      </View>
    );
}
  return (
    <View style={styles.pantallaCompleta}>
      <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
        <NavegacionSuperior regresar={() => { if (prodDetalle) return setProdDetalle(null); setSubVista('inicio'); }} irAInicio={() => setSubVista('inicio')} />
        <View style={styles.filaSaludo}>
          <View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo} • {datos?.puntos ?? 0} PTS</Text></View>
          <TouchableOpacity style={{ backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }} onPress={() => setSubVista('carrito')}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>🛒 CARRITO ({totalItems})</Text>
          </TouchableOpacity>
        </View>
        {(subVista === 'promos' || subVista === 'ofertas') && (
          <View>
            <Text style={styles.titulo}>{subVista === 'promos' ? 'PROMOCIONES' : 'OFERTAS DEL DÍA'}</Text>
            {(promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay {subVista} activas por el momento.</Text></View>
            ) : (promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).map(pr => {
              const st = pr.stock != null ? Number(pr.stock) : 10, sinStock = st <= 0;
              return (
                <View key={pr.id} style={styles.tarjetaPedido}>
                  {!!pr.imagen_url && <Image source={{ uri: pr.imagen_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} />}
                  <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                  {!!pr.descripcion && <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>}
                  <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)} • Stock: {st}</Text>
                  <TouchableOpacity style={[styles.boton, { marginTop: 8, backgroundColor: sinStock ? '#555' : '#F5B041' }]} disabled={sinStock} onPress={() => agregar(pr, true)}>
                    <Text style={[styles.textoBoton, { color: sinStock ? '#CCC' : '#111' }]}>{sinStock ? 'SIN STOCK' : '+ AGREGAR AL CARRITO'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        {subVista === 'puntos' && (
          <View>
            <View style={styles.tarjetaSaldo}>
              <Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text>
              <Text style={styles.numeroSaldo}>{datos?.puntos ?? 0} PTS</Text>
              <Text style={styles.textoSecundarioSaldo}>Gana 10 puntos por cada S/ 1 en tus pedidos</Text>
            </View>
            <Text style={styles.titulo}>HISTORIAL DE PUNTOS</Text>
            {(datos?.historial || []).length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes movimientos de puntos.</Text></View>
            ) : (datos?.historial || []).map((h, idx) => (
              <View key={h.id || idx} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>{h.descripcion || h.motivo || 'Movimiento'}</Text>
                <Text style={[styles.precioProducto, { color: Number(h.cantidad) >= 0 ? '#4CAF50' : '#E53935' }]}>{Number(h.cantidad) >= 0 ? `+${h.cantidad}` : h.cantidad} PTS</Text>
              </View>
            ))}
          </View>
        )}
        {subVista === 'canjear' && (
          <View>
            <View style={[styles.tarjetaSaldo, { paddingVertical: 12, marginBottom: 12 }]}><Text style={styles.etiquetaSaldo}>TUS PUNTOS: {datos?.puntos ?? 0} PTS</Text></View>
            <Text style={styles.titulo}>RECOMPENSAS Y CANJES</Text>
            {canjeConfirmar && (
              <View style={[styles.tarjetaPedido, { borderColor: '#F5B041', borderWidth: 2 }]}>
                <Text style={[styles.titulo, { color: '#F5B041', marginBottom: 6 }]}>CONFIRMAR CANJE DE PREMIO</Text>
                <Text style={styles.nombreProducto}>¿Estás seguro de canjear "{canjeConfirmar.titulo}"?</Text>
                <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>Se descontarán {canjeConfirmar.puntos_requeridos} puntos de tu saldo.</Text>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => { onCanjear(canjeConfirmar); setCanjeConfirmar(null); }} disabled={cargando}><Text style={styles.textoBoton}>SI, CONFIRMAR CANJE</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setCanjeConfirmar(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
              </View>
            )}
            {(recompensas || []).filter(r => r.activa !== false).map(r => {
              const st = r.stock != null ? Number(r.stock) : 5, sinStock = st <= 0;
              const puedeCanjear = !sinStock && (datos?.puntos ?? 0) >= Number(r.puntos_requeridos);
              return (
                <View key={r.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>{r.titulo}</Text>
                  <Text style={styles.descripcionPedido}>{r.descripcion}</Text>
                  <Text style={styles.precioProducto}>{r.puntos_requeridos} PTS • Stock: {st}</Text>
                  <TouchableOpacity style={[styles.boton, { backgroundColor: puedeCanjear ? '#F5B041' : '#555' }]} disabled={!puedeCanjear || cargando} onPress={() => intentarCanjear(r)}>
                    <Text style={[styles.textoBoton, { color: puedeCanjear ? '#111' : '#CCC' }]}>{sinStock ? 'SIN STOCK' : puedeCanjear ? 'CANJEAR PREMIO' : 'PUNTOS INSUFICIENTES'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
                      {subVista === 'carrito' && (
          <View>
            <Text style={styles.titulo}>MI CARRITO ({totalItems})</Text>
            {totalItems === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Tu carrito está vacío. Agrega platos desde el Menú.</Text></View>
            ) : (
              <View>
                {(carrito || []).map(it => (
                  <View key={it.id} style={styles.producto}>
                    <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{it.nombre}</Text><Text style={styles.precioProducto}>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</Text></View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TouchableOpacity style={styles.botonAgregar} onPress={() => setCarrito(carrito.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad - 1 } : x).filter(x => x.cantidad > 0))}><Text style={styles.textoAgregar}>-</Text></TouchableOpacity>
                      <Text style={styles.nombreProducto}>{it.cantidad}</Text>
                      <TouchableOpacity style={styles.botonAgregar} onPress={() => setCarrito(carrito.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad + 1 } : x))}><Text style={styles.textoAgregar}>+</Text></TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={styles.tarjetaPedido}>
                  <Text style={styles.titulo}>1. TIPO DE ENTREGA</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {[{ id: 'DELIVERY', txt: 'DELIVERY' }, { id: 'RECOJO', txt: 'RECOJO EN LOCAL' }].map(op => (
                      <TouchableOpacity key={op.id} onPress={() => setTipoEntrega(op.id)} style={[styles.opcionEntrega, tipoEntrega === op.id && styles.opcionEntregaActiva, { flex: 1 }]}>
                        <Text style={{ color: tipoEntrega === op.id ? '#111' : '#FFF', fontWeight: '900', fontSize: 12, textAlign: 'center' }}>{op.txt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {tipoEntrega === 'DELIVERY' && (
                    <View style={{ marginTop: 8 }}>
                      <TextInput style={[styles.campo, { marginTop: 6, color: '#FFF' }]} placeholder="Distrito (ej. San Borja, Surco...)" placeholderTextColor="#777" value={distrito} onChangeText={setDistrito} />
                      <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Dirección exacta y referencia" placeholderTextColor="#777" value={direccion} onChangeText={setDireccion} />
                    </View>
                  )}
                  <TextInput style={[styles.campo, { marginTop: 8, color: '#FFF' }]} placeholder="Notas para cocina o motorizado (opcional)" placeholderTextColor="#777" value={notas} onChangeText={setNotas} />
                </View>
                <View style={styles.tarjetaPedido}>
                  <Text style={styles.titulo}>2. MÉTODO DE PAGO</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {['Yape', 'Plin', 'Efectivo'].map(mp => (
                      <TouchableOpacity key={mp} onPress={() => setMetodoPago(mp)} style={[styles.opcionEntrega, metodoPago === mp && styles.opcionEntregaActiva, { flex: 1 }]}>
                        <Text style={{ color: metodoPago === mp ? '#111' : '#FFF', fontWeight: '900', fontSize: 12, textAlign: 'center' }}>{mp.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {metodoPago === 'Yape' && (
                    <View style={{ alignItems: 'center', marginTop: 12, padding: 10, backgroundColor: '#111', borderRadius: 10 }}>
                      <Text style={{ color: '#F5B041', fontWeight: '900', marginBottom: 6 }}>ESCANEA NUESTRO QR YAPE ({cfgPagos?.titular || 'Club Sazón'})</Text>
                      {cfgPagos?.qr_yape ? <Image source={{ uri: cfgPagos.qr_yape }} style={{ width: 200, height: 200, borderRadius: 10 }} /> : <Text style={{ color: '#AAA', fontSize: 12 }}>QR Yape disponible al confirmar.</Text>}
                    </View>
                  )}
                  {metodoPago === 'Plin' && (
                    <View style={{ alignItems: 'center', marginTop: 12, padding: 10, backgroundColor: '#111', borderRadius: 10 }}>
                      <Text style={{ color: '#F5B041', fontWeight: '900', marginBottom: 6 }}>ESCANEA NUESTRO QR PLIN ({cfgPagos?.titular || 'Club Sazón'})</Text>
                      {cfgPagos?.qr_plin ? <Image source={{ uri: cfgPagos.qr_plin }} style={{ width: 200, height: 200, borderRadius: 10 }} /> : <Text style={{ color: '#AAA', fontSize: 12 }}>QR Plin disponible al confirmar.</Text>}
                    </View>
                  )}
                  {metodoPago === 'Efectivo' && <Text style={[styles.descripcionPedido, { marginTop: 10, color: '#4CAF50' }]}>Pagarás en efectivo al recibir tu pedido.</Text>}
                </View>
                                    <View style={styles.tarjetaPedido}>
                  <Text style={styles.totalPedidoTexto}>TOTAL A PAGAR: S/ {subtotal.toFixed(2)}</Text>
                  {!confirmarPedModal ? (
                    <TouchableOpacity style={styles.boton} onPress={() => {
                      if (tipoEntrega === 'DELIVERY' && (!distrito.trim() || !direccion.trim())) return mostrarAviso('Falta dirección', 'Ingresa tu distrito y dirección para el delivery.');
                      setConfirmarPedModal(true);
                    }}><Text style={styles.textoBoton}>CONTINUAR Y CONFIRMAR PAGO</Text></TouchableOpacity>
                  ) : (
                    <View style={{ marginTop: 10, padding: 12, backgroundColor: '#111', borderRadius: 10, borderWidth: 1.5, borderColor: '#F5B041' }}>
                      <Text style={{ color: '#F5B041', fontWeight: '900', fontSize: 14, marginBottom: 6 }}>CONFIRMAR PEDIDO AHORA</Text>
                      <Text style={styles.descripcionPedido}>Entrega: {tipoEntrega} • Pago: {metodoPago} • Total: S/ {subtotal.toFixed(2)}</Text>
                      <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} disabled={cargando} onPress={() => {
                        setConfirmarPedModal(false);
                        onConfirmarPedido({
                          numero_pedido: 'CS-' + Math.floor(100000 + Math.random() * 900000),
                          cliente_id: usuario.id,
                          tipo_entrega: tipoEntrega,
                          distrito: tipoEntrega === 'DELIVERY' ? distrito.trim() : null,
                          direccion: tipoEntrega === 'DELIVERY' ? direccion.trim() : null,
                          notas: notas.trim() || null,
                          metodo_pago: metodoPago,
                          pago_confirmado: metodoPago !== 'Efectivo',
                          subtotal,
                          costo_delivery: 0,
                          total: subtotal,
                          estado: 'Pendiente de confirmación'
                        }, carrito);
                      }}><Text style={styles.textoBoton}>SI, ENVIAR PEDIDO</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setConfirmarPedModal(false)}><Text style={styles.textoBoton}>REVISAR DATOS</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      {barraInferior}
    </View>
  );
                    }
