import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Platform, Vibration } from 'react-native';
import { ROJO, DORADO, TARJETA } from './estilos';

let setAvisoGlobal = null;

export function mostrarAviso(titulo, mensaje) {
  if (setAvisoGlobal) setAvisoGlobal({ tipo: 'alerta', titulo, mensaje });
}

export function pedirConfirmacion(titulo, mensaje, onConfirmar) {
  if (setAvisoGlobal) setAvisoGlobal({ tipo: 'confirmar', titulo, mensaje, onConfirmar });
}

export function reproducirTimbreAlerta() {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(new Array(0, 350, 150, 350, 150, 450));
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(new Array(350, 150, 350, 150, 450));
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const ahora = ctx.currentTime;
    new Array(880, 1174.66).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ahora + i * 0.16);
      gain.gain.setValueAtTime(0.22, ahora + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + i * 0.16 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ahora + i * 0.16);
      osc.stop(ahora + i * 0.16 + 0.36);
    });
  } catch (e) {}
}

export function VentanaAviso() {
  const [dato, setDato] = useState(null);
  useEffect(() => {
    setAvisoGlobal = setDato;
    return () => { setAvisoGlobal = null; };
  }, []);

  if (!dato) return null;

  return (
    <Modal transparent animationType="fade" visible={Boolean(dato)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: TARJETA, borderWidth: 1.5, borderColor: dato.tipo === 'confirmar' ? DORADO : ROJO, borderRadius: 18, padding: 20 }}>
          <Text style={{ color: DORADO, fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 1, marginBottom: 4 }}>
            {dato.tipo === 'confirmar' ? 'CONFIRMAR ACCIÓN' : 'EL SAZÓN ORIENTAL'}
          </Text>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            {dato.titulo}
          </Text>
          <Text style={{ color: '#D1D5DB', fontSize: 14, textAlign: 'center', marginBottom: 18 }}>
            {dato.mensaje}
          </Text>
          {dato.tipo === 'confirmar' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDato(null)}
                style={{ flex: 1, backgroundColor: '#252530', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#D1D5DB', fontWeight: '800', fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const fn = dato.onConfirmar;
                  setDato(null);
                  if (fn) fn();
                }}
                style={{ flex: 1, backgroundColor: ROJO, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setDato(null)}
              style={{ backgroundColor: ROJO, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>Entendido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
