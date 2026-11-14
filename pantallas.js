import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { styles } from './estilos';
import { categorias } from './servicios';

export const LOGO = require('./20261104_204552_0000.png');

export function NavegacionSuperior({ regresar, irAInicio }) {
  return (
    <View>
      <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 4 }}><Image source={LOGO} style={{ width: 64, height: 64, borderRadius: 32 }} /></View>
      <View style={styles.navegacion}>
        <TouchableOpacity style={[styles.botonNavegacion, styles.botonRegresar]} onPress={regresar}><Text style={styles.textoNavegacion}>← REGRESAR</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.botonNavegacion, styles.botonInicio]} onPress={irAInicio}><Text style={styles.textoNavegacion}>INICIO</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function CampoPassword({ value, onChangeText, placeholder }) {
  const [ver, setVer] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', borderWidth: 1, borderColor: '#2E2E2E', borderRadius: 12 }}>
      <TextInput style={{ flex: 1, color: '#FFF', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 }} placeholder={placeholder} placeholderTextColor="#777" secureTextEntry={!ver} value={value} onChangeText={onChangeText} />
      <TouchableOpacity style={{ paddingHorizontal: 14 }} onPress={() => setVer(!ver)}><Text style={{ fontSize: 18 }}>{ver ? '🙈' : '👁️'}</Text></TouchableOpacity>
    </View>
  );
}

export function VistaBienvenida({ irARegistro, irAIngreso }) {
  return (
    <ScrollView contentContainerStyle={styles.bienvenida}>
      <View style={styles.logoBienvenida}><Image source={LOGO} style={styles.logoGrande} /></View>
      <Text style={styles.fraseBienvenida}>EL SAZÓN ORIENTAL</Text>
      <Text style={styles.textoBienvenida}>Gana 10 puntos por cada S/ 1.00 de consumo y canjéalos por tus platos favoritos.</Text>
      <View style={styles.barraPuntos}><Text style={styles.numeroPuntos}>+100 PUNTOS</Text></View>
      <Text style={styles.deBienvenida}>de regalo al registrarte hoy</Text>
      <View style={styles.espacioGrande} />
      <TouchableOpacity style={styles.boton} onPress={irARegistro}><Text style={styles.textoBoton}>COMENZAR / CREAR CUENTA</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={irAIngreso}><Text style={styles.textoBoton}>YA TENGO CUENTA</Text></TouchableOpacity>
      <Text style={styles.pieBienvenida}>CLUB SAZÓN • COMIDA VENEZOLANA</Text>
    </ScrollView>
  );
}
export function VistaRegistro({ nombre, setNombre, telefono, setTelefono, password, setPassword, onRegistrar, irAIngreso, regresar, irAInicio, cargando }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>CREAR CUENTA</Text>
      <View style={styles.grupoCampo}><Text style={styles.etiqueta}>Nombre completo</Text><TextInput style={styles.campo} placeholder="Ej. Luisana Vera" placeholderTextColor="#777" value={nombre} onChangeText={setNombre} /></View>
      <View style={styles.grupoCampo}><Text style={styles.etiqueta}>Teléfono (9 dígitos)</Text><TextInput style={styles.campo} placeholder="Ej. 987654321" placeholderTextColor="#777" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} /></View>
      <View style={styles.grupoCampo}><Text style={styles.etiqueta}>Contraseña</Text><CampoPassword value={password} onChangeText={setPassword} placeholder="Crea una contraseña" /></View>
      <TouchableOpacity style={[styles.boton, cargando && styles.botonDesactivado]} onPress={onRegistrar} disabled={cargando}><Text style={styles.textoBoton}>{cargando ? 'CREANDO...' : 'CREAR CUENTA'}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.enlace} onPress={irAIngreso}><Text style={styles.textoEnlace}>¿Ya tienes cuenta? <Text style={styles.rojo}>Iniciar sesión</Text></Text></TouchableOpacity>
    </ScrollView>
  );
}

export function VistaIngreso({ telefono, setTelefono, password, setPassword, onIngresar, irARegistro, regresar, irAInicio, cargando }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>INICIAR SESIÓN</Text>
      <View style={styles.grupoCampo}><Text style={styles.etiqueta}>Teléfono</Text><TextInput style={styles.campo} placeholder="Tu número de teléfono" placeholderTextColor="#777" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} /></View>
      <View style={styles.grupoCampo}><Text style={styles.etiqueta}>Contraseña</Text><CampoPassword value={password} onChangeText={setPassword} placeholder="Tu contraseña" /></View>
      <TouchableOpacity style={[styles.boton, cargando && styles.botonDesactivado]} onPress={onIngresar} disabled={cargando}><Text style={styles.textoBoton}>{cargando ? 'ENTRANDO...' : 'INICIAR SESIÓN'}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.enlace} onPress={irARegistro}><Text style={styles.textoEnlace}>¿No tienes cuenta? <Text style={styles.rojo}>Regístrate</Text></Text></TouchableOpacity>
    </ScrollView>
  );
}

export function VistaInicioCliente({ usuario, puntos, irA, cerrarSesion }) {
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <View style={styles.filaSaludo}>
        <View><Text style={styles.saludo}>Hola,</Text><Text style={styles.nombreCliente}>{usuario?.nombre_completo}</Text></View>
        <View style={styles.puntosCliente}><Text style={styles.puntosNumero}>{puntos}</Text><Text style={styles.puntosEtiqueta}>PUNTOS</Text></View>
      </View>
      <View style={styles.encabezado}>
        <Image source={LOGO} style={styles.logoPequeno} />
        <View style={styles.encabezadoTexto}><Text style={styles.nombreNegocio}>EL SAZÓN ORIENTAL</Text><Text style={styles.subtituloNegocio}>10 PUNTOS POR CADA S/ 1.00 DE COMPRA</Text><Text style={styles.hamburguesa}>🍔</Text></View>
      </View>
      <View style={styles.cuadricula}>
        <TouchableOpacity style={styles.tarjetaAcceso} onPress={() => irA('menu')}><Text style={styles.iconoTarjeta}>🍔</Text><Text style={styles.textoTarjeta}>MENÚ</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tarjetaAcceso} onPress={() => irA('carrito')}><Text style={styles.iconoTarjeta}>🛒</Text><Text style={styles.textoTarjeta}>CARRITO</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tarjetaAcceso} onPress={() => irA('pedidos')}><Text style={styles.iconoTarjeta}>🧾</Text><Text style={styles.textoTarjeta}>PEDIDOS</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tarjetaAcceso} onPress={() => irA('puntos')}><Text style={styles.iconoTarjeta}>🎁</Text><Text style={styles.textoTarjeta}>PUNTOS Y CANJES</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.boton, styles.botonSecundario, { marginTop: 20 }]} onPress={cerrarSesion}><Text style={styles.textoBoton}>CERRAR SESIÓN</Text></TouchableOpacity>
    </ScrollView>
  );
}

export function VistaMenu({ productos, categoriaActiva, setCategoriaActiva, agregarAlCarrito, regresar, irAInicio }) {
  const filtrados = categoriaActiva === 'Todas' ? productos : productos.filter(p => p.categoria === categoriaActiva);
  return (
    <ScrollView style={styles.pantallaCompleta} contentContainerStyle={styles.contenido}>
      <NavegacionSuperior regresar={regresar} irAInicio={irAInicio} />
      <Text style={styles.titulo}>NUESTRO MENÚ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listaCategorias}>
        {categorias.map(cat => <TouchableOpacity key={cat} style={[styles.categoria, categoriaActiva === cat && styles.categoriaActiva]} onPress={() => setCategoriaActiva(cat)}><Text style={styles.textoCategoria}>{cat}</Text></TouchableOpacity>)}
      </ScrollView>
      {filtrados.map(prod => (
        <View key={prod.id} style={styles.producto}>
          <Image source={prod.imagen_url && prod.imagen_url.includes('supabase.co') ? { uri: prod.imagen_url } : LOGO} style={{ width: 68, height: 68, borderRadius: 10, backgroundColor: '#222' }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nombreProducto}>{prod.nombre}</Text>
            {prod.ingredientes ? <Text style={[styles.descripcionPedido, { marginTop: 3 }]}>{prod.ingredientes}</Text> : null}
            <Text style={styles.precioProducto}>S/ {Number(prod.precio).toFixed(2)} • +{Math.floor(Number(prod.precio) * 10)} pts</Text>
          </View>
          <TouchableOpacity style={styles.botonAgregar} onPress={() => agregarAlCarrito(prod)}><Text style={styles.textoAgregar}>+ AGREGAR</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
