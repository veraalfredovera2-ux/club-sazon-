const ID_PROYECTO = 'pripxtsriyxhafevokjg';
export const SUPABASE_URL = 'https://' + ID_PROYECTO + '.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXB4dHNyaXl4aGFmZXZva2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MTEzMDMsImV4cCI6MjEwOTQ4NzMwM30.uECAPmu6zRj4hN0Jrfq-3dWT49Dfm9fdM3Vb0HbWfOw';

export const categorias = ['Todas', 'Empanadas', 'Arepas', 'Tequeños', 'Hamburguesas', 'Pepitos', 'Perros calientes', 'Shawarmas', 'Salchipapas', 'Broaster', 'Cafés y Jugos', 'Bebidas'];

const limpiarTel = (t) => String(t || '').replace(/\D/g, '');
const generarUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => ((c === 'x' ? Math.random() * 16 | 0 : (Math.random() * 16 | 0) & 0x3 | 0x8)).toString(16));

async function apiRest(ruta, metodo = 'GET', cuerpo = null) {
  const op = { method: metodo, cache: 'no-store', headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'return=representation' } };
  if (cuerpo) op.body = JSON.stringify(cuerpo);
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + ruta, op);
  const txt = await res.text();
  let datos = [];
  try { datos = txt ? JSON.parse(txt) : []; } catch (e) { throw new Error('Error de red (' + res.status + ')'); }
  if (!res.ok) throw new Error(datos.message || datos.error || 'Error ' + res.status);
  return datos;
}


export async function obtenerConfigPagos() {
  const r = await apiRest('configuracion_pagos?id=eq.principal&select=*');
  return r?.at(0) || { qr_yape: '', qr_plin: '', titular: 'Club Sazón' };
}

export const guardarConfigPagos = (cfg) => apiRest('configuracion_pagos?id=eq.principal', 'PATCH', { qr_yape: cfg.qr_yape, qr_plin: cfg.qr_plin, titular: cfg.titular });
export const obtenerCatalogo = (disp = true) => apiRest('productos?' + (disp ? 'disponible=eq.true&' : '') + 'order=categoria.asc,nombre.asc&select=*');
export const guardarProductoAdmin = (p) => {
  const body = { nombre: p.nombre, categoria: p.categoria, precio: Number(p.precio), ingredientes: p.ingredientes, imagen_url: p.imagen_url, disponible: p.disponible, turno: p.turno || 'ambos', stock: p.stock != null && p.stock !== '' ? Number(p.stock) : 10 };
  return p.id ? apiRest('productos?id=eq.' + p.id, 'PATCH', body) : apiRest('productos', 'POST', { id: generarUUID(), ...body });
};

export const obtenerPromociones = (act = true) => apiRest('promociones?' + (act ? 'activa=eq.true&' : '') + 'order=creado_en.desc&select=*');
export const guardarPromocionAdmin = (pr) => {
  const body = { tipo: pr.tipo || 'promocion', titulo: pr.titulo, descripcion: pr.descripcion, precio: Number(pr.precio || 0), imagen_url: pr.imagen_url, stock: pr.stock != null && pr.stock !== '' ? Number(pr.stock) : 10, activa: pr.activa !== false };
  return pr.id ? apiRest('promociones?id=eq.' + pr.id, 'PATCH', body) : apiRest('promociones', 'POST', body);
};

export const obtenerRecompensas = (act = true) => apiRest('recompensas?' + (act ? 'activa=eq.true&' : '') + 'order=puntos_requeridos.asc&select=*');
export const guardarRecompensaAdmin = (r) => {
  const body = { titulo: r.titulo, descripcion: r.descripcion, puntos_requeridos: Number(r.puntos_requeridos), activa: r.activa, stock: r.stock != null && r.stock !== '' ? Number(r.stock) : 5 };
  return r.id ? apiRest('recompensas?id=eq.' + r.id, 'PATCH', body) : apiRest('recompensas', 'POST', body);
};

export async function canjearRecompensaCliente(clienteId, rec) {
  if (rec.stock != null && Number(rec.stock) <= 0) throw new Error('Este premio está agotado en stock.');
  const pts = Math.abs(Number(rec.puntos_requeridos));
  const movsActuales = await apiRest('movimientos_puntos?cliente_id=eq.' + clienteId + '&select=cantidad');
  const saldoReal = (movsActuales || []).reduce((a, m) => a + Number(m.cantidad || 0), 0);
  if (saldoReal < pts) throw new Error(`Puntos insuficientes. Tu saldo real actualizado es de ${saldoReal} pts.`);
  await apiRest('movimientos_puntos', 'POST', { cliente_id: clienteId, tipo: 'canje', cantidad: -pts, descripcion: 'Canje: ' + rec.titulo });
  await apiRest('solicitudes_canje', 'POST', { cliente_id: clienteId, recompensa_titulo: rec.titulo, puntos_usados: pts, estado: 'Pendiente de entrega' });
  if (rec.id && rec.stock != null) await apiRest('recompensas?id=eq.' + rec.id, 'PATCH', { stock: Math.max(0, Number(rec.stock) - 1) });
}
export const obtenerSolicitudesCanje = () => apiRest('solicitudes_canje?order=creado_en.desc&select=*,clientes(nombre_completo,telefono)');
export const confirmarEntregaCanje = (id) => apiRest('solicitudes_canje?id=eq.' + id, 'PATCH', { estado: 'Entregado' });

export async function obtenerDatosCliente(id) {
  const [movs, peds, canjes] = await Promise.all([
    apiRest('movimientos_puntos?cliente_id=eq.' + id + '&order=creado_en.desc&select=*'),
    apiRest('pedidos?cliente_id=eq.' + id + '&order=creado_en.desc&select=*,pedido_detalles(*)'),
    apiRest('solicitudes_canje?cliente_id=eq.' + id + '&order=creado_en.desc&select=*')
  ]);
  return { puntos: (movs || []).reduce((a, m) => a + Number(m.cantidad || 0), 0), historial: movs || [], pedidos: peds || [], canjes: canjes || [] };
}

export const obtenerPedidosAdmin = () => apiRest('pedidos?order=creado_en.desc&select=*,clientes(nombre_completo,telefono),pedido_detalles(*)');

export async function registrarUsuario({ nombreCompleto, telefono, password }) {
  const tel = limpiarTel(telefono);
  if (tel.length < 8 || tel.length > 15) throw new Error('Teléfono inválido (8 a 15 dígitos).');
  const ex = await apiRest('clientes?telefono=eq.' + tel + '&select=id');
  if (ex?.length) throw new Error('Este teléfono ya tiene una cuenta registrada.');
  const id = generarUUID();
  await apiRest('clientes', 'POST', { id, nombre_completo: nombreCompleto, telefono: tel, email_login: 'tel' + tel + '@clubsazon.com', password });
  await apiRest('movimientos_puntos', 'POST', { cliente_id: id, tipo: 'bienvenida', cantidad: 100, descripcion: '100 puntos de bienvenida por registrarse' });
  return { ok: true, mensaje: '¡Bienvenido/a, ' + nombreCompleto + '! Has recibido 100 puntos.', perfil: { id, nombre_completo: nombreCompleto, telefono: tel } };
}

export async function ingresarUsuario({ telefono, password }) {
  const tel = limpiarTel(telefono);
  const adm = await apiRest('administradores?telefono=eq.' + tel + '&password=eq.' + encodeURIComponent(password) + '&select=*');
  if (adm?.length) return { tipo: 'administrador', perfil: adm.at(0) };
  const cli = await apiRest('clientes?telefono=eq.' + tel + '&password=eq.' + encodeURIComponent(password) + '&select=*');
  if (!cli?.length) throw new Error('Teléfono o contraseña incorrectos.');
  return { tipo: 'cliente', perfil: cli.at(0) };
}

export async function crearNuevoPedido(pedidoData, carrito) {
  const num = pedidoData.numero_pedido || ('PED-' + Math.floor(100000 + Math.random() * 900000));
  const creados = await apiRest('pedidos', 'POST', { ...pedidoData, numero_pedido: num, estado: pedidoData.estado || 'Pendiente' });
  const ped = creados.at(0);
  await apiRest('pedido_detalles', 'POST', carrito.map(p => ({ pedido_id: ped.id, producto_id: !p.es_promo && String(p.id).includes('-') ? p.id : null, nombre_producto: p.extra_ingrediente?.trim() ? `${p.nombre} (${p.extra_ingrediente.trim()})` : p.nombre, precio_unitario: Number(p.precio), cantidad: p.cantidad, total_linea: Number(p.precio) * p.cantidad })));
  for (const p of carrito) {
    if (p.id && p.stock != null) {
      const tabla = p.es_promo ? 'promociones' : 'productos';
      await apiRest(`${tabla}?id=eq.${p.id}`, 'PATCH', { stock: Math.max(0, Number(p.stock) - Number(p.cantidad || 1)) });
    }
  }
  return ped;
}

export async function confirmarAdminPedido(pedido, costoDelivery = 0) {
  const sub = Number(pedido.subtotal || pedido.total || 0), del = Number(costoDelivery || 0);
  await apiRest('pedidos?id=eq.' + pedido.id, 'PATCH', { confirmado_admin: true, costo_delivery: del, total: sub + del, estado: 'Confirmado por local' });
}

export async function confirmarRecepcionYDarPuntos(pedido) {
  const actual = await apiRest('pedidos?id=eq.' + pedido.id + '&select=estado');
  if (actual?.at(0)?.estado === 'Cancelado') throw new Error('Este pedido fue cancelado.');
  await apiRest('pedidos?id=eq.' + pedido.id, 'PATCH', { confirmado_admin: true, recibido_cliente: true, estado: 'Completado' });
  const yaDados = await apiRest('movimientos_puntos?pedido_id=eq.' + pedido.id + '&tipo=eq.compra&select=cantidad');
  if (yaDados?.length) return 0;
  const puntosGanados = Math.floor(Number(pedido.subtotal || pedido.total) * 10);
  if (puntosGanados > 0) await apiRest('movimientos_puntos', 'POST', { cliente_id: pedido.cliente_id, pedido_id: pedido.id, tipo: 'compra', cantidad: puntosGanados, descripcion: 'Compra pedido ' + pedido.numero_pedido + ' (10 pts x sol)' });
  return puntosGanados;
}

export async function cancelarPedidoYDescontar(pedido) {
  const pedActual = await apiRest('pedidos?id=eq.' + pedido.id + '&select=*');
  const infoPed = pedActual?.at(0) || pedido;
  await apiRest('pedidos?id=eq.' + pedido.id, 'PATCH', { estado: 'Cancelado' });
  const movsCompra = await apiRest('movimientos_puntos?pedido_id=eq.' + pedido.id + '&tipo=eq.compra&select=cantidad');
  const movsCancel = await apiRest('movimientos_puntos?pedido_id=eq.' + pedido.id + '&tipo=eq.cancelacion&select=cantidad');
  const puntosRegistrados = (movsCompra || []).reduce((acc, m) => acc + Number(m.cantidad || 0), 0);
  const puntosPorMonto = (infoPed.estado === 'Completado' || infoPed.recibido_cliente) ? Math.floor(Number(infoPed.subtotal || infoPed.total || 0) * 10) : 0;
  const totalDado = Math.max(puntosRegistrados, puntosPorMonto);
  const totalYaRestado = Math.abs((movsCancel || []).reduce((acc, m) => acc + Number(m.cantidad || 0), 0));
  const pendienteRestar = totalDado - totalYaRestado;
  if (pendienteRestar > 0) {
    await apiRest('movimientos_puntos', 'POST', { cliente_id: infoPed.cliente_id, pedido_id: pedido.id, tipo: 'cancelacion', cantidad: -pendienteRestar, descripcion: 'Descuento por cancelación pedido ' + infoPed.numero_pedido });
    return pendienteRestar;
  }
  return 0;
    }
export function subirImagenGaleria() {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('Solo disponible en navegador web.'));
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
        const ruta = `plato_${Date.now()}.${ext}`;
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/productos/${ruta}`, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': file.type || 'image/jpeg' },
          body: file
        });
        if (!res.ok) throw new Error('No se pudo subir la imagen (' + res.status + ').');
        resolve(`${SUPABASE_URL}/storage/v1/object/public/productos/${ruta}`);
      } catch (e) { reject(e); }
    };
    input.click();
  });
}
