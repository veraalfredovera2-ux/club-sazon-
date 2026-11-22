import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { styles, DORADO, TARJETA, BORDE } from './estilos';
import { LOGO } from './pantallas';
import { mostrarAviso } from './avisos';
import { completarEntregaRiderAdmin } from './servicios';

function obtenerRangoSemana(offsetSemanas = 0) {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diffLunes = (dia === 0 ? -6 : 1 - dia) + offsetSemanas * 7;
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diffLunes, 0, 0, 0);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59);
  return { inicio, fin };
}

function obtenerRangoMes(offsetMeses = 0) {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() + offsetMeses, 1, 0, 0, 0);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + offsetMeses + 1, 0, 23, 59, 59);
  return { inicio, fin };
}

export function VistaRider({ usuario, pedidos, recargar, cerrarSesion }) {
  const [periodo, setPeriodo] = useState('esta_semana');
  const [procesando, setProcesando] = useState(false);

  const misPedidos = (pedidos || []).filter(p => p.rider_id === usuario?.id);
  const enRuta = misPedidos.filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado');
  const entregados = misPedidos.filter(p => p.estado === 'Completado');

  const rango = periodo === 'esta_semana'
    ? obtenerRangoSemana(0)
    : periodo === 'semana_pasada'
      ? obtenerRangoSemana(-1)
      : periodo === 'este_mes'
        ? obtenerRangoMes(0)
        : obtenerRangoMes(-1);

  const filtrados = entregados.filter(p => {
    const f = new Date(p.creado_en);
    return f >= rango.inicio && f <= rango.fin;
  });

  const gananciaPeriodo = filtrados.reduce((acc, p) => acc + Number(p.costo_delivery || 0), 0);

  const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const resumenPorDia = {};
  filtrados.forEach(p => {
    const f = new Date(p.creado_en);
    const clave = f.toISOString().slice(0, 10);
    const etiqueta = `${diasSemanaNombres[f.getDay()]} ${clave.slice(8, 10)}/${clave.slice(5, 7)}`;
    if (!resumenPorDia[clave]) resumenPorDia[clave] = { etiqueta, pedidos: 0, ganancia: 0 };
    resumenPorDia[clave].pedidos += 1;
    resumenPorDia[clave].ganancia += Number(p.costo_delivery || 0);
  });

  async function marcarEntregadoFinal(ped) {
    if (!ped.recibido_cliente) {
      return mostrarAviso('Falta confirmación', 'El cliente debe pulsar "PEDIDO RECIBIDO" en su app primero.');
    }
    setProcesando(true);
    try {
      await completarEntregaRiderAdmin(ped.id);
      await recargar();
      mostrarAviso('¡Entrega completada!', `Se sumó +S/ ${Number(ped.costo_delivery || 0).toFixed(2)} a tu ganancia.`);
    } catch (e) {
      mostrarAviso('Error', e.message);
    } finally {
      setProcesando(false);
    }
  }

  function abrirMapaCliente(dir) {
    const match = (dir || '').match(/https:\/\/www\.google\.com\/maps\?q=[^\s|]+/);
    if (match) return Linking.openURL(match[0]).catch(() => {});
    const query = encodeURIComponent(dir || 'Lima, Peru');
    Linking.openURL(`https://google.com{query}`).catch(() => {});
  }
  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <View style={styles.cabeceraTop}>
        <View style={{ width: 70 }} />
        <Image source={LOGO} style={styles.logoHeaderCentro} />
        <TouchableOpacity onPress={recargar} style={{ backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 }}>
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tarjetaPerfilHero}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F3F4F6', fontSize: 12, fontWeight: '800' }}>ORIENTAL RIDERS 🛵</Text>
          <Text style={styles.nombreDoradoHero}>{usuario?.nombre_completo}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
            📅 Horario semanal: {usuario?.direccion_predeterminada || 'Lun a Dom: 12:00 pm - 10:00 pm'}
          </Text>
        </View>
        <View style={styles.badgePuntosHero}>
          <Text style={{ color: DORADO, fontSize: 16, fontWeight: '900' }}>S/ {gananciaPeriodo.toFixed(0)}</Text>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Ganancia</Text>
        </View>
      </View>

      <Text style={styles.titulo}>PEDIDOS EN RUTA ({enRuta.length})</Text>
      {enRuta.length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Text style={styles.textoVacio}>No tienes entregas activas en este momento.</Text>
        </View>
      ) : (
        enRuta.map(p => (
          <View key={p.id} style={styles.tarjetaPedido}>
            <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
            <Text style={styles.descripcionPedido}>📱 Teléfono: {p.perfiles?.telefono || 'Sin número'}</Text>
            <Text style={[styles.descripcionPedido, { color: '#FFF', fontWeight: '700' }]}>📍 Destino: {p.distrito} - {p.direccion}</Text>
            <Text style={styles.totalPedidoTexto}>Cobrar: S/ {Number(p.total).toFixed(2)} ({p.metodo_pago}) • Tu ganancia: S/ {Number(p.costo_delivery || 0).toFixed(2)}</Text>

            <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E293B', marginTop: 8 }]} onPress={() => abrirMapaCliente(p.direccion)}>
              <Text style={styles.textoBoton}>🗺️ ABRIR RUTA EN GOOGLE MAPS</Text>
            </TouchableOpacity>

            {p.recibido_cliente ? (
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#16A34A', marginTop: 8 }]} onPress={() => marcarEntregadoFinal(p)} disabled={procesando}>
                <Text style={styles.textoBoton}>✅ MARCAR PEDIDO ENTREGADO (+ S/ {Number(p.costo_delivery || 0).toFixed(2)})</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ backgroundColor: '#2A1D0D', borderWidth: 1, borderColor: DORADO, borderRadius: 10, padding: 10, marginTop: 8 }}>
                <Text style={{ color: DORADO, fontSize: 11, fontWeight: '900', textAlign: 'center' }}>
                  ⏳ Esperando que el cliente pulse "PEDIDO RECIBIDO" en su app para habilitar entrega
                </Text>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={styles.titulo}>RENDIMIENTO Y GANANCIAS HISTÓRICAS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {[
          { id: 'esta_semana', label: 'Esta semana' },
          { id: 'semana_pasada', label: 'Semana pasada' },
          { id: 'este_mes', label: 'Este mes' },
          { id: 'mes_pasado', label: 'Mes pasado' }
        ].map(tab => (
          <TouchableOpacity key={tab.id} style={[styles.categoria, periodo === tab.id && styles.categoriaActiva]} onPress={() => setPeriodo(tab.id)}>
            <Text style={styles.textoCategoria}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>ENTREGAS COMPLETADAS</Text>
          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 }}>{filtrados.length}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 14, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800' }}>GANANCIA DEL PERIODO</Text>
          <Text style={{ color: DORADO, fontSize: 22, fontWeight: '900', marginTop: 2 }}>S/ {gananciaPeriodo.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={[styles.descripcionPedido, { color: '#FFF', fontWeight: '800', marginBottom: 6 }]}>Desglose guardado por día:</Text>
      {Object.keys(resumenPorDia).length === 0 ? (
        <View style={styles.tarjetaVacia}>
          <Text style={styles.textoVacio}>Sin entregas registradas en este periodo.</Text>
        </View>
      ) : (
        Object.keys(resumenPorDia).sort().reverse().map(diaKey => (
          <View key={diaKey} style={styles.producto}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombreProducto}>{resumenPorDia[diaKey].etiqueta}</Text>
              <Text style={styles.descripcionPedido}>{resumenPorDia[diaKey].pedidos} pedidos entregados</Text>
            </View>
            <Text style={[styles.precioProducto, { color: '#22C55E' }]}>+ S/ {resumenPorDia[diaKey].ganancia.toFixed(2)}</Text>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.boton, { backgroundColor: '#1E1E28', borderWidth: 1, borderColor: BORDE, marginTop: 14 }]} onPress={cerrarSesion}>
        <Text style={styles.textoBoton}>↪ Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
          }
              
