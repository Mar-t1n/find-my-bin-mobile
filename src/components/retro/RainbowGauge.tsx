import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { stripe } from '@/theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type RainbowGaugeProps = {
  // 0-1
  value: number;
  size?: number;
  // Band width as a fraction of `size`.
  thickness?: number;
  trackColor?: string;
};

// A 70s rainbow that fills from left to right, one band after another.
export function RainbowGauge({
  value,
  size = 220,
  thickness = 0.062,
  trackColor = 'rgba(244, 235, 221, 0.12)',
}: RainbowGaugeProps) {
  const strokeWidth = size * thickness;
  const gap = size * thickness * 0.38;
  const center = size / 2;
  const outer = center - strokeWidth / 2;
  const height = center + strokeWidth / 2;

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {stripe.map((color, index) => (
        <Band
          key={color}
          center={center}
          radius={outer - index * (strokeWidth + gap)}
          strokeWidth={strokeWidth}
          color={color}
          trackColor={trackColor}
          value={value}
          delay={index * 140}
        />
      ))}
    </Svg>
  );
}

type BandProps = {
  center: number;
  radius: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
  value: number;
  delay: number;
};

function Band({ center, radius, strokeWidth, color, trackColor, value, delay }: BandProps) {
  const reduceMotion = useReducedMotion();
  const length = Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, value));
    progress.set(
      reduceMotion
        ? target
        : withDelay(delay, withTiming(target, { duration: 1100, easing: Easing.out(Easing.cubic) })),
    );
  }, [value, delay, reduceMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
    // Round caps would still draw a dot at 0%.
    strokeOpacity: progress.value > 0.002 ? 1 : 0,
  }));

  const d = `M${center - radius} ${center}A${radius} ${radius} 0 0 1 ${center + radius} ${center}`;
  return (
    <>
      <Path d={d} stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={[length, length]}
        animatedProps={animatedProps}
      />
    </>
  );
}
