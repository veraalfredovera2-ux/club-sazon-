import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, ROJO, DORADO, TARJETA, BORDE } from './estilos';
import { NavegacionSuperior, BarraInferiorCliente, PantallaBienvenida, PantallaLogin, PantallaRegistro, PantallaRecuperar, SiluetaBlanca, LOGO, BANNER_COMIDA } from './pantallas';
import { VentanaAviso, mostrarAviso, pedirConfirmacion, reproducirTimbreAlerta } from './avisos';
import { VistaAdmin } from './admin';
import { VistaRider } from './rider';
import { iniciarOneSignalWeb, pedirPermisoPushWeb } from './push';
import {
  categorias, obtenerCatalogo, obtenerPromociones, obtenerRecompensas, obtenerConfigPagos,
  obtenerDatosCliente, obtenerPedidosAdmin, registrarUsuario, ingresarUsuario, actualizarFotoPerfilNube,
  crearNuevoPedido, actualizarEstadoPedidoAdmin, confirmarRecepcionYDarPuntos, cancelarPedidoYDescontar, canjearRecompensaCliente, subirImagenGaleria
} from './servicios';

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function seleccionarYComprimirAvatar() {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return resolve(null);
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target?.files?.item(0);
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 260;
          const scale = Math.min(max / img.width, max / img.height, 1);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(ev.target?.result || null);
        img.src = ev.target?.result;
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  });
}

function IconoRojo({ tipo }) {
  if (Platform.OS === 'web') {
    const paths = {
      menu: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
      promos: 'M12 2l2.39 1.65 2.89-.39.84 2.79 2.53 1.44-.88 2.78 1.24 2.63-2.29 1.81-.29 2.9-2.88.45-1.69 2.36-2.76-.94-2.76.94-1.69-2.36-2.88-.45-.29-2.9-2.29-1.81 1.24-2.63-.88-2.78 2.53-1.44.84-2.79 2.89.39L12 2zm-2.5 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm5 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm.3-5.8l-7.1 7.1 1.4 1.4 7.1-7.1-1.4-1.4z',
      ofertas: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
      novedades: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
      puntos: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
      canjes: 'M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z',
      carrito: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
      pedidos: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      cuenta: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      salir: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z'
    };
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill={ROJO}>
        <path d={paths[tipo] || paths.menu} />
      </svg>
    );
  }
  return <Text style={{ fontSize: 22, color: ROJO, fontWeight: '900' }}>★</Text>;
}
export default function App() {
  const [pantallaAuth, setPantallaAuth] = useState('bienvenida');
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [modoClienteRider, setModoClienteRider] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [catActiva, setCatActiva] = useState('Todas');
  const [catalogo, setCatalogo] = useState([]);
  const [promos, setPromos] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [promoDetalle, setPromoDetalle] = useState(null);
  const [verHistorialPts, setVerHistorialPts] = useState(false);
  const [cfgPagos, setCfgPagos] = useState({ qr_yape: '', qr_plin: '', titularLimpio: 'Club Sazón', local_lat: '-12.089700', local_lng: '-77.003100', tarifa_base: '4.00', tarifa_km: '1.50', local_cerrado: false });
  const [datosCli, setDatosCli] = useState({ puntos: 0, historial: [], pedidos: [], canjes: [] });
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [tipoEntrega, setTipoEntrega] = useState('DELIVERY');
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [gpsCliente, setGpsCliente] = useState(null);
  const [notas, setNotas] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [subiendoComp, setSubiendoComp] = useState(false);
  const [cargando, setCargando] = useState(false);
  const puertaAvisadaRef = useRef({});

  useEffect(() => {
    AsyncStorage.getItem('sesion_club_sazon').then(s => {
