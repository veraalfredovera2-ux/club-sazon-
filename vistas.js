import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styles } from './estilos';
import { categorias } from './servicios';
import { NavegacionSuperior, LOGO } from './pantallas';

export function VistaInicio({ usuario, datos, productos, recompensas, carrito, setCarrito, categoriaActiva, setCategoriaActiva, navInfo, onCanjear, onRecibido, cerrarSesion, irAPanel, irACarrito, cargando }) {
  const [subVista, setSubVista] = useState(navInfo?.tab || 'inicio');
  const [prodDetalle, setProdDetalle] = useState(null);
  const [canjeConfirmar, setCanjeConfirmar] = useState(null);

  useEffect(() => {
    if (navInfo?.tab) {
      setProdDetalle(null);
      setCanjeConfirmar(null);
      setSubVista(navInfo.tab);
    }
  }, [navInfo]);

  const filtrados = categoriaActiva === 'Todas' ? productos : productos.filter(p => p.categoria === categoriaActiva);
  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  function agregar(p) {
    const ex = carrito.find(i => i.id === p.id);
    setCarrito(ex ? carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...carrito, { ...p, cantidad: 1 }]);
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={() => { setProdDetalle(null); setCanjeConfirmar(null); setSubVista('inicio'); }} irAInicio={() => { setProdDetalle(null); setCanjeConfirmar(null); setSubVista('inicio'); }} />
      <View style={styles.filaSaludo}>
        <View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View>
        {totalItems > 0 && <TouchableOpacity style={styles.botonCarrito} onPress={irACarrito}><Text style={styles.textoBotonCarrito}>CARRITO ({totalItems})</Text></TouchableOpacity>}
      </View>

      <View style={styles.tarjetaSaldo}>
        <Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text>
        <Text style={styles.numeroSaldo}>{datos.puntos}</Text>
        <View style={styles.filaBotones}>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { flex: 1 }]} onPress={() => { setCanjeConfirmar(null); setSubVista(subVista === 'canjear' ? 'inicio' : 'canjear'); }}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>{subVista === 'canjear' ? 'VER MENÚ' : 'CANJEAR PUNTOS'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonSecundario, styles.botonPequeno, { flex: 1 }]} onPress={() => { setCanjeConfirmar(null); setSubVista(subVista === 'pedidos' ? 'inicio' : 'pedidos'); }}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>{subVista === 'pedidos' ? 'VER MENÚ' : 'MIS PEDIDOS'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {subVista === 'canjear' && (
        <View>
          <Text style={styles.titulo}>RECOMPENSAS Y CANJES</Text>

          {canjeConfirmar && (
            <View style={[styles.tarjetaPedido, { borderColor: '#F5B041', borderWidth: 2, backgroundColor: '#1E1A12' }]}>
              <Text style={[styles.titulo, { color: '#F5B041', marginBottom: 4 }]}>⚠️ CONFIRMAR CANJE DE PREMIO</Text>
              <Text style={styles.nombreProducto}>¿Deseas canjear "{canjeConfirmar.titulo}"?</Text>
              <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>Se descontarán <Text style={{ color: '#F5B041', fontWeight: '800' }}>{canjeConfirmar.puntos_requeridos} puntos</Text> de tu saldo actual ({datos.puntos} pts).</Text>
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => { const r = canjeConfirmar; setCanjeConfirmar(null); onCanjear(r); }} disabled={cargando}>
                <Text style={styles.textoBoton}>✅ SÍ, CONFIRMAR CANJE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setCanjeConfirmar(null)}>
                <Text style={styles.textoBoton}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {recompensas.map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.titulo}</Text>
              <Text style={styles.descripcionPedido}>{r.descripcion}</Text>
              <Text style={styles.precioProducto}>{r.puntos_requeridos} PUNTOS</Text>
              <TouchableOpacity style={[styles.boton, datos.puntos < r.puntos_requeridos && styles.botonDeshabilitado]} onPress={() => setCanjeConfirmar(r)} disabled={datos.puntos < r.puntos_requeridos || cargando}>
                <Text style={styles.textoBoton}>{datos.puntos >= r.puntos_requeridos ? 'CANJEAR AHORA' : 'PUNTOS INSUFICIENTES'}</Text>
              </TouchableOpacity>
            </View>
          ))}

          {(datos.canjes || []).length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.titulo}>MIS CANJES REALIZADOS</Text>
              {datos.canjes.map(c => (
                <View key={c.id} style={styles.tarjetaPedido}>
                  <Text style={styles.nombreProducto}>🎁 {c.recompensa_titulo} (-{c.puntos_usados} pts)</Text>
                  <View style={[styles.estadoPedido, c.estado === 'Entregado' && { borderColor: '#4CAF50', backgroundColor: '#132615' }]}>
                    <Text style={[styles.textoEstado, c.estado === 'Entregado' && { color: '#4CAF50' }]}>{c.estado}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      {subVista === 'pedidos' && (
        <View>
          <Text style={styles.titulo}>MIS PEDIDOS</Text>
          {datos.pedidos.length === 0 ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes pedidos realizados.</Text></View> : datos.pedidos.map(p => (
            <View key={p.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
              <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
              {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>{d.cantidad}x {d.nombre_producto}</Text>)}
              {p.tipo_entrega === 'DELIVERY' && <Text style={styles.descripcionPedido}>Delivery ({p.distrito}): S/ {Number(p.costo_delivery || 0).toFixed(2)}</Text>}
              <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
              {p.estado === 'Confirmado por local' && <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onRecibido(p)} disabled={cargando}><Text style={styles.textoBoton}>RECIBÍ MI PEDIDO (+{Math.floor(Number(p.subtotal || p.total) * 10)} PTS)</Text></TouchableOpacity>}
            </View>
          ))}
        </View>
      )}

      {subVista === 'inicio' && (
        <View>
          {prodDetalle && (
            <View style={styles.tarjetaPedido}>
              <Image source={prodDetalle.imagen_url && prodDetalle.imagen_url.includes('supabase.co') ? { uri: prodDetalle.imagen_url } : LOGO} style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 10, backgroundColor: '#222' }} resizeMode="cover" />
              <Text style={styles.nombreProducto}>{prodDetalle.nombre}</Text>
              <Text style={styles.precioProducto}>S/ {Number(prodDetalle.precio).toFixed(2)}</Text>
              <Text style={[styles.descripcionPedido, { marginTop: 6, color: '#DDD' }]}>Ingredientes: {prodDetalle.ingredientes || 'Preparación especial de la casa.'}</Text>
              <TouchableOpacity style={styles.boton} onPress={() => { agregar(prodDetalle); setProdDetalle(null); }}><Text style={styles.textoBoton}>AGREGAR AL CARRITO</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setProdDetalle(null)}><Text style={styles.textoBoton}>CERRAR DETALLE</Text></TouchableOpacity>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
            {categorias.map(c => <TouchableOpacity key={c} style={[styles.categoria, categoriaActiva === c && styles.categoriaActiva]} onPress={() => setCategoriaActiva(c)}><Text style={styles.textoCategoria}>{c}</Text></TouchableOpacity>)}
          </ScrollView>
          <Text style={styles.titulo}>MENÚ</Text>
          {filtrados.map(prod => (
            <TouchableOpacity key={prod.id} style={styles.producto} onPress={() => setProdDetalle(prod)}>
              <Image source={prod.imagen_url && prod.imagen_url.includes('supabase.co') ? { uri: prod.imagen_url } : LOGO} style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#222' }} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreProducto}>{prod.nombre}</Text>
                <Text style={styles.precioProducto}>S/ {Number(prod.precio).toFixed(2)}</Text>
                <Text style={[styles.descripcionPedido, { fontSize: 12 }]} numberOfLines={2}>{prod.ingredientes}</Text>
              </View>
              <TouchableOpacity style={styles.botonAgregar} onPress={() => agregar(prod)}><Text style={styles.textoAgregar}>+ AGREGAR</Text></TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.filaBotones}>
        <TouchableOpacity style={[styles.boton, styles.botonSecundario, { flex: 1 }]} onPress={irAPanel}><Text style={styles.textoBoton}>MOVIMIENTOS</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.boton, styles.botonSecundario, { flex: 1 }]} onPress={cerrarSesion}><Text style={styles.textoBoton}>SALIR</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
                }
                
