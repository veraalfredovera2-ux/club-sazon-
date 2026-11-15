import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { styles } from './estilos';
import { mostrarAviso } from './avisos';

export const LOGO = require('./20261104_204552_0000.png');

export function NavegacionSuperior({ regresar, irAInicio }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingVertical: 6 }}>
      <TouchableOpacity onPress={regresar} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1E1E1E', borderRadius: 8, borderWidth: 1, borderColor: '#333' }}>
        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>← REGRESAR</Text>
      </TouchableOpacity>
      <Image source={LOGO} style={{ width: 68, height: 68, borderRadius: 34 }} resizeMode="contain" />
      <TouchableOpacity onPress={irAInicio} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1E1E1E', borderRadius: 8, borderWidth: 1, borderColor: '#F5B041' }}>
        <Text style={{ color: '#F5B041', fontSize: 12, fontWeight: '800' }}>INICIO</Text>
      </TouchableOpacity>
    </View>
  );
}

function CampoClave({ placeholder, value, onChangeText }) {
  const [ver, setVer] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderColor: '#444', borderWidth: 1, borderRadius: 10, marginBottom: 12, paddingRight: 10 }}>
      <TextInput
        style={{ flex: 1, color: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 }}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        secureTextEntry={!ver}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={() => setVer(!ver)} style={{ padding: 8 }}>
        <Text style={{ fontSize: 18 }}>{ver ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function VistaBienvenida({ irARegistro, onIngresar, cargando }) {
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');

  async function entrar() {
    if (!telefono.trim() || !password.trim()) return mostrarAviso('Faltan datos', 'Ingresa tu teléfono y contraseña.');
    try { await onIngresar({ telefono, password }); } catch (e) { mostrarAviso('Error al ingresar', e.message); }
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { flexGrow: 1, justifyContent: 'center' }]}>
      <Image source={LOGO} style={{ width: 190, height: 190, alignSelf: 'center', marginBottom: 14 }} resizeMode="contain" />
      <Text style={[styles.titulo, { textAlign: 'center', fontSize: 22, marginBottom: 4 }]}>CLUB SAZÓN</Text>
      <Text style={{ color: '#CCC', textAlign: 'center', marginBottom: 20 }}>Inicia sesión para pedir y acumular puntos</Text>
      <TextInput style={[styles.campo, { color: '#FFF', marginBottom: 12 }]} placeholder="Teléfono" placeholderTextColor="#888" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <CampoClave placeholder="Contraseña" value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.boton} onPress={entrar} disabled={cargando}><Text style={styles.textoBoton}>{cargando ? 'INGRESANDO...' : 'INICIAR SESIÓN'}</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={irARegistro}><Text style={styles.textoBoton}>CREAR CUENTA NUEVA</Text></TouchableOpacity>
    </ScrollView>
  );
}

export function VistaRegistro({ onRegistrar, regresar, cargando }) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  async function registrar() {
    if (!nombreCompleto.trim() || !telefono.trim() || !password.trim()) return mostrarAviso('Faltan datos', 'Completa todos los campos.');
    if (password !== confirmar) return mostrarAviso('Contraseñas distintas', 'La contraseña y su confirmación no coinciden.');
    try { await onRegistrar({ nombreCompleto, telefono, password }); } catch (e) { mostrarAviso('Error al registrar', e.message); }
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={regresar} />
      <Text style={[styles.titulo, { fontSize: 20, marginBottom: 12 }]}>CREAR CUENTA (+100 PTS DE REGALO)</Text>
      <TextInput style={[styles.campo, { color: '#FFF', marginBottom: 12 }]} placeholder="Nombre completo" placeholderTextColor="#888" value={nombreCompleto} onChangeText={setNombreCompleto} />
      <TextInput style={[styles.campo, { color: '#FFF', marginBottom: 12 }]} placeholder="Teléfono" placeholderTextColor="#888" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <CampoClave placeholder="Contraseña" value={password} onChangeText={setPassword} />
      <CampoClave placeholder="Confirmar contraseña" value={confirmar} onChangeText={setConfirmar} />
      <TouchableOpacity style={styles.boton} onPress={registrar} disabled={cargando}><Text style={styles.textoBoton}>{cargando ? 'REGISTRANDO...' : 'REGISTRARME AHORA'}</Text></TouchableOpacity>
    </ScrollView>
  );
}
