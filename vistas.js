import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styles } from './estilos';
import { categorias } from './servicios';
import { NavegacionSuperior, LOGO } from './pantallas';
import { mostrarAviso } from './avisos';

function obtenerTurnoPeru() {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const peru = new Date(utc - 5 * 3600000);
  const min = peru.getHours() * 60 + peru.getMinutes();
  if (min >= (6 * 60 + 50) && min <= (11 * 60)) return 'manana';
  if (min >= (18 * 60 + 30) && min <= (23 * 60 + 50)) return 'noche';
  return 'cerrado';
}

function evaluarHorarioProducto(p) {
  const turnoActual = obtenerTurnoPeru();
  if (turnoActual === 'cerrado') return { abierto: false, disponibleTurno: false };
  const tProd = p.turno || 'ambos';
  if (tProd === 'ambos') return { abierto: true, disponibleTurno: true };
  return { abierto: true, disponibleTurno: tProd === turnoActual };
}

export function VistaInicio({ usuario, datos, productos, recompensas, promociones, cfgPagos, navInfo, irA, carrito, setCarrito, categoriaActiva, setCategoriaActiva, onConfirmarPedido, onCanjear, onRecibirPedido, onCancelarPedido, cerrarSesion, cargando }) {
  const [subVista, setSubVista] = useState(navInfo?.tab || 'inicio');
  const [prodDetalle, setProdDetalle] = useState(null);
  const [canjeConfirmar, setCanjeConfirmar] = useState(null);

  useEffect(() => { if (navInfo?.tab) { setProdDetalle(null); setCanjeConfirmar(null); setSubVista(navInfo.tab); } }, [navInfo]);

  const listaCategorias = Array.isArray(categorias) && categorias.length ? ['Todas', ...categorias] : ['Todas', ...new Set((productos || []).map(p => p.categoria).filter(Boolean))];
  const catSel = categoriaActiva || 'Todas';
  const filtrados = catSel === 'Todas' ? (productos || []) : (productos || []).filter(p => p.categoria === catSel);
  const totalItems = (carrito || []).reduce((a, i) => a + i.cantidad, 0);

  function agregar(p, esPromo = false) {
    if (obtenerTurnoPeru() === 'cerrado') return mostrarAviso('Local cerrado', 'Nuestro horario de atención es de 6:50am a 11:00am y de 6:30pm a 11:50pm.');
    const stockActual = p.stock != null ? Number(p.stock) : 10;
    const ex = (carrito || []).find(i => i.id === p.id);
    if (stockActual <= 0 || (ex ? ex.cantidad : 0) + 1 > stockActual) return mostrarAviso('Sin stock', 'No hay más unidades disponibles.');
    const item = esPromo ? { ...p, nombre: p.titulo, es_promo: true } : p;
    setCarrito(ex ? carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...(carrito || []), { ...item, cantidad: 1 }]);
    mostrarAviso('Agregado', `${item.nombre} añadido al carrito.`);
  }

  function intentarCanjear(r) {
    if (obtenerTurnoPeru() === 'cerrado') return mostrarAviso('Local cerrado', 'Solo puedes canjear en horario de atención.');
    setCanjeConfirmar(r);
  }

  const barraInferior = (
    <View style={{ flexDirection: 'row', backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingVertical: 8, paddingHorizontal: 2, justifyContent: 'space-around' }}>
      {[
        { id: 'menu', ico: '🍽️', txt: 'Menú' },
        { id: 'pedidos', ico: '📦', txt: 'Pedido' },
        { id: 'puntos', ico: '⭐', txt: 'Puntos' },
        { id: 'canjear', ico: '🎁', txt: 'Canjes' },
        { id: 'ofertas', ico: '⚡', txt: 'Ofertas' },
        { id: 'promos', ico: '🔥', txt: 'Promos' }
      ].map(b => (
        <TouchableOpacity key={b.id} onPress={() => { setProdDetalle(null); setCanjeConfirmar(null); setSubVista(b.id); }} style={{ alignItems: 'center', flex: 1, paddingVertical: 4, borderRadius: 8, backgroundColor: subVista === b.id ? '#241B08' : 'transparent' }}>
          <Text style={{ fontSize: 15 }}>{b.ico}</Text>
          <Text style={{ color: subVista === b.id ? '#F5B041' : '#CCCCCC', fontSize: 10, fontWeight: '800', marginTop: 2 }}>{b.txt}</Text>
        </TouchableOpacity>
      ))}
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
          <View>
            <Text style={styles.saludo}>Hola,</Text>
            <Text style={styles.nombreCliente}>{usuario?.nombre_completo} • {datos?.puntos ?? 0} PTS</Text>
          </View>
          {totalItems > 0 && (
            <TouchableOpacity style={styles.botonCarrito} onPress={() => setSubVista('carrito')}>
              <Text style={styles.textoBotonCarrito}>🛒 {totalItems}</Text>
            </TouchableOpacity>
          )}
        </View>
        {(subVista === 'promos' || subVista === 'ofertas') && (
          <View>
            <Text style={styles.titulo}>{subVista === 'promos' ? 'PROMOCIONES' : 'OFERTAS DEL DÍA'}</Text>
            {(promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>No hay {subVista} activas por el momento.</Text>
              </View>
            ) : (
              (promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).map(pr => {
                const st = pr.stock != null ? Number(pr.stock) : 10, sinStock = st <= 0;
                return (
                  <View key={pr.id} style={styles.tarjetaPedido}>
                    {!!pr.imagen_url && <Image source={{ uri: pr.imagen_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} />}
                    <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                    {!!pr.descripcion && <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>}
                    <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)} • Stock: {st}</Text>
                    <TouchableOpacity style={[styles.boton, { marginTop: 8, backgroundColor: sinStock ? '#555' : '#F5B041' }]} disabled={sinStock} onPress={() => agregar(pr, true)}>
                      <Text style={[styles.textoBoton, { color: sinStock ? '#CCC' : '#111' }]}>{sinStock ? 'SIN STOCK' : '+ AGREGAR'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
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
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Aún no tienes movimientos de puntos.</Text>
              </View>
            ) : (
              (datos?.historial || []).map((h, idx) => (
                <View key={h.id || idx} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>{h.descripcion || h.motivo || 'Movimiento'}</Text>
                  <Text style={[styles.precioProducto, { color: Number(h.cantidad) >= 0 ? '#4CAF50' : '#E53935' }]}>
                    {Number(h.cantidad) >= 0 ? `+${h.cantidad}` : h.cantidad} PTS
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
                      {subVista === 'canjear' && (
          <View>
            <View style={[styles.tarjetaSaldo, { paddingVertical: 12, marginBottom: 12 }]}>
              <Text style={styles.etiquetaSaldo}>TUS PUNTOS: {datos?.puntos ?? 0} PTS</Text>
            </View>
            <Text style={styles.titulo}>RECOMPENSAS Y CANJES</Text>
            {canjeConfirmar && (
              <View style={[styles.tarjetaPedido, { borderColor: '#F5B041' }]}>
                <Text style={[styles.titulo, { color: '#F5B041', marginBottom: 6 }]}>CONFIRMAR CANJE</Text>
                <Text style={styles.nombreProducto}>¿Deseas canjear "{canjeConfirmar.titulo}"?</Text>
                <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>Se descontarán {canjeConfirmar.puntos_requeridos} puntos.</Text>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => { onCanjear(canjeConfirmar); setCanjeConfirmar(null); }} disabled={cargando}><Text style={styles.textoBoton}>SÍ, CANJEAR AHORA</Text></TouchableOpacity>
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
        {subVista === 'pedidos' && (
          <View>
            <Text style={styles.titulo}>MIS PEDIDOS</Text>
            {(datos?.pedidos || []).length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes pedidos realizados.</Text></View>
            ) : (datos?.pedidos || []).map(p => (
              <View key={p.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
                <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
                {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto}</Text>)}
                <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
                {p.estado === 'Confirmado por local' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onRecibirPedido(p)}><Text style={styles.textoBoton}>YA RECIBÍ MI PEDIDO</Text></TouchableOpacity>}
              </View>
            ))}
          </View>
        )}
        {subVista === 'menu' && (
          <View>
            <Text style={styles.titulo}>NUESTRO MENÚ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
              {listaCategorias.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategoriaActiva && setCategoriaActiva(cat)} style={[styles.categoria, catSel === cat && styles.categoriaActiva]}>
                  <Text style={{ color: catSel === cat ? '#111' : '#FFF', fontWeight: '800', fontSize: 12 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filtrados.map(p => {
              const st = p.stock != null ? Number(p.stock) : 10;
              return (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Image source={p.imagen_url && p.imagen_url.includes('supabase.co') ? { uri: p.imagen_url } : LOGO} style={{ width: 64, height: 64, borderRadius: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nombreProducto}>{p.nombre}</Text>
                      {!!p.ingredientes && <Text style={[styles.descripcionPedido, { color: '#AAA' }]}>{p.ingredientes}</Text>}
                      <Text style={styles.precioProducto}>S/ {Number(p.precio).toFixed(2)} • Stock: {st}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.boton, { marginTop: 10, backgroundColor: st <= 0 ? '#555' : '#F5B041' }]} disabled={st <= 0} onPress={() => agregar(p, false)}>
                    <Text style={[styles.textoBoton, { color: st <= 0 ? '#CCC' : '#111' }]}>{st <= 0 ? 'SIN STOCK' : '+ AGREGAR AL CARRITO'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        {subVista === 'carrito' && (
          <View>
            <Text style={styles.titulo}>MI CARRITO ({totalItems})</Text>
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
            {totalItems > 0 && <TouchableOpacity style={styles.boton} onPress={() => onConfirmarPedido({ numero_pedido: 'CS-' + Math.floor(100000 + Math.random() * 900000), cliente_id: usuario.id, tipo_entrega: 'RECOJO', metodo_pago: 'Yape', subtotal: carrito.reduce((a, b) => a + Number(b.precio) * b.cantidad, 0), costo_delivery: 0, total: carrito.reduce((a, b) => a + Number(b.precio) * b.cantidad, 0), estado: 'Pendiente de confirmación' }, carrito)}><Text style={styles.textoBoton}>CONFIRMAR PEDIDO</Text></TouchableOpacity>}
          </View>
        )}
      </ScrollView>
      {barraInferior}
    </View>
  );
                  }
          
        {subVista === 'canjear' && (
          <View>
            <View style={[styles.tarjetaSaldo, { paddingVertical: 12, marginBottom: 12 }]}>
              <Text style={styles.etiquetaSaldo}>TUS PUNTOS: {datos?.puntos ?? 0} PTS</Text>
            </View>
            <Text style={styles.titulo}>RECOMPENSAS Y CANJES</Text>
            {canjeConfirmar && (
              <View style={[styles.tarjetaPedido, { borderColor: '#F5B041' }]}>
                <Text style={[styles.titulo, { color: '#F5B041', marginBottom: 6 }]}>CONFIRMAR CANJE</Text>
                <Text style={styles.nombreProducto}>¿Deseas canjear "{canjeConfirmar.titulo}"?</Text>
                <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>Se descontarán {canjeConfirmar.puntos_requeridos} puntos.</Text>
                <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => { onCanjear(canjeConfirmar); setCanjeConfirmar(null); }} disabled={cargando}>
                  <Text style={styles.textoBoton}>SÍ, CANJEAR AHORA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setCanjeConfirmar(null)}>
                  <Text style={styles.textoBoton}>CANCELAR</Text>
                </TouchableOpacity>
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
        {subVista === 'pedidos' && (
          <View>
            <Text style={styles.titulo}>MIS PEDIDOS</Text>
            {(datos?.pedidos || []).length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.textoVacio}>Aún no tienes pedidos realizados.</Text>
              </View>
            ) : (
              (datos?.pedidos || []).map(p => (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
                  <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
                  {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>• {d.cantidad}x {d.nombre_producto}</Text>)}
                  <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
                  {p.estado === 'Confirmado por local' && (
                    <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onRecibirPedido(p)}>
                      <Text style={styles.textoBoton}>YA RECIBÍ MI PEDIDO</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        {subVista === 'menu' && (
          <View>
            <Text style={styles.titulo}>NUESTRO MENÚ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
              {listaCategorias.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategoriaActiva && setCategoriaActiva(cat)} style={[styles.categoria, catSel === cat && styles.categoriaActiva]}>
                  <Text style={{ color: catSel === cat ? '#111' : '#FFF', fontWeight: '800', fontSize: 12 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filtrados.map(p => {
              const st = p.stock != null ? Number(p.stock) : 10;
              return (
                <View key={p.id} style={styles.tarjetaPedido}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Image source={p.imagen_url && p.imagen_url.includes('supabase.co') ? { uri: p.imagen_url } : LOGO} style={{ width: 64, height: 64, borderRadius: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nombreProducto}>{p.nombre}</Text>
                      {!!p.ingredientes && <Text style={[styles.descripcionPedido, { color: '#AAA' }]}>{p.ingredientes}</Text>}
                      <Text style={styles.precioProducto}>S/ {Number(p.precio).toFixed(2)} • Stock: {st}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.boton, { marginTop: 10, backgroundColor: st <= 0 ? '#555' : '#F5B041' }]} disabled={st <= 0} onPress={() => agregar(p, false)}>
                    <Text style={[styles.textoBoton, { color: st <= 0 ? '#CCC' : '#111' }]}>{st <= 0 ? 'SIN STOCK' : '+ AGREGAR AL CARRITO'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        {subVista === 'carrito' && (
          <View>
            <Text style={styles.titulo}>MI CARRITO ({totalItems})</Text>
            {(carrito || []).map(it => (
              <View key={it.id} style={styles.producto}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombreProducto}>{it.nombre}</Text>
                  <Text style={styles.precioProducto}>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity style={styles.botonAgregar} onPress={() => setCarrito(carrito.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad - 1 } : x).filter(x => x.cantidad > 0))}>
                    <Text style={styles.textoAgregar}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.nombreProducto}>{it.cantidad}</Text>
                  <TouchableOpacity style={styles.botonAgregar} onPress={() => setCarrito(carrito.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad + 1 } : x))}>
                    <Text style={styles.textoAgregar}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {totalItems > 0 && (
              <TouchableOpacity style={styles.boton} onPress={() => onConfirmarPedido({ numero_pedido: 'CS-' + Math.floor(100000 + Math.random() * 900000), cliente_id: usuario.id, tipo_entrega: 'RECOJO', metodo_pago: 'Yape', subtotal: carrito.reduce((a, b) => a + Number(b.precio) * b.cantidad, 0), costo_delivery: 0, total: carrito.reduce((a, b) => a + Number(b.precio) * b.cantidad, 0), estado: 'Pendiente de confirmación' }, carrito)}>
                <Text style={styles.textoBoton}>CONFIRMAR PEDIDO</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      {barraInferior}
    </View>
  );
                                                                                                                             }
          
