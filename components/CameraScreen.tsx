import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, CameraRef, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';

type CameraScreenProps = {
  onCapture: (photoUri: string) => void;
  // Disables the shutter button while the model is still loading.
  captureDisabled?: boolean;
};

export function CameraScreen({ onCapture, captureDisabled }: CameraScreenProps) {
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({ containerFormat: 'jpeg' });
  const camera = useRef<CameraRef>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access is needed to scan items.</Text>
        {canRequestPermission ? (
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.subMessage}>
              Camera permission was denied. Enable it in Settings to continue.
            </Text>
            <Pressable style={styles.button} onPress={() => Linking.openSettings()}>
              <Text style={styles.buttonText}>Open Settings</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Looking for a camera…</Text>
      </View>
    );
  }

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const file = await photoOutput.capturePhotoToFile({}, {});
      onCapture(`file://${file.filePath}`);
    } catch (error) {
      console.error('Failed to capture photo', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[photoOutput]}
        isActive={true}
      />
      <View style={styles.controls}>
        <Pressable
          style={[styles.shutterButton, (isCapturing || captureDisabled) && styles.shutterButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing || captureDisabled}
        >
          {isCapturing ? <ActivityIndicator color="#fff" /> : <View style={styles.shutterInner} />}
        </Pressable>
        {captureDisabled && !isCapturing ? (
          <Text style={styles.loadingModelText}>Loading model…</Text>
        ) : null}
      </View>
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
    textAlign: 'center',
    marginTop: 12,
  },
  subMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  loadingModelText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 13,
  },
});
