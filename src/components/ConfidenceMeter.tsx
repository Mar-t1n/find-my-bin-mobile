import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/theme/colors';

export const LOW_CONFIDENCE = 0.6;

export function ConfidenceMeter({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color = value >= LOW_CONFIDENCE ? colors.avocado : colors.mustard;
  return (
    <View style={styles.row} accessibilityLabel={`${percent} percent sure`}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text variant="caption" color={colors.inkSoft}>
        {percent}% sure
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
