import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Linking, Platform } from 'react-native';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';

export const LOGO = require('./20261104_204552_0000.png');
export const BANNER_COMIDA = require('./banner_hamburguesa-1.png');

export function SiluetaBlanca({ size = 34 }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21, backgroundColor: '#FFFFFF', marginBottom: 2 }} />
      <View style={{ width: size * 0.72, height: size * 0.34, borderTopLeftRadius: size * 0.36, borderTopRightRadius: size * 0.36, backgroundColor: '#FFFFFF' }} />
    </View>
  );
}

export function NavegacionSuperior({ regresar, irAInicio, cantidadNotif, abrirNotificaciones, cantidadCarrito, abrirCarrito }) {
  return (
    <View style={styles.cabeceraTop}>
      <View style={{ width: 82, alignItems: 'flex-start' }}>
        {regresar && (
          <TouchableOpacity onPress={regresar} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: TARJETA, borderRadius: 10, borderWidth: 1, borderColor: BORDE }}>
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={irAInicio} style={{ alignItems: 'center' }}>
        <Image source={LOGO} style={styles.logoHeaderCentro} />
      </TouchableOpacity>

      <View style={{ width: 82, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        {abrirNotificaciones && (
          <TouchableOpacity onPress={abrirNotificaciones} style={{ padding: 5, position: 'relative' }}>
            <Text style={{ color: '#FFF', fontSize: 21 }}>🔔</Text>
            {(cantidadNotif || 0) > 0 && (
              <View style={{ position: 'absolute', top: 1, right: 1, backgroundColor: ROJO, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{cantidadNotif}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {abrirCarrito && (
          <TouchableOpacity onPress={abrirCarrito} style={{ padding: 5, position: 'relative' }}>
            <Text style={{ color: '#FFF', fontSize: 21 }}>🛒</Text>
            <View style={{ position: 'absolute', top: 1, right: 1, backgroundColor: ROJO, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
              <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{cantidadCarrito || 0}</Text>
            </View>
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
    { id: 'mas', icono: '•••', label: 'Más' }
  ];
  return (
    <View style={styles.barraInferior}>
      {tabs.map(t => {
        const activo = vistaActual === t.id || (t.id === 'mas' && ['cuenta', 'canjes', 'ofertas', 'carrito', 'notificaciones', 'mas'].includes(vistaActual));
        return (
          <TouchableOpacity key={t.id} style={styles.tabInferior} onPress={() => cambiarVista(t.id)}>
            <Text style={{ fontSize: 16, color: activo ? ROJO : '#9CA3AF', fontWeight: '900' }}>{t.icono}</Text>
            <Text style={[styles.textoTabInferior, activo && styles.textoTabInferiorAct]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function PantallaBienvenida({ irALogin, irARegistro }) {
  const fuenteElegante = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : 'serif';
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={{ paddingTop: 12, paddingBottom: 18, justifyContent: 'space-between', minHeight: '100%' }}>
      <View>
        <View style={{ paddingHorizontal: 20 }}>
          <Image source={LOGO} style={[styles.logoRedondo, { width: 112, height: 112, borderRadius: 56, marginBottom: 6 }]} />
          <Text style={[styles.tituloPrincipal, { fontSize: 23 }]}>EL SAZÓN ORIENTAL</Text>
          <Text style={{ color: '#F3F4F6', fontSize: 16, fontStyle: 'italic', fontFamily: fuenteElegante, textAlign: 'center', marginBottom: 2 }}>
            Sabor que te hace volver
          </Text>
        </View>

        <View style={{ width: '100%', height: 245, position: 'relative', backgroundColor: '#070709', overflow: 'hidden' }}>
          <Image source={BANNER_COMIDA} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <Text
            style={{
              position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center',
              color: '#FFFFFF', fontSize: 22, fontStyle: 'italic', fontWeight: '600',
              fontFamily: fuenteElegante, letterSpacing: 0.6,
              textShadowColor: 'rgba(0,0,0,0.98)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10
            }}
          >
            ¡Sabor que enamora!
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 10, paddingHorizontal: 20 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>¡Regístrate y recibe</Text>
          <View style={[styles.pildoraRoja, { borderRadius: 14, paddingVertical: 6, paddingHorizontal: 26, marginVertical: 4 }]}>
            <Text style={[styles.textoPildoraRoja, { fontSize: 21 }]}>100 puntos</Text>
          </View>
          <Text style={{ color: '#E5E7EB', fontSize: 13, fontWeight: '600' }}>de bienvenida!</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity style={[styles.boton, { borderRadius: 14, paddingVertical: 13, marginTop: 0 }]} onPress={irALogin}>
          <Text style={[styles.textoBoton, { fontSize: 16 }]}>Comenzar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={irARegistro} style={{ marginTop: 10, alignItems: 'center' }}>
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
