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

export function VistaInicio({ usuario, datos, productos, recompensas, promociones, carrito, setCarrito, categoriaActiva, setCategoriaActiva, navInfo, onCanjear, onRecibido, cerrarSesion, irACarrito, irATab, cargando }) {
  const [subVista, setSubVista] = useState(navInfo?.tab || 'inicio');
  const [prodDetalle, setProdDetalle] = useState(null);
  const [canjeConfirmar, setCanjeConfirmar] = useState(null);

  useEffect(() => { if (navInfo?.tab) { setProdDetalle(null); setCanjeConfirmar(null); setSubVista(navInfo.tab); } }, [navInfo]);

  const listaCategorias = Array.isArray(categorias) && categorias.length > 0 ? categorias : ['Todas'];
  const filtrados = categoriaActiva === 'Todas' ? (productos || []) : (productos || []).filter(p => p.categoria === categoriaActiva);
  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  function agregar(p, esPromo = false) {
    if (obtenerTurnoPeru() === 'cerrado') return mostrarAviso('Local cerrado', 'Local cerrado, intenta más tarde.');
    const stockActual = p.stock != null ? Number(p.stock) : 10;
    const ex = carrito.find(i => i.id === p.id);
    if (stockActual <= 0 || (ex ? ex.cantidad : 0) + 1 > stockActual) return mostrarAviso('Sin stock', 'No hay más unidades disponibles.');
    const item = esPromo ? { ...p, nombre: p.titulo, es_promo: true } : p;
    setCarrito(ex ? carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...carrito, { ...item, cantidad: 1 }]);
  }

  function intentarCanjear(r) {
    if (obtenerTurnoPeru() === 'cerrado') return mostrarAviso('Local cerrado', 'Local cerrado, intenta más tarde.');
    setCanjeConfirmar(r);
  }

  if (subVista === 'inicio') {
    return (
      <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
        <Image source={LOGO} style={{ width: 220, height: 220, borderRadius: 110, marginBottom: 22 }} resizeMode="contain" />
        <Text style={{ color: '#F5B041', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>Hola, {usuario?.nombre_completo || 'Cliente'}</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>Bienvenido (a)</Text>
        <Text style={{ color: '#CCCCCC', fontSize: 15, textAlign: 'center', marginBottom: 30, paddingHorizontal: 16 }}>El sabor que te encanta, a un solo clic</Text>
        <TouchableOpacity style={[styles.boton, { width: '100%', paddingVertical: 16, backgroundColor: '#F5B041' }]} onPress={() => { setSubVista('menu'); if (irATab) irATab('menu'); }}>
          <Text style={[styles.textoBoton, { color: '#111111', fontSize: 16, fontWeight: '900' }]}>¡ COMIENZA AHORA!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 28, padding: 8 }} onPress={cerrarSesion}><Text style={{ color: '#888888', fontSize: 12, fontWeight: '700' }}>CERRAR SESIÓN</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={() => { if (prodDetalle) return setProdDetalle(null); if (canjeConfirmar) return setCanjeConfirmar(null); setSubVista('inicio'); if (irATab) irATab('inicio'); }} irAInicio={() => { setProdDetalle(null); setCanjeConfirmar(null); setSubVista('inicio'); if (irATab) irATab('inicio'); }} />
      <View style={styles.filaSaludo}>
        <View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View>
        {totalItems > 0 && <TouchableOpacity style={styles.botonCarrito} onPress={irACarrito}><Text style={styles.textoBotonCarrito}>CARRITO ({totalItems})</Text></TouchableOpacity>}
      </View>

      {(subVista === 'promos' || subVista === 'ofertas') && (
        <View>
          <Text style={styles.titulo}>{subVista === 'promos' ? '🔥 PROMOCIONES ACTIVAS' : '🏷️ OFERTAS ESPECIALES'}</Text>
          {(promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay {subVista === 'promos' ? 'promociones' : 'ofertas'} disponibles por ahora.</Text></View>
          ) : (
            (promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).map(pr => {
              const st = pr.stock != null ? Number(pr.stock) : 10, sinStock = st <= 0;
              return (
                <View key={pr.id} style={styles.tarjetaPedido}>
                  {!!pr.imagen_url && <Image source={{ uri: pr.imagen_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />}
                  <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                  <Text style={[styles.descripcionPedido, { color: '#DDD' }]}>{pr.descripcion}</Text>
                  <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)}</Text>
                  <Text style={{ color: sinStock ? '#E53935' : '#4CAF50', fontWeight: '800', fontSize: 12, marginTop: 4 }}>{sinStock ? '🔴 SIN STOCK (AGOTADO)' : `🟢 DISPONIBLE (${st} uds)`}</Text>
                  <TouchableOpacity style={[styles.boton, { marginTop: 8, backgroundColor: sinStock ? '#B71C1C' : '#2E7D32' }]} onPress={() => agregar(pr, true)} disabled={sinStock}>
                    <Text style={styles.textoBoton}>{sinStock ? 'SIN STOCK / AGOTADO' : '+ AGREGAR AL CARRITO'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}
      {subVista === 'canjear' && (
        <View>
          <View style={[styles.tarjetaSaldo, { paddingVertical: 12, marginBottom: 14 }]}><Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text><Text style={[styles.numeroSaldo, { fontSize: 28 }]}>{datos?.puntos ?? 0} PTS</Text></View>
          <Text style={styles.titulo}>RECOMPENSAS Y CANJES</Text>
          {canjeConfirmar && (
            <View style={[styles.tarjetaPedido, { borderColor: '#F5B041', borderWidth: 2, backgroundColor: '#1E1A12' }]}>
              <Text style={[styles.titulo, { color: '#F5B041', marginBottom: 4 }]}>⚠️ CONFIRMAR CANJE</Text>
              <Text style={styles.nombreProducto}>¿Deseas canjear "{canjeConfirmar.titulo}"?</Text>
              <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>Se descontarán {canjeConfirmar.puntos_requeridos} puntos.</Text>
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => { const r = canjeConfirmar; setCanjeConfirmar(null); onCanjear(r); }} disabled={cargando}><Text style={styles.textoBoton}>✅ SÍ, CONFIRMAR CANJE</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setCanjeConfirmar(null)}><Text style={styles.textoBoton}>CANCELAR</Text></TouchableOpacity>
            </View>
          )}
          {(recompensas || []).filter(r => r.activa !== false).map(r => {
            const st = r.stock != null ? Number(r.stock) : 5, sinStock = st <= 0, sinPts = (datos?.puntos ?? 0) < r.puntos_requeridos;
            const puedeCanjear = !sinStock && !sinPts;
            return (
              <View key={r.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>{r.titulo}</Text>
                <Text style={styles.descripcionPedido}>{r.descripcion}</Text>
                <Text style={styles.precioProducto}>{r.puntos_requeridos} PUNTOS</Text>
                <Text style={{ color: sinStock ? '#E53935' : '#4CAF50', fontWeight: '800', fontSize: 12, marginTop: 4 }}>{sinStock ? '🔴 SIN STOCK' : `🟢 DISPONIBLE (${st} uds)`}</Text>
                <TouchableOpacity style={[styles.boton, { backgroundColor: puedeCanjear ? '#2E7D32' : '#B71C1C' }]} onPress={() => intentarCanjear(r)} disabled={!puedeCanjear || cargando}>
                  <Text style={styles.textoBoton}>{sinStock ? 'SIN STOCK (AGOTADO)' : sinPts ? 'TE FALTAN PTOS' : 'CANJEA'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {(datos?.canjes || []).length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.titulo}>MIS CANJES REALIZADOS</Text>
              {datos.canjes.map(c => (
                <View key={c.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>🎁 {c.recompensa_titulo} (-{c.puntos_usados} pts)</Text>
                  <View style={[styles.estadoPedido, c.estado === 'Entregado' && { borderColor: '#4CAF50', backgroundColor: '#132615' }]}><Text style={[styles.textoEstado, c.estado === 'Entregado' && { color: '#4CAF50' }]}>{c.estado}</Text></View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {subVista === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>MIS PEDIDOS</Text>
          {(datos?.pedidos || []).length === 0 ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes pedidos realizados.</Text></View> : datos.pedidos.map(p => (
            <View key={p.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
              <View style={[styles.estadoPedido, p.estado === 'Completado' && { borderColor: '#4CAF50', backgroundColor: '#132615' }, p.estado === 'Cancelado' && { borderColor: '#E53935', backgroundColor: '#2A1215' }, p.estado === 'Pendiente' && { borderColor: '#F5B041', backgroundColor: '#2B210B' }]}>
                <Text style={[styles.textoEstado, p.estado === 'Completado' && { color: '#4CAF50' }, p.estado === 'Cancelado' && { color: '#E53935' }, p.estado === 'Pendiente' && { color: '#F5B041' }]}>{p.estado}</Text>
              </View>
              {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>{d.cantidad}x {d.nombre_producto}</Text>)}
              <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
              {p.estado === 'Confirmado por local' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onRecibido(p)} disabled={cargando}><Text style={styles.textoBoton}>RECIBÍ MI PEDIDO (+{Math.floor(Number(p.subtotal || p.total) * 10)} PTS)</Text></TouchableOpacity>}
            </View>
          ))}
        </View>
      )}

      {subVista === 'menu' && (
        <View>
          <Text style={styles.titulo}>NUESTRO MENÚ</Text>
          <Text style={{ color: '#F5B041', fontSize: 12, marginBottom: 10 }}>⏰ Horario Perú: Mañana 6:50am–11:00am | Noche 6:30pm–11:50pm</Text>
          {prodDetalle && (
            <View style={styles.tarjetaPedido}>
              <Image source={prodDetalle.imagen_url && prodDetalle.imagen_url.includes('supabase.co') ? { uri: prodDetalle.imagen_url } : LOGO} style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 10, backgroundColor: '#222' }} resizeMode="cover" />
              <Text style={styles.nombreProducto}>{prodDetalle.nombre}</Text>
              <Text style={styles.precioProducto}>S/ {Number(prodDetalle.precio).toFixed(2)}</Text>
              <Text style={[styles.descripcionPedido, { marginTop: 6, color: '#FFF' }]}>Ingredientes completos: {prodDetalle.ingredientes || 'Preparación especial de la casa.'}</Text>
              <TouchableOpacity style={styles.boton} onPress={() => { agregar(prodDetalle); setProdDetalle(null); }}><Text style={styles.textoBoton}>AGREGAR AL CARRITO</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setProdDetalle(null)}><Text style={styles.textoBoton}>CERRAR DETALLE</Text></TouchableOpacity>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {listaCategorias.map(cat => (
              <TouchableOpacity key={cat} onPress={() => setCategoriaActiva(cat)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: categoriaActiva === cat ? '#F5B041' : '#1E1E1E', borderWidth: 1, borderColor: categoriaActiva === cat ? '#F5B041' : '#333' }}>
                <Text style={{ color: categoriaActiva === cat ? '#111' : '#EEE', fontWeight: '700', fontSize: 12 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtrados.map(p => {
            const st = p.stock != null ? Number(p.stock) : 10, hor = evaluarHorarioProducto(p);
            const activoAhora = p.disponible !== false && hor.disponibleTurno && st > 0;
            return (
              <View key={p.id} style={styles.tarjetaPedido}>
                <TouchableOpacity onPress={() => setProdDetalle(p)} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Image source={p.imagen_url && p.imagen_url.includes('supabase.co') ? { uri: p.imagen_url } : LOGO} style={{ width: 78, height: 78, borderRadius: 10, marginRight: 12, backgroundColor: '#222' }} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreProducto}>{p.nombre}</Text>
                    <Text style={[styles.descripcionPedido, { color: '#DDD', marginTop: 2 }]}>{p.ingredientes || p.descripcion || ''}</Text>
                    <Text style={styles.precioProducto}>S/ {Number(p.precio).toFixed(2)}</Text>
                    <Text style={{ color: st <= 0 || !activoAhora ? '#E53935' : '#4CAF50', fontWeight: '800', fontSize: 12, marginTop: 3 }}>
                      {st <= 0 ? '🔴 SIN STOCK (AGOTADO)' : !hor.abierto ? '🔴 LOCAL CERRADO' : !activoAhora ? '🔴 NO DISPONIBLE EN ESTE TURNO' : `🟢 DISPONIBLE (${st} uds)`}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { marginTop: 10, backgroundColor: activoAhora ? '#2E7D32' : '#B71C1C' }]} onPress={() => agregar(p)} disabled={!activoAhora}>
                  <Text style={styles.textoBoton}>{st <= 0 ? 'SIN STOCK' : !hor.abierto ? 'LOCAL CERRADO' : !activoAhora ? 'NO DISPONIBLE EN ESTE HORARIO' : '+ AGREGAR AL CARRITO'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
            }
        
