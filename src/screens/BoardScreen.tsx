import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { CorkTexture } from '@/components/retro/CorkTexture';
import { Polaroid } from '@/components/retro/Polaroid';
import { Stamp } from '@/components/retro/Stamp';
import { Stripe } from '@/components/retro/Stripe';
import { Text } from '@/components/Text';
import { BINS, binFor, BinId, CATEGORIES, CATEGORY_LIST, CategoryId } from '@/data/categories';
import { dayKey, dayLabel, formatTime } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { photoUri } from '@/lib/photos';
import { createRandom, hashString } from '@/lib/random';
import { effectiveCategory, Scan, useScans } from '@/store/scans';
import { colors, pinColors } from '@/theme/colors';
import { tabBarClearance } from '@/theme/layout';

type Filter = 'all' | BinId | CategoryId;

type Row = { type: 'day'; key: string; label: string } | { type: 'pair'; key: string; scans: Scan[] };

const SIDE = 18;
const GUTTER = 18;

function matchesFilter(scan: Scan, filter: Filter) {
  if (filter === 'all') return true;
  const category = effectiveCategory(scan);
  return filter in BINS ? CATEGORIES[category].bin === filter : category === filter;
}

// Groups scans by day, two polaroids per row.
function buildRows(scans: Scan[]): Row[] {
  const rows: Row[] = [];
  let pending: Scan[] = [];
  let currentDay: number | null = null;
  const flush = () => {
    for (let i = 0; i < pending.length; i += 2) {
      rows.push({ type: 'pair', key: pending[i].id, scans: pending.slice(i, i + 2) });
    }
    pending = [];
  };
  for (const scan of scans) {
    const day = dayKey(scan.createdAt);
    if (day !== currentDay) {
      flush();
      currentDay = day;
      rows.push({ type: 'day', key: `day-${day}`, label: dayLabel(scan.createdAt) });
    }
    pending.push(scan);
  }
  flush();
  return rows;
}

export function BoardScreen({ onStartScanning }: { onStartScanning: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scans } = useScans();
  const [filter, setFilter] = useState<Filter>('all');

  const polaroidWidth = (width - SIDE * 2 - GUTTER) / 2;
  const recycled = scans.filter((scan) => binFor(effectiveCategory(scan)).id === 'recycling').length;

  const filters = useMemo(() => {
    const counts = new Map<Filter, number>();
    for (const scan of scans) {
      const category = effectiveCategory(scan);
      counts.set(category, (counts.get(category) ?? 0) + 1);
      counts.set(CATEGORIES[category].bin, (counts.get(CATEGORIES[category].bin) ?? 0) + 1);
    }
    const binFilters = Object.values(BINS).map((bin) => ({ id: bin.id as Filter, label: bin.label, color: bin.color }));
    const categoryFilters = CATEGORY_LIST.filter((category) => counts.has(category.id)).map((category) => ({
      id: category.id as Filter,
      label: category.label,
      color: category.color,
    }));
    return [
      { id: 'all' as Filter, label: 'All', color: undefined, count: scans.length },
      ...[...binFilters, ...categoryFilters].map((item) => ({ ...item, count: counts.get(item.id) ?? 0 })),
    ];
  }, [scans]);

  // If the last scan of a filtered kind gets removed, fall back to everything.
  const activeFilter = filters.some((item) => item.id === filter) ? filter : 'all';
  const rows = useMemo(
    () => buildRows(scans.filter((scan) => matchesFilter(scan, activeFilter))),
    [scans, activeFilter],
  );

  const summary = scans.length
    ? `${scans.length} pinned · ${Math.round((recycled / scans.length) * 100)}% recycled`
    : 'Nothing pinned yet';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.overlineRow}>
          <Stripe width={16} band={2.5} gap={1.5} />
          <Text variant="overline" color={colors.inkSoft}>
            {summary}
          </Text>
        </View>
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          The Board
        </Text>
      </View>

      {scans.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filterBar}
        >
          {filters.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              count={item.count}
              color={item.color}
              selected={activeFilter === item.id}
              onPress={() => {
                haptics.select();
                setFilter(item.id);
              }}
            />
          ))}
        </ScrollView>
      )}

      <View style={[styles.board, scans.length === 0 && styles.boardEmpty]}>
        <CorkTexture />
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarClearance(insets.bottom) + 16 },
            rows.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            item.type === 'day' ? (
              <DayLabel label={item.label} />
            ) : (
              <View style={styles.pair}>
                {item.scans.map((scan, index) => (
                  <View key={scan.id} style={index === 1 && styles.staggered}>
                    <BoardPolaroid scan={scan} width={polaroidWidth} />
                  </View>
                ))}
              </View>
            )
          }
          ListEmptyComponent={
            scans.length === 0 ? (
              <EmptyBoard onStartScanning={onStartScanning} />
            ) : (
              <View style={styles.filterEmpty}>
                <DayLabel label="nothing here yet" />
              </View>
            )
          }
        />
      </View>
    </View>
  );
}

const BoardPolaroid = memo(function BoardPolaroid({ scan, width }: { scan: Scan; width: number }) {
  const category = CATEGORIES[effectiveCategory(scan)];
  // Tilt, pin color and pin-vs-tape come from the id so they never shuffle.
  const look = useMemo(() => {
    const random = createRandom(hashString(scan.id));
    return {
      tilt: (random() - 0.5) * 7,
      attachment: random() < 0.72 ? ('pin' as const) : ('tape' as const),
      accent: pinColors[Math.floor(random() * pinColors.length)],
      tapeAngle: (random() - 0.5) * 12,
    };
  }, [scan.id]);

  return (
    <View style={{ transform: [{ rotate: `${look.tilt}deg` }] }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${category.label}, ${binFor(category.id).label}, scanned at ${formatTime(scan.createdAt)}`}
        accessibilityHint="Opens details"
        onPress={() => router.push({ pathname: '/scan/[id]', params: { id: scan.id } })}
      >
        <Polaroid
          width={width}
          photoUri={photoUri(scan.photoFile)}
          caption={category.label.toLowerCase()}
          meta={formatTime(scan.createdAt)}
          attachment={look.attachment}
          accent={look.accent}
          tapeAngle={look.tapeAngle}
          photoOverlay={
            <View style={styles.smallStamp}>
              <Stamp bin={binFor(category.id)} scale={Math.min(0.55, width / 320)} />
            </View>
          }
        />
      </PressableScale>
    </View>
  );
});

function DayLabel({ label }: { label: string }) {
  return (
    <View style={styles.dayLabel}>
      <View style={styles.dayTape}>
        <Text variant="hand" style={styles.dayText}>
          {label}
        </Text>
      </View>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  count: number;
  color?: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, count, color, selected, onPress }: FilterChipProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count}`}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {color && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text variant="label" color={selected ? colors.cream : colors.ink} style={styles.chipLabel}>
        {label}
      </Text>
      <Text variant="caption" color={selected ? colors.onDarkSoft : colors.inkFaint}>
        {count}
      </Text>
    </PressableScale>
  );
}

function EmptyBoard({ onStartScanning }: { onStartScanning: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyPolaroid}>
        <Polaroid
          width={176}
          caption="your first find"
          attachment="pin"
          accent={colors.orange}
          placeholder={
            <View style={styles.emptyPhoto}>
              <Icon name="camera" size={34} color={colors.inkFaint} strokeWidth={1.6} />
            </View>
          }
        />
      </View>
      <View style={styles.emptyCard}>
        <Text variant="title" style={styles.centered}>
          Nothing pinned yet
        </Text>
        <Text variant="body" color={colors.inkSoft} style={[styles.centered, styles.emptyBody]}>
          Everything you scan gets pinned here, stamped with the bin it belongs in.
        </Text>
        <Button label="Start scanning" icon="camera" onPress={onStartScanning} style={styles.emptyButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 22 },
  overlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { marginTop: 4 },
  filterBar: { flexGrow: 0 },
  filters: { gap: 8, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.creamLight,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSelected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipDot: { width: 9, height: 9, borderRadius: 5 },
  chipLabel: { fontSize: 13.5 },
  board: {
    flex: 1,
    marginTop: 14,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  boardEmpty: { marginTop: 18 },
  list: { paddingHorizontal: SIDE, paddingTop: 26 },
  listEmpty: { flexGrow: 1 },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  staggered: { marginTop: 22 },
  smallStamp: { position: 'absolute', right: 6, bottom: 7, transform: [{ rotate: '-8deg' }] },
  dayLabel: { alignItems: 'flex-start', marginBottom: 20 },
  dayTape: {
    paddingHorizontal: 14,
    paddingTop: 1,
    paddingBottom: 3,
    backgroundColor: colors.tape,
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#2B1D14',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  dayText: { fontSize: 22, lineHeight: 27 },
  filterEmpty: { alignItems: 'center', paddingTop: 30 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 12 },
  emptyPolaroid: { transform: [{ rotate: '-4deg' }], marginBottom: -18, zIndex: 1 },
  emptyPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    margin: 6,
    borderRadius: 4,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingTop: 34,
    paddingBottom: 22,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: colors.cream,
    shadowColor: '#2B1D14',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  emptyBody: { marginTop: 8 },
  emptyButton: { marginTop: 20, alignSelf: 'stretch' },
  centered: { textAlign: 'center' },
});
