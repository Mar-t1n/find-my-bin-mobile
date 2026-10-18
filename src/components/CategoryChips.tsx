import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { CATEGORY_LIST, CategoryId } from '@/data/categories';
import { colors } from '@/theme/colors';

type CategoryChipsProps = {
  selected: CategoryId;
  onSelect: (category: CategoryId) => void;
};

// Grid of material choices, used to correct a wrong guess.
export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {CATEGORY_LIST.map((category) => {
        const isSelected = category.id === selected;
        return (
          <PressableScale
            key={category.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(category.id)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <Text variant="label" color={isSelected ? colors.cream : colors.ink} style={styles.label}>
              {category.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.creamLight,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSelected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { fontSize: 13.5 },
});
