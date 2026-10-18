import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ScanOutcome, ScanResultOverlay } from '@/components/ScanResultOverlay';
import { TabBar } from '@/components/TabBar';
import { BoardScreen } from '@/screens/BoardScreen';
import { ImpactScreen } from '@/screens/ImpactScreen';
import { Capture, ScanScreen } from '@/screens/ScanScreen';
import { colors } from '@/theme/colors';
import { PageIndex, PAGES } from '@/theme/layout';

// Three pages side by side: swipe right for the board, left for your impact.
// The scanner in the middle is where the app opens.
export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const didInitialScroll = useRef(false);
  const scrollX = useSharedValue(width * PAGES.scan);
  const [page, setPage] = useState<PageIndex>(PAGES.scan);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [boardPulse, setBoardPulse] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  // Flip the current page as soon as a swipe passes halfway.
  useAnimatedReaction(
    () => Math.round(scrollX.value / width),
    (current, previous) => {
      if (current !== previous) scheduleOnRN(setPage, current as PageIndex);
    },
    [width],
  );

  const goToPage = useCallback(
    (index: PageIndex) => scrollRef.current?.scrollTo({ x: index * width, animated: true }),
    [width],
  );

  const handleFinish = useCallback(
    (outcome: ScanOutcome) => {
      setCapture(null);
      if (outcome === 'discarded') return;
      setBoardPulse((value) => value + 1);
      if (outcome === 'viewBoard') goToPage(PAGES.board);
    },
    [goToPage],
  );

  return (
    <View style={styles.container}>
      <StatusBar style={page === PAGES.scan || capture ? 'light' : 'dark'} animated />

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        scrollEnabled={!capture}
        contentOffset={{ x: width * PAGES.scan, y: 0 }}
        onLayout={() => {
          // Android ignores contentOffset, so jump to the scanner once laid out.
          if (didInitialScroll.current) return;
          didInitialScroll.current = true;
          scrollRef.current?.scrollTo({ x: width * PAGES.scan, animated: false });
        }}
      >
        <View style={{ width }}>
          <BoardScreen onStartScanning={() => goToPage(PAGES.scan)} />
        </View>
        <View style={{ width }}>
          <ScanScreen
            active={page === PAGES.scan && !capture}
            onCapture={setCapture}
            onOpenBoard={() => goToPage(PAGES.board)}
          />
        </View>
        <View style={{ width }}>
          <ImpactScreen />
        </View>
      </Animated.ScrollView>

      <TabBar scrollX={scrollX} pageWidth={width} page={page} onSelect={goToPage} boardPulse={boardPulse} />

      {capture && <ScanResultOverlay capture={capture} onFinish={handleFinish} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
});
