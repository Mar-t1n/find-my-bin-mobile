import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Polaroid } from '@/components/retro/Polaroid';
import { RainbowGauge } from '@/components/retro/RainbowGauge';
import { Stamp } from '@/components/retro/Stamp';
import { Text } from '@/components/Text';
import { BINS } from '@/data/categories';
import { useSettings } from '@/store/settings';
import { colors, stripe } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

const STEPS = [
  { title: 'Snap it', body: 'Point your camera at one piece of trash.' },
  { title: 'Sort it', body: 'It gets stamped with the bin it belongs in.' },
  { title: 'Pin it', body: 'Every find lands on your board, with your stats.' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { updateSettings } = useSettings();
  const compact = height < 740;
  const rainbowSize = Math.min(width * 0.86, 360);
  const polaroidWidth = compact ? 120 : 146;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeInUp.duration(700)} style={styles.art}>
        <RainbowGauge value={1} size={rainbowSize} thickness={0.075} trackColor="transparent" />
        <View style={[styles.polaroid, { bottom: -polaroidWidth * 0.55 }]}>
          <Polaroid
            width={polaroidWidth}
            caption="soda can"
            attachment="tape"
            tapeAngle={-6}
            placeholder={<SodaCan />}
            photoOverlay={
              <View style={styles.stamp}>
                <Stamp bin={BINS.recycling} scale={polaroidWidth / 300} />
              </View>
            }
          />
        </View>
      </Animated.View>

      <View style={[styles.body, { marginTop: polaroidWidth * 0.55 + (compact ? 20 : 36) }]}>
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={[styles.title, compact && styles.titleCompact]} accessibilityRole="header">
            Find My Bin
          </Text>
          <Text variant="body" color={colors.inkSoft} style={styles.subtitle}>
            Not sure where something goes? Snap it and we’ll tell you which bin.
          </Text>
        </Animated.View>

        <View style={[styles.steps, compact && styles.stepsCompact]}>
          {STEPS.map((step, index) => (
            <Animated.View
              key={step.title}
              entering={FadeInDown.delay(350 + index * 120).duration(500)}
              style={styles.step}
            >
              <View style={[styles.stepNumber, { backgroundColor: stripe[index] }]}>
                <Text style={styles.stepNumberText} color={colors.paper}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyStrong">{step.title}</Text>
                <Text variant="body" color={colors.inkSoft}>
                  {step.body}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <Button
          label="Let’s get sorting"
          size="lg"
          icon="arrowRight"
          iconPosition="right"
          onPress={() => updateSettings({ onboarded: true })}
        />
      </Animated.View>
    </View>
  );
}

// A stand-in "photo" for the intro polaroid.
function SodaCan() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <Rect width={100} height={100} fill={colors.teal} />
      <Ellipse cx={50} cy={86} rx={26} ry={5} fill="#1F4F4C" />
      <Path d="M31 26h38v54a6 6 0 0 1-6 6H37a6 6 0 0 1-6-6V26z" fill={colors.orange} />
      <Rect x={31} y={44} width={38} height={14} fill={colors.cream} />
      <Rect x={31} y={49} width={38} height={4} fill={colors.mustard} />
      <Ellipse cx={50} cy={26} rx={19} ry={5} fill="#D9D2C6" />
      <Ellipse cx={50} cy={25.5} rx={14} ry={3.2} fill="#BDB4A6" />
      <Rect x={36} y={30} width={4} height={50} rx={2} fill="#FFFFFF" opacity={0.18} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: 24,
  },
  art: { alignItems: 'center', marginTop: 12 },
  polaroid: { position: 'absolute', transform: [{ rotate: '-5deg' }] },
  stamp: { position: 'absolute', right: 5, bottom: 6, transform: [{ rotate: '-9deg' }] },
  body: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 46, lineHeight: 52, letterSpacing: -1, color: colors.ink },
  titleCompact: { fontSize: 38, lineHeight: 44 },
  subtitle: { marginTop: 6, fontSize: 16.5, lineHeight: 24 },
  steps: { marginTop: 28, gap: 18 },
  stepsCompact: { marginTop: 18, gap: 12 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumberText: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20 },
  stepText: { flex: 1 },
});
