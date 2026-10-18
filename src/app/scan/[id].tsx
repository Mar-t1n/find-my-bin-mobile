import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BinPill } from '@/components/BinPill';
import { Button } from '@/components/Button';
import { CategoryChips } from '@/components/CategoryChips';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { Icon } from '@/components/Icon';
import { Polaroid } from '@/components/retro/Polaroid';
import { Stamp } from '@/components/retro/Stamp';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { binFor, CATEGORIES, CategoryId } from '@/data/categories';
import { formatDate, formatTime } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { photoUri } from '@/lib/photos';
import { effectiveCategory, useScans } from '@/store/scans';
import { colors } from '@/theme/colors';

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { scans, correctScan, confirmScan, removeScan } = useScans();
  const live = scans.find((scan) => scan.id === id);
  // Keep showing the last known copy while the sheet animates away after a delete.
  const [snapshot] = useState(live);
  const scan = live ?? snapshot;
  const [picking, setPicking] = useState(false);

  if (!scan) return <View style={styles.container} />;

  const categoryId = effectiveCategory(scan);
  const category = CATEGORIES[categoryId];
  const bin = binFor(categoryId);
  const original = CATEGORIES[scan.category];
  const corrected = !!scan.correctedCategory;
  const polaroidWidth = Math.min(width * 0.64, 270);

  const pick = (next: CategoryId) => {
    haptics.select();
    setPicking(false);
    if (next === scan.category) confirmScan(scan.id);
    else correctScan(scan.id, next);
  };

  const remove = () => {
    router.back();
    const undo = removeScan(scan.id);
    showToast({ message: 'Removed from your board', actionLabel: 'Undo', onAction: undo });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.polaroid}>
        <Polaroid
          width={polaroidWidth}
          photoUri={photoUri(scan.photoFile)}
          caption={category.label.toLowerCase()}
          meta={formatTime(scan.createdAt)}
          attachment="pin"
          accent={colors.orange}
          photoOverlay={
            <View style={styles.stamp}>
              <Stamp bin={bin} scale={polaroidWidth / 300} />
            </View>
          }
        />
      </View>

      <View style={styles.titleRow}>
        <Text variant="display" style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {category.label}
        </Text>
        <BinPill bin={bin} />
      </View>
      <Text variant="caption" color={colors.inkFaint}>
        Scanned {formatDate(scan.createdAt)} at {formatTime(scan.createdAt)}
      </Text>

      <View style={styles.section}>
        <Text variant="overline" color={colors.inkFaint}>
          How to toss it
        </Text>
        <View style={[styles.tipsCard, { borderLeftColor: category.color }]}>
          {category.tips.map((tip) => (
            <View key={tip} style={styles.tip}>
              <View style={[styles.bullet, { backgroundColor: category.color }]} />
              <Text variant="body" color={colors.inkSoft} style={styles.tipText}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="overline" color={colors.inkFaint}>
          Did we get it right?
        </Text>
        <View style={styles.feedbackCard}>
          {picking ? (
            <Animated.View entering={FadeIn.duration(180)} style={styles.picker}>
              <Text variant="bodyStrong">What is it really?</Text>
              <CategoryChips selected={categoryId} onSelect={pick} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(180)} style={styles.feedback}>
              <View style={styles.feedbackText}>
                {corrected ? (
                  <Text variant="body" color={colors.inkSoft}>
                    You changed this from <Text variant="bodyStrong">{original.label}</Text>. Thanks, that helps train
                    the next model.
                  </Text>
                ) : scan.confirmed ? (
                  <View style={styles.confirmed}>
                    <Icon name="check" size={18} color={colors.avocado} strokeWidth={2.6} />
                    <Text variant="body" color={colors.inkSoft}>
                      You confirmed this one.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text variant="body" color={colors.inkSoft}>
                      The model guessed {original.label.toLowerCase()}.
                    </Text>
                    <ConfidenceMeter value={scan.confidence} />
                  </>
                )}
              </View>
              <View style={styles.feedbackActions}>
                {!corrected && !scan.confirmed && (
                  <Button
                    label="Yep"
                    icon="check"
                    variant="outline"
                    onPress={() => confirmScan(scan.id)}
                    style={styles.flex}
                  />
                )}
                <Button
                  label={corrected || scan.confirmed ? 'Change it' : 'Not quite'}
                  variant={corrected || scan.confirmed ? 'outline' : 'primary'}
                  onPress={() => setPicking(true)}
                  style={styles.flex}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      <Button
        label="Remove from board"
        icon="trash"
        variant="ghost"
        tint={colors.rust}
        onPress={remove}
        style={styles.remove}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 44 },
  polaroid: { alignItems: 'center', marginBottom: 28, transform: [{ rotate: '-2.5deg' }] },
  stamp: { position: 'absolute', right: 10, bottom: 12, transform: [{ rotate: '-9deg' }] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  title: { flexShrink: 1 },
  section: { marginTop: 26, gap: 10 },
  tipsCard: {
    gap: 8,
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    backgroundColor: colors.creamLight,
  },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  tipText: { flex: 1 },
  feedbackCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.creamLight,
    borderWidth: 1,
    borderColor: colors.line,
  },
  feedback: { gap: 14 },
  feedbackText: { gap: 10 },
  confirmed: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackActions: { flexDirection: 'row', gap: 10 },
  picker: { gap: 12 },
  flex: { flex: 1 },
  remove: { marginTop: 22, alignSelf: 'center' },
});
