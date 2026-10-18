import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BinPill } from '@/components/BinPill';
import { Button } from '@/components/Button';
import { CategoryChips } from '@/components/CategoryChips';
import { ConfidenceMeter, LOW_CONFIDENCE } from '@/components/ConfidenceMeter';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Daisy } from '@/components/retro/Daisy';
import { Polaroid, polaroidMetrics } from '@/components/retro/Polaroid';
import { Stamp } from '@/components/retro/Stamp';
import { Sunburst } from '@/components/retro/Sunburst';
import { Text } from '@/components/Text';
import { classifyPhoto } from '@/classifier/classifyPhoto';
import { binFor, CATEGORIES, CategoryId } from '@/data/categories';
import { formatTime } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { deletePhoto, persistPhoto } from '@/lib/photos';
import { createId, createRandom } from '@/lib/random';
import type { Capture } from '@/screens/ScanScreen';
import { Scan, useScans } from '@/store/scans';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { tabBarFrame } from '@/theme/layout';

export type ScanOutcome = 'kept' | 'viewBoard' | 'discarded';

type Phase = 'developing' | 'sorted' | 'failed';

// Room reserved at the bottom for the result card.
const CARD_SPACE = 292;
// Keeps the "developing" beat long enough to read, even if the model is fast.
const MIN_DEVELOP_MS = 1500;
// When the stamp spring first hits full size, give or take.
const STAMP_IMPACT_MS = 320;

type ScanResultOverlayProps = {
  capture: Capture;
  onFinish: (outcome: ScanOutcome) => void;
};

export function ScanResultOverlay({ capture, onFinish }: ScanResultOverlayProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { addScan, correctScan, removeScan } = useScans();

  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>('developing');
  const [scan, setScan] = useState<Scan | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const leaving = useRef(false);
  const impactTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Layout: the polaroid sits centered in the space above the card.
  const cardBottom = insets.bottom + 12;
  const regionTop = insets.top + 16;
  const regionHeight = height - regionTop - CARD_SPACE - cardBottom;
  const polaroidWidth = Math.min(width * 0.7, 300, (regionHeight - 20) / 1.18);
  const metrics = polaroidMetrics(polaroidWidth);
  const centerY = regionTop + regionHeight / 2;
  const raySize = Math.hypot(width, height) * 1.25;
  const stampScale = Math.max(0.75, Math.min(1, polaroidWidth / 310));

  // Where the polaroid flies to: the middle of the Board tab.
  const tab = tabBarFrame(width, insets.bottom);
  const flightX = tab.left + tab.width / 6 - width / 2;
  const flightY = height - tab.bottom - tab.height / 2 - centerY;

  const backdrop = useSharedValue(0);
  const enter = useSharedValue(0);
  const develop = useSharedValue(1);
  const rays = useSharedValue(0);
  const spin = useSharedValue(0);
  const stamp = useSharedValue(0);
  const shake = useSharedValue(0);
  const card = useSharedValue(0);
  const flight = useSharedValue(0);

  // Entrance: dim everything, bring the polaroid in and start developing.
  useEffect(() => {
    backdrop.set(withTiming(1, { duration: 240 }));
    enter.set(withSpring(1, { damping: 15, stiffness: 150 }));
    if (!reduceMotion) {
      spin.set(withRepeat(withTiming(360, { duration: 70000, easing: Easing.linear }), -1, false));
    }
    return () => clearTimeout(impactTimer.current);
  }, [backdrop, enter, spin, reduceMotion]);

  // Classify and save. Re-runs on "Try again".
  useEffect(() => {
    let cancelled = false;
    const id = createId();
    develop.set(1);
    develop.set(withTiming(0.55, { duration: MIN_DEVELOP_MS, easing: Easing.out(Easing.quad) }));

    const minimumWait = new Promise((resolve) => setTimeout(resolve, reduceMotion ? 300 : MIN_DEVELOP_MS));
    Promise.all([classifyPhoto(capture.uri), persistPhoto(capture.uri, id, capture.width), minimumWait])
      .then(([prediction, photoFile]) => {
        if (cancelled) {
          deletePhoto(photoFile);
          return;
        }
        const saved: Scan = {
          id,
          photoFile,
          category: prediction.category,
          confidence: prediction.confidence,
          createdAt: Date.now(),
        };
        addScan(saved);
        setScan(saved);
        setCategory(prediction.category);
        setPhase('sorted');
      })
      .catch((error) => {
        console.warn('Scan failed', error);
        if (!cancelled) setPhase('failed');
      });

    return () => {
      cancelled = true;
    };
    // `attempt` is the retry trigger.
  }, [attempt, capture, addScan, develop, reduceMotion]);

  const slamStamp = useCallback(() => {
    stamp.set(0);
    stamp.set(withDelay(180, withSpring(1, { damping: 12, stiffness: 260, mass: 0.9 })));
    if (!reduceMotion) {
      shake.set(
        withDelay(
          STAMP_IMPACT_MS,
          withSequence(
            withTiming(-1, { duration: 45 }),
            withTiming(0.8, { duration: 55 }),
            withTiming(-0.4, { duration: 55 }),
            withTiming(0, { duration: 60 }),
          ),
        ),
      );
    }
    clearTimeout(impactTimer.current);
    impactTimer.current = setTimeout(() => {
      haptics.thud();
      setBurstKey((key) => key + 1);
    }, STAMP_IMPACT_MS);
  }, [stamp, shake, reduceMotion]);

  // Reveal: finish developing, rays out, stamp down, card up.
  useEffect(() => {
    if (phase === 'sorted') {
      develop.set(withTiming(0, { duration: 420 }));
      rays.set(withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
      slamStamp();
      card.set(withDelay(reduceMotion ? 0 : 520, withSpring(1, { damping: 18, stiffness: 170 })));
    } else if (phase === 'failed') {
      haptics.warning();
      card.set(withSpring(1, { damping: 18, stiffness: 170 }));
    }
  }, [phase, develop, rays, card, slamStamp, reduceMotion]);

  const leave = useCallback(
    (outcome: ScanOutcome) => {
      if (leaving.current) return;
      leaving.current = true;
      const finish = (finished?: boolean) => {
        'worklet';
        if (finished) scheduleOnRN(onFinish, outcome);
      };

      card.set(withTiming(0, { duration: 200 }));
      rays.set(withTiming(0, { duration: 260 }));
      backdrop.set(withTiming(0, { duration: 380 }));
      if (outcome === 'discarded') {
        enter.set(withTiming(0, { duration: 240 }, finish));
      } else {
        flight.set(
          withTiming(1, { duration: reduceMotion ? 260 : 640, easing: Easing.bezier(0.55, 0, 0.25, 1) }, finish),
        );
      }
    },
    [backdrop, card, enter, flight, rays, onFinish, reduceMotion],
  );

  const retry = () => {
    card.set(withTiming(0, { duration: 160 }));
    setPhase('developing');
    setAttempt((value) => value + 1);
  };

  const discard = () => {
    if (scan) removeScan(scan.id);
    leave('discarded');
  };

  const pickCategory = (next: CategoryId) => {
    haptics.select();
    setCorrecting(false);
    if (!scan || next === category) return;
    correctScan(scan.id, next === scan.category ? undefined : next);
    setCategory(next);
    slamStamp();
  };

  // Android back: keep the result if there is one, otherwise back out.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'sorted') leave('kept');
      else if (phase === 'failed') leave('discarded');
      return true;
    });
    return () => subscription.remove();
  }, [phase, leave]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: rays.value,
    transform: [{ rotate: `${spin.value}deg` }, { scale: interpolate(rays.value, [0, 1], [0.35, 1]) }],
  }));
  const polaroidStyle = useAnimatedStyle(() => {
    const f = flight.value;
    return {
      opacity: enter.value * interpolate(f, [0.7, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: shake.value * 8 + f * flightX },
        // The sine term tosses it up in an arc on the way to the tab.
        { translateY: interpolate(enter.value, [0, 1], [80, 0]) + f * flightY - Math.sin(f * Math.PI) * 70 },
        { rotate: `${interpolate(enter.value, [0, 1], [7, -3]) - f * 18}deg` },
        { scale: interpolate(enter.value, [0, 1], [0.84, 1]) * interpolate(f, [0, 1], [1, 0.12]) },
      ],
    };
  });
  const developStyle = useAnimatedStyle(() => ({ opacity: develop.value }));
  const stampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stamp.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(stamp.value, [0, 1, 1.3], [2.8, 1, 0.92], Extrapolation.CLAMP) },
      { rotate: `${interpolate(stamp.value, [0, 1], [-26, -9], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ translateY: interpolate(card.value, [0, 1], [90, 0]) }],
  }));
  const closeStyle = useAnimatedStyle(() => ({ opacity: card.value }));

  const bin = category ? binFor(category) : null;
  // Burst from roughly the middle of the stamp.
  const burstOrigin = {
    x: metrics.pad + metrics.photo * 0.94 - 70 * stampScale,
    y: metrics.pad + metrics.photo * 0.93 - 18 * stampScale,
  };

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />

      {bin && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.absolute,
            { width: raySize, height: raySize, left: width / 2 - raySize / 2, top: centerY - raySize / 2 },
            raysStyle,
          ]}
        >
          <Sunburst size={raySize} color={bin.color} intensity={0.6} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.absolute,
          { left: width / 2 - polaroidWidth / 2, top: centerY - metrics.height / 2 },
          polaroidStyle,
        ]}
      >
        <Polaroid
          width={polaroidWidth}
          photoUri={capture.uri}
          caption={category ? CATEGORIES[category].label.toLowerCase() : phase === 'failed' ? 'hmm…' : 'developing…'}
          meta={scan ? formatTime(scan.createdAt) : undefined}
          photoOverlay={
            <>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.undeveloped, developStyle]} />
              {bin && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.stamp, { right: metrics.photo * 0.06, bottom: metrics.photo * 0.07 }, stampStyle]}
                >
                  <Stamp bin={bin} scale={stampScale} />
                </Animated.View>
              )}
            </>
          }
        >
          {burstKey > 0 && !reduceMotion && (
            <DaisyBurst key={burstKey} seed={burstKey} x={burstOrigin.x} y={burstOrigin.y} />
          )}
        </Polaroid>
      </Animated.View>

      {phase === 'sorted' && (
        <Animated.View style={[styles.close, { top: insets.top + 10 }, closeStyle]}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Don’t keep this scan"
            onPress={discard}
            hitSlop={10}
            style={styles.closeButton}
          >
            <Icon name="close" size={18} color={colors.cream} strokeWidth={2.4} />
          </PressableScale>
        </Animated.View>
      )}

      <Animated.View style={[styles.card, { bottom: cardBottom }, cardStyle]}>
        {phase === 'sorted' && scan && category && (
          <SortedCard
            scan={scan}
            category={category}
            correcting={correcting}
            onToggleCorrecting={() => {
              haptics.tap();
              setCorrecting((value) => !value);
            }}
            onPick={pickCategory}
            onViewBoard={() => leave('viewBoard')}
            onKeepSorting={() => leave('kept')}
          />
        )}
        {phase === 'failed' && <FailedCard onDiscard={() => leave('discarded')} onRetry={retry} />}
      </Animated.View>
    </View>
  );
}

type SortedCardProps = {
  scan: Scan;
  category: CategoryId;
  correcting: boolean;
  onToggleCorrecting: () => void;
  onPick: (category: CategoryId) => void;
  onViewBoard: () => void;
  onKeepSorting: () => void;
};

function SortedCard({
  scan,
  category,
  correcting,
  onToggleCorrecting,
  onPick,
  onViewBoard,
  onKeepSorting,
}: SortedCardProps) {
  const details = CATEGORIES[category];
  const corrected = category !== scan.category;
  const unsure = !corrected && scan.confidence < LOW_CONFIDENCE;

  return (
    <>
      <View style={styles.cardHeader}>
        <Text variant="overline" color={colors.inkFaint}>
          {corrected ? 'Sorted by you' : 'Sorted as'}
        </Text>
        <Pressable accessibilityRole="button" onPress={onToggleCorrecting} hitSlop={12}>
          <Text variant="label" color={colors.orange} style={styles.link}>
            {correcting ? 'Never mind' : 'Not right?'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {details.label}
        </Text>
        <BinPill bin={binFor(category)} />
      </View>

      <View style={styles.cardBody}>
        {correcting ? (
          <CategoryChips selected={category} onSelect={onPick} />
        ) : (
          <>
            {!corrected && <ConfidenceMeter value={scan.confidence} />}
            <View style={styles.tipRow}>
              {unsure && <Icon name="info" size={18} color={colors.mustard} />}
              <Text variant="body" color={colors.inkSoft} style={styles.tip}>
                {unsure
                  ? 'Not totally sure about this one. Give it a second look before you toss it.'
                  : corrected
                    ? `Got it, ${details.label.toLowerCase()}. ${details.quickTip}`
                    : details.quickTip}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Button label="View board" variant="outline" onPress={onViewBoard} style={styles.secondaryAction} />
        <Button label="Keep sorting" icon="camera" onPress={onKeepSorting} style={styles.primaryAction} />
      </View>
    </>
  );
}

function FailedCard({ onDiscard, onRetry }: { onDiscard: () => void; onRetry: () => void }) {
  return (
    <>
      <Text variant="overline" color={colors.rust}>
        Hmm
      </Text>
      <Text variant="title" style={styles.failedTitle}>
        Couldn’t sort that one
      </Text>
      <View style={styles.cardBody}>
        <Text variant="body" color={colors.inkSoft}>
          Something went wrong reading the photo. Try again, or retake it with the item filling the frame.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Discard" variant="outline" onPress={onDiscard} style={styles.secondaryAction} />
        <Button label="Try again" icon="undo" onPress={onRetry} style={styles.primaryAction} />
      </View>
    </>
  );
}

const PETAL_STYLES = [
  { petal: colors.paper, center: colors.mustard },
  { petal: colors.mustard, center: colors.orange },
  { petal: colors.orange, center: colors.paper },
];
const PARTICLE_COUNT = 9;

// Little daisies that pop out from under the stamp.
function DaisyBurst({ seed, x, y }: { seed: number; x: number; y: number }) {
  const particles = useMemo(() => {
    const random = createRandom(seed * 7919);
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      angle: (index / PARTICLE_COUNT) * Math.PI * 2 + random() * 0.5,
      distance: 70 + random() * 80,
      size: 14 + random() * 12,
      spin: (random() - 0.5) * 420,
      ...PETAL_STYLES[index % PETAL_STYLES.length],
    }));
  }, [seed]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, index) => (
        <Particle key={index} x={x} y={y} {...particle} />
      ))}
    </View>
  );
}

type ParticleProps = {
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  spin: number;
  petal: string;
  center: string;
};

function Particle({ x, y, angle, distance, size, spin, petal, center }: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.55, 1], [1, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        // A touch of gravity once they're out.
        { translateY: Math.sin(angle) * distance * p + p * p * 36 },
        { rotate: `${spin * p}deg` },
        { scale: interpolate(p, [0, 0.2, 1], [0.2, 1, 0.75]) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.absolute, { left: x - size / 2, top: y - size / 2 }, style]}>
      <Daisy size={size} petal={petal} center={center} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  backdrop: { backgroundColor: '#21160F' },
  undeveloped: { backgroundColor: '#3A2B20' },
  stamp: { position: 'absolute' },
  close: { position: 'absolute', right: 16 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onDarkFaint,
  },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    padding: 20,
    borderRadius: 28,
    backgroundColor: colors.cream,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { textDecorationLine: 'underline' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, flexShrink: 1 },
  failedTitle: { marginTop: 6 },
  // Fixed height so switching to the correction chips doesn't resize the card.
  cardBody: { height: 92, justifyContent: 'center', gap: 10, marginTop: 8 },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tip: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryAction: { flex: 1 },
  primaryAction: { flex: 1.35 },
});
