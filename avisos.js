import React, { useState } from 'react';
import { Alert, Platform, View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { styles } from './estilos';
import { NavegacionSuperior } from './pantallas';

export function mostrarAviso(titulo, mensaje) {
  if (Platform.OS === 'web') window.alert(`${titulo}\n\n${mensaje}`);
  else Alert.alert(titulo, mensaje);
}

const inputBlanco = { color: '#FFFFFF', backgroundColor: '#1E1E1E', borderColor: '#444', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 50, marginBottom: 10 };

export function VistaPanel({ usuario, datos, regresar, irAInicio, irACanjes, irAPedidos }) {
  const historial = Array.isArray(datos?.historial) ? datos.historial : [];
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <View style={styles.filaSaludo}>
        <View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View>
      </View>
      <View style={styles.tarjetaSaldo}>
        <Text style={styles.etiquetaSaldo}>TUS PUNTOS DISPONIBLES</Text>
        <Text style={styles.numeroSaldo}>{datos?.puntos ?? 0}</Text>
        <View style={styles.filaBotones}>
          <TouchableOpacity style={[styles.boton, styles.botonPequeno, { flex: 1 }]} onPress={irACanjes}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>CANJEAR PUNTOS</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.boton, styles.botonSecundario, styles.botonPequeno, { flex: 1 }]} onPress={irAPedidos}><Text style={[styles.textoBoton, styles.textoBotonPequeno]}>MIS PEDIDOS</Text></TouchableOpacity>
        </View>
      </View>
      <Text style={styles.titulo}>HISTORIAL DE PUNTOS</Text>
      {historial.length === 0 ? <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Sin movimientos registrados.</Text></View> : historial.map((h, i) => (
        <View key={h.id || i} style={styles.tarjetaPedido}>
          <Text style={styles.nombreProducto}>{h.descripcion || h.motivo || 'Movimiento'}</Text>
          <Text style={[styles.precioProducto, { color: Number(h.puntos) >= 0 ? '#4CAF50' : '#E53935' }]}>{Number(h.puntos) >= 0 ? `+${h.puntos}` : h.puntos} PTS</Text>
        </View>
      ))}
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
  const subtotal = items.reduce((a, i) => a + Number(i.precio || 0) * Number(i.cantidad || 1), 0);
  const costoDelivery = tipoEntrega === 'DELIVERY' ? 5.0 : 0;
  const total = subtotal + costoDelivery;

  function cambiarCantidad(id, delta) {
    setCarrito(prev => prev.map(i => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)).filter(i => i.cantidad > 0));
  }

  function cambiarNotaProducto(id, texto) {
    setCarrito(prev => prev.map(i => (i.id === id ? { ...i, nota_producto: texto } : i)));
  }

  async function enviarPedido() {
    if (items.length === 0) { mostrarAviso('Carrito vacío', 'Agrega productos antes de confirmar.'); return; }
    if (tipoEntrega === 'DELIVERY' && !direccion.trim()) { mostrarAviso('Falta dirección', 'Ingresa tu dirección para el delivery.'); return; }
    const detalleIngredientes = items.filter(i => i.nota_producto?.trim()).map(i => `${i.nombre}: ${i.nota_producto.trim()}`).join(' | ');
    const notasFinales = [detalleIngredientes, notas.trim()].filter(Boolean).join(' — ');
    await onConfirmarPedido({
      tipo_entrega: tipoEntrega,
      distrito: tipoEntrega === 'DELIVERY' ? distrito : 'Recojo en tienda',
      direccion: tipoEntrega === 'DELIVERY' ? direccion : 'Local Club Sazón',
      metodo_pago: metodoPago,
      subtotal,
      costo_delivery: costoDelivery,
      total,
      notas: notasFinales
    });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>MI CARRITO DE COMPRAS</Text>
      {items.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Text style={styles.textoVacio}>Tu carrito está vacío.</Text>
          <TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={regresar}><Text style={styles.textoBoton}>IR AL MENÚ</Text></TouchableOpacity>
        </View>
      ) : (
        <View>
          {items.map(i => (
            <View key={i.id} style={styles.tarjetaPedido}>
              <Text style={styles.nombreProducto}>{i.nombre} - S/ {(Number(i.precio) * i.cantidad).toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 12 }}>
                <TouchableOpacity onPress={() => cambiarCantidad(i.id, -1)} style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}><Text style={{ color: '#FFF', fontWeight: '900' }}>-</Text></TouchableOpacity>
                <Text style={{ color: '#F5B041', fontWeight: '900' }}>{i.cantidad}</Text>
                <TouchableOpacity onPress={() => cambiarCantidad(i.id, 1)} style={{ backgroundColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}><Text style={{ color: '#FFF', fontWeight: '900' }}>+</Text></TouchableOpacity>
              </View>
              <TextInput
                style={[inputBlanco, { minHeight: 42, fontSize: 13, marginBottom: 0 }]}
                placeholder="¿Quitar o agregar ingredientes? (Ej: Sin cebolla, extra queso)"
                placeholderTextColor="#999"
                value={i.nota_producto || ''}
                onChangeText={t => cambiarNotaProducto(i.id, t)}
              />
            </View>
          ))}
          <View style={styles.tarjetaPedido}>
            <Text style={styles.titulo}>ENTREGA Y PAGO</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['RECOJO', 'DELIVERY'].map(t => (
                <TouchableOpacity key={t} onPress={() => setTipoEntrega(t)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: tipoEntrega === t ? '#F5B041' : '#222' }]}>
                  <Text style={[styles.textoBoton, { color: tipoEntrega === t ? '#111' : '#FFF' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {tipoEntrega === 'DELIVERY' && (
              <View>
                <TextInput style={inputBlanco} placeholder="Distrito" placeholderTextColor="#999" value={distrito} onChangeText={setDistrito} />
                <TextInput style={[inputBlanco, { minHeight: 70 }]} multiline placeholder="Dirección exacta y referencia" placeholderTextColor="#999" value={direccion} onChangeText={setDireccion} />
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['Yape', 'Plin', 'Efectivo'].map(m => (
                <TouchableOpacity key={m} onPress={() => setMetodoPago(m)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: metodoPago === m ? '#F5B041' : '#222' }]}>
                  <Text style={[styles.textoBoton, { color: metodoPago === m ? '#111' : '#FFF' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {metodoPago === 'Yape' && !!cfgPagos?.qr_yape && <Image source={{ uri: cfgPagos.qr_yape }} style={{ width: 150, height: 150, alignSelf: 'center', marginVertical: 6 }} />}
            {metodoPago === 'Plin' && !!cfgPagos?.qr_plin && <Image source={{ uri: cfgPagos.qr_plin }} style={{ width: 150, height: 150, alignSelf: 'center', marginVertical: 6 }} />}
            <TextInput style={inputBlanco} placeholder="Notas adicionales del pedido (opcional)" placeholderTextColor="#999" value={notas} onChangeText={setNotas} />
            <Text style={[styles.totalPedidoTexto, { fontSize: 18, marginTop: 6 }]}>Total: S/ {total.toFixed(2)}</Text>
            <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={enviarPedido}>
              <Text style={styles.textoBoton}>{cargando ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
