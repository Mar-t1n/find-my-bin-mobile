import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

// Pressable that squishes a little on touch. Don't pass a `transform` in
// `style`: wrap it in a View instead, or the press scale will replace it.
export function PressableScale({ scaleTo = 0.96, style, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const pressed = useSharedValue(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? scaleTo : 1, { damping: 16, stiffness: 380, mass: 0.6 }) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        pressed.set(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.set(false);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
