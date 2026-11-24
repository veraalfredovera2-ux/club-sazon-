import React from 'react';
import { Text, ScrollView } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: String(error?.stack || error?.message || error) };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#111', padding: 20 }}>
          <Text style={{ color: '#E50914', fontSize: 18, fontWeight: '900', marginBottom: 10 }}>
            ERROR DETECTADO:
          </Text>
          <Text style={{ color: '#FFF', fontSize: 13 }}>{this.state.error}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

registerRootComponent(Root);
