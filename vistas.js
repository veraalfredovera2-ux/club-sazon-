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
