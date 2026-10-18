import { memo } from 'react';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

type SunburstProps = {
  size: number;
  color: string;
  rays?: number;
  // Opacity of the rays at the center; they fade out toward the edge.
  intensity?: number;
};

export const Sunburst = memo(function Sunburst({ size, color, rays = 24, intensity = 0.5 }: SunburstProps) {
  const radius = size / 2;
  const step = (Math.PI * 2) / rays;
  let d = '';
  for (let i = 0; i < rays; i += 2) {
    const start = i * step - Math.PI / 2;
    const end = start + step;
    const x0 = radius + radius * Math.cos(start);
    const y0 = radius + radius * Math.sin(start);
    const x1 = radius + radius * Math.cos(end);
    const y1 = radius + radius * Math.sin(end);
    d += `M${radius} ${radius}L${x0} ${y0}A${radius} ${radius} 0 0 1 ${x1} ${y1}Z`;
  }

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="sunburst-fade" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={intensity} />
          <Stop offset="0.7" stopColor={color} stopOpacity={intensity * 0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d={d} fill="url(#sunburst-fade)" />
    </Svg>
  );
});
