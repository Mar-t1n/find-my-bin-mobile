import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Bin } from '@/data/categories';
import { colors } from '@/theme/colors';

export function BinPill({ bin, size = 'md' }: { bin: Bin; size?: 'sm' | 'md' }) {
  const small = size === 'sm';
  return (
    <View style={[styles.pill, { backgroundColor: bin.color }, small && styles.small]}>
      <Icon
        name={bin.id === 'recycling' ? 'recycle' : 'trash'}
        size={small ? 12 : 14}
        color={colors.paper}
        strokeWidth={2.4}
      />
      <Text variant="label" color={colors.paper} style={small ? styles.smallLabel : styles.label}>
        {bin.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  small: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  label: { fontSize: 13 },
  smallLabel: { fontSize: 11.5, lineHeight: 15 },
});
