import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { styles } from './estilos';

let listenerAviso = null;

export function registrarAvisoGlobal(fn) {
  listenerAviso = fn;
}

export function mostrarAviso(titulo, mensaje) {
  if (listenerAviso) listenerAviso({ titulo, mensaje });
}

export function BannerAviso({ aviso, onCerrar, cerrar }) {
  if (!aviso) return null;
  const cerrarAhora = () => {
    if (typeof onCerrar === 'function') onCerrar();
    if (typeof cerrar === 'function') cerrar();
    if (listenerAviso) listenerAviso(null);
  };
  return (
    <TouchableOpacity activeOpacity={1} onPress={cerrarAhora} style={s.fondo}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={s.caja}>
        <Text style={s.titulo}>{aviso.titulo}</Text>
        {!!aviso.mensaje && <Text style={s.mensaje}>{aviso.mensaje}</Text>}
        <TouchableOpacity onPress={cerrarAhora} style={s.boton}>
          <Text style={s.textoBoton}>OK</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 9999 },
  caja: { width: '100%', maxWidth: 340, backgroundColor: '#181818', borderRadius: 16, padding: 22, borderWidth: 1.5, borderColor: '#F5B041', alignItems: 'center' },
  titulo: { color: '#F5B041', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  mensaje: { color: '#FFFFFF', fontSize: 15, textAlign: 'center', marginBottom: 18, lineHeight: 21 },
  boton: { width: '100%', backgroundColor: '#F5B041', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  textoBoton: { color: '#111111', fontSize: 15, fontWeight: '900' }
});
