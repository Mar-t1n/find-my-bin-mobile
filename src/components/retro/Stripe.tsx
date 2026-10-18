import { StyleProp, View, ViewStyle } from 'react-native';

import { stripe } from '@/theme/colors';

type StripeProps = {
  width?: number;
  band?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

// Three stacked bands (orange / mustard / avocado). A small accent, used sparingly.
export function Stripe({ width = 28, band = 3.5, gap = 2.5, style }: StripeProps) {
  return (
    <View style={[{ width, gap }, style]} accessible={false}>
      {stripe.map((color) => (
        <View key={color} style={{ height: band, borderRadius: band / 2, backgroundColor: color }} />
      ))}
    </View>
  );
}
