import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { createRandom } from '@/lib/random';

const TILE = 160;
const BASE = '#C9A273';
const SPECKLE_COLORS = ['#A87B49', '#98683A', '#B98C58', '#DDBE91', '#E7CFA6', '#8C5F33'];

type Speckle = { x: number; y: number; rx: number; ry: number; angle: number; color: string; opacity: number };

// Generated once with a fixed seed so the board looks identical every launch.
const { blotches, speckles } = (() => {
  const random = createRandom(1979);
  const make = (count: number, minR: number, maxR: number, minOpacity: number, maxOpacity: number) => {
    const result: Speckle[] = [];
    for (let i = 0; i < count; i++) {
      const rx = minR + random() * (maxR - minR);
      const base: Speckle = {
        x: random() * TILE,
        y: random() * TILE,
        rx,
        ry: rx * (0.45 + random() * 0.5),
        angle: random() * 180,
        color: SPECKLE_COLORS[Math.floor(random() * SPECKLE_COLORS.length)],
        opacity: minOpacity + random() * (maxOpacity - minOpacity),
      };
      result.push(base);
      // Repeat speckles that cross a tile edge on the opposite side so the
      // pattern tiles without visible seams.
      const pad = rx + 1;
      const wrapX = base.x < pad ? TILE : base.x > TILE - pad ? -TILE : 0;
      const wrapY = base.y < pad ? TILE : base.y > TILE - pad ? -TILE : 0;
      if (wrapX) result.push({ ...base, x: base.x + wrapX });
      if (wrapY) result.push({ ...base, y: base.y + wrapY });
      if (wrapX && wrapY) result.push({ ...base, x: base.x + wrapX, y: base.y + wrapY });
    }
    return result;
  };
  return {
    blotches: make(26, 6, 18, 0.05, 0.12),
    speckles: make(520, 0.5, 2.3, 0.45, 0.95),
  };
})();

function renderSpeckle(speckle: Speckle, index: number) {
  return (
    <Ellipse
      key={index}
      cx={speckle.x}
      cy={speckle.y}
      rx={speckle.rx}
      ry={speckle.ry}
      fill={speckle.color}
      opacity={speckle.opacity}
      transform={`rotate(${speckle.angle} ${speckle.x} ${speckle.y})`}
    />
  );
}

export const CorkTexture = memo(function CorkTexture() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id="cork" patternUnits="userSpaceOnUse" x={0} y={0} width={TILE} height={TILE}>
          <Rect width={TILE} height={TILE} fill={BASE} />
          {blotches.map(renderSpeckle)}
          {speckles.map(renderSpeckle)}
        </Pattern>
        <RadialGradient id="cork-vignette" cx="50%" cy="40%" r="80%">
          <Stop offset="0.5" stopColor="#3B230F" stopOpacity={0} />
          <Stop offset="1" stopColor="#3B230F" stopOpacity={0.32} />
        </RadialGradient>
        <LinearGradient id="cork-top-shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2B1D14" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#2B1D14" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#cork)" />
      <Rect width="100%" height="100%" fill="url(#cork-vignette)" />
      <Rect width="100%" height={22} fill="url(#cork-top-shade)" />
    </Svg>
  );
});
