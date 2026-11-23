export const SUPABASE_URL = 'https://' + 'pripxtsriyxhafevokjg' + '.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ShY2V3Oh7gB4ZHSBzI5o_Q_GSMxzmds';

export const categorias = ['Todas', 'Empanadas', 'Arepas', 'Tequeños', 'Hamburguesas', 'Salchipapas', 'Bebidas'];

const limpiarTel = (t) => {
  const n = String(t || '').replace(/\D/g, '');
  return n.length === 11 && n.startsWith('51') ? n.slice(2) : n;
};

const generarUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

async function apiRest(ruta, metodo = 'GET', cuerpo = null) {
  const op = {
    method: metodo,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation'
    }
  };
  if (cuerpo) op.body = JSON.stringify(cuerpo);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, op);
  const txt = await res.text();
  let datos = {};
  try { datos = txt ? JSON.parse(txt) : []; } catch (e) { throw new Error('Error de formato en servidor'); }
  if (!res.ok) throw new Error(datos.message || datos.error || 'Error en la base de datos');
  return datos;
}

export function extraerConfigDelivery(titularRaw) {
  const partes = String(titularRaw || 'Club Sazón').split('||DEL:');
  const titularLimpio = (partes.at(0) || 'Club Sazón').trim();
  const def = { titularLimpio, local_lat: '-12.089700', local_lng: '-77.003100', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false };
  if (partes.length < 2) return def;
  const nums = partes.at(1).split('|');
  return {
    titularLimpio,
    local_lat: nums.at(0) || def.local_lat,
    local_lng: nums.at(1) || def.local_lng,
    tarifa_base: nums.at(2) || def.tarifa_base,
    tarifa_km: nums.at(3) || def.tarifa_km,
    local_cerrado: nums.at(4) === '1'
  };
}

export async function obtenerConfigPagos() {
  const r = await apiRest('configuracion_pagos?select=*&limit=1');
  const raw = (Array.isArray(r) && r.length > 0 ? r.at(0) : null) || { id: 'principal', qr_yape: '', qr_plin: '', titular: 'Club Sazón' };
  return { ...raw, ...extraerConfigDelivery(raw.titular) };
}

export async function guardarConfigPagos(cfg) {
  const del = extraerConfigDelivery(cfg.titular);
  const titBase = (cfg.titularLimpio !== undefined ? cfg.titularLimpio : del.titularLimpio) || 'Club Sazón';
  const cerradoFlag = cfg.local_cerrado ? '1' : '0';
  const titularEmpacado = `${titBase.trim()}||DEL:${cfg.local_lat || del.local_lat}|${cfg.local_lng || del.local_lng}|${cfg.tarifa_base || del.tarifa_base}|${cfg.tarifa_km || del.tarifa_km}|${cerradoFlag}`;
  await apiRest('configuracion_pagos?id=eq.principal', 'PATCH', {
    titular: titularEmpacado,
    qr_yape: (cfg.qr_yape || '').trim(),
    qr_plin: (cfg.qr_plin || '').trim()
  });
}
export async function obtenerCatalogo(soloDisp = false) {
  const q = soloDisp ? 'productos?select=*&disponible=eq.true&order=nombre.asc' : 'productos?select=*&order=nombre.asc';
  return (await apiRest(q)) || [];
}

export async function guardarProductoAdmin(p) {
  const datos = {
    nombre: (p.nombre || '').trim(),
    precio: Number(p.precio || 0),
    stock: Number(p.stock ?? 20),
    categoria: p.categoria || 'Hamburguesas',
    turno: p.turno || 'Ambos',
    ingredientes: (p.ingredientes || '').trim(),
    imagen_url: (p.imagen_url || '').trim(),
    disponible: Boolean(p.disponible)
  };
  if (p.id) return apiRest(`productos?id=eq.${p.id}`, 'PATCH', datos);
  return apiRest('productos', 'POST', datos);
}

export async function eliminarProductoAdmin(id) {
  await apiRest(`productos?id=eq.${id}`, 'DELETE');
}

export async function obtenerPromociones(soloAct = false) {
  const q = soloAct ? 'promociones?select=*&activa=eq.true&order=id.desc' : 'promociones?select=*&order=id.desc';
  return (await apiRest(q)) || [];
}

export async function guardarPromocionAdmin(pr) {
  const datos = {
    titulo: (pr.titulo || '').trim(),
    descripcion: (pr.descripcion || '').trim(),
    precio: Number(pr.precio || 0),
    imagen_url: (pr.imagen_url || '').trim(),
    activa: Boolean(pr.activa),
    tipo: pr.tipo || 'promocion'
  };
  if (pr.id) return apiRest(`promociones?id=eq.${pr.id}`, 'PATCH', datos);
  return apiRest('promociones', 'POST', datos);
}

export async function eliminarPromocionAdmin(id) {
  await apiRest(`promociones?id=eq.${id}`, 'DELETE');
}

export async function obtenerRecompensas(soloAct = false) {
  const q = soloAct ? 'recompensas?select=*&activa=eq.true&order=puntos_requeridos.asc' : 'recompensas?select=*&order=puntos_requeridos.asc';
  return (await apiRest(q)) || [];
}

export async function guardarRecompensaAdmin(r) {
  const datos = {
    titulo: (r.titulo || '').trim(),
    descripcion: (r.descripcion || '').trim(),
    puntos_requeridos: Number(r.puntos_requeridos || 0),
    stock: Number(r.stock ?? 10),
    imagen_url: (r.imagen_url || '').trim(),
    activa: Boolean(r.activa)
  };
  if (r.id) return apiRest(`recompensas?id=eq.${r.id}`, 'PATCH', datos);
  return apiRest('recompensas', 'POST', datos);
}

export async function eliminarRecompensaAdmin(id) {
  await apiRest(`recompensas?id=eq.${id}`, 'DELETE');
}
export async function registrarUsuario({ nombreCompleto, telefono, password }) {
  const tel = limpiarTel(telefono);
  if (tel.length < 6) throw new Error('Ingresa un número de teléfono válido.');
  if ((password || '').length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres.');
  const existe = await apiRest(`perfiles?select=id&telefono=eq.${tel}`);
  if (existe.length > 0) throw new Error('Ese número de teléfono ya está registrado.');
  const id = generarUUID();
  const [perfil] = await apiRest('perfiles', 'POST', {
    id,
    nombre_completo: nombreCompleto.trim(),
    telefono: tel,
    password_hash: password.trim(),
    rol: 'cliente',
    puntos: 100,
    foto_url: ''
  });
  await apiRest('historial_puntos', 'POST', {
    cliente_id: id,
    cantidad: 100,
    descripcion: 'Bono de bienvenida Club Sazón'
  });
  return { perfil, mensaje: 'Cuenta creada con éxito. Ganaste +100 puntos de bienvenida.' };
}

export async function ingresarUsuario({ telefono, password }) {
  const tel = limpiarTel(telefono);
  const res = await apiRest(`perfiles?select=*&telefono=eq.${tel}&limit=1`);
  const perfil = Array.isArray(res) && res.length > 0 ? res.at(0) : null;
  if (!perfil) throw new Error('Número de teléfono no registrado.');
  if (String(perfil.password_hash || '') !== String(password || '').trim()) {
    throw new Error('Contraseña incorrecta.');
  }
  return { tipo: perfil.rol || 'cliente', perfil };
}

export async function actualizarFotoPerfilNube(perfilId, fotoUrl) {
  await apiRest(`perfiles?id=eq.${perfilId}`, 'PATCH', { foto_url: fotoUrl || '' });
}

export async function subirImagenGaleria() {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve(null);
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target?.files?.item(0);
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
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(ev.target?.result || null);
        img.src = ev.target?.result;
      };
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    };
    inp.click();
  });
}

export async function obtenerDatosCliente(clienteId) {
  const [perfs, hist, peds, canjes] = await Promise.all([
    apiRest(`perfiles?select=puntos,foto_url&id=eq.${clienteId}&limit=1`),
    apiRest(`historial_puntos?select=*&cliente_id=eq.${clienteId}&order=id.desc`),
    apiRest(`pedidos?select=*,pedido_detalles(*)&cliente_id=eq.${clienteId}&order=creado_en.desc`),
    apiRest(`canjes?select=*&cliente_id=eq.${clienteId}&order=id.desc`)
  ]);
  const filaCli = Array.isArray(perfs) && perfs.length > 0 ? perfs.at(0) : null;
  return {
    puntos: Number(filaCli?.puntos || 0),
    foto_url: filaCli?.foto_url || '',
    historial: hist || [],
    pedidos: peds || [],
    canjes: canjes || []
  };
}

export async function obtenerPedidosAdmin() {
  return (await apiRest('pedidos?select=*,perfiles(nombre_completo,telefono),pedido_detalles(*)&order=creado_en.desc')) || [];
}
export async function crearNuevoPedido(cabecera, items) {
  const num = 'PED-' + Math.floor(100000 + Math.random() * 900000);
  const [ped] = await apiRest('pedidos', 'POST', {
    ...cabecera,
    numero_pedido: num,
    estado: 'Pendiente',
    recibido_cliente: false
  });
  for (const it of items) {
    await apiRest('pedido_detalles', 'POST', {
      pedido_id: ped.id,
      producto_id: it.es_promo ? null : it.id,
      nombre_producto: it.nombre,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio),
      subtotal: Number(it.precio) * Number(it.cantidad)
    });
    if (!it.es_promo && it.id) {
      const prodRes = await apiRest(`productos?select=stock&id=eq.${it.id}&limit=1`);
      const prodActual = Array.isArray(prodRes) && prodRes.length > 0 ? prodRes.at(0) : null;
      if (prodActual && prodActual.stock !== null && prodActual.stock !== undefined) {
        const nuevoStock = Math.max(0, Number(prodActual.stock) - Number(it.cantidad));
        await apiRest(`productos?id=eq.${it.id}`, 'PATCH', {
          stock: nuevoStock,
          disponible: nuevoStock > 0
        });
      }
    }
  }
  return ped;
}

export async function actualizarEstadoPedidoAdmin(ped, nuevoEstado) {
  await apiRest(`pedidos?id=eq.${ped.id}`, 'PATCH', {
    estado: nuevoEstado,
    ...(nuevoEstado === 'Listo' && ped.tipo_entrega === 'DELIVERY' ? { estado_rider: 'Disponible' } : {})
  });
}

export async function confirmarRecepcionYDarPuntos(ped) {
  if (ped.recibido_cliente) return 0;
  const pts = Math.floor(Number(ped.subtotal || ped.total || 0) * 10);
  const nuevoEstado = ped.tipo_entrega === 'DELIVERY' ? ped.estado : 'Completado';
  await apiRest(`pedidos?id=eq.${ped.id}`, 'PATCH', {
    recibido_cliente: true,
    estado: nuevoEstado
  });
  if (pts > 0 && ped.cliente_id) {
    const [cli] = await apiRest(`perfiles?select=puntos&id=eq.${ped.cliente_id}&limit=1`);
    const actual = Number(cli?.puntos || 0);
    await apiRest(`perfiles?id=eq.${ped.cliente_id}`, 'PATCH', { puntos: actual + pts });
    await apiRest('historial_puntos', 'POST', {
      cliente_id: ped.cliente_id,
      cantidad: pts,
      descripcion: `Compra ${ped.numero_pedido}`
    });
  }
  return pts;
}

export async function cancelarPedidoYDescontar(ped) {
  await apiRest(`pedidos?id=eq.${ped.id}`, 'PATCH', { estado: 'Cancelado' });
  if (ped.cliente_id && ped.recibido_cliente) {
    const ptsGanados = Math.floor(Number(ped.subtotal || ped.total || 0) * 10);
    if (ptsGanados > 0) {
      const [cli] = await apiRest(`perfiles?select=puntos&id=eq.${ped.cliente_id}&limit=1`);
      const actual = Number(cli?.puntos || 0);
      const nuevoSaldo = Math.max(0, actual - ptsGanados);
      await apiRest(`perfiles?id=eq.${ped.cliente_id}`, 'PATCH', { puntos: nuevoSaldo });
      await apiRest('historial_puntos', 'POST', {
        cliente_id: ped.cliente_id,
        cantidad: -ptsGanados,
        descripcion: `Cancelación ${ped.numero_pedido}`
      });
    }
  }
}

export async function canjearRecompensaCliente(clienteId, rec) {
  const [cli] = await apiRest(`perfiles?select=puntos&id=eq.${clienteId}&limit=1`);
  const actual = Number(cli?.puntos || 0);
  const req = Number(rec.puntos_requeridos || 0);
  if (actual < req) throw new Error(`Te faltan ${req - actual} puntos para este premio.`);
  await apiRest(`perfiles?id=eq.${clienteId}`, 'PATCH', { puntos: actual - req });
  await apiRest('historial_puntos', 'POST', {
    cliente_id: clienteId,
    cantidad: -req,
    descripcion: `Canje: ${rec.titulo}`
  });
  await apiRest('canjes', 'POST', {
    cliente_id: clienteId,
    recompensa_id: rec.id,
    puntos_usados: req,
    estado: 'Pendiente'
  });
}

export async function obtenerMotorizados() {
  return (await apiRest('perfiles?select=*&rol=eq.repartidor&order=nombre_completo.asc')) || [];
}

export async function crearMotorizadoAdmin({ nombre_completo, telefono, password, direccion_predeterminada }) {
  const tel = limpiarTel(telefono);
  if (!nombre_completo?.trim() || tel.length < 6 || !password?.trim()) {
    throw new Error('Completa nombre, teléfono válido y contraseña.');
  }
  const [res] = await apiRest('perfiles', 'POST', {
    id: generarUUID(),
    nombre_completo: nombre_completo.trim(),
    telefono: tel,
    password_hash: password.trim(),
    rol: 'repartidor',
    puntos: 0,
    direccion_predeterminada: (direccion_predeterminada || 'Lun a Dom: 12:00 pm - 10:00 pm').trim()
  });
  return res;
}

export async function eliminarMotorizadoAdmin(id) {
  await apiRest(`perfiles?id=eq.${id}`, 'DELETE');
}

export async function actualizarHorarioRiderAdmin(id, textoHorario) {
  await apiRest(`perfiles?id=eq.${id}`, 'PATCH', { direccion_predeterminada: textoHorario });
}

export async function obtenerClientesAdmin() {
  return (await apiRest('perfiles?select=id,nombre_completo,telefono,puntos&rol=eq.cliente&order=nombre_completo.asc')) || [];
}

export async function cambiarClaveClienteAdmin(id, nuevaClave) {
  await apiRest(`perfiles?id=eq.${id}`, 'PATCH', { password_hash: nuevaClave });
}
