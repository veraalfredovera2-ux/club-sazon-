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

export function VistaBienvenida({ irARegistro, irAIngreso }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={[styles.contenido, { justifyContent: 'center', flexGrow: 1, alignItems: 'center' }]}>
      <Image source={LOGO} style={{ width: 170, height: 170, borderRadius: 85, marginBottom: 18, borderWidth: 2, borderColor: '#B81D24' }} resizeMode="cover" />
      <Text style={[styles.titulo, { fontSize: 26, textAlign: 'center', marginBottom: 6 }]}>EL SAZÓN ORIENTAL</Text>
      <Text style={[styles.descripcionPedido, { textAlign: 'center', marginBottom: 24, fontSize: 14 }]}>Club de Puntos y Pedidos en Línea</Text>
      <TouchableOpacity style={[styles.boton, { width: '100%' }]} onPress={irARegistro}><Text style={styles.textoBoton}>CREAR CUENTA (+100 PUNTOS)</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.boton, styles.botonSecundario, { width: '100%' }]} onPress={irAIngreso}><Text style={styles.textoBoton}>INICIAR SESIÓN</Text></TouchableOpacity>
    </ScrollView>
  );
}

export function VistaRegistro({ onRegistrar, registrar, regresar, cargando }) {
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
    const fn = onRegistrar || registrar;
    if (fn) await fn({ nombreCompleto: nombreCompleto.trim(), telefono: telefono.trim(), password: password.trim() });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={regresar} />
      <Text style={styles.titulo}>CREAR CUENTA</Text>
      <Text style={styles.descripcionPedido}>Regístrate y recibe 100 puntos de bienvenida al instante.</Text>
      {aviso !== '' && <Text style={{ color: '#FF5252', fontWeight: '800', marginTop: 10 }}>{aviso}</Text>}
      <TextInput style={[styles.campo, { marginTop: 14 }]} placeholder="Nombre completo" placeholderTextColor="#777" value={nombreCompleto} onChangeText={setNombreCompleto} />
      <TextInput style={[styles.campo, { marginTop: 10 }]} placeholder="Número de teléfono (ej. 987654321)" placeholderTextColor="#777" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <TextInput style={[styles.campo, { marginTop: 10 }]} placeholder="Crea una contraseña" placeholderTextColor="#777" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={[styles.boton, { marginTop: 18 }]} onPress={enviar} disabled={cargando}>
        <Text style={styles.textoBoton}>{cargando ? 'CREANDO CUENTA...' : 'REGISTRARME Y GANAR 100 PTS'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function VistaIngreso({ onIngresar, ingresar, regresar, cargando }) {
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [aviso, setAviso] = useState('');

  async function enviar() {
    setAviso('');
    if (!telefono.trim() || !password.trim()) {
      setAviso('Ingresa tu teléfono y contraseña.');
      return;
    }
    const fn = onIngresar || ingresar;
    if (fn) await fn({ telefono: telefono.trim(), password: password.trim() });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={regresar} />
      <Text style={styles.titulo}>INICIAR SESIÓN</Text>
      <Text style={styles.descripcionPedido}>Ingresa con tu número de teléfono y contraseña.</Text>
      {aviso !== '' && <Text style={{ color: '#FF5252', fontWeight: '800', marginTop: 10 }}>{aviso}</Text>}
      <TextInput style={[styles.campo, { marginTop: 14 }]} placeholder="Número de teléfono" placeholderTextColor="#777" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <TextInput style={[styles.campo, { marginTop: 10 }]} placeholder="Contraseña" placeholderTextColor="#777" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={[styles.boton, { marginTop: 18 }]} onPress={enviar} disabled={cargando}>
        <Text style={styles.textoBoton}>{cargando ? 'INGRESANDO...' : 'ENTRAR A CLUB SAZÓN'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
