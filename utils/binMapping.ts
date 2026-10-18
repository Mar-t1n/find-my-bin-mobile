// The model's output classes, in the exact order of the output tensor's indices.
// Index 0 -> 'cardboard', index 1 -> 'glass', etc. This order must match how
// the model was trained; changing it here does NOT change what the model
// outputs, it just changes how we (mis)label the result.
export const CLASS_NAMES = [
  'cardboard',
  'glass',
  'metal',
  'paper',
  'plastic',
  'trash',
] as const;

export type ClassName = (typeof CLASS_NAMES)[number];

export type BinCategory = 'recycling' | 'landfill';

// Local recycling rules. Edit this if your area handles materials differently
// (e.g. some municipalities don't accept glass curbside).
const CLASS_TO_BIN: Record<ClassName, BinCategory> = {
  cardboard: 'recycling',
  glass: 'recycling',
  metal: 'recycling',
  paper: 'recycling',
  plastic: 'recycling',
  trash: 'landfill',
};

export function getBinForClass(className: ClassName): BinCategory {
  return CLASS_TO_BIN[className];
}
