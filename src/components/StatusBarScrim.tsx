import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const FADE = 18;

// Solid strip behind the status bar that fades out below it, so scrolled
// content doesn't collide with the clock.
export function StatusBarScrim({ color }: { color: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.scrim, { height: insets.top + FADE }]}>
      <View style={{ height: insets.top, backgroundColor: color }} />
      <Svg width="100%" height={FADE}>
        <Defs>
          <LinearGradient id="scrim-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={FADE} fill="url(#scrim-fade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
