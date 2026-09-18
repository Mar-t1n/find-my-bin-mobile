import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { CameraScreen } from './components/CameraScreen';
import { ResultScreen } from './components/ResultScreen';
import { ClassificationResult, useTrashClassifier } from './hooks/useTrashClassifier';

type AppState =
  | { screen: 'camera' }
  | { screen: 'processing'; photoUri: string }
  | { screen: 'result'; photoUri: string; result: ClassificationResult }
  | { screen: 'inferenceError'; photoUri: string; message: string };

export default function App() {
  const { modelState, classify } = useTrashClassifier();
  const [state, setState] = useState<AppState>({ screen: 'camera' });

  const runClassification = useCallback(
    async (photoUri: string) => {
      setState({ screen: 'processing', photoUri });
      try {
        const result = await classify(photoUri);
        setState({ screen: 'result', photoUri, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState({ screen: 'inferenceError', photoUri, message });
      }
    },
    [classify]
  );

  const handleScanAgain = useCallback(() => {
    setState({ screen: 'camera' });
  }, []);

  if (modelState.status === 'error') {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorTitle}>Couldn't load the model</Text>
        <Text style={styles.errorMessage}>{modelState.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {state.screen === 'camera' && (
        <CameraScreen onCapture={runClassification} captureDisabled={modelState.status !== 'ready'} />
      )}

      {state.screen === 'processing' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.message}>Analyzing…</Text>
        </View>
      )}

      {state.screen === 'result' && (
        <ResultScreen photoUri={state.photoUri} result={state.result} onScanAgain={handleScanAgain} />
      )}

      {state.screen === 'inferenceError' && (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn't classify that photo</Text>
          <Text style={styles.errorMessage}>{state.message}</Text>
          <Pressable style={styles.button} onPress={() => runClassification(state.photoUri)}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={handleScanAgain}>
            <Text style={styles.buttonText}>Scan Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#1e88e5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#424242',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
