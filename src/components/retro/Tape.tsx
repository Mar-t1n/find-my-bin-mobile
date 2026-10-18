import Svg, { Line, Polygon } from 'react-native-svg';

import { colors } from '@/theme/colors';

// A strip of masking tape with torn, zig-zag ends.
export function Tape({
  width = 64,
  height = 20,
  color = colors.tape,
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  const teeth = 5;
  const tooth = height / teeth;
  const depth = Math.max(1.5, height * 0.1);

  const right: string[] = [];
  const left: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const inset = i % 2 === 0 ? 0 : depth;
    right.push(`${width - inset},${i * tooth}`);
    left.unshift(`${inset},${i * tooth}`);
  }

  return (
    <Svg width={width} height={height}>
      <Polygon points={[...right, ...left].join(' ')} fill={color} />
      <Line
        x1={depth}
        y1={height * 0.28}
        x2={width - depth}
        y2={height * 0.3}
        stroke="#FFFFFF"
        strokeOpacity={0.25}
        strokeWidth={1}
      />
    </Svg>
  );
}
