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

export function VistaInicio({ usuario, datos, productos, recompensas, promociones, cfgPagos, navInfo, irA, carrito, setCarrito, categoriaActiva, setCategoriaActiva, onConfirmarPedido, onCanjear, onRecibirPedido, onCancelarPedido, cerrarSesion, cargando }) {
  const [subVista, setSubVista] = useState(navInfo?.tab || 'inicio');
  const [prodDetalle, setProdDetalle] = useState(null);
  const [canjeConfirmar, setCanjeConfirmar] = useState(null);

  useEffect(() => { if (navInfo?.tab) { setProdDetalle(null); setCanjeConfirmar(null); setSubVista(navInfo.tab); } }, [navInfo]);

  const listaCategorias = Array.isArray(categorias) && categorias.length ? ['Todas', ...categorias] : ['Todas', ...new Set((productos || []).map(p => p.categoria).filter(Boolean))];
  const catSel = categoriaActiva || 'Todas';
  const filtrados = catSel === 'Todas' ? (productos || []) : (productos || []).filter(p => p.categoria === catSel);
  const totalItems = (carrito || []).reduce((a, i) => a + i.cantidad, 0);

  function agregar(p, esPromo = false) {
    if (obtenerTurnoPeru() === 'cerrado') return mostrarAviso('Local cerrado', 'Nuestro horario de atención es de 6:50am a 11:00am y de 6:30pm a 11:50pm.');
    const stockActual = p.stock != null ? Number(p.stock) : 10;
    const ex = (carrito || []).find(i => i.id === p.id);
    if (stockActual <= 0 || (ex ? ex.cantidad : 0) + 1 > stockActual) return mostrarAviso('Sin stock', 'No hay más unidades disponibles.');
    const item = esPromo ? { ...p, nombre: p.titulo, es_promo: true } : p;
    setCarrito(ex ? carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...(carrito || []), { ...item, cantidad: 1 }]);
    mostrarAviso('Agregado', `${item.nombre} añadido al carrito.`);
  }

  function intentarCanjear(r) {
    if (obtenerTurnoPeru() === 'cerrado') return mostrarAviso('Local cerrado', 'Solo puedes canjear en horario de atención.');
    setCanjeConfirmar(r);
  }
  const BarraAbajoCliente = () => (
    <View style={{ flexDirection: 'row', backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingVertical: 8, paddingHorizontal: 4, justifyContent: 'space-around' }}>
      {[
        { id: 'menu', icon: '🍽️', txt: 'Menú' },
        { id: 'puntos', icon: '⭐', txt: 'Puntos' },
        { id: 'canjear', icon: '🎁', txt: 'Canjes' },
        { id: 'pedidos', icon: '📦', txt: 'Pedidos' },
        { id: 'ofertas', icon: '⚡', txt: 'Ofertas' },
        { id: 'promos', icon: '🔥', txt: 'Promos' }
      ].map(b => (
        <TouchableOpacity key={b.id} onPress={() => { setProdDetalle(null); setCanjeConfirmar(null); setSubVista(b.id); }} style={{ alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8, backgroundColor: subVista === b.id ? '#2A200B' : 'transparent' }}>
          <Text style={{ fontSize: 16 }}>{b.icon}</Text>
          <Text style={{ color: subVista === b.id ? '#F5B041' : '#CCCCCC', fontSize: 10, fontWeight: '800', marginTop: 2 }}>{b.txt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (subVista === 'inicio') {
    return (
      <View style={styles.pantallaCompleta}>
        <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { alignItems: 'center', paddingBottom: 30 }]}>
          <Image source={LOGO} style={{ width: 170, height: 170, borderRadius: 85, marginBottom: 14, borderWidth: 2, borderColor: '#F5B041' }} />
          <Text style={{ color: '#F5B041', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>¡Bienvenido, {usuario?.nombre_completo}!</Text>
          <Text style={{ color: '#CCCCCC', fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>Tienes {datos?.puntos ?? 0} puntos acumulados en Club Sazón</Text>
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {[
              { id: 'menu', titulo: '🍽️ MENÚ', desc: 'Ver platos y pedir', bg: '#F5B041', color: '#111111' },
              { id: 'promos', titulo: '🔥 PROMOCIONES', desc: 'Combos especiales', bg: '#181818', color: '#F5B041' },
              { id: 'ofertas', titulo: '⚡ OFERTAS', desc: 'Precios por hoy', bg: '#181818', color: '#F5B041' },
              { id: 'canjear', titulo: '🎁 CANJES', desc: 'Reclamar premios', bg: '#181818', color: '#F5B041' },
              { id: 'pedidos', titulo: '📦 PEDIDOS', desc: 'Estado en vivo', bg: '#181818', color: '#F5B041' },
              { id: 'puntos', titulo: '⭐ PUNTOS', desc: 'Historial de puntos', bg: '#181818', color: '#F5B041' }
            ].map(btn => (
              <TouchableOpacity key={btn.id} onPress={() => setSubVista(btn.id)} style={{ width: '48%', backgroundColor: btn.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F5B041' }}>
                <Text style={{ color: btn.color, fontSize: 14, fontWeight: '900' }}>{btn.titulo}</Text>
                <Text style={{ color: btn.id === 'menu' ? '#222' : '#AAA', fontSize: 11, marginTop: 4 }}>{btn.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={cerrarSesion} style={{ marginTop: 22, paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: '#E53935', fontWeight: '800', fontSize: 13 }}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </ScrollView>
        <BarraAbajoCliente />
      </View>
    );
}
  const barraInferior = (
    <View style={{ flexDirection: 'row', backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingVertical: 8, paddingHorizontal: 4, justifyContent: 'space-around' }}>
      {[
        { id: 'menu', ico: '🍽️', txt: 'MENÚ' },
        { id: 'puntos', ico: '⭐', txt: 'PUNTOS' },
        { id: 'canjear', ico: '🎁', txt: 'CANJES' },
        { id: 'pedidos', ico: '📦', txt: 'PEDIDOS' },
        { id: 'ofertas', ico: '⚡', txt: 'OFERTAS' },
        { id: 'promos', ico: '🔥', txt: 'PROMOS' }
      ].map(b => (
        <TouchableOpacity key={b.id} onPress={() => { setProdDetalle(null); setSubVista(b.id); }} style={{ alignItems: 'center', flex: 1, paddingVertical: 4, borderRadius: 8, backgroundColor: subVista === b.id ? '#241B08' : 'transparent' }}>
          <Text style={{ fontSize: 15 }}>{b.ico}</Text>
          <Text style={{ color: subVista === b.id ? '#F5B041' : '#AAA', fontSize: 9, fontWeight: '900', marginTop: 2 }}>{b.txt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (subVista === 'inicio') {
    return (
      <View style={styles.pantallaCompleta}>
        <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { alignItems: 'center', paddingBottom: 24 }]}>
          <Image source={LOGO} style={{ width: 150, height: 150, borderRadius: 75, marginBottom: 12, borderWidth: 2, borderColor: '#F5B041' }} />
          <Text style={{ color: '#F5B041', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>¡Bienvenido, {usuario?.nombre_completo}!</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 4 }}>Tienes {datos?.puntos ?? 0} PUNTOS acumulados</Text>
          <Text style={{ color: '#CCCCCC', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 18 }}>Elige a dónde quieres ingresar hoy en Club Sazón</Text>
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {[
              { id: 'menu', txt: '🍽️ MENÚ', color: '#F5B041', texto: '#111' },
              { id: 'puntos', txt: '⭐ PUNTOS', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'canjear', txt: '🎁 CANJES', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'pedidos', txt: '📦 PEDIDOS', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'ofertas', txt: '⚡ OFERTAS', color: '#1E1E1E', texto: '#F5B041' },
              { id: 'promos', txt: '🔥 PROMOCIONES', color: '#1E1E1E', texto: '#F5B041' }
            ].map(btn => (
              <TouchableOpacity key={btn.id} onPress={() => setSubVista(btn.id)} style={{ width: '48%', backgroundColor: btn.color, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F5B041' }}>
                <Text style={{ color: btn.texto, fontSize: 13, fontWeight: '900' }}>{btn.txt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={cerrarSesion} style={{ marginTop: 22, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#B71C1C' }}>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </ScrollView>
        {barraInferior}
      </View>
    );
  }

  return (
    <View style={styles.pantallaCompleta}>
      <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
        <NavegacionSuperior regresar={() => { if (prodDetalle) return setProdDetalle(null); setSubVista('inicio'); }} irAInicio={() => setSubVista('inicio')} />
        <View style={styles.filaSaludo}>
          <View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo} • {datos?.puntos ?? 0} PTS</Text></View>
          {totalItems > 0 && (
            <TouchableOpacity style={styles.botonCarrito} onPress={() => setSubVista('carrito')}>
              <Text style={styles.textoBotonCarrito}>🛒 {totalItems}</Text>
            </TouchableOpacity>
          )}
        </View>
        {(subVista === 'promos' || subVista === 'ofertas') && (
          <View>
            <Text style={styles.titulo}>{subVista === 'promos' ? 'PROMOCIONES' : 'OFERTAS DEL DÍA'}</Text>
            {(promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).length === 0 ? (
              <View style={styles.tarjetaVacia}><Text style={styles.textoVacio}>No hay {subVista} activas por el momento.</Text></View>
            ) : (promociones || []).filter(x => (subVista === 'promos' ? x.tipo === 'promocion' : x.tipo === 'oferta')).map(pr => {
              const st = pr.stock != null ? Number(pr.stock) : 10, sinStock = st <= 0;
              return (
                <View key={pr.id} style={styles.tarjetaPedido}>
                  {!!pr.imagen_url && <Image source={{ uri: pr.imagen_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} />}
                  <Text style={styles.nombreProducto}>{pr.titulo}</Text>
                  {!!pr.descripcion && <Text style={styles.descripcionPedido}>{pr.descripcion}</Text>}
                  <Text style={styles.precioProducto}>S/ {Number(pr.precio).toFixed(2)} • Stock: {st}</Text>
                  <TouchableOpacity style={[styles.boton, { marginTop: 8, backgroundColor: sinStock ? '#555' : '#F5B041' }]} disabled={sinStock} onPress={() => agregar(pr, true)}>
                    <Text style={[styles.textoBoton, { color: sinStock ? '#CCC' : '#111' }]}>{sinStock ? 'SIN STOCK' : '+ AGREGAR'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
              
