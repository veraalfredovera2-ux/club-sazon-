import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Linking } from 'react-native';
import { styles, ROJO, TARJETA, BORDE } from './estilos';

export const LOGO = {
  uri: 'https://githubusercontent.com'
};

export const BANNER_COMIDA = {
  uri: 'https://githubusercontent.com'
};

export function NavegacionSuperior({ regresar, irAInicio, puntos, cantidadCarrito, abrirCarrito }) {
  return (
    <View style={styles.cabeceraTop}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
        {regresar && (
          <TouchableOpacity onPress={regresar} style={{ paddingVertical: 6, paddingHorizontal: 8, backgroundColor: TARJETA, borderRadius: 10, borderWidth: 1, borderColor: BORDE }}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>←</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={irAInicio} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <Image source={LOGO} style={styles.logoMini} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>EL SAZÓN ORIENTAL</Text>
            <Text style={{ color: ROJO, fontSize: 9, fontWeight: '800' }}>CLUB SAZÓN</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {typeof puntos === 'number' && (
          <View style={[styles.insigniaPuntos, { paddingHorizontal: 8, paddingVertical: 5 }]}>
            <Text style={[styles.textoInsigniaPuntos, { fontSize: 11 }]}>★ {puntos}</Text>
          </View>
        )}
        {abrirCarrito && (
          <TouchableOpacity onPress={abrirCarrito} style={{ backgroundColor: TARJETA, borderWidth: 1, borderColor: BORDE, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 10 }}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>🛒 {cantidadCarrito || 0}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function BarraInferiorCliente({ vistaActual, cambiarVista }) {
  const tabs = [
    { id: 'inicio', icono: '🏠', label: 'Inicio' },
    { id: 'pedidos', icono: '📋', label: 'Pedidos' },
    { id: 'puntos', icono: '★', label: 'Puntos' },
    { id: 'promos', icono: '🏷️', label: 'Promociones' },
    { id: 'menu', icono: '🍔', label: 'Menú' }
  ];
  return (
    <View style={styles.barraInferior}>
      {tabs.map(t => {
        const activo = vistaActual === t.id;
        return (
          <TouchableOpacity key={t.id} style={styles.tabInferior} onPress={() => cambiarVista(t.id)}>
            <Text style={{ fontSize: 16, color: activo ? ROJO : '#9CA3AF' }}>{t.icono}</Text>
            <Text style={[styles.textoTabInferior, activo && styles.textoTabInferiorAct]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function PantallaBienvenida({ irALogin, irARegistro }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={{ padding: 22, paddingTop: 38, justifyContent: 'space-between', minHeight: '100%' }}>
      <View>
        <Image source={LOGO} style={styles.logoRedondo} />
        <Text style={styles.tituloPrincipal}>EL SAZÓN ORIENTAL</Text>
        <Text style={[styles.subtitulo, { fontStyle: 'italic', color: '#E5E7EB', fontSize: 15 }]}>Sabor que te hace volver</Text>

        <View style={styles.bannerHero}>
          <Image source={BANNER_COMIDA} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>

        <View style={styles.bannerPuntosBienvenida}>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>¡Regístrate y recibe</Text>
          <View style={styles.pildoraRoja}>
            <Text style={styles.textoPildoraRoja}>100 puntos</Text>
          </View>
          <Text style={{ color: '#D1D5DB', fontSize: 13, fontWeight: '700' }}>de bienvenida!</Text>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <TouchableOpacity style={styles.boton} onPress={irALogin}>
          <Text style={styles.textoBoton}>Comenzar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={irARegistro} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
            ¿Eres nuevo? <Text style={styles.enlaceRojo}>Crea tu cuenta gratis</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
export function PantallaLogin({ onIngresar, irARegistro, irARecuperar, irABienvenida, cargando }) {
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={{ padding: 22, paddingTop: 28 }}>
      {irABienvenida && (
        <TouchableOpacity onPress={irABienvenida} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '800' }}>← Volver</Text>
        </TouchableOpacity>
      )}
      <Image source={LOGO} style={styles.logoRedondo} />
      <Text style={styles.tituloPrincipal}>Iniciar sesión</Text>
      <Text style={styles.subtitulo}>Ingresa tus datos para acceder a tu cuenta</Text>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>📱</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Número de teléfono"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
      </View>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>🔒</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Contraseña"
          placeholderTextColor="#6B7280"
          secureTextEntry={!verClave}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setVerClave(!verClave)} style={{ padding: 6 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{verClave ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.boton} onPress={() => onIngresar({ telefono, password })} disabled={cargando}>
        <Text style={styles.textoBoton}>{cargando ? 'Ingresando...' : 'Iniciar sesión'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={irARegistro} style={{ marginTop: 18, alignItems: 'center' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
          ¿No tienes una cuenta? <Text style={styles.enlaceRojo}>Crear cuenta</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={irARecuperar} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={styles.enlaceRojo}>Recuperar contraseña</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function PantallaRegistro({ onRegistrar, irALogin, cargando }) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verClave, setVerClave] = useState(false);

  function enviarRegistro() {
    if (!nombreCompleto.trim()) return alert('Ingresa tu nombre completo.');
    if (password !== confirmar) return alert('Las contraseñas no coinciden.');
    onRegistrar({ nombreCompleto, telefono, password });
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={{ padding: 22, paddingTop: 28 }}>
      <TouchableOpacity onPress={irALogin} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '800' }}>← Volver</Text>
      </TouchableOpacity>
      <Image source={LOGO} style={styles.logoRedondo} />
      <Text style={styles.tituloPrincipal}>Crear cuenta</Text>
      <Text style={styles.subtitulo}>Regístrate y empieza a disfrutar de todos los beneficios (+100 pts)</Text>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>👤</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Nombre completo"
          placeholderTextColor="#6B7280"
          value={nombreCompleto}
          onChangeText={setNombreCompleto}
        />
      </View>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>📱</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Número de teléfono"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
      </View>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>🔒</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Contraseña"
          placeholderTextColor="#6B7280"
          secureTextEntry={!verClave}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setVerClave(!verClave)} style={{ padding: 6 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{verClave ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>🔒</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#6B7280"
          secureTextEntry={!verClave}
          value={confirmar}
          onChangeText={setConfirmar}
        />
      </View>

      <TouchableOpacity style={styles.boton} onPress={enviarRegistro} disabled={cargando}>
        <Text style={styles.textoBoton}>{cargando ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={irALogin} style={{ marginTop: 18, alignItems: 'center' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
          ¿Ya tienes una cuenta? <Text style={styles.enlaceRojo}>Iniciar sesión</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function PantallaRecuperar({ irALogin }) {
  const [telefono, setTelefono] = useState('');
  const [enviado, setEnviado] = useState(false);

  function solicitarRecuperacion() {
    if (!telefono.trim()) return alert('Ingresa tu número de teléfono registrado.');
    setEnviado(true);
    const msg = encodeURIComponent(`Hola El Sazón Oriental, olvidé mi contraseña para el número: ${telefono.trim()}. ¿Me ayudan a restablecerla?`);
    Linking.openURL(`https://wa.me{msg}`).catch(() => {});
  }

  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={{ padding: 22, paddingTop: 28 }}>
      <TouchableOpacity onPress={irALogin} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
        <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '800' }}>← Volver</Text>
      </TouchableOpacity>
      <Image source={LOGO} style={styles.logoRedondo} />
      <Text style={styles.tituloPrincipal}>Recuperar contraseña</Text>
      <Text style={styles.subtitulo}>Ingresa tu número de teléfono y te ayudaremos a restablecer tu contraseña.</Text>

      <View style={styles.cajaInput}>
        <Text style={{ marginRight: 8, fontSize: 15 }}>📱</Text>
        <TextInput
          style={styles.campoSinBorde}
          placeholder="Número de teléfono"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
      </View>

      <TouchableOpacity style={styles.boton} onPress={solicitarRecuperacion}>
        <Text style={styles.textoBoton}>Solicitar restablecimiento</Text>
      </TouchableOpacity>

      {enviado && (
        <View style={[styles.tarjetaPedido, { marginTop: 14, borderColor: ROJO }]}>
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>
            Solicitud lista para {telefono}. Envía el mensaje por WhatsApp al administrador del local para recibir tu nueva clave.
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={irALogin} style={{ marginTop: 22, alignItems: 'center' }}>
        <Text style={styles.enlaceRojo}>¿Volver al inicio de sesión?</Text>
      </TouchableOpacity>
    </ScrollView>
  );
        }
            
