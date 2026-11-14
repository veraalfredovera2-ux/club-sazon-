const ID_PROYECTO = 'pripxtsriyxhafevokjg';
export const SUPABASE_URL = 'https://' + ID_PROYECTO + '.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXB4dHNyaXl4aGFmZXZva2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MTEzMDMsImV4cCI6MjEwOTQ4NzMwM30.uECAPmu6zRj4hN0Jrfq-3dWT49Dfm9fdM3Vb0HbWfOw';

export const categorias = ['Todas', 'Hamburguesas', 'Pepitos', 'Perros calientes', 'Shawarmas', 'Tequeños', 'Salchipapas', 'Broaster', 'Bebidas'];

const limpiarTel = (t) => String(t || '').replace(/\D/g, '');
const generarUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => ((c === 'x' ? Math.random() * 16 | 0 : (Math.random() * 16 | 0) & 0x3 | 0x8)).toString(16));

async function apiRest(ruta, metodo = 'GET', cuerpo = null) {
  const op = { method: metodo, headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'return=representation' } };
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

export const guardarProductoAdmin = (p) => p.id
  ? apiRest('productos?id=eq.' + p.id, 'PATCH', { nombre: p.nombre, categoria: p.categoria, precio: Number(p.precio), ingredientes: p.ingredientes, imagen_url: p.imagen_url, disponible: p.disponible })
  : apiRest('productos', 'POST', { id: generarUUID(), nombre: p.nombre, categoria: p.categoria, precio: Number(p.precio), ingredientes: p.ingredientes, imagen_url: p.imagen_url, disponible: true });

export const obtenerRecompensas = (act = true) => apiRest('recompensas?' + (act ? 'activa=eq.true&' : '') + 'order=puntos_requeridos.asc&select=*');

export const guardarRecompensaAdmin = (r) => r.id
  ? apiRest('recompensas?id=eq.' + r.id, 'PATCH', { titulo: r.titulo, descripcion: r.descripcion, puntos_requeridos: Number(r.puntos_requeridos), activa: r.activa })
  : apiRest('recompensas', 'POST', { titulo: r.titulo, descripcion: r.descripcion, puntos_requeridos: Number(r.puntos_requeridos), activa: true });

export async function canjearRecompensaCliente(clienteId, rec) {
  const pts = Math.abs(Number(rec.puntos_requeridos));
  await apiRest('movimientos_puntos', 'POST', { cliente_id: clienteId, tipo: 'canje', cantidad: -pts, descripcion: 'Canje: ' + rec.titulo });
  await apiRest('solicitudes_canje', 'POST', { cliente_id: clienteId, recompensa_titulo: rec.titulo, puntos_usados: pts, estado: 'Pendiente de entrega' });
}

export const obtenerSolicitudesCanje = () => apiRest('solicitudes_canje?order=creado_en.desc&select=*,clientes(nombre_completo,telefono)');
export const confirmarEntregaCanje = (id) => apiRest('solicitudes_canje?id=eq.' + id, 'PATCH', { estado: 'Entregado' });
export async function obtenerDatosCliente(id) {
  const [movs, peds, canjes] = await Promise.all([
    apiRest('movimientos_puntos?cliente_id=eq.' + id + '&order=creado_en.desc&select=*'),
    apiRest('pedidos?cliente_id=eq.' + id + '&order=creado_en.desc&select=*,pedido_detalles(*)'),
    apiRest('solicitudes_canje?cliente_id=eq.' + id + '&order=creado_en.desc&select=*')
  ]);
  return { puntos: (movs || []).reduce((a, m) => a + (m.cantidad || 0), 0), historial: movs || [], pedidos: peds || [], canjes: canjes || [] };
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
  const creados = await apiRest('pedidos', 'POST', pedidoData);
  const ped = creados.at(0);
  await apiRest('pedido_detalles', 'POST', carrito.map(p => ({ pedido_id: ped.id, producto_id: String(p.id).includes('-') ? p.id : null, nombre_producto: p.nombre, precio_unitario: Number(p.precio), cantidad: p.cantidad, total_linea: Number(p.precio) * p.cantidad })));
  return ped;
}

export async function confirmarAdminPedido(pedido, costoDelivery = 0) {
  const sub = Number(pedido.subtotal || pedido.total || 0);
  const del = Number(costoDelivery || 0);
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
  await apiRest('pedidos?id=eq.' + pedido.id, 'PATCH', { estado: 'Cancelado' });
  const movsCompra = await apiRest('movimientos_puntos?pedido_id=eq.' + pedido.id + '&tipo=eq.compra&select=cantidad');
  const movsCancel = await apiRest('movimientos_puntos?pedido_id=eq.' + pedido.id + '&tipo=eq.cancelacion&select=cantidad');
  const totalDado = (movsCompra || []).reduce((acc, m) => acc + Number(m.cantidad || 0), 0);
  const totalYaRestado = Math.abs((movsCancel || []).reduce((acc, m) => acc + Number(m.cantidad || 0), 0));
  const pendienteRestar = totalDado - totalYaRestado;
  if (pendienteRestar > 0) {
    await apiRest('movimientos_puntos', 'POST', { cliente_id: pedido.cliente_id, pedido_id: pedido.id, tipo: 'cancelacion', cantidad: -pendienteRestar, descripcion: 'Descuento por cancelación pedido ' + pedido.numero_pedido });
    return pendienteRestar;
  }
  return 0;
}
