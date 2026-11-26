import { StyleSheet, Platform, StatusBar } from 'react-native';

export const ROJO = '#FF1717';
export const DORADO = '#FFD600';
export const FONDO = '#070709';
export const TARJETA = '#12131A';
export const BORDE = '#242430';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = FONDO;
  document.body.style.backgroundColor = FONDO;
  document.body.style.margin = '0';
}

export const styles = StyleSheet.create({
  pantallaCompleta: {
    flex: 1,
    backgroundColor: FONDO,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 0,
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' } : {})
  },
  contenido: {
    flexGrow: 1,
    backgroundColor: FONDO,
    padding: 16,
    paddingBottom: 95
  },
  cabeceraTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 4
  },
  logoHeaderCentro: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: DORADO
  },
  logoRedondo: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: DORADO,
    marginBottom: 10
  },
  tituloPrincipal: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.4
  },
  subtitulo: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 10,
    letterSpacing: 0.4
  },
  cajaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12
  },
  campoSinBorde: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14
  },
  campo: {
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 14,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10
  },
  boton: {
    backgroundColor: ROJO,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6
  },
  botonSecundario: {
    backgroundColor: '#1E1E28',
    borderWidth: 1,
    borderColor: BORDE
  },
  botonPequeno: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  enlaceRojo: {
    color: ROJO,
    fontWeight: '900',
    fontSize: 13
  },
  pildoraRoja: {
    backgroundColor: ROJO,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 20,
    marginVertical: 5
  },
  textoPildoraRoja: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  tarjetaPerfilHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171014',
    borderWidth: 1.5,
    borderColor: ROJO,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    gap: 12
  },
  avatarClienteBox: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: DORADO,
    backgroundColor: '#1E1E28',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  nombreDoradoHero: {
    color: DORADO,
    fontSize: 18,
    fontWeight: '900'
  },
  badgePuntosHero: {
    backgroundColor: ROJO,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74
  },
  numeroPuntosDorado: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900'
  },
  cuadricula3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  itemCuadricula: {
    width: '31%',
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconoCuadriculaBox: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textoCuadricula: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  listaCategorias: {
    flexDirection: 'row',
    marginBottom: 12
  },
  categoria: {
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8
  },
  categoriaActiva: {
    backgroundColor: ROJO,
    borderColor: ROJO
  },
  textoCategoria: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  },
  producto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    gap: 12
  },
  fotoProducto: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#1E1E28'
  },
  nombreProducto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  },
  precioProducto: {
    color: ROJO,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4
  },
  botonAgregar: {
    backgroundColor: ROJO,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textoAgregar: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  },
  tarjetaPromo: {
    backgroundColor: TARJETA,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14
  },
  etiquetaPromo: {
    position: 'absolute',
    backgroundColor: ROJO
  },
  textoEtiquetaPromo: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  tarjetaPedido: {
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  descripcionPedido: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2
  },
  totalPedidoTexto: {
    color: DORADO,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8
  },
  estadoPedido: {
    alignSelf: 'flex-start',
    backgroundColor: '#261418',
    borderWidth: 1,
    borderColor: ROJO,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginVertical: 6
  },
  textoEstado: {
    color: ROJO,
    fontSize: 11,
    fontWeight: '900'
  },
  opcionEntrega: {
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12
  },
  opcionEntregaActiva: {
    borderColor: ROJO,
    backgroundColor: '#241216'
  },
  tarjetaVacia: {
    backgroundColor: TARJETA,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8
  },
  textoVacio: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center'
  },
  barraInferior: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    backgroundColor: '#0E0E14',
    borderTopWidth: 1,
    borderTopColor: BORDE,
    paddingVertical: 8,
    paddingHorizontal: 0
  },
  tabInferior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textoTabInferior: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2
  },
  textoTabInferiorAct: {
    color: ROJO
  }
});
