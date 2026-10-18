import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { colors } from '@/theme/colors';

const PETALS = [0, 60, 120, 180, 240, 300];

export function Daisy({
  size = 20,
  petal = colors.paper,
  center = colors.mustard,
}: {
  size?: number;
  petal?: string;
  center?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="-12 -12 24 24">
      <G>
        {PETALS.map((angle) => (
          <Ellipse key={angle} cx={0} cy={-6.2} rx={3.4} ry={5.6} fill={petal} transform={`rotate(${angle})`} />
        ))}
      </G>
      <Circle r={3.6} fill={center} />
    </Svg>
  );
}
