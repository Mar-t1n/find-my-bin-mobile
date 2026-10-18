// Warm, slightly faded 70s palette. Keep new colors in here so the whole app
// stays in the same family.
export const colors = {
  cream: '#F4EBDD',
  creamLight: '#FBF6EC',
  creamDeep: '#EADCC6',
  paper: '#FFFCF6',
  line: '#E2D4BE',

  ink: '#2B1D14',
  inkSoft: '#6B5646',
  inkFaint: '#9C8775',

  espresso: '#2B1D14',
  espressoRaised: '#3A2A1F',
  onDark: '#F4EBDD',
  onDarkSoft: 'rgba(244, 235, 221, 0.66)',
  onDarkFaint: 'rgba(244, 235, 221, 0.14)',

  orange: '#D2622A',
  mustard: '#E0A526',
  avocado: '#6F7F3A',
  rust: '#A8432A',
  teal: '#2F7470',
  kraft: '#B07A45',
  slate: '#5F6B72',

  tape: 'rgba(243, 228, 186, 0.9)',
} as const;

// The three-band stripe that shows up in small doses around the app.
export const stripe = [colors.orange, colors.mustard, colors.avocado] as const;

export const pinColors = [colors.orange, colors.mustard, colors.avocado, colors.teal, colors.rust] as const;

// Mixes two #RRGGBB colors. t = 0 returns `from`, t = 1 returns `to`.
export function mix(from: string, to: string, t: number): string {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const channel = (shift: number) => {
    const start = (a >> shift) & 0xff;
    const end = (b >> shift) & 0xff;
    return Math.round(start + (end - start) * t);
  };
  const value = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${value.toString(16).padStart(6, '0')}`;
}
