import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { enviarPushNativo } from './push';

const SUPABASE_URL = 'https://' + 'pripxtsriyxhafevokjg' + '.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ShY2V3Oh7gB4ZHSBzI5o_Q_GSMxzmds';

export const categorias = [
  'Todas', 'Hamburguesas', 'Salchipapas', 'Alitas', 'Broaster', 'Pollo a la brasa', 'Chaufa', 'Bebidas', 'Extras'
];

export function obtenerHoraPeru() {
  const ahoraUtc = Date.now();
  const limaDate = new Date(ahoraUtc - 5 * 3600 * 1000);
  const horas = limaDate.getUTCHours();
  const minutos = limaDate.getUTCMinutes();
  const texto = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  return { horas, minutos, totalMinutos: horas * 60 + minutos, texto };
}

function parsearMinutosHora(horaStr, defMin) {
  const m = String(horaStr || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return defMin;
  const h = Math.min(23, Math.max(0, Number(m.at(1))));
  const min = Math.min(59, Math.max(0, Number(m.at(2))));
  return h * 60 + min;
}

export function verificarEstadoLocalPeru(cfg) {
  const peru = obtenerHoraPeru();
  if (cfg?.local_cerrado) {
    return { cerrado: true, motivo: 'manual', horaPeru: peru.texto };
  }
  const minAp = parsearMinutosHora(cfg?.hora_apertura || '12:00', 12 * 60);
  const minCi = parsearMinutosHora(cfg?.hora_cierre || '23:00', 23 * 60);
  const actual = peru.totalMinutos;
  let dentroHorario = false;
  if (minAp <= minCi) {
    dentroHorario = actual >= minAp && actual < minCi;
  } else {
    dentroHorario = actual >= minAp || actual < minCi;
  }
  return {
    cerrado: !dentroHorario,
    motivo: dentroHorario ? 'abierto' : 'horario',
    horaPeru: peru.texto
  };
}

export const limpiarTelefono = (tel) => {
  const num = String(tel || '').replace(/\D/g, '');
  return num.length === 11 && num.startsWith('51') ? num.slice(2) : num;
};

async function apiSupabase(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation'
    }
  };
  if (cuerpo) opciones.body = JSON.stringify(cuerpo);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, opciones);
  const texto = await res.text();
  let datos = {};
  try {
    datos = texto ? JSON.parse(texto) : [];
  } catch (e) {
    throw new Error('Respuesta inválida del servidor.');
  }
  if (!res.ok) throw new Error(datos.message || datos.error || 'Error en la base de datos.');
  return datos;
}
export function extraerConfigDelivery(titularRaw) {
  const partes = String(titularRaw || 'Club Sazón').split('||DEL:');
  const titularLimpio = (partes.at(0) || 'Club Sazón').trim();
  const defCats = categorias.filter(c => c !== 'Todas');
  const def = {
    titularLimpio,
    local_lat: '-12.069706',
    local_lng: '-77.033827',
    tarifa_base: '4.00',
    tarifa_km: '1.50',
    local_cerrado: false,
    puntos_rider: '10',
    hora_apertura: '12:00',
    hora_cierre: '23:00',
    categorias_lista: defCats
  };
  if (partes.length < 2) return def;
  const nums = partes.at(1).split('|');
  const catsRaw = nums.at(8);
  const catsParsed = catsRaw ? catsRaw.split('~').map(x => x.trim()).filter(Boolean) : defCats;
  return {
    titularLimpio,
    local_lat: nums.at(0) || def.local_lat,
    local_lng: nums.at(1) || def.local_lng,
    tarifa_base: nums.at(2) || def.tarifa_base,
    tarifa_km: nums.at(3) || def.tarifa_km,
    local_cerrado: nums.at(4) === '1',
    puntos_rider: nums.at(5) !== undefined ? String(nums.at(5)) : '10',
    hora_apertura: nums.at(6) || '12:00',
    hora_cierre: nums.at(7) || '23:00',
    categorias_lista: catsParsed.length > 0 ? catsParsed : defCats
  };
}

export async function obtenerConfigPagos() {
  try {
    const res = await apiSupabase('configuracion_pagos?select=*&limit=1');
    const fila = Array.isArray(res) && res.length > 0 ? res.at(0) : { qr_yape: '', qr_plin: '', titular: 'Club Sazón' };
    return { ...fila, ...extraerConfigDelivery(fila.titular) };
  } catch (e) {
    return { qr_yape: '', qr_plin: '', titular: 'Club Sazón', ...extraerConfigDelivery('Club Sazón') };
  }
}

export async function guardarConfigPagos(cfg) {
  const actual = await apiSupabase('configuracion_pagos?select=id&limit=1');
  const catsStr = Array.isArray(cfg.categorias_lista) && cfg.categorias_lista.length > 0
    ? cfg.categorias_lista.map(c => String(c).replace(/[|~]/g, '').trim()).filter(Boolean).join('~')
    : categorias.filter(c => c !== 'Todas').join('~');
  const cadenaDelivery = `${cfg.titularLimpio || 'Club Sazón'}||DEL:${cfg.local_lat || '-12.069706'}|${cfg.local_lng || '-77.033827'}|${cfg.tarifa_base || '4.00'}|${cfg.tarifa_km || '1.50'}|${cfg.local_cerrado ? '1' : '0'}|${cfg.puntos_rider ?? '10'}|${cfg.hora_apertura || '12:00'}|${cfg.hora_cierre || '23:00'}|${catsStr}`;
  const payload = {
    titular: cadenaDelivery,
    qr_yape: cfg.qr_yape || '',
    qr_plin: cfg.qr_plin || ''
  };
  if (Array.isArray(actual) && actual.length > 0) {
    return apiSupabase(`configuracion_pagos?id=eq.${actual.at(0).id}`, 'PATCH', payload);
  }
  return apiSupabase('configuracion_pagos', 'POST', payload);
}

export async function subirImagenGaleria() {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('Permite el acceso a la galería para subir imágenes.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true
    });
    if (res.canceled || !res.assets?.length) return null;
    const asset = res.assets.at(0);
    return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
  }
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target.files?.item(0);
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 800;
          const scale = Math.min(max / img.width, max / img.height, 1);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(ev.target?.result || null);
        img.src = ev.target?.result;
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  });
}
export async function registrarUsuario({ nombre, telefono, password }) {
  const telLimpio = limpiarTelefono(telefono);
  if (!nombre || nombre.trim().length < 2) throw new Error('Ingresa tu nombre completo.');
  if (telLimpio.length < 6) throw new Error('Ingresa un número de teléfono válido.');
  if (!password || password.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres.');

  const existe = await apiSupabase(`perfiles?select=id&telefono=eq.${telLimpio}&limit=1`);
  if (Array.isArray(existe) && existe.length > 0) throw new Error('Este teléfono ya está registrado.');

  const creados = await apiSupabase('perfiles', 'POST', {
    nombre_completo: nombre.trim(),
    telefono: telLimpio,
    password_hash: password.trim(),
    rol: 'cliente',
    puntos: 100
  });
  const perfil = Array.isArray(creados) ? creados.at(0) : creados;
  if (perfil?.id) {
    await apiSupabase('historial_puntos', 'POST', {
      cliente_id: perfil.id,
      tipo: 'bono',
      cantidad: 100,
      descripcion: 'Bono de bienvenida Club Sazón'
    });
  }
  return { perfil, mensaje: '¡Registro exitoso! Ganaste 100 puntos de bienvenida.' };
}

export async function ingresarUsuario({ telefono, password }) {
  const telLimpio = limpiarTelefono(telefono);
  if (telLimpio.length < 6 || !password) throw new Error('Ingresa tu teléfono y contraseña.');
  const res = await apiSupabase(`perfiles?select=*&telefono=eq.${telLimpio}&limit=1`);
  const perfil = Array.isArray(res) && res.length > 0 ? res.at(0) : null;
  if (!perfil) throw new Error('No existe una cuenta con ese teléfono.');
  if (String(perfil.password_hash || '') !== password.trim()) throw new Error('Contraseña incorrecta.');
  return { tipo: perfil.rol || 'cliente', perfil };
}

export async function actualizarFotoPerfilNube(usuarioId, fotoUrl) {
  return apiSupabase(`perfiles?id=eq.${usuarioId}`, 'PATCH', { foto_url: fotoUrl });
}

export async function obtenerCatalogo(soloDisponibles = true) {
  const filtro = soloDisponibles ? '&disponible=eq.true' : '';
  const res = await apiSupabase(`productos?select=*${filtro}&order=nombre.asc`);
  return Array.isArray(res) ? res : [];
}

export async function guardarProductoAdmin(prod) {
  const payload = {
    nombre: prod.nombre.trim(),
    precio: Number(prod.precio || 0),
    stock: Number(prod.stock || 0),
    categoria: prod.categoria || 'Hamburguesas',
    turno: prod.turno || 'Ambos',
    ingredientes: prod.ingredientes || '',
    imagen_url: prod.imagen_url || '',
    disponible: prod.disponible !== false
  };
  if (prod.id) return apiSupabase(`productos?id=eq.${prod.id}`, 'PATCH', payload);
  return apiSupabase('productos', 'POST', payload);
}

export async function eliminarProductoAdmin(id) {
  return apiSupabase(`productos?id=eq.${id}`, 'DELETE');
}

export async function obtenerPromociones(soloActivas = true) {
  const filtro = soloActivas ? '&activa=eq.true' : '';
  const res = await apiSupabase(`promociones?select=*${filtro}&order=creado_en.desc`);
  return Array.isArray(res) ? res : [];
}

export async function guardarPromocionAdmin(pr) {
  const payload = {
    titulo: pr.titulo.trim(),
    descripcion: pr.descripcion || '',
    precio: Number(pr.precio || 0),
    imagen_url: pr.imagen_url || '',
    activa: pr.activa !== false,
    tipo: pr.tipo || 'promocion'
  };
  if (pr.id) return apiSupabase(`promociones?id=eq.${pr.id}`, 'PATCH', payload);
  return apiSupabase('promociones', 'POST', payload);
}

export async function eliminarPromocionAdmin(id) {
  return apiSupabase(`promociones?id=eq.${id}`, 'DELETE');
}
export async function obtenerRecompensas(soloActivas = true) {
  const filtro = soloActivas ? '&activa=eq.true' : '';
  const res = await apiSupabase(`recompensas?select=*${filtro}&order=puntos_requeridos.asc`);
  return Array.isArray(res) ? res : [];
}

export async function guardarRecompensaAdmin(rec) {
  const payload = {
    titulo: rec.titulo.trim(),
    descripcion: rec.descripcion || '',
    puntos_requeridos: Number(rec.puntos_requeridos || 500),
    stock: Number(rec.stock || 10),
    imagen_url: rec.imagen_url || '',
    activa: rec.activa !== false
  };
  if (rec.id) return apiSupabase(`recompensas?id=eq.${rec.id}`, 'PATCH', payload);
  return apiSupabase('recompensas', 'POST', payload);
}

export async function eliminarRecompensaAdmin(id) {
  return apiSupabase(`recompensas?id=eq.${id}`, 'DELETE');
}

export async function obtenerMotorizados() {
  const res = await apiSupabase('perfiles?select=*&rol=eq.repartidor&order=nombre_completo.asc');
  return Array.isArray(res) ? res : [];
}

export async function crearMotorizadoAdmin({ nombre_completo, telefono, password, direccion_predeterminada }) {
  const telLimpio = limpiarTelefono(telefono);
  if (!nombre_completo?.trim() || telLimpio.length < 6 || !password?.trim()) {
    throw new Error('Completa nombre, teléfono y contraseña del motorizado.');
  }
  return apiSupabase('perfiles', 'POST', {
    nombre_completo: nombre_completo.trim(),
    telefono: telLimpio,
    password_hash: password.trim(),
    rol: 'repartidor',
    direccion_predeterminada: direccion_predeterminada || 'Lun a Dom: 12:00 pm - 10:00 pm',
    puntos: 0
  });
}

export async function eliminarMotorizadoAdmin(id) {
  return apiSupabase(`perfiles?id=eq.${id}`, 'DELETE');
}

export async function actualizarHorarioRiderAdmin(id, horario) {
  return apiSupabase(`perfiles?id=eq.${id}`, 'PATCH', { direccion_predeterminada: horario });
}

export async function obtenerClientesAdmin() {
  const res = await apiSupabase('perfiles?select=*&rol=eq.cliente&order=nombre_completo.asc');
  return Array.isArray(res) ? res : [];
}

export async function cambiarClaveClienteAdmin(id, nuevaClave) {
  return apiSupabase(`perfiles?id=eq.${id}`, 'PATCH', { password_hash: nuevaClave });
}

export async function obtenerDatosCliente(clienteId) {
  const [perfs, hist, peds, canjes] = await Promise.all([
    apiSupabase(`perfiles?select=puntos,foto_url&id=eq.${clienteId}&limit=1`),
    apiSupabase(`historial_puntos?select=*&cliente_id=eq.${clienteId}&order=creado_en.desc&limit=30`),
    apiSupabase(`pedidos?select=*,pedido_detalles(*)&cliente_id=eq.${clienteId}&order=creado_en.desc&limit=50`),
    apiSupabase(`canjes?select=*,recompensas(titulo,puntos_requeridos)&cliente_id=eq.${clienteId}&order=creado_en.desc&limit=30`)
  ]);
  const perfil = Array.isArray(perfs) && perfs.length > 0 ? perfs.at(0) : {};
  return {
    puntos: Number(perfil.puntos || 0),
    foto_url: perfil.foto_url || null,
    historial: Array.isArray(hist) ? hist : [],
    pedidos: Array.isArray(peds) ? peds : [],
    canjes: Array.isArray(canjes) ? canjes : []
  };
}

export async function obtenerPedidosAdmin() {
  const res = await apiSupabase('pedidos?select=*,perfiles(nombre_completo,telefono),pedido_detalles(*)&order=creado_en.desc&limit=250');
  return Array.isArray(res) ? res : [];
}
export async function crearNuevoPedido(pedido, items) {
  const numPed = 'PED-' + Math.floor(100000 + Math.random() * 900000);
  const creados = await apiSupabase('pedidos', 'POST', {
    ...pedido,
    numero_pedido: numPed,
    estado: 'Pendiente',
    estado_rider: 'Sin asignar',
    recibido_cliente: false
  });
  const ped = Array.isArray(creados) ? creados.at(0) : creados;
  const detallesGuardados = [];
  if (ped?.id && Array.isArray(items)) {
    for (const item of items) {
      const detRes = await apiSupabase('pedido_detalles', 'POST', {
        pedido_id: ped.id,
        producto_id: item.es_promo ? null : item.id,
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: Number((item.precio * item.cantidad).toFixed(2))
      });
      const detFila = Array.isArray(detRes) ? detRes.at(0) : detRes;
      if (detFila) detallesGuardados.push(detFila);
      if (!item.es_promo && item.stock !== undefined && item.stock !== null) {
        const nuevoStock = Math.max(0, Number(item.stock) - Number(item.cantidad));
        await apiSupabase(`productos?id=eq.${item.id}`, 'PATCH', { stock: nuevoStock });
      }
    }
  }
  await enviarPushNativo('¡Nuevo pedido en Club Sazón!', `Pedido ${numPed} por S/ ${Number(pedido.total || 0).toFixed(2)}`, 'administrador');
  return { ...ped, creado_en: ped?.creado_en || new Date().toISOString(), pedido_detalles: detallesGuardados };
}

export async function actualizarEstadoPedidoAdmin(ped, nuevoEstado) {
  await apiSupabase(`pedidos?id=eq.${ped.id}`, 'PATCH', { estado: nuevoEstado });
  if (ped.cliente_id) {
    await enviarPushNativo(`Pedido ${ped.numero_pedido}: ${nuevoEstado}`, 'Actualización en tiempo real de tu pedido en El Sazón Oriental.', null, ped.cliente_id);
  }
  if (nuevoEstado === 'Listo' && ped.tipo_entrega === 'DELIVERY') {
    await enviarPushNativo('🛵 Nuevo pedido listo para recoger', `Pedido ${ped.numero_pedido} disponible en cocina.`, 'repartidor');
  }
}

export async function confirmarRecepcionYDarPuntos(ped) {
  if (ped.recibido_cliente) return 0;
  await apiSupabase(`pedidos?id=eq.${ped.id}`, 'PATCH', { recibido_cliente: true });
  const puntosGanados = Math.floor(Number(ped.subtotal || ped.total || 0) * 10);
  if (puntosGanados > 0 && ped.cliente_id) {
    const perfs = await apiSupabase(`perfiles?select=puntos&id=eq.${ped.cliente_id}&limit=1`);
    const actual = Array.isArray(perfs) && perfs.length > 0 ? Number(perfs.at(0).puntos || 0) : 0;
    await apiSupabase(`perfiles?id=eq.${ped.cliente_id}`, 'PATCH', { puntos: actual + puntosGanados });
    await apiSupabase('historial_puntos', 'POST', {
      cliente_id: ped.cliente_id,
      tipo: 'compra',
      cantidad: puntosGanados,
      descripcion: `Compra ${ped.numero_pedido}`
    });
  }
  return puntosGanados;
}

export async function cancelarPedidoYDescontar(ped) {
  await apiSupabase(`pedidos?id=eq.${ped.id}`, 'PATCH', { estado: 'Cancelado' });
  if (ped.recibido_cliente && ped.cliente_id) {
    const puntosDescontar = Math.floor(Number(ped.subtotal || ped.total || 0) * 10);
    if (puntosDescontar > 0) {
      const perfs = await apiSupabase(`perfiles?select=puntos&id=eq.${ped.cliente_id}&limit=1`);
      const actual = Array.isArray(perfs) && perfs.length > 0 ? Number(perfs.at(0).puntos || 0) : 0;
      await apiSupabase(`perfiles?id=eq.${ped.cliente_id}`, 'PATCH', { puntos: Math.max(0, actual - puntosDescontar) });
      await apiSupabase('historial_puntos', 'POST', {
        cliente_id: ped.cliente_id,
        tipo: 'anulacion',
        cantidad: -puntosDescontar,
        descripcion: `Anulación ${ped.numero_pedido}`
      });
    }
  }
}

export async function liquidarEfectivoRiderAdmin(riderId) {
  return apiSupabase(`pedidos?rider_id=eq.${riderId}&metodo_pago=eq.Efectivo&estado=eq.Completado`, 'PATCH', {
    estado_rider: 'Liquidado en caja'
  });
}

export async function liquidarPedidoIndividualAdmin(pedidoId) {
  return apiSupabase(`pedidos?id=eq.${pedidoId}`, 'PATCH', {
    estado_rider: 'Liquidado en caja'
  });
}

export async function canjearRecompensaCliente(clienteId, rec) {
  const req = Number(rec.puntos_requeridos || 0);
  const perfs = await apiSupabase(`perfiles?select=puntos&id=eq.${clienteId}&limit=1`);
  const actual = Array.isArray(perfs) && perfs.length > 0 ? Number(perfs.at(0).puntos || 0) : 0;
  if (actual < req) throw new Error('No tienes puntos suficientes para este premio.');
  await apiSupabase(`perfiles?id=eq.${clienteId}`, 'PATCH', { puntos: actual - req });
  await apiSupabase('canjes', 'POST', {
    cliente_id: clienteId,
    recompensa_id: rec.id,
    puntos_usados: req,
    estado: 'Solicitado'
  });
  await apiSupabase('historial_puntos', 'POST', {
    cliente_id: clienteId,
    tipo: 'canje',
    cantidad: -req,
    descripcion: `Canje: ${rec.titulo}`
  });
}
