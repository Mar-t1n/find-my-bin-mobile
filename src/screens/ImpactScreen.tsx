import Constants from 'expo-constants';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IS_DEMO_CLASSIFIER } from '@/classifier/classifyPhoto';
import { BinPill } from '@/components/BinPill';
import { Icon, IconName } from '@/components/Icon';
import { RainbowGauge } from '@/components/retro/RainbowGauge';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { Stripe } from '@/components/retro/Stripe';
import { Text } from '@/components/Text';
import { binFor, Category, CATEGORY_LIST } from '@/data/categories';
import { currentStreak, DayCount, formatDate, lastSevenDays, longestStreak } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { effectiveCategory, useScans } from '@/store/scans';
import { useSettings } from '@/store/settings';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { tabBarClearance } from '@/theme/layout';

export function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scans, clearAll } = useScans();
  const { settings, updateSettings } = useSettings();

  const stats = useMemo(() => {
    const timestamps = scans.map((scan) => scan.createdAt);
    const byCategory = CATEGORY_LIST.map((category) => ({
      category,
      count: scans.filter((scan) => effectiveCategory(scan) === category.id).length,
    }));
    const recycled = scans.filter((scan) => binFor(effectiveCategory(scan)).id === 'recycling').length;
    const week = lastSevenDays(timestamps);
    return {
      total: scans.length,
      recycled,
      rate: scans.length ? recycled / scans.length : 0,
      byCategory,
      week,
      weekTotal: week.reduce((sum, day) => sum + day.count, 0),
      streak: currentStreak(timestamps),
      bestStreak: longestStreak(timestamps),
      materialsSeen: byCategory.filter((item) => item.count > 0).length,
      since: timestamps.length ? Math.min(...timestamps) : null,
    };
  }, [scans]);

  const confirmClear = () => {
    haptics.warning();
    Alert.alert(
      'Clear your board?',
      `This removes all ${stats.total} photos and their sorting history from this phone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear board', style: 'destructive', onPress: clearAll },
      ],
    );
  };

  const gaugeSize = Math.min(width - 88, 260);
  const percent = Math.round(stats.rate * 100);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: tabBarClearance(insets.bottom) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.overlineRow}>
            <Stripe width={16} band={2.5} gap={1.5} />
            <Text variant="overline" color={colors.inkSoft}>
              {stats.since ? `Since ${formatDate(stats.since)}` : 'Your numbers'}
            </Text>
          </View>
          <Text variant="display" accessibilityRole="header" style={styles.title}>
            Your Impact
          </Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.gauge} accessible accessibilityLabel={`${percent} percent recycled`}>
            <RainbowGauge value={stats.rate} size={gaugeSize} />
            <View style={styles.gaugeLabel}>
              <Text style={styles.gaugeNumber} color={colors.cream}>
                {percent}
                <Text style={styles.gaugePercent} color={colors.cream}>
                  %
                </Text>
              </Text>
            </View>
          </View>
          <Text variant="body" color={colors.onDarkSoft} style={styles.heroCopy}>
            {stats.total
              ? 'of what you’ve scanned stayed out of the landfill'
              : 'Scan a few things to see how much you keep out of the landfill'}
          </Text>
          <View style={styles.heroStats}>
            <HeroStat value={stats.total} label="sorted" />
            <View style={styles.heroDivider} />
            <HeroStat value={stats.streak} label="day streak" icon="flame" />
            <View style={styles.heroDivider} />
            <HeroStat value={stats.weekTotal} label="this week" />
          </View>
        </View>

        <Card title="This week" aside={`${stats.weekTotal} scan${stats.weekTotal === 1 ? '' : 's'}`}>
          <WeekChart days={stats.week} />
        </Card>

        <Card title="What you’ve sorted">
          <MaterialBreakdown items={stats.byCategory} total={stats.total} />
        </Card>

        <Card title="Milestones">
          <View style={styles.badges}>
            <Badge icon="sparkle" label="First find" color={colors.orange} reached={stats.total >= 1} />
            <Badge icon="layers" label="10 sorted" color={colors.mustard} reached={stats.total >= 10} />
            <Badge icon="flame" label="3-day run" color={colors.rust} reached={stats.bestStreak >= 3} />
            <Badge
              icon="board"
              label="All six"
              color={colors.avocado}
              reached={stats.materialsSeen === CATEGORY_LIST.length}
            />
          </View>
        </Card>

        <Card title="Bin guide" aside="Rules vary by city">
          <BinGuide />
        </Card>

        <Card title="Settings">
          <SettingRow label="Haptics" detail="Little taps when you snap and sort">
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(value) => {
                updateSettings({ hapticsEnabled: value });
                if (value) haptics.select();
              }}
              trackColor={{ false: colors.line, true: colors.avocado }}
              ios_backgroundColor={colors.line}
            />
          </SettingRow>
          <SettingRow label="Replay the intro" onPress={() => updateSettings({ onboarded: false })} />
          <SettingRow
            label="Clear your board"
            detail={
              stats.total
                ? `${stats.total} photo${stats.total === 1 ? '' : 's'} saved on this phone`
                : 'Nothing saved yet'
            }
            destructive
            disabled={stats.total === 0}
            onPress={confirmClear}
            last
          />
        </Card>

        <View style={styles.about}>
          <Text variant="hand" color={colors.inkFaint} style={styles.aboutText}>
            find my bin · v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
          <Text variant="caption" color={colors.inkFaint} style={styles.centered}>
            {IS_DEMO_CLASSIFIER
              ? 'Running a demo model, so sorting results are random for now.'
              : 'Sorting runs on your phone. Photos never leave it.'}
          </Text>
        </View>
      </ScrollView>
      <StatusBarScrim color={colors.cream} />
    </View>
  );
}

function HeroStat({ value, label, icon }: { value: number; label: string; icon?: IconName }) {
  return (
    <View style={styles.heroStat}>
      <View style={styles.heroStatValue}>
        {icon && <Icon name={icon} size={18} color={colors.orange} strokeWidth={2.2} />}
        <Text style={styles.heroStatNumber} color={colors.cream}>
          {value}
        </Text>
      </View>
      <Text variant="caption" color={colors.onDarkSoft}>
        {label}
      </Text>
    </View>
  );
}

function Card({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text variant="heading">{title}</Text>
        {aside && (
          <Text variant="caption" color={colors.inkFaint}>
            {aside}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

const BAR_MAX = 92;

function WeekChart({ days }: { days: DayCount[] }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <View style={styles.week}>
      {days.map((day, index) => (
        <View key={day.key} style={styles.weekDay} accessible accessibilityLabel={`${day.count} on ${day.label}`}>
          <Text variant="caption" color={day.count ? colors.inkSoft : 'transparent'}>
            {day.count}
          </Text>
          <Bar
            height={day.count ? Math.max(12, (day.count / max) * BAR_MAX) : 6}
            color={day.count === 0 ? colors.line : day.isToday ? colors.orange : colors.mustard}
            delay={index * 60}
          />
          <Text variant="label" color={day.isToday ? colors.ink : colors.inkFaint} style={styles.weekLabel}>
            {day.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Bar({ height, color, delay }: { height: number; color: string; delay: number }) {
  const reduceMotion = useReducedMotion();
  const animatedHeight = useSharedValue(6);

  useEffect(() => {
    animatedHeight.set(
      reduceMotion ? height : withDelay(delay, withTiming(height, { duration: 650, easing: Easing.out(Easing.cubic) })),
    );
  }, [height, delay, reduceMotion, animatedHeight]);

  const style = useAnimatedStyle(() => ({ height: animatedHeight.value }));
  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

function MaterialBreakdown({ items, total }: { items: { category: Category; count: number }[]; total: number }) {
  const present = items.filter((item) => item.count > 0);
  return (
    <>
      <View style={styles.stack}>
        {total === 0 ? (
          <View style={styles.stackEmpty} />
        ) : (
          present.map((item) => (
            <View key={item.category.id} style={{ flex: item.count, backgroundColor: item.category.color }} />
          ))
        )}
      </View>
      <View style={styles.legend}>
        {items.map((item) => (
          <View key={item.category.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.category.color }]} />
            <Text variant="body" style={styles.legendLabel} color={item.count ? colors.ink : colors.inkFaint}>
              {item.category.label}
            </Text>
            <Text variant="bodyStrong" color={item.count ? colors.ink : colors.inkFaint}>
              {item.count}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function Badge({ icon, label, color, reached }: { icon: IconName; label: string; color: string; reached: boolean }) {
  return (
    <View style={styles.badge} accessible accessibilityLabel={`${label}, ${reached ? 'unlocked' : 'locked'}`}>
      <View style={[styles.badgeCircle, reached ? { backgroundColor: color } : styles.badgeLocked]}>
        <Icon name={icon} size={24} color={reached ? colors.paper : colors.inkFaint} strokeWidth={2} />
      </View>
      <Text variant="caption" color={reached ? colors.ink : colors.inkFaint} style={styles.centered}>
        {label}
      </Text>
    </View>
  );
}

function BinGuide() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View>
      {CATEGORY_LIST.map((category, index) => {
        const expanded = open === category.id;
        return (
          <Animated.View
            key={category.id}
            layout={LinearTransition.duration(220)}
            style={[styles.guideRow, index > 0 && styles.divider]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => {
                haptics.select();
                setOpen(expanded ? null : category.id);
              }}
              style={styles.guideHeader}
            >
              <View style={[styles.legendDot, { backgroundColor: category.color }]} />
              <Text variant="bodyStrong" style={styles.guideLabel}>
                {category.label}
              </Text>
              <BinPill bin={binFor(category.id)} size="sm" />
              <View style={expanded && styles.chevronOpen}>
                <Icon name="chevronDown" size={18} color={colors.inkFaint} />
              </View>
            </Pressable>
            {expanded && (
              <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={styles.tips}>
                {category.tips.map((tip) => (
                  <View key={tip} style={styles.tip}>
                    <View style={[styles.tipBullet, { backgroundColor: category.color }]} />
                    <Text variant="body" color={colors.inkSoft} style={styles.tipText}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

type SettingRowProps = {
  label: string;
  detail?: string;
  children?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  last?: boolean;
};

function SettingRow({ label, detail, children, onPress, destructive, disabled, last }: SettingRowProps) {
  const content = (
    <>
      <View style={styles.settingText}>
        <Text variant="bodyStrong" color={destructive ? colors.rust : colors.ink}>
          {label}
        </Text>
        {detail && (
          <Text variant="caption" color={colors.inkFaint}>
            {detail}
          </Text>
        )}
      </View>
      {children ??
        (onPress && <Icon name="arrowRight" size={18} color={destructive ? colors.rust : colors.inkFaint} />)}
    </>
  );

  const style = [styles.settingRow, !last && styles.settingBorder, disabled && styles.disabled];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { paddingHorizontal: 2, marginBottom: 4 },
  overlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { marginTop: 4 },
  hero: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 22,
    borderRadius: 30,
    backgroundColor: colors.espresso,
  },
  gauge: { alignItems: 'center' },
  gaugeLabel: { position: 'absolute', bottom: -4, alignItems: 'center' },
  gaugeNumber: { fontFamily: fonts.display, fontSize: 42, lineHeight: 48, letterSpacing: -1 },
  gaugePercent: { fontFamily: fonts.display, fontSize: 22 },
  heroCopy: { textAlign: 'center', marginTop: 10, maxWidth: 260 },
  heroStats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(244, 235, 221, 0.2)',
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatNumber: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31 },
  heroDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(244, 235, 221, 0.2)' },
  card: {
    padding: 20,
    borderRadius: 26,
    backgroundColor: colors.creamLight,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  week: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  weekDay: { alignItems: 'center', gap: 6, flex: 1 },
  weekLabel: { fontSize: 12.5 },
  bar: { width: 24, borderRadius: 8 },
  stack: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    gap: 3,
  },
  stackEmpty: { flex: 1, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 10, columnGap: 20 },
  legendItem: { width: '44%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1 },
  badges: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { alignItems: 'center', gap: 8, width: 72 },
  badgeCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  badgeLocked: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkFaint },
  guideRow: { overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  guideLabel: { flex: 1 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  tips: { paddingBottom: 14, paddingLeft: 20, gap: 6 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  tipText: { flex: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  settingBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  settingText: { flex: 1, gap: 1 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.6 },
  about: { alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 20 },
  aboutText: { fontSize: 20 },
  centered: { textAlign: 'center' },
});
