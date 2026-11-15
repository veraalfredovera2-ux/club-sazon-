import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { styles } from './estilos';
import { NavegacionSuperior } from './pantallas';

let _setAvisoGlobal = null;
export function registrarAvisoGlobal(fn) { _setAvisoGlobal = fn; }
export function mostrarAviso(titulo, mensaje) {
  if (_setAvisoGlobal) _setAvisoGlobal({ titulo, mensaje });
}

export function BannerAviso({ aviso, onCerrar }) {
  if (!aviso) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 999 }}>
      <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 22, borderWidth: 2, borderColor: '#F5B041', alignItems: 'center' }}>
        {!!aviso.titulo && <Text style={{ color: '#F5B041', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>{aviso.titulo}</Text>}
        <Text style={{ color: '#FFFFFF', fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 21 }}>{aviso.mensaje}</Text>
        <TouchableOpacity onPress={onCerrar} style={{ backgroundColor: '#F5B041', paddingVertical: 12, paddingHorizontal: 36, borderRadius: 10, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: '#111111', fontWeight: '900', fontSize: 15 }}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cajaBlanca = { color: '#FFFFFF', backgroundColor: '#1E1E1E', borderColor: '#555', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 50, marginBottom: 12 };

export function VistaPanel({ usuario, datos, regresar, irAInicio, irACanjes, irAPedidos }) {
  const historial = Array.isArray(datos?.historial) ? datos.historial : [];
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <View style={styles.filaSaludo}><View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View></View>
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
          <Text style={[styles.precioProducto, { color: Number(h.cantidad || h.puntos) >= 0 ? '#4CAF50' : '#E53935' }]}>{Number(h.cantidad || h.puntos) >= 0 ? `+${h.cantidad ?? h.puntos}` : (h.cantidad ?? h.puntos)} PTS</Text>
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
    setCarrito(prev => prev.map(i => {
      if (i.id !== id) return i;
      const maxStock = i.stock != null ? Number(i.stock) : 999;
      const nueva = i.cantidad + delta;
      if (nueva > maxStock) { mostrarAviso('Stock limitado', `Solo quedan ${maxStock} unidades disponibles.`); return i; }
      return { ...i, cantidad: nueva };
    }).filter(i => i.cantidad > 0));
  }

  async function enviarPedido() {
    if (!items.length) return mostrarAviso('Carrito vacío', 'Agrega productos antes de confirmar.');
    if (tipoEntrega === 'DELIVERY' && !direccion.trim()) return mostrarAviso('Falta dirección', 'Ingresa tu dirección para el delivery.');
    const extras = items.filter(i => i.extra_ingrediente?.trim()).map(i => `${i.nombre}: ${i.extra_ingrediente.trim()}`).join(' | ');
    await onConfirmarPedido({ tipo_entrega: tipoEntrega, distrito: tipoEntrega === 'DELIVERY' ? (distrito.trim() || 'Por confirmar') : 'Recojo en tienda', direccion: tipoEntrega === 'DELIVERY' ? direccion.trim() : 'Local Club Sazón', metodo_pago: metodoPago, subtotal, costo_delivery: costoDelivery, total, notas: [extras, notas.trim()].filter(Boolean).join(' — ') });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>MI CARRITO DE COMPRAS</Text>
      {items.length === 0 ? (
        <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Tu carrito está vacío.</Text><TouchableOpacity style={[styles.boton, { marginTop: 14 }]} onPress={regresar}><Text style={styles.textoBoton}>IR AL MENÚ</Text></TouchableOpacity></View>
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
              <TextInput style={[cajaBlanca, { minHeight: 44, fontSize: 13, marginBottom: 0 }]} placeholder="Quitar o agregar extras de ingredientes..." placeholderTextColor="#999" value={i.extra_ingrediente || ''} onChangeText={t => setCarrito(prev => prev.map(x => x.id === i.id ? { ...x, extra_ingrediente: t } : x))} />
            </View>
          ))}
          <View style={styles.tarjetaPedido}>
            <Text style={styles.titulo}>ENTREGA Y PAGO</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['RECOJO', 'DELIVERY'].map(t => <TouchableOpacity key={t} onPress={() => setTipoEntrega(t)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: tipoEntrega === t ? '#F5B041' : '#222' }]}><Text style={[styles.textoBoton, { color: tipoEntrega === t ? '#111' : '#FFF' }]}>{t}</Text></TouchableOpacity>)}
            </View>
            {tipoEntrega === 'DELIVERY' && <View><TextInput style={cajaBlanca} placeholder="Distrito" placeholderTextColor="#999" value={distrito} onChangeText={setDistrito} /><TextInput style={[cajaBlanca, { minHeight: 72 }]} multiline placeholder="Dirección exacta y referencia..." placeholderTextColor="#999" value={direccion} onChangeText={setDireccion} /></View>}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['Yape', 'Plin', 'Efectivo'].map(m => <TouchableOpacity key={m} onPress={() => setMetodoPago(m)} style={[styles.boton, styles.botonPequeno, { flex: 1, backgroundColor: metodoPago === m ? '#F5B041' : '#222' }]}><Text style={[styles.textoBoton, { color: metodoPago === m ? '#111' : '#FFF' }]}>{m}</Text></TouchableOpacity>)}
            </View>
            {metodoPago === 'Yape' && !!cfgPagos?.qr_yape && <Image source={{ uri: cfgPagos.qr_yape }} style={{ width: 150, height: 150, alignSelf: 'center', marginVertical: 6 }} />}
            {metodoPago === 'Plin' && !!cfgPagos?.qr_plin && <Image source={{ uri: cfgPagos.qr_plin }} style={{ width: 150, height: 150, alignSelf: 'center', marginVertical: 6 }} />}
            <TextInput style={cajaBlanca} placeholder="Notas adicionales generales (opcional)" placeholderTextColor="#999" value={notas} onChangeText={setNotas} />
            <Text style={[styles.totalPedidoTexto, { fontSize: 18, marginTop: 6 }]}>Total: S/ {total.toFixed(2)}</Text>
            <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={enviarPedido} disabled={cargando}><Text style={styles.textoBoton}>{cargando ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
