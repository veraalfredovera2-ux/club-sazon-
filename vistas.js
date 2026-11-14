import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Linking } from 'react-native';
import { styles } from './estilos';
import { NavegacionSuperior } from './pantallas';

export function VistaCarrito({ carrito, cambiarCantidad, entrega, setEntrega, distrito, setDistrito, direccion, setDireccion, pago, setPago, cfgPagos, confirmarPedido, cargando, regresar, irAInicio }) {
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const subtotal = carrito.reduce((a, b) => a + Number(b.precio) * b.cantidad, 0);
  const delivery = entrega === 'DELIVERY' ? 5 : 0;
  const esDigital = pago === 'Yape' || pago === 'Plin';
  const qrUrl = pago === 'Yape' ? cfgPagos?.qr_yape : cfgPagos?.qr_plin;

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>TU CARRITO</Text>
      {carrito.length === 0 ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Tu carrito está vacío.</Text></View> : (
        <View>
          {carrito.map(item => (
            <View key={item.id} style={styles.productoCarrito}>
              <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{item.nombre}</Text><Text style={styles.precioProducto}>S/ {(Number(item.precio) * item.cantidad).toFixed(2)}</Text></View>
              <View style={styles.controlesCantidad}>
                <TouchableOpacity style={styles.botonCantidad} onPress={() => cambiarCantidad(item.id, -1)}><Text style={styles.textoCantidad}>-</Text></TouchableOpacity>
                <Text style={styles.numeroCantidad}>{item.cantidad}</Text>
                <TouchableOpacity style={styles.botonCantidad} onPress={() => cambiarCantidad(item.id, 1)}><Text style={styles.textoCantidad}>+</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={[styles.opcionEntrega, entrega === 'RECOGER' && styles.opcionEntregaActiva]} onPress={() => setEntrega('RECOGER')}><Text style={styles.textoOpcionEntrega}>RECOGER EN LOCAL (GRATIS)</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.opcionEntrega, entrega === 'DELIVERY' && styles.opcionEntregaActiva]} onPress={() => setEntrega('DELIVERY')}><Text style={styles.textoOpcionEntrega}>DELIVERY (+ S/ 5.00)</Text></TouchableOpacity>
          {entrega === 'DELIVERY' && (
            <View style={{ marginTop: 12 }}>
              <TextInput style={styles.campo} placeholder="Distrito" placeholderTextColor="#777" value={distrito} onChangeText={setDistrito} />
              <TextInput style={[styles.campo, { marginTop: 8 }]} placeholder="Dirección exacta y referencia" placeholderTextColor="#777" value={direccion} onChangeText={setDireccion} />
            </View>
          )}
          <Text style={[styles.etiqueta, { marginTop: 16 }]}>Método de pago:</Text>
          {['Yape', 'Plin', 'Efectivo', 'Transferencia'].map(m => (
            <TouchableOpacity key={m} style={styles.opcionPago} onPress={() => { setPago(m); setPagoConfirmado(false); }}><Text style={styles.textoPago}>{m}</Text><Text style={styles.seleccionPago}>{pago === m ? '●' : '○'}</Text></TouchableOpacity>
          ))}
          {esDigital && (
            <View style={[styles.tarjetaPedido, { alignItems: 'center', marginTop: 14 }]}>
              <Text style={styles.nombreProducto}>Escanea o guarda el QR de {pago}</Text>
              {cfgPagos?.titular ? <Text style={[styles.descripcionPedido, { marginTop: 4 }]}>Titular: {cfgPagos.titular}</Text> : null}
              <Text style={[styles.descripcionPedido, { marginVertical: 4 }]}>Monto exacto: S/ {(subtotal + delivery).toFixed(2)}</Text>
              {qrUrl ? <Image source={{ uri: qrUrl }} style={{ width: 190, height: 190, borderRadius: 12, backgroundColor: '#FFF', marginVertical: 8 }} /> : null}
              {qrUrl ? <TouchableOpacity style={[styles.boton, styles.botonSecundario, { marginBottom: 8 }]} onPress={() => Linking.openURL(qrUrl)}><Text style={styles.textoBoton}>📲 ABRIR QR PARA GUARDAR / ESCANEAR</Text></TouchableOpacity> : null}
              <TouchableOpacity style={[styles.opcionEntrega, { width: '100%' }, pagoConfirmado && { borderColor: '#4CAF50', backgroundColor: '#132615' }]} onPress={() => setPagoConfirmado(!pagoConfirmado)}>
                <Text style={styles.textoOpcionEntrega}>{pagoConfirmado ? '✅ PAGO REALIZADO Y CONFIRMADO' : '⬜ PULSA AQUÍ PARA CONFIRMAR TU PAGO'}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.totalFila}><Text style={styles.textoTotal}>TOTAL A PAGAR</Text><Text style={styles.numeroTotal}>S/ {(subtotal + delivery).toFixed(2)}</Text></View>
          <Text style={[styles.descripcionPedido, { textAlign: 'right', marginBottom: 10 }]}>Al recibir tu pedido ganarás +{Math.floor(subtotal * 10)} puntos</Text>
          <TouchableOpacity style={[styles.boton, (cargando || (esDigital && !pagoConfirmado)) && styles.botonDesactivado]} onPress={() => confirmarPedido(pagoConfirmado)} disabled={cargando || (esDigital && !pagoConfirmado)}>
            <Text style={styles.textoBoton}>{cargando ? 'ENVIANDO...' : (esDigital && !pagoConfirmado ? 'CONFIRMA TU PAGO ARRIBA' : 'CONFIRMAR PEDIDO')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
export function VistaPedidos({ pedidos, onRecibirPedido, onCancelarPedido, cargando, regresar, irAInicio }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>MIS PEDIDOS</Text>
      {pedidos.length === 0 ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes pedidos.</Text></View> : pedidos.map(p => (
        <View key={p.id} style={styles.tarjetaPedido}>
          <Text style={styles.nombreProducto}>Pedido {p.numero_pedido}</Text>
          <View style={styles.estadoPedido}><Text style={styles.textoEstado}>{p.estado}</Text></View>
          {(p.pedido_detalles || []).map(d => <Text key={d.id} style={styles.descripcionPedido}>{d.cantidad}x {d.nombre_producto}</Text>)}
          <Text style={styles.totalPedidoTexto}>Total: S/ {Number(p.total).toFixed(2)}</Text>
          {p.estado === 'Confirmado por local' && (
            <TouchableOpacity style={[styles.boton, { backgroundColor: '#2E7D32', marginTop: 10 }]} onPress={() => onRecibirPedido(p)} disabled={cargando}>
              <Text style={styles.textoBoton}>✅ YA RECIBÍ MI PEDIDO (+{Math.floor(Number(p.subtotal || p.total) * 10)} PTS)</Text>
            </TouchableOpacity>
          )}
          {p.estado !== 'Cancelado' && p.estado !== 'Completado' && (
            <TouchableOpacity style={[styles.boton, styles.botonSecundario, { marginTop: 8 }]} onPress={() => onCancelarPedido(p)} disabled={cargando}>
              <Text style={styles.textoBoton}>CANCELAR COMPRA</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export function VistaPuntos({ puntos, historial, recompensas, onCanjear, cargando, regresar, irAInicio }) {
  const disponibles = (recompensas || []).filter(r => puntos >= r.puntos_requeridos);
  const proximos = (recompensas || []).filter(r => puntos < r.puntos_requeridos);
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>PUNTOS Y CANJES</Text>
      <View style={styles.tarjetaSaldo}>
        <Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text>
        <Text style={styles.numeroSaldo}>{puntos}</Text>
        <Text style={[styles.etiquetaSaldo, { marginTop: 8, color: '#FFF' }]}>★ GANAS 10 PUNTOS POR CADA S/ 1.00 DE COMPRA ★</Text>
      </View>
      <Text style={[styles.etiqueta, { color: '#4CAF50', marginBottom: 8 }]}>DISPONIBLES PARA CANJEAR ({disponibles.length})</Text>
      {disponibles.length === 0 ? <View style={[styles.tarjetaVacia, { marginBottom: 14 }]}><Text style={styles.textoVacio}>Sigue acumulando puntos para desbloquear premios.</Text></View> : disponibles.map(rec => (
        <View key={rec.id} style={[styles.producto, { borderColor: '#4CAF50' }]}>
          <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{rec.titulo}</Text><Text style={styles.descripcionPedido}>{rec.descripcion}</Text><Text style={styles.precioProducto}>{rec.puntos_requeridos} PUNTOS</Text></View>
          <TouchableOpacity style={styles.botonAgregar} onPress={() => onCanjear(rec)} disabled={cargando}><Text style={styles.textoAgregar}>CANJEAR</Text></TouchableOpacity>
        </View>
      ))}
      {proximos.length > 0 && <Text style={[styles.etiqueta, { marginTop: 12, marginBottom: 8 }]}>PRÓXIMOS PREMIOS</Text>}
      {proximos.map(rec => (
        <View key={rec.id} style={[styles.producto, { opacity: 0.65 }]}>
          <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{rec.titulo}</Text><Text style={styles.descripcionPedido}>Te faltan {rec.puntos_requeridos - puntos} pts</Text><Text style={styles.precioProducto}>{rec.puntos_requeridos} PUNTOS</Text></View>
        </View>
      ))}
      <Text style={[styles.etiqueta, { marginTop: 18, marginBottom: 10 }]}>HISTORIAL DE MOVIMIENTOS</Text>
      {historial.map(m => (
        <View key={m.id} style={styles.filaHistorial}>
          <View style={{ flex: 1 }}><Text style={styles.nombreProducto}>{m.descripcion}</Text></View>
          <Text style={[styles.puntosHistorial, m.cantidad < 0 && { color: '#E53935' }]}>{m.cantidad > 0 ? '+' + m.cantidad : m.cantidad} pts</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export function VistaCuenta({ usuario, cerrarSesion, regresar, irAInicio }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>MI CUENTA</Text>
      <View style={styles.tarjetaCuenta}><Text style={styles.etiqueta}>Nombre:</Text><Text style={styles.datoCuenta}>{usuario?.nombre_completo}</Text><Text style={styles.etiqueta}>Teléfono:</Text><Text style={styles.datoCuenta}>{usuario?.telefono}</Text></View>
      <TouchableOpacity style={styles.boton} onPress={cerrarSesion}><Text style={styles.textoBoton}>CERRAR SESIÓN</Text></TouchableOpacity>
    </ScrollView>
  );
}

export function BarraInferior({ pantalla, irA, cantidadCarrito }) {
  const items = [
    { id: 'inicio', icono: '🏠', label: 'Inicio' },
    { id: 'menu', icono: '🍔', label: 'Menú' },
    { id: 'carrito', icono: '🛒', label: cantidadCarrito > 0 ? 'Carrito (' + cantidadCarrito + ')' : 'Carrito' },
    { id: 'pedidos', icono: '🧾', label: 'Pedidos' },
    { id: 'puntos', icono: '🎁', label: 'Puntos' }
  ];
  return (
    <View style={styles.barraInferior}>
      {items.map(it => (
        <TouchableOpacity key={it.id} style={styles.opcionInferior} onPress={() => irA(it.id)}>
          <Text style={[styles.iconoInferior, pantalla === it.id && styles.seleccionado]}>{it.icono}</Text>
          <Text style={[styles.textoInferior, pantalla === it.id && styles.seleccionado]}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
