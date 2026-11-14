import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styles } from './estilos';
import { categorias } from './servicios';
import { NavegacionSuperior, LOGO } from './pantallas';

export function VistaInicio({
  usuario, datos, productos, recompensas, carrito, setCarrito,
  categoriaActiva, setCategoriaActiva, navInfo, onCanjear,
  onRecibido, cerrarSesion, irACarrito, irATab, cargando
}) {
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

  const listaCategorias = Array.isArray(categorias) && categorias.length > 0
    ? categorias
    : ['Todas', ...new Set((productos || []).map(p => p.categoria).filter(Boolean))];

  const filtrados = categoriaActiva === 'Todas'
    ? (productos || [])
    : (productos || []).filter(p => p.categoria === categoriaActiva);

  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  function agregar(p) {
    const ex = carrito.find(i => i.id === p.id);
    setCarrito(ex ? carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...carrito, { ...p, cantidad: 1 }]);
  }

  if (subVista === 'inicio') {
    return (
      <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
        <Image source={LOGO} style={{ width: 170, height: 170, borderRadius: 85, marginBottom: 22 }} resizeMode="contain" />
        <Text style={{ color: '#F5B041', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>
          Hola, {usuario?.nombre_completo || 'Cliente'}
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
          Bienvenido (a)
        </Text>
        <Text style={{ color: '#CCCCCC', fontSize: 15, textAlign: 'center', marginBottom: 30, paddingHorizontal: 16 }}>
          El sabor que te encanta, a un solo clic
        </Text>
        <TouchableOpacity
          style={[styles.boton, { width: '100%', paddingVertical: 16, backgroundColor: '#F5B041' }]}
          onPress={() => { setSubVista('menu'); if (irATab) irATab('menu'); }}
        >
          <Text style={[styles.textoBoton, { color: '#111111', fontSize: 16, fontWeight: '900' }]}>
            ¡ COMIENZA AHORA!
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 28, padding: 8 }} onPress={cerrarSesion}>
          <Text style={{ color: '#888888', fontSize: 12, fontWeight: '700' }}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior
        regresar={() => {
          if (prodDetalle) { setProdDetalle(null); return; }
          if (canjeConfirmar) { setCanjeConfirmar(null); return; }
          setSubVista('inicio');
          if (irATab) irATab('inicio');
        }}
        irAInicio={() => {
          setProdDetalle(null);
          setCanjeConfirmar(null);
          setSubVista('inicio');
          if (irATab) irATab('inicio');
        }}
      />

      <View style={styles.filaSaludo}>
        <View>
          <Text style={styles.saludo}>Hola,</Text>
          <Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text>
        </View>
        {totalItems > 0 && (
          <TouchableOpacity style={styles.botonCarrito} onPress={irACarrito}>
            <Text style={styles.textoBotonCarrito}>CARRITO ({totalItems})</Text>
          </TouchableOpacity>
        )}
      </View>
      {subVista === 'canjear' && (
        <View>
          <View style={[styles.tarjetaSaldo, { paddingVertical: 12, marginBottom: 14 }]}>
            <Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text>
            <Text style={[styles.numeroSaldo, { fontSize: 28 }]}>{datos?.puntos ?? 0} PTS</Text>
          </View>
          <Text style={styles.titulo}>RECOMPENSAS Y CANJES</Text>
          {canjeConfirmar && (
            <View style={[styles.tarjetaPedido, { borderColor: '#F5B041', borderWidth: 2, backgroundColor: '#1E1A12' }]}>
              <Text style={[styles.titulo, { color: '#F5B041', marginBottom: 4 }]}>⚠️ CONFIRMAR CANJE DE PREMIO</Text>
              <Text style={styles.nombreProducto}>¿Deseas canjear "{canjeConfirmar.titulo}"?</Text>
              <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>
                Se descontarán <Text style={{ color: '#F5B041', fontWeight: '800' }}>{canjeConfirmar.puntos_requeridos} puntos</Text> de tu saldo actual ({datos?.puntos ?? 0} pts).
              </Text>
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => { const r = canjeConfirmar; setCanjeConfirmar(null); onCanjear(r); }} disabled={cargando}>
                <Text style={styles.textoBoton}>✅ SÍ, CONFIRMAR CANJE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={() => setCanjeConfirmar(null)}>
                <Text style={styles.textoBoton}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          )}
          {(recompensas || []).map(r => (
            <View key={r.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{r.titulo}</Text>
              <Text style={styles.descripcionPedido}>{r.descripcion}</Text>
              <Text style={styles.precioProducto}>{r.puntos_requeridos} PUNTOS</Text>
              <TouchableOpacity
                style={[styles.boton, (datos?.puntos ?? 0) < r.puntos_requeridos && styles.botonDeshabilitado]}
                onPress={() => setCanjeConfirmar(r)}
                disabled={(datos?.puntos ?? 0) < r.puntos_requeridos || cargando}
              >
                <Text style={styles.textoBoton}>{(datos?.puntos ?? 0) >= r.puntos_requeridos ? 'CANJEAR AHORA' : 'PUNTOS INSUFICIENTES'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {(datos?.canjes || []).length > 0 && (
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
          {(datos?.pedidos || []).length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes pedidos realizados.</Text></View>
          ) : (
            datos.pedidos.map(p => (
              <View key={p.id} style={styles.tarjetaPedido}>
                <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
                <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
                {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>{d.cantidad}x {d.nombre_producto}</Text>)}
                {p.tipo_entrega === 'DELIVERY' && <Text style={styles.descripcionPedido}>Delivery ({p.distrito}): S/ {Number(p.costo_delivery || 0).toFixed(2)}</Text>}
                <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
                {p.estado === 'Confirmado por local' && (
                  <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32' }]} onPress={() => onRecibido(p)} disabled={cargando}>
                    <Text style={styles.textoBoton}>RECIBÍ MI PEDIDO (+{Math.floor(Number(p.subtotal || p.total) * 10)} PTS)</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}
                  {subVista === 'menu' && (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.titulo}>NUESTRO MENÚ</Text>
            <TouchableOpacity onPress={() => { setSubVista('pedidos'); if (irATab) irATab('pedidos'); }}>
              <Text style={{ color: '#F5B041', fontSize: 12, fontWeight: '800' }}>MIS PEDIDOS →</Text>
            </TouchableOpacity>
          </View>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {listaCategorias.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoriaActiva(cat)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: categoriaActiva === cat ? '#F5B041' : '#1E1E1E', borderWidth: 1, borderColor: categoriaActiva === cat ? '#F5B041' : '#333' }}
              >
                <Text style={{ color: categoriaActiva === cat ? '#111' : '#EEE', fontWeight: '700', fontSize: 12 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtrados.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay platos disponibles en esta categoría.</Text></View>
          ) : (
            filtrados.map(p => (
              <View key={p.id} style={styles.tarjetaPedido}>
                <TouchableOpacity onPress={() => setProdDetalle(p)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={p.imagen_url && p.imagen_url.includes('supabase.co') ? { uri: p.imagen_url } : LOGO} style={{ width: 72, height: 72, borderRadius: 10, marginRight: 12, backgroundColor: '#222' }} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreProducto}>{p.nombre}</Text>
                    <Text style={styles.descripcionPedido} numberOfLines={2}>{p.descripcion || p.ingredientes || ''}</Text>
                    <Text style={styles.precioProducto}>S/ {Number(p.precio).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { marginTop: 10 }]} onPress={() => agregar(p)}><Text style={styles.textoBoton}>+ AGREGAR AL CARRITO</Text></TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
