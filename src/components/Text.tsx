import { Text as RNText, StyleSheet, TextProps as RNTextProps } from 'react-native';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

export type TextVariant =
  'hero' | 'display' | 'title' | 'heading' | 'overline' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'hand';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: string;
};

export function Text({ variant = 'body', color = colors.ink, style, ...rest }: TextProps) {
  return <RNText maxFontSizeMultiplier={1.3} {...rest} style={[styles[variant], { color }, style]} />;
}

const styles = StyleSheet.create({
  hero: { fontFamily: fonts.display, fontSize: 56, lineHeight: 60, letterSpacing: -1 },
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 41, letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 23 },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 17 },
  // Caveat overhangs its box on the right, so pad it to avoid clipping.
  hand: { fontFamily: fonts.hand, fontSize: 21, lineHeight: 25, paddingRight: 4 },
});
