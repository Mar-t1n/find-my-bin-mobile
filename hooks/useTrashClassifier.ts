import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeJpeg } from 'jpeg-js';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { CLASS_NAMES, ClassName, getBinForClass, BinCategory } from '../utils/binMapping';

// The model was trained on 128x128 RGB input.
const MODEL_INPUT_SIZE = 128;

export type ClassificationResult = {
  className: ClassName;
  confidence: number;
  bin: BinCategory;
};

export type ModelState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

export function useTrashClassifier() {
  const [modelState, setModelState] = useState<ModelState>({ status: 'loading' });
  const modelRef = useRef<TensorflowModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadTensorflowModel(require('../assets/trash_classifier.tflite'), [])
      .then((loadedModel) => {
        if (cancelled) return;
        modelRef.current = loadedModel;
        setModelState({ status: 'ready' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setModelState({ status: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const classify = useCallback(async (photoUri: string): Promise<ClassificationResult> => {
    const model = modelRef.current;
    if (!model) {
      throw new Error('Model is not loaded yet.');
    }

    // 1. Resize the captured photo down to the model's expected 128x128 input
    // using native image manipulation, and re-encode it as JPEG so we get a
    // base64 string back we can decode to raw pixels in step 2.
    const resized = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!resized.base64) {
      throw new Error('Failed to encode the resized photo.');
    }

    // 2. Decode the resized JPEG into raw RGBA pixel bytes. jpeg-js is a pure
    // JS decoder, so this works with no extra native modules.
    const jpegBytes = base64ToUint8Array(resized.base64);
    const decoded = decodeJpeg(jpegBytes, { useTArray: true });

    // 3. Build the float32 input tensor: shape [1, 128, 128, 3]. Pixel values
    // are normalized with MobileNetV2's preprocessing formula, which maps the
    // 0-255 range to -1..1 (the range the model was trained on):
    //   normalized = (pixelValue / 127.5) - 1.0
    // decoded.data is RGBA (4 bytes/pixel); the model only takes RGB, so we
    // skip every 4th (alpha) byte.
    const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    const input = new Float32Array(pixelCount * 3);
    for (let i = 0; i < pixelCount; i++) {
      const r = decoded.data[i * 4];
      const g = decoded.data[i * 4 + 1];
      const b = decoded.data[i * 4 + 2];
      input[i * 3] = r / 127.5 - 1.0;
      input[i * 3 + 1] = g / 127.5 - 1.0;
      input[i * 3 + 2] = b / 127.5 - 1.0;
    }

    // 4. Run inference. fast-tflite takes/returns ArrayBuffers matching the
    // model's declared tensor shapes; output is [1, 6] float32 scores.
    const outputs = await model.run([input.buffer]);
    const scores = new Float32Array(outputs[0]);

    let bestIndex = 0;
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[bestIndex]) {
        bestIndex = i;
      }
    }

    const className = CLASS_NAMES[bestIndex];
    return {
      className,
      confidence: scores[bestIndex],
      bin: getBinForClass(className),
    };
  }, []);

  return { modelState, classify };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = globalThis.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
