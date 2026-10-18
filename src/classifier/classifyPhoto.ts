import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import * as jpeg from 'jpeg-js';

import { type CategoryId } from '@/data/categories';
import modelAsset from '../../assets/mira_exp011_int8.tflite';

export type Prediction = {
  category: CategoryId;
  confidence: number;
};

export const IS_DEMO_CLASSIFIER = false;

const INPUT_SIZE = 320;
const DETECTION_COUNT = 2100;
const CLASS_COUNT = 5;

// The supplied model does not contain label metadata. Keep this order aligned
// with the training configuration used to produce the model.
const MODEL_CATEGORY_IDS: readonly CategoryId[] = ['cardboard', 'glass', 'metal', 'plastic', 'trash'];

let modelPromise: Promise<TfliteModel> | undefined;

function loadModel() {
  modelPromise ??= loadTensorflowModel(modelAsset, []);
  return modelPromise;
}

async function photoToInput(photoUri: string): Promise<{ input: ArrayBuffer; temporaryFile: File }> {
  const context = ImageManipulator.manipulate(photoUri);
  context.resize({ width: INPUT_SIZE, height: INPUT_SIZE });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 1, format: SaveFormat.JPEG });
  const temporaryFile = new File(saved.uri);
  const decoded = jpeg.decode(await temporaryFile.bytes(), { useTArray: true, formatAsRGBA: true });
  const channelSize = INPUT_SIZE * INPUT_SIZE;
  const input = new Float32Array(channelSize * 3);

  for (let pixel = 0; pixel < channelSize; pixel += 1) {
    const source = pixel * 4;
    input[pixel] = decoded.data[source] / 255;
    input[channelSize + pixel] = decoded.data[source + 1] / 255;
    input[channelSize * 2 + pixel] = decoded.data[source + 2] / 255;
  }

  return { input: input.buffer, temporaryFile };
}

function bestDetection(output: ArrayBuffer): Prediction {
  const values = new Float32Array(output);
  let bestClass = 0;
  let bestConfidence = Number.NEGATIVE_INFINITY;

  for (let classIndex = 0; classIndex < CLASS_COUNT; classIndex += 1) {
    for (let detection = 0; detection < DETECTION_COUNT; detection += 1) {
      const confidence = values[(classIndex + 4) * DETECTION_COUNT + detection];
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestClass = classIndex;
      }
    }
  }

  return {
    category: MODEL_CATEGORY_IDS[bestClass] ?? MODEL_CATEGORY_IDS[MODEL_CATEGORY_IDS.length - 1],
    confidence: Math.max(0, Math.min(1, bestConfidence)),
  };
}

export async function classifyPhoto(photoUri: string): Promise<Prediction> {
  const model = await loadModel();
  const { input, temporaryFile } = await photoToInput(photoUri);

  try {
    const [output] = await model.run([input]);
    if (!output) throw new Error('The garbage model returned no output tensor.');
    return bestDetection(output);
  } finally {
    if (temporaryFile.exists) temporaryFile.delete();
  }
}
