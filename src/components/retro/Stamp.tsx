import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { Bin } from '@/data/categories';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

// The bin "stamp" slapped onto a photo once it's sorted. `scale` 1 is the big
// version from the scan result; the board uses ~0.5.
export function Stamp({ bin, scale = 1 }: { bin: Bin; scale?: number }) {
  const fontSize = 22 * scale;
  const inset = 3 * scale;
  const radius = 9 * scale;

  return (
    <View
      style={[styles.outer, { backgroundColor: bin.color, borderRadius: radius, padding: inset }]}
      accessibilityLabel={`${bin.label} bin`}
    >
      <View
        style={{
          borderRadius: radius - inset / 2,
          borderWidth: Math.max(1, 1.5 * scale),
          borderColor: 'rgba(255, 248, 236, 0.7)',
          borderStyle: 'dashed',
          paddingHorizontal: 10 * scale,
          paddingVertical: 3 * scale,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ fontFamily: fonts.display, fontSize, lineHeight: fontSize * 1.15, letterSpacing: 1.4 * scale }}
          color={colors.paper}
        >
          {bin.stamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    opacity: 0.95,
    shadowColor: '#1A0F08',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
});
