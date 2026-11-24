import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { LOGO } from './pantallas';
import { mostrarAviso } from './avisos';
import { SUPABASE_URL, SUPABASE_KEY, obtenerConfigPagos } from './servicios';

async function patchPedidoRider(id, datos) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify(datos)
  });
  if (!res.ok) throw new Error('No se pudo actualizar la entrega.');
}

export function VistaRider({ usuario, pedidos, recargar, cerrarSesion, irAModoCliente }) {
  const [tab, setTab] = useState('disponibles');
  const [cargando, setCargando] = useState(false);

  const disponibles = (pedidos || []).filter(
    p => p.tipo_entrega === 'DELIVERY' && !p.rider_id && (p.estado === 'Listo' || p.estado_rider === 'Disponible')
  );
  const enCurso = (pedidos || []).filter(
    p => p.rider_id === usuario.id && p.estado !== 'Completado' && p.estado !== 'Cancelado'
  );
  const entregados = (pedidos || []).filter(
    p => p.rider_id === usuario.id && p.estado === 'Completado'
  );

  const gananciaDelivery = entregados.reduce((acc, p) => acc + Number(p.costo_delivery || 0), 0);
  const efectivoPendienteCaja = entregados
    .filter(p => p.metodo_pago === 'Efectivo' && p.estado_rider !== 'Liquidado en caja')
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  async function tomarPedido(ped) {
    setCargando(true);
    try {
      await patchPedidoRider(ped.id, {
        rider_id: usuario.id,
        rider_nombre: usuario.nombre_completo,
        estado_rider: 'Recogiendo en local',
        estado: 'Listo'
      });
      await recargar();
      setTab('encurso');
      mostrarAviso('Pedido asignado', `Ve al local a recoger el pedido ${ped.numero_pedido}.`);
    } catch (e) {
      mostrarAviso('Error', e.message);
    } finally {
      setCargando(false);
    }
  }

  async function actualizarPasoRider(ped, paso) {
    setCargando(true);
    try {
      if (paso === 'En camino') {
        await patchPedidoRider(ped.id, { estado_rider: 'En camino', estado: 'En camino' });
        await recargar();
        mostrarAviso('En camino', 'Se notificó al cliente que ya vas en camino.');
      } else if (paso === 'En la puerta') {
        await patchPedidoRider(ped.id, { estado_rider: 'En la puerta' });
        await recargar();
        mostrarAviso('Cliente notificado', 'Se envió una alerta avisando que ya estás en la puerta.');
      } else if (paso === 'Entregado') {
        if (!ped.recibido_cliente) {
          mostrarAviso('Falta confirmación del cliente', 'El cliente debe pulsar "Pedido Recibido" en su pantalla antes de cerrar la entrega.');
          setCargando(false);
          return;
        }
        await patchPedidoRider(ped.id, { estado_rider: 'Entregado', estado: 'Completado' });
        const cfg = await obtenerConfigPagos();
        const bonoPts = Number(cfg?.puntos_rider ?? 10);
        if (bonoPts > 0) {
          const resPts = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?select=puntos&id=eq.${usuario.id}&limit=1`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
          });
          const dataPts = await resPts.json();
          const ptsActuales = Number((Array.isArray(dataPts) && dataPts.at(0)?.puntos) || usuario.puntos || 0);
          await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${usuario.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({ puntos: ptsActuales + bonoPts })
          });
          await fetch(`${SUPABASE_URL}/rest/v1/historial_puntos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({ usuario_id: usuario.id, cantidad: bonoPts, descripcion: `Bono +${bonoPts} pts por entrega ${ped.numero_pedido}` })
          });
          await recargar();
          mostrarAviso('¡Entrega completada!', `Ganaste S/ ${Number(ped.costo_delivery || 0).toFixed(2)} y +${bonoPts} puntos Club Sazón.`);
        } else {
          await recargar();
          mostrarAviso('¡Entrega completada!', `Ganaste S/ ${Number(ped.costo_delivery || 0).toFixed(2)} por este envío.`);
        }
      }
    } catch (e) {
      mostrarAviso('Error', e.message);
    } finally {
      setCargando(false);
    }
  }

  function abrirMapaRuta(ped) {
    const partes = String(ped.direccion || '').split('|');
    const linkMaps = partes.length > 1 ? partes.at(1).trim() : '';
    if (linkMaps.startsWith('http')) {
      Linking.openURL(linkMaps);
    } else {
      const q = encodeURIComponent(`${partes.at(0) || ''} ${ped.distrito || ''}`.trim());
      const mapsBase = 'https://google.com';
      Linking.openURL(`${mapsBase}${q}`);
    }
  }

  function contactarClienteWhatsApp(ped) {
    const tel = String(ped.perfiles?.telefono || '').replace(/\D/g, '');
    if (!tel) return mostrarAviso('Sin teléfono', 'El cliente no tiene un teléfono registrado.');
    const telFinal = tel.length === 9 ? '51' + tel : tel;
    const msg = encodeURIComponent(
      `Hola ${ped.perfiles?.nombre_completo || ''}, soy ${usuario.nombre_completo}, tu repartidor de El Sazón Oriental. Ya estoy en camino / en la puerta con tu pedido ${ped.numero_pedido}.`
    );
    const baseWa = 'https://wa.me';
    Linking.openURL(`${baseWa}${telFinal}?text=${msg}`);
  }
  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Image source={LOGO} style={{ width: 44, height: 44, borderRadius: 10 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>ORIENTAL RIDERS</Text>
            <Text style={{ color: DORADO, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>🛵 {usuario.nombre_completo} • {usuario.puntos || 0} pts</Text>
          </View>
        </View>
        <TouchableOpacity onPress={cerrarSesion} style={{ backgroundColor: '#252530', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Salir</Text>
        </TouchableOpacity>
      </View>

      {irAModoCliente && (
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#1E1E28', borderWidth: 1.5, borderColor: DORADO, marginBottom: 10, paddingVertical: 10 }]}
          onPress={irAModoCliente}
        >
          <Text style={[styles.textoBoton, { color: DORADO }]}>🍔 CAMBIAR A MODO CLIENTE (PEDIR COMIDA)</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.tarjetaPedido, { borderColor: DORADO }]}>
        <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '800' }}>HORARIO DE TRABAJO ASIGNADO:</Text>
        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900', marginTop: 2 }}>{usuario.direccion_predeterminada || 'Lun a Dom: 12:00 pm - 10:00 pm'}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { id: 'disponibles', label: `Disponibles (${disponibles.length})` },
            { id: 'encurso', label: `En ruta (${enCurso.length})` },
            { id: 'ganancias', label: 'Mis Pagos' },
            { id: 'historial', label: `Historial (${entregados.length})` }
          ].map(t => (
            <TouchableOpacity key={t.id} style={[styles.categoria, tab === t.id && styles.categoriaActiva, { paddingHorizontal: 14, alignItems: 'center' }]} onPress={() => setTab(t.id)}>
              <Text style={styles.textoCategoria}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {tab === 'disponibles' && (
        <View>
          {disponibles.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay pedidos listos en cocina por ahora.</Text></View>
          ) : (
            disponibles.map(p => (
              <View key={p.id} style={[styles.tarjetaPedido, { borderColor: DORADO }]}>
                <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                <Text style={styles.descripcionPedido}>Destino: {p.distrito} - {String(p.direccion || '').split('|').at(0)}</Text>
                <Text style={[styles.precioProducto, { color: '#22C55E', marginTop: 4 }]}>Tu ganancia delivery: S/ {Number(p.costo_delivery || 0).toFixed(2)}</Text>
                <Text style={styles.descripcionPedido}>Cobro al cliente: S/ {Number(p.total || 0).toFixed(2)} ({p.metodo_pago})</Text>
                <TouchableOpacity style={styles.boton} onPress={() => tomarPedido(p)} disabled={cargando}>
                  <Text style={styles.textoBoton}>🛵 ACEPTAR ENTREGA</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'encurso' && (
        <View>
          {enCurso.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No tienes entregas en curso.</Text></View>
          ) : (
            enCurso.map(p => (
              <View key={p.id} style={[styles.tarjetaPedido, { borderColor: ROJO }]}>
                <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                <Text style={styles.descripcionPedido}>Tel: {p.perfiles?.telefono || 'No registrado'}</Text>
                <Text style={styles.descripcionPedido}>Dir: {p.distrito} - {String(p.direccion || '').split('|').at(0)}</Text>
                <Text style={[styles.descripcionPedido, { color: DORADO, fontWeight: '800', marginTop: 4 }]}>
                  {p.metodo_pago === 'Efectivo' ? `💵 COBRAR EN EFECTIVO: S/ ${Number(p.total || 0).toFixed(2)}` : `✅ PAGADO CON ${p.metodo_pago.toUpperCase()} (NO COBRAR)`}
                </Text>
                <Text style={{ color: p.recibido_cliente ? '#22C55E' : '#F59E0B', fontWeight: '900', fontSize: 12, marginTop: 4 }}>
                  {p.recibido_cliente ? '✅ Cliente ya confirmó recepción' : '⏳ Esperando confirmación del cliente'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.boton, { flex: 1, backgroundColor: '#0284C7', marginTop: 0 }]} onPress={() => abrirMapaRuta(p)}>
                    <Text style={styles.textoBoton}>🗺️ GOOGLE MAPS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.boton, { flex: 1, backgroundColor: '#128C7E', marginTop: 0 }]} onPress={() => contactarClienteWhatsApp(p)}>
                    <Text style={styles.textoBoton}>💬 WHATSAPP</Text>
                  </TouchableOpacity>
                </View>

                {p.estado_rider === 'Recogiendo en local' && (
                  <TouchableOpacity style={[styles.boton, { backgroundColor: '#2563EB', marginTop: 8 }]} onPress={() => actualizarPasoRider(p, 'En camino')}>
                    <Text style={styles.textoBoton}>📦 CONFIRMAR RECOGIDA (EN CAMINO)</Text>
                  </TouchableOpacity>
                )}

                {p.estado_rider === 'En camino' && (
                  <TouchableOpacity style={[styles.boton, { backgroundColor: '#D97706', marginTop: 8 }]} onPress={() => actualizarPasoRider(p, 'En la puerta')}>
                    <Text style={styles.textoBoton}>🔔 ESTOY AQUÍ (EN LA PUERTA)</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.boton, { backgroundColor: p.recibido_cliente ? '#16A34A' : '#374151', marginTop: 8 }]} onPress={() => actualizarPasoRider(p, 'Entregado')}>
                  <Text style={styles.textoBoton}>
                    {p.recibido_cliente ? '✅ FINALIZAR ENTREGA (SUMAR GANANCIA)' : '🔒 BLOQUEADO HASTA CONFIRMACIÓN DEL CLIENTE'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'ganancias' && (
        <View>
          <View style={[styles.tarjetaPedido, { borderColor: '#16A34A' }]}>
            <Text style={styles.nombreProducto}>TUS GANANCIAS ACUMULADAS (DELIVERY)</Text>
            <Text style={[styles.precioProducto, { fontSize: 26, color: '#22C55E', marginTop: 4 }]}>S/ {gananciaDelivery.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>Entregas completadas: {entregados.length}</Text>
          </View>
          <View style={[styles.tarjetaPedido, { borderColor: efectivoPendienteCaja > 0 ? ROJO : BORDE }]}>
            <Text style={styles.nombreProducto}>EFECTIVO COBRADO POR RENDIR A CAJA</Text>
            <Text style={[styles.precioProducto, { fontSize: 24, color: efectivoPendienteCaja > 0 ? ROJO : '#22C55E', marginTop: 4 }]}>S/ {efectivoPendienteCaja.toFixed(2)}</Text>
            <Text style={styles.descripcionPedido}>
              {efectivoPendienteCaja > 0 ? 'Entrega este monto en caja al finalizar tu turno.' : 'No tienes efectivo pendiente por rendir.'}
            </Text>
          </View>
        </View>
      )}

      {tab === 'historial' && (
        <View>
          <Text style={styles.titulo}>HISTORIAL DE ENTREGAS ({entregados.length})</Text>
          {entregados.length === 0 ? (
            <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>Aún no tienes entregas completadas.</Text></View>
          ) : (
            entregados.map(p => (
              <View key={p.id} style={styles.tarjetaPedido}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.nombreProducto}>{p.numero_pedido} • {p.perfiles?.nombre_completo || 'Cliente'}</Text>
                  <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 13 }}>+S/ {Number(p.costo_delivery || 0).toFixed(2)}</Text>
                </View>
                <Text style={styles.descripcionPedido}>{new Date(p.creado_en).toLocaleString()} • {p.metodo_pago}</Text>
                <Text style={styles.descripcionPedido}>Destino: {p.distrito} - {String(p.direccion || '').split('|').at(0)}</Text>
                {p.metodo_pago === 'Efectivo' && (
                  <Text style={{ color: p.estado_rider === 'Liquidado en caja' ? '#22C55E' : ROJO, fontSize: 11, fontWeight: '800', marginTop: 4 }}>
                    {p.estado_rider === 'Liquidado en caja'
                      ? `✅ Efectivo S/ ${Number(p.total || 0).toFixed(2)} liquidado en caja`
                      : `⏳ Efectivo S/ ${Number(p.total || 0).toFixed(2)} pendiente de rendir`}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
        }
                  
