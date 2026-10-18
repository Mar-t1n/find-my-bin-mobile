import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { PageIndex, tabBarFrame } from '@/theme/layout';

const TABS: { label: string; icon: IconName }[] = [
  { label: 'Board', icon: 'board' },
  { label: 'Scan', icon: 'camera' },
  { label: 'Impact', icon: 'chart' },
];

const INNER_PADDING = 5;

type TabBarProps = {
  scrollX: SharedValue<number>;
  pageWidth: number;
  page: PageIndex;
  onSelect: (page: PageIndex) => void;
  // Bumped each time a new scan lands on the board.
  boardPulse: number;
};

export function TabBar({ scrollX, pageWidth, page, onSelect, boardPulse }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const frame = tabBarFrame(pageWidth, insets.bottom);
  const segment = (frame.width - INNER_PADDING * 2) / TABS.length;

  // The highlight follows the pager scroll 1:1, so it tracks the finger mid-swipe.
  const highlightStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(scrollX.value, [0, pageWidth * 2], [0, segment * 2], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { left: frame.left, bottom: frame.bottom, width: frame.width, height: frame.height }]}
    >
      <Animated.View
        style={[styles.highlight, { width: segment, height: frame.height - INNER_PADDING * 2 }, highlightStyle]}
      />
      {TABS.map((tab, index) => (
        <TabButton
          key={tab.label}
          index={index as PageIndex}
          label={tab.label}
          icon={tab.icon}
          width={segment}
          scrollX={scrollX}
          pageWidth={pageWidth}
          selected={page === index}
          pulse={index === 0 ? boardPulse : 0}
          onPress={() => {
            if (page !== index) haptics.select();
            onSelect(index as PageIndex);
          }}
        />
      ))}
    </View>
  );
}

type TabButtonProps = {
  index: PageIndex;
  label: string;
  icon: IconName;
  width: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  selected: boolean;
  pulse: number;
  onPress: () => void;
};

function TabButton({ index, label, icon, width, scrollX, pageWidth, selected, pulse, onPress }: TabButtonProps) {
  const bump = useSharedValue(1);
  const plusOne = useSharedValue(0);

  useEffect(() => {
    if (!pulse) return;
    // Quick pop up, then a short springy settle.
    bump.set(
      withSequence(
        withTiming(1.2, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 11, stiffness: 320 }),
      ),
    );
    plusOne.set(0);
    plusOne.set(withSequence(withTiming(1, { duration: 900 }), withDelay(100, withTiming(0, { duration: 0 }))));
  }, [pulse, bump, plusOne]);

  // 1 when this tab's page is fully on screen, 0 when a page or more away.
  const activeStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / pageWidth - index);
    return { opacity: interpolate(distance, [0, 0.6], [1, 0], Extrapolation.CLAMP) };
  });
  const inactiveStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / pageWidth - index);
    return { opacity: interpolate(distance, [0, 0.6], [0, 0.72], Extrapolation.CLAMP) };
  });
  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const plusOneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(plusOne.value, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
    transform: [{ translateY: interpolate(plusOne.value, [0, 1], [0, -26]) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, { width }]}
      hitSlop={{ top: 8, bottom: 8 }}
    >
      <Animated.View style={bumpStyle}>
        <TabContent label={label} icon={icon} color={colors.cream} style={inactiveStyle} />
        <TabContent label={label} icon={icon} color={colors.espresso} style={[StyleSheet.absoluteFill, activeStyle]} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.plusOne, plusOneStyle]}>
        <Text style={styles.plusOneText} color={colors.mustard}>
          +1
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function TabContent({ label, icon, color, style }: { label: string; icon: IconName; color: string; style: object }) {
  return (
    <Animated.View style={[styles.tabContent, style]}>
      <Icon name={icon} size={19} color={color} strokeWidth={2.1} />
      <Text variant="label" color={color} style={styles.label}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    padding: INNER_PADDING,
    borderRadius: 999,
    backgroundColor: colors.espressoRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244, 235, 221, 0.12)',
    shadowColor: '#1A0F08',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  highlight: {
    position: 'absolute',
    left: INNER_PADDING,
    top: INNER_PADDING,
    borderRadius: 999,
    backgroundColor: colors.cream,
  },
  tab: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { fontSize: 13.5 },
  plusOne: {
    position: 'absolute',
    top: -6,
    right: 14,
  },
  plusOneText: { fontFamily: fonts.hand, fontSize: 22, lineHeight: 24, paddingRight: 4 },
});
