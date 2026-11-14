import { Alert, Platform } from 'react-native';

export function mostrarAviso(titulo, mensaje) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
  } else {
    Alert.alert(titulo, mensaje);
  }
}
