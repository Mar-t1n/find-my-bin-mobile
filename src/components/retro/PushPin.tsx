import Svg, { Circle, Ellipse } from 'react-native-svg';

import { mix } from '@/theme/colors';

// A round push pin seen from above, lit from the top-left.
export function PushPin({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 24 26.4">
      <Ellipse cx={15} cy={17.5} rx={8} ry={5.5} fill="#28160A" opacity={0.3} />
      <Circle cx={12} cy={12} r={9} fill={mix(color, '#000000', 0.28)} />
      <Circle cx={11.3} cy={11.2} r={8} fill={color} />
      <Circle cx={10.4} cy={10.2} r={4.6} fill={mix(color, '#FFFFFF', 0.4)} opacity={0.6} />
      <Circle cx={9} cy={8.6} r={1.6} fill="#FFFFFF" opacity={0.8} />
    </Svg>
  );
}
