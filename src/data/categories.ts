import { colors } from '@/theme/colors';

export type BinId = 'recycling' | 'landfill';

export type Bin = {
  id: BinId;
  label: string;
  // Short word printed on the stamp that gets slapped onto each photo.
  stamp: string;
  color: string;
};

export const BINS: Record<BinId, Bin> = {
  recycling: { id: 'recycling', label: 'Recycling', stamp: 'RECYCLE', color: colors.avocado },
  landfill: { id: 'landfill', label: 'Landfill', stamp: 'LANDFILL', color: colors.rust },
};

// Same order as the model's output tensor in find-my-bin-V2
// (utils/binMapping.ts), so wiring the real classifier in is index -> id.
export const CATEGORY_IDS = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  label: string;
  bin: BinId;
  color: string;
  // One-liner shown right after a scan.
  quickTip: string;
  tips: string[];
};

export const CATEGORIES: Record<CategoryId, Category> = {
  cardboard: {
    id: 'cardboard',
    label: 'Cardboard',
    bin: 'recycling',
    color: colors.kraft,
    quickTip: 'Flatten it first so it takes up less room.',
    tips: [
      'Flatten boxes and remove any packing foam.',
      'Tape and shipping labels can stay on.',
      'Greasy pizza boxes go in the trash.',
    ],
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    bin: 'recycling',
    color: colors.teal,
    quickTip: 'Give it a quick rinse. Lids come off.',
    tips: [
      'Bottles and jars only. Rinse them out.',
      'Take metal lids off and recycle them separately.',
      'No mirrors, window glass or drinking glasses.',
    ],
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    bin: 'recycling',
    color: colors.slate,
    quickTip: 'Rinse the can. Labels can stay on.',
    tips: [
      'Food and drink cans: empty and rinsed.',
      'Clean foil can go in, balled up to fist size.',
      'Aerosol cans only when completely empty.',
    ],
  },
  paper: {
    id: 'paper',
    label: 'Paper',
    bin: 'recycling',
    color: colors.mustard,
    quickTip: 'Keep it clean and dry.',
    tips: [
      'Mail, newspaper, office paper and cartons.',
      'Keep it dry. Wet paper can’t be recycled.',
      'Used tissues and napkins go in the trash.',
    ],
  },
  plastic: {
    id: 'plastic',
    label: 'Plastic',
    bin: 'recycling',
    color: colors.orange,
    quickTip: 'Empty it out and give it a rinse.',
    tips: [
      'Bottles, jugs and tubs. Empty and rinsed.',
      'Put caps back on bottles.',
      'No plastic bags or film. Return those to the store.',
    ],
  },
  trash: {
    id: 'trash',
    label: 'Trash',
    bin: 'landfill',
    color: colors.espressoRaised,
    quickTip: 'This one can’t be recycled. Bag it and bin it.',
    tips: [
      'Chip bags, candy wrappers and styrofoam.',
      'Food-soiled paper and napkins.',
      'When in doubt, check your city’s rules.',
    ],
  },
};

export const CATEGORY_LIST = CATEGORY_IDS.map((id) => CATEGORIES[id]);

export function binFor(category: CategoryId): Bin {
  return BINS[CATEGORIES[category].bin];
}
