import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Vibration, Platform } from 'react-native';

const ROJO = '#E50914';
const DORADO = '#F59E0B';
const TARJETA = '#121218';

let escuchadorAviso = null;
let escuchadorConfirmacion = null;

export function mostrarAviso(titulo, mensaje) {
  if (escuchadorAviso) {
    escuchadorAviso({ titulo, mensaje });
  }
}

export function pedirConfirmacion(titulo, mensaje, onConfirmar) {
  if (escuchadorConfirmacion) {
    escuchadorConfirmacion({ titulo, mensaje, onConfirmar });
  } else if (onConfirmar) {
    onConfirmar();
  }
}

export function reproducirTimbreAlerta() {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 300, 150, 400]);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 150, 400]);
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const ahora = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ahora + i * 0.18);
      gain.gain.setValueAtTime(0.22, ahora + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + i * 0.18 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ahora + i * 0.18);
      osc.stop(ahora + i * 0.18 + 0.36);
    });
  } catch (e) {}
}

export function VentanaAviso() {
  const [dato, setDato] = useState(null);
  const [conf, setConf] = useState(null);

  useEffect(() => {
    escuchadorAviso = (nuevo) => setDato(nuevo);
    escuchadorConfirmacion = (nuevoConf) => setConf(nuevoConf);
    return () => {
      escuchadorAviso = null;
      escuchadorConfirmacion = null;
    };
  }, []);

  return (
    <>
      <Modal transparent animationType="fade" visible={Boolean(dato)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {dato && (
            <View style={{ width: '100%', maxWidth: 350, backgroundColor: TARJETA, borderWidth: 1.5, borderColor: ROJO, borderRadius: 18, padding: 22 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
                {dato.titulo}
              </Text>
              <Text style={{ color: '#D1D5DB', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 }}>
                {dato.mensaje}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: ROJO, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                onPress={() => setDato(null)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>Entendido</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={Boolean(conf)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {conf && (
            <View style={{ width: '100%', maxWidth: 360, backgroundColor: TARJETA, borderWidth: 1.5, borderColor: DORADO, borderRadius: 18, padding: 22 }}>
              <Text style={{ color: DORADO, fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 1, marginBottom: 4 }}>
                CONFIRMAR ACCIÓN
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
                {conf.titulo}
              </Text>
              <Text style={{ color: '#D1D5DB', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                {conf.mensaje}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#252530', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                  onPress={() => setConf(null)}
                >
                  <Text style={{ color: '#D1D5DB', fontSize: 14, fontWeight: '800' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: ROJO, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                  onPress={() => {
                    const fn = conf.onConfirmar;
                    setConf(null);
                    if (fn) fn();
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
