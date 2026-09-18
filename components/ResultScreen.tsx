import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ClassificationResult } from '../hooks/useTrashClassifier';

type ResultScreenProps = {
  photoUri: string;
  result: ClassificationResult;
  onScanAgain: () => void;
};

export function ResultScreen({ photoUri, result, onScanAgain }: ResultScreenProps) {
  const isRecycling = result.bin === 'recycling';
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />

      <View style={styles.content}>
        <Text style={styles.materialLabel}>{capitalize(result.className)}</Text>
        <Text style={styles.confidence}>{confidencePercent}% confidence</Text>

        <View style={[styles.binBadge, isRecycling ? styles.binBadgeRecycling : styles.binBadgeLandfill]}>
          <Text style={styles.binBadgeText}>{isRecycling ? '♻ Recycling' : '🗑 Landfill'}</Text>
        </View>

        <Pressable style={styles.button} onPress={onScanAgain}>
          <Text style={styles.buttonText}>Scan Again</Text>
        </Pressable>
      </View>
    </View>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  photo: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  materialLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  confidence: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  binBadge: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  binBadgeRecycling: {
    backgroundColor: '#2e7d32',
  },
  binBadgeLandfill: {
    backgroundColor: '#616161',
  },
  binBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#1e88e5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
