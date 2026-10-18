import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/colors';

type Variant = 'primary' | 'accent' | 'cream' | 'outline' | 'outlineLight' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  // Overrides the label/icon color, e.g. for destructive ghost buttons.
  tint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const VARIANTS: Record<Variant, { background: string; foreground: string; border?: string }> = {
  primary: { background: colors.espresso, foreground: colors.cream },
  accent: { background: colors.orange, foreground: colors.paper },
  cream: { background: colors.cream, foreground: colors.espresso },
  outline: { background: 'transparent', foreground: colors.espresso, border: colors.espresso },
  outlineLight: { background: 'transparent', foreground: colors.cream, border: 'rgba(244, 235, 221, 0.45)' },
  ghost: { background: 'transparent', foreground: colors.espresso },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  tint,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const foreground = tint ?? palette.foreground;
  const iconNode = icon ? <Icon name={icon} size={18} color={foreground} strokeWidth={2.2} /> : null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        styles.base,
        size === 'lg' ? styles.large : styles.medium,
        variant === 'ghost' && styles.ghost,
        {
          backgroundColor: palette.background,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1.5 : 0,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {iconPosition === 'left' && iconNode}
        <Text variant="label" color={foreground} style={size === 'lg' && styles.largeLabel} numberOfLines={1}>
          {label}
        </Text>
        {iconPosition === 'right' && iconNode}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  medium: { height: 48 },
  large: { height: 56, paddingHorizontal: 26 },
  ghost: { paddingHorizontal: 12 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  largeLabel: { fontSize: 16 },
});
