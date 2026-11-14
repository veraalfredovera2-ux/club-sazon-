import React, { useState } from 'react';
import { Alert, Platform, View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { styles } from './estilos';
import { NavegacionSuperior } from './pantallas';

export function mostrarAviso(titulo, mensaje) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
  } else {
    Alert.alert(titulo, mensaje);
  }
}

export function VistaPanel({ usuario, datos, regresar, irAInicio, irACanjes, irAPedidos }) {
  const historial = Array.isArray(datos?.historial) ? datos.historial : [];

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />

      <View style={styles.filaSaludo}>
        <View>
          <Text style={styles.saludo}>Hola,</Text>
          <Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text>
        </View>
      </View>

      <View style={styles.tarjetaSaldo}>
        <Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text>
        <Text style={styles.numeroSaldo}>{datos?.puntos ?? 0}</Text>
        <Text style={{ color: '#CCC', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
          Gana 10 puntos por cada S/ 1.00 de consumo en tus pedidos confirmados.
        </Text>
        <View style={styles.filaBotones}>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { flex: 1 }]} onPress={irACanjes}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>CANJEAR PUNTOS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonSecundario, styles.botonPequeno, { flex: 1 }]} onPress={irAPedidos}>
            <Text style={[styles.textoBoton, styles.textoBotonPequeno]}>MIS PEDIDOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.titulo}>HISTORIAL DE PUNTOS</Text>
      {historial.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Text style={styles.textoVacio}>Aún no tienes movimientos de puntos registrados.</Text>
        </View>
      ) : (
        historial.map((h, idx) => (
          <View key={h.id || idx} style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>{h.descripcion || h.motivo || 'Movimiento de puntos'}</Text>
            <Text style={[styles.precioProducto, { color: Number(h.puntos) >= 0 ? '#4CAF50' : '#E53935' }]}>
              {Number(h.puntos) >= 0 ? `+${h.puntos}` : h.puntos} PUNTOS
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
export function VistaCarrito({ usuario, carrito, setCarrito, cfgPagos, onConfirmarPedido, regresar, irAInicio, cargando }) {
  const [tipoEntrega, setTipoEntrega] = useState('RECOJO');
  const [distrito, setDistrito] = useState(usuario?.distrito || '');
  const [direccion, setDireccion] = useState(usuario?.direccion || '');
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [notas, setNotas] = useState('');

  const items = Array.isArray(carrito) ? carrito : [];
  const subtotal = items.reduce((acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 1), 0);
  const costoDelivery = tipoEntrega === 'DELIVERY' ? 5.0 : 0;
  const total = subtotal + costoDelivery;

  function cambiarCantidad(id, delta) {
    setCarrito(prev =>
      prev
        .map(item => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter(item => item.cantidad > 0)
    );
  }

  function enviarPedido() {
    if (items.length === 0) return;
    if (tipoEntrega === 'DELIVERY' && !direccion.trim()) {
      mostrarAviso('Falta dirección', 'Por favor ingresa tu dirección para el delivery.');
      return;
    }
    onConfirmarPedido({
      tipo_entrega: tipoEntrega,
      distrito: tipoEntrega === 'DELIVERY' ? distrito : 'Recojo en tienda',
      direccion: tipoEntrega === 'DELIVERY' ? direccion : 'Local Club Sazón',
      metodo_pago: metodoPago,
      subtotal,
      costo_delivery: costoDelivery,
      total,
      notas
    });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>MI CARRITO DE COMPRAS</Text>

      {items.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Text style={styles.textoVacio}>Tu carrito está vacío.</Text>
          <TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={regresar}>
            <Text style={styles.textoBoton}>IR AL MENÚ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {items.map(item => (
            <View key={item.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{item.nombre}</Text>
              <Text style={styles.precioProducto}>
                S/ {(Number(item.precio) * item.cantidad).toFixed(2)} (S/ {Number(item.precio).toFixed(2)} c/u)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
                <TouchableOpacity onPress={() => cambiarCantidad(item.id, -1)} style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: '#F5B041', fontWeight: '900', fontSize: 16 }}>{item.cantidad}</Text>
                <TouchableOpacity onPress={() => cambiarCantidad(item.id, 1)} style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
                                                  <View style={styles.tarjetaPedido}>
            <Text style={styles.titulo}>TIPO DE ENTREGA</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['RECOJO', 'DELIVERY'].map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => setTipoEntrega(tipo)}
                  style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: tipoEntrega === tipo ? '#F5B041' : '#222' }]}
                >
                  <Text style={[styles.textoBoton, { color: tipoEntrega === tipo ? '#111' : '#FFF' }]}>{tipo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoEntrega === 'DELIVERY' && (
              <View>
                <TextInput style={styles.input} placeholder="Distrito" placeholderTextColor="#777" value={distrito} onChangeText={setDistrito} />
                <TextInput style={styles.input} placeholder="Dirección exacta y referencia" placeholderTextColor="#777" value={direccion} onChangeText={setDireccion} />
              </View>
            )}

            <Text style={[styles.titulo, { marginTop: 10 }]}>MÉTODO DE PAGO</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['Yape', 'Plin', 'Efectivo'].map(metodo => (
                <TouchableOpacity
                  key={metodo}
                  onPress={() => setMetodoPago(metodo)}
                  style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: metodoPago === metodo ? '#F5B041' : '#222' }]}
                >
                  <Text style={[styles.textoBoton, { color: metodoPago === metodo ? '#111' : '#FFF' }]}>{metodo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {metodoPago === 'Yape' && !!cfgPagos?.qr_yape && (
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Image source={{ uri: cfgPagos.qr_yape }} style={{ width: 160, height: 160, borderRadius: 10 }} />
                <Text style={styles.descripcionPedido}>Titular: {cfgPagos?.titular || 'Club Sazón'}</Text>
              </View>
            )}

            {metodoPago === 'Plin' && !!cfgPagos?.qr_plin && (
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Image source={{ uri: cfgPagos.qr_plin }} style={{ width: 160, height: 160, borderRadius: 10 }} />
                <Text style={styles.descripcionPedido}>Titular: {cfgPagos?.titular || 'Club Sazón'}</Text>
              </View>
            )}

            <TextInput style={styles.input} placeholder="Notas adicionales para tu pedido (opcional)" placeholderTextColor="#777" value={notas} onChangeText={setNotas} />

            <View style={{ borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10, marginTop: 6 }}>
              <Text style={styles.descripcionPedido}>Subtotal: S/ {subtotal.toFixed(2)}</Text>
              {tipoEntrega === 'DELIVERY' && <Text style={styles.descripcionPedido}>Delivery: S/ {costoDelivery.toFixed(2)}</Text>}
              <Text style={[styles.totalPedidoTexto, { fontSize: 18, marginTop: 4 }]}>Total a pagar: S/ {total.toFixed(2)}</Text>
              <Text style={{ color: '#F5B041', fontSize: 12, marginTop: 2 }}>
                Ganarás +{Math.floor(subtotal * 10)} puntos al recibir tu pedido
              </Text>
            </View>

            <TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={enviarPedido} disabled={cargando}>
              <Text style={styles.textoBoton}>{cargando ? 'ENVIANDO PEDIDO...' : 'CONFIRMAR PEDIDO'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
              }
export function VistaCarrito({ usuario, carrito, setCarrito, cfgPagos, onConfirmarPedido, regresar, irAInicio, cargando }) {
  const [tipoEntrega, setTipoEntrega] = useState('RECOJO');
  const [distrito, setDistrito] = useState(usuario?.distrito || '');
  const [direccion, setDireccion] = useState(usuario?.direccion || '');
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [notas, setNotas] = useState('');

  const items = Array.isArray(carrito) ? carrito : [];
  const subtotal = items.reduce((acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 1), 0);
  const costoDelivery = tipoEntrega === 'DELIVERY' ? 5.0 : 0;
  const total = subtotal + costoDelivery;

  function cambiarCantidad(id, delta) {
    setCarrito(prev =>
      prev
        .map(item => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter(item => item.cantidad > 0)
    );
  }

  function enviarPedido() {
    if (items.length === 0) return;
    if (tipoEntrega === 'DELIVERY' && !direccion.trim()) {
      mostrarAviso('Falta dirección', 'Por favor ingresa tu dirección para el delivery.');
      return;
    }
    onConfirmarPedido({
      tipo_entrega: tipoEntrega,
      distrito: tipoEntrega === 'DELIVERY' ? distrito : 'Recojo en tienda',
      direccion: tipoEntrega === 'DELIVERY' ? direccion : 'Local Club Sazón',
      metodo_pago: metodoPago,
      subtotal,
      costo_delivery: costoDelivery,
      total,
      notas
    });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>MI CARRITO DE COMPRAS</Text>

      {items.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Text style={styles.textoVacio}>Tu carrito está vacío.</Text>
          <TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={regresar}>
            <Text style={styles.textoBoton}>IR AL MENÚ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {items.map(item => (
            <View key={item.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{item.nombre}</Text>
              <Text style={styles.precioProducto}>
                S/ {(Number(item.precio) * item.cantidad).toFixed(2)} (S/ {Number(item.precio).toFixed(2)} c/u)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
                <TouchableOpacity onPress={() => cambiarCantidad(item.id, -1)} style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: '#F5B041', fontWeight: '900', fontSize: 16 }}>{item.cantidad}</Text>
                <TouchableOpacity onPress={() => cambiarCantidad(item.id, 1)} style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.tarjetaPedido}>
            <Text style={styles.titulo}>TIPO DE ENTREGA</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['RECOJO', 'DELIVERY'].map(tipo => (
                <TouchableOpacity key={tipo} onPress={() => setTipoEntrega(tipo)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: tipoEntrega === tipo ? '#F5B041' : '#222' }]}>
                  <Text style={[styles.textoBoton, { color: tipoEntrega === tipo ? '#111' : '#FFF' }]}>{tipo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoEntrega === 'DELIVERY' && (
              <View>
                <TextInput style={styles.input} placeholder="Distrito" placeholderTextColor="#777" value={distrito} onChangeText={setDistrito} />
                <TextInput style={styles.input} placeholder="Dirección exacta y referencia" placeholderTextColor="#777" value={direccion} onChangeText={setDireccion} />
              </View>
            )}

            <Text style={[styles.titulo, { marginTop: 10 }]}>MÉTODO DE PAGO</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['Yape', 'Plin', 'Efectivo'].map(metodo => (
                <TouchableOpacity key={metodo} onPress={() => setMetodoPago(metodo)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: metodoPago === metodo ? '#F5B041' : '#222' }]}>
                  <Text style={[styles.textoBoton, { color: metodoPago === metodo ? '#111' : '#FFF' }]}>{metodo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {metodoPago === 'Yape' && !!cfgPagos?.qr_yape && (
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Image source={{ uri: cfgPagos.qr_yape }} style={{ width: 160, height: 160, borderRadius: 10 }} />
                <Text style={styles.descripcionPedido}>Titular: {cfgPagos?.titular || 'Club Sazón'}</Text>
              </View>
            )}

            {metodoPago === 'Plin' && !!cfgPagos?.qr_plin && (
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Image source={{ uri: cfgPagos.qr_plin }} style={{ width: 160, height: 160, borderRadius: 10 }} />
                <Text style={styles.descripcionPedido}>Titular: {cfgPagos?.titular || 'Club Sazón'}</Text>
              </View>
            )}

            <TextInput style={styles.input} placeholder="Notas adicionales para tu pedido (opcional)" placeholderTextColor="#777" value={notas} onChangeText={setNotas} />

            <View style={{ borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10, marginTop: 6 }}>
              <Text style={styles.descripcionPedido}>Subtotal: S/ {subtotal.toFixed(2)}</Text>
              {tipoEntrega === 'DELIVERY' && <Text style={styles.descripcionPedido}>Delivery: S/ {costoDelivery.toFixed(2)}</Text>}
              <Text style={[styles.totalPedidoTexto, { fontSize: 18, marginTop: 4 }]}>Total a pagar: S/ {total.toFixed(2)}</Text>
              <Text style={{ color: '#F5B041', fontSize: 12, marginTop: 2 }}>Ganarás +{Math.floor(subtotal * 10)} puntos al recibir tu pedido</Text>
            </View>

            <TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={enviarPedido} disabled={cargando}>
              <Text style={styles.textoBoton}>{cargando ? 'ENVIANDO PEDIDO...' : 'CONFIRMAR PEDIDO'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
                }
              
