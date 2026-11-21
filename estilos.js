import { StyleSheet } from 'react-native';

export const ROJO = '#E50914';
export const DORADO = '#F5B041';
export const FONDO = '#08080B';
export const TARJETA = '#14141A';
export const BORDE = '#2E2E3A';

export const styles = StyleSheet.create({
  pantallaCompleta: { flex: 1, backgroundColor: FONDO },
  contenido: { padding: 14, paddingBottom: 135 },
  contenedor: { flex: 1, backgroundColor: FONDO, padding: 20, justifyContent: 'center' },

  logoRedondo: {
    width: 120, height: 120, borderRadius: 60, alignSelf: 'center',
    borderWidth: 3, borderColor: ROJO, backgroundColor: '#121218', marginBottom: 10
  },
  logoHeaderCentro: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 2, borderColor: ROJO
  },
  logoMini: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: ROJO
  },

  tituloPrincipal: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  subtitulo: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  bannerPuntosBienvenida: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 16,
    padding: 14, alignItems: 'center', marginVertical: 12
  },
  pildoraRoja: {
    backgroundColor: ROJO, paddingVertical: 8, paddingHorizontal: 22,
    borderRadius: 12, marginVertical: 6
  },
  textoPildoraRoja: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },

  tarjetaPerfilHero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1F0A0E', borderWidth: 1.8, borderColor: ROJO,
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 10, gap: 8
  },
  avatarClienteBox: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 2.2, borderColor: ROJO,
    backgroundColor: '#2B0D12', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  nombreDoradoHero: {
    color: DORADO, fontSize: 19, fontWeight: '900', lineHeight: 22
  },
  badgePuntosHero: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6
  },
  numeroPuntosDorado: {
    color: DORADO, fontSize: 21, fontWeight: '900', lineHeight: 23
  },

  cajaInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: TARJETA,
    borderWidth: 1, borderColor: BORDE, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12
  },
  campo: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 12,
    padding: 13, color: '#FFFFFF', fontSize: 14, marginBottom: 12
  },
  campoSinBorde: { flex: 1, color: '#FFFFFF', fontSize: 14, paddingVertical: 13 },

  boton: {
    backgroundColor: ROJO, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 6
  },
  botonSecundario: { backgroundColor: '#22222C', borderWidth: 1, borderColor: BORDE },
  botonPequeno: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginTop: 0 },
  textoBoton: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  textoBotonPequeno: { fontSize: 12 },
  enlaceRojo: { color: ROJO, fontSize: 13, fontWeight: '800' },
  textoGrisCentro: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 14 },

  cabeceraTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4, marginBottom: 8
  },
  insigniaPuntos: {
    backgroundColor: ROJO, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5
  },
  textoInsigniaPuntos: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  bannerHero: {
    width: '100%', height: 195, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2A1215', marginBottom: 12, backgroundColor: '#050507'
  },
  cuadricula3: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8
  },
  itemCuadricula: {
    width: '31.5%', backgroundColor: '#15151C', borderWidth: 1.5, borderColor: '#343442',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', marginBottom: 4
  },
  iconoCuadriculaBox: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4
  },
  textoCuadricula: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  barraInferior: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 66,
    backgroundColor: '#101015', borderTopWidth: 1, borderTopColor: BORDE,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 4
  },
  tabInferior: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 4 },
  textoTabInferior: { color: '#9CA3AF', fontSize: 10, fontWeight: '700', marginTop: 2 },
  textoTabInferiorAct: { color: ROJO, fontWeight: '900' },

  filaSaludo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  saludo: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  nombreCliente: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  titulo: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginVertical: 10, letterSpacing: 0.4 },

  listaCategorias: { marginBottom: 12, flexGrow: 0 },
  categoria: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8
  },
  categoriaActiva: { backgroundColor: ROJO, borderColor: ROJO },
  textoCategoria: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  producto: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: TARJETA,
    borderWidth: 1, borderColor: BORDE, borderRadius: 14, padding: 10, marginBottom: 10, gap: 10
  },
  fotoProducto: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#1F1F28' },
  nombreProducto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  descripcionPedido: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  precioProducto: { color: '#F3F4F6', fontSize: 14, fontWeight: '900', marginTop: 4 },
  botonAgregar: {
    backgroundColor: ROJO, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  textoAgregar: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  tarjetaPromo: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE,
    borderRadius: 16, overflow: 'hidden', marginBottom: 14
  },
  etiquetaPromo: {
    position: 'absolute', top: 10, left: 10, backgroundColor: ROJO,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8
  },
  textoEtiquetaPromo: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  tarjetaSaldo: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE,
    borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 14
  },
  etiquetaSaldo: { color: '#9CA3AF', fontSize: 12, fontWeight: '800' },
  numeroSaldo: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginVertical: 4 },

  tarjetaPedido: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE,
    borderRadius: 14, padding: 14, marginBottom: 12
  },
  tarjetaVacia: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE,
    borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 10
  },
  textoVacio: { color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
  estadoPedido: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: ROJO,
    backgroundColor: '#251216', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginVertical: 6
  },
  textoEstado: { color: ROJO, fontSize: 11, fontWeight: '800' },
  totalPedidoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 8 },

  opcionEntrega: {
    backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 8
  },
  opcionEntregaActiva: { borderColor: ROJO, backgroundColor: '#251216' }
});
