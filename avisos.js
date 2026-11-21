import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ROJO, TARJETA, BORDE } from './estilos';

let listenerAviso = null;
export function mostrarAviso(titulo, mensaje) {
  if (listenerAviso) listenerAviso({ titulo, mensaje });
}

export function VentanaAviso() {
  const [data, setData] = useState(null);
  useEffect(() => {
    listenerAviso = setData;
    return () => { listenerAviso = null; };
  }, []);
  if (!data) return null;
  return (
    <Modal transparent animationType="fade" visible={Boolean(data)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, borderRadius: 16, padding: 20 }}>
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '900', marginBottom: 8 }}>{data.titulo}</Text>
          <Text style={{ color: '#D1D5DB', fontSize: 14, marginBottom: 18 }}>{data.mensaje}</Text>
          <TouchableOpacity onPress={() => setData(null)} style={{ backgroundColor: ROJO, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
