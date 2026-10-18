import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'board'
  | 'camera'
  | 'chart'
  | 'image'
  | 'flash'
  | 'flashOff'
  | 'close'
  | 'check'
  | 'trash'
  | 'undo'
  | 'chevronDown'
  | 'arrowRight'
  | 'recycle'
  | 'flame'
  | 'sparkle'
  | 'layers'
  | 'settings'
  | 'info';

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

// Hand-drawn 24px line icons with round caps, to match the soft type.
export function Icon({ name, size = 22, color, strokeWidth = 2 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderGlyph(name, stroke, color)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
};

function renderGlyph(name: IconName, s: StrokeProps, color: string) {
  switch (name) {
    case 'board':
      return (
        <>
          <Rect x={3.5} y={4} width={7.5} height={8.5} rx={1.5} {...s} />
          <Rect x={13} y={3} width={7.5} height={8.5} rx={1.5} {...s} />
          <Rect x={3.5} y={14.5} width={7.5} height={6} rx={1.5} {...s} />
          <Rect x={13} y={13.5} width={7.5} height={7} rx={1.5} {...s} />
        </>
      );
    case 'camera':
      return (
        <>
          <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" {...s} />
          <Circle cx={12} cy={13} r={3.5} {...s} />
        </>
      );
    case 'chart':
      return (
        <>
          <Path d="M5 20V13" {...s} />
          <Path d="M10 20V8" {...s} />
          <Path d="M15 20v-5" {...s} />
          <Path d="M20 20V4" {...s} />
        </>
      );
    case 'image':
      return (
        <>
          <Rect x={3} y={3} width={18} height={18} rx={3} {...s} />
          <Circle cx={9} cy={9} r={2} {...s} />
          <Path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" {...s} />
        </>
      );
    case 'flash':
      return <Path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12L13 2z" {...s} />;
    case 'flashOff':
      return (
        <>
          <Path d="M13 2 10.6 5.3M8.2 8.6 4.5 13.5H12L11 22l4.3-5.8M17.2 13.6l2.3-3.1H12L13 2" {...s} />
          <Path d="m3 3 18 18" {...s} />
        </>
      );
    case 'close':
      return (
        <>
          <Path d="M18 6 6 18" {...s} />
          <Path d="m6 6 12 12" {...s} />
        </>
      );
    case 'check':
      return <Path d="M20 6 9 17l-5-5" {...s} />;
    case 'trash':
      return (
        <>
          <Path d="M3 6h18" {...s} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" {...s} />
          <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...s} />
          <Path d="M10 11v6M14 11v6" {...s} />
        </>
      );
    case 'undo':
      return (
        <>
          <Path d="M3 7v6h6" {...s} />
          <Path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" {...s} />
        </>
      );
    case 'chevronDown':
      return <Path d="m6 9 6 6 6-6" {...s} />;
    case 'arrowRight':
      return (
        <>
          <Path d="M5 12h14" {...s} />
          <Path d="m12 5 7 7-7 7" {...s} />
        </>
      );
    case 'recycle':
      return (
        <>
          <Path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-.9 1.8 1.8 0 0 1 0-1.8L7.2 9.5" {...s} />
          <Path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-.9 1.8 1.8 0 0 0 0-1.8l-1.2-2.1" {...s} />
          <Path d="m14 16-3 3 3 3" {...s} />
          <Path d="M8.3 13.6 7.2 9.5l-4.1 1.1" {...s} />
          <Path d="m9.3 5.8 1.1-1.9A1.8 1.8 0 0 1 12 3a1.8 1.8 0 0 1 1.5.9l4 6.8" {...s} />
          <Path d="m13.4 9.6 4.1 1.1 1.1-4.1" {...s} />
        </>
      );
    case 'flame':
      return (
        <Path
          d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"
          {...s}
        />
      );
    case 'sparkle':
      return (
        <>
          <Path d="M12 3.5 13.9 9l5.6 2-5.6 2L12 18.5 10.1 13l-5.6-2 5.6-2L12 3.5z" {...s} />
          <Path d="M19 3v3M17.5 4.5h3" {...s} />
        </>
      );
    case 'layers':
      return (
        <>
          <Path d="m12 2.5 9 4.5-9 4.5L3 7l9-4.5z" {...s} />
          <Path d="m3 12 9 4.5 9-4.5" {...s} />
          <Path d="m3 17 9 4.5 9-4.5" {...s} />
        </>
      );
    case 'settings':
      return (
        <>
          <Path d="M4 7h10M18 7h2M4 17h2M10 17h10" {...s} />
          <Circle cx={16} cy={7} r={2} {...s} />
          <Circle cx={8} cy={17} r={2} {...s} />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...s} />
          <Path d="M12 16v-4.5" {...s} />
          <Circle cx={12} cy={8} r={0.6} fill={color} stroke={color} strokeWidth={1.2} />
        </>
      );
  }
}
