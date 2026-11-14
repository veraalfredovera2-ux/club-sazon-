import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { styles } from './estilos';

export const LOGO = require('./20261104_204552_0000.png');

export function NavegacionSuperior({ regresar, irAInicio }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#222' }}>
      <TouchableOpacity style={{ backgroundColor: '#1E1E1E', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#333' }} onPress={regresar}>
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>← REGRESAR</Text>
      </TouchableOpacity>
      <Image source={LOGO} style={{ width: 34, height: 34, borderRadius: 17 }} />
      <TouchableOpacity style={{ backgroundColor: '#1E1E1E', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#333' }} onPress={irAInicio}>
        <Text style={{ color: '#F5B041', fontWeight: '700', fontSize: 12 }}>INICIO</Text>
      </TouchableOpacity>
    </View>
  );
}

export function VistaBienvenida({ irARegistro, onIngresar, cargando }) {
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [aviso, setAviso] = useState('');
  const [verRecuperar, setVerRecuperar] = useState(false);

  async function entrar() {
    setAviso('');
    if (!telefono.trim() || !password.trim()) {
      setAviso('Ingresa tu número de teléfono y contraseña.');
      return;
    }
    try {
      await onIngresar({ telefono: telefono.trim(), password: password.trim() });
    } catch (e) {
      setAviso(e.message || 'Teléfono o contraseña incorrectos.');
    }
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { justifyContent: 'center', flexGrow: 1, alignItems: 'center' }]}>
      <Image source={LOGO} style={{ width: 150, height: 150, borderRadius: 75, marginBottom: 14, borderWidth: 2, borderColor: '#B81D24' }} resizeMode="cover" />
      <Text style={[styles.titulo, { fontSize: 25, textAlign: 'center', marginBottom: 2 }]}>EL SAZÓN ORIENTAL</Text>
      <Text style={{ color: '#F5B041', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>Comida venezolana</Text>
      <Text style={{ color: '#DDD', fontSize: 13, textAlign: 'center', marginBottom: 18 }}>Regístrate y gana 100 puntos de bienvenida</Text>

      {aviso !== '' && <Text style={{ color: '#FF5252', fontWeight: '800', marginBottom: 10, textAlign: 'center' }}>{aviso}</Text>}

      <TextInput style={[styles.campo, { width: '100%', marginBottom: 10 }]} placeholder="Teléfono" placeholderTextColor="#777" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <TextInput style={[styles.campo, { width: '100%', marginBottom: 14 }]} placeholder="Contraseña" placeholderTextColor="#777" secureTextEntry value={password} onChangeText={setPassword} />

      <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
        <TouchableOpacity style={[styles.boton, styles.botonSecundario, { flex: 1, marginTop: 0 }]} onPress={irARegistro} disabled={cargando}>
          <Text style={styles.textoBoton}>CREAR CUENTA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.boton, { flex: 1, marginTop: 0 }]} onPress={entrar} disabled={cargando}>
          <Text style={styles.textoBoton}>{cargando ? 'ENTRANDO...' : 'INICIAR SESIÓN'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={{ marginTop: 18, padding: 8 }} onPress={() => setVerRecuperar(!verRecuperar)}>
        <Text style={{ color: '#AAA', fontSize: 13, textDecorationLine: 'underline' }}>Recuperar contraseña</Text>
      </TouchableOpacity>

      {verRecuperar && (
        <View style={[styles.tarjetaPedido, { width: '100%', marginTop: 8, borderColor: '#F5B041' }]}>
          <Text style={{ color: '#F5B041', fontWeight: '800', marginBottom: 4 }}>🔑 Recuperación de contraseña</Text>
          <Text style={{ color: '#DDD', fontSize: 13 }}>Para restablecer tu clave de acceso de forma segura, comunícate por WhatsApp o en caja con la administración de El Sazón Oriental indicando tu número de teléfono registrado.</Text>
        </View>
      )}
    </ScrollView>
  );
}

export function VistaRegistro({ onRegistrar, regresar, cargando }) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [aviso, setAviso] = useState('');

  async function enviar() {
    setAviso('');
    if (!nombreCompleto.trim() || !telefono.trim() || !password.trim()) {
      setAviso('Completa tu nombre, teléfono y contraseña.');
      return;
    }
    try {
      await onRegistrar({ nombreCompleto: nombreCompleto.trim(), telefono: telefono.trim(), password: password.trim() });
    } catch (e) {
      setAviso(e.message || 'No se pudo registrar.');
    }
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={regresar} />
      <Text style={styles.titulo}>CREAR CUENTA</Text>
      <Text style={styles.descripcionPedido}>Regístrate y gana 100 puntos de bienvenida al instante.</Text>
      {aviso !== '' && <Text style={{ color: '#FF5252', fontWeight: '800', marginTop: 10 }}>{aviso}</Text>}
      <TextInput style={[styles.campo, { marginTop: 14 }]} placeholder="Nombre completo" placeholderTextColor="#777" value={nombreCompleto} onChangeText={setNombreCompleto} />
      <TextInput style={[styles.campo, { marginTop: 10 }]} placeholder="Teléfono" placeholderTextColor="#777" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <TextInput style={[styles.campo, { marginTop: 10 }]} placeholder="Contraseña" placeholderTextColor="#777" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={[styles.boton, { marginTop: 18 }]} onPress={enviar} disabled={cargando}>
        <Text style={styles.textoBoton}>{cargando ? 'CREANDO CUENTA...' : 'REGISTRARME Y GANAR 100 PTS'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
