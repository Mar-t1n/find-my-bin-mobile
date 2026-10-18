import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IS_DEMO_CLASSIFIER } from '@/classifier/classifyPhoto';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Polaroid } from '@/components/retro/Polaroid';
import { Stripe } from '@/components/retro/Stripe';
import { Sunburst } from '@/components/retro/Sunburst';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { haptics } from '@/lib/haptics';
import { photoUri } from '@/lib/photos';
import { useScans } from '@/store/scans';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { tabBarClearance } from '@/theme/layout';

export type Capture = { uri: string; width?: number };

type ScanScreenProps = {
  // False while another page is showing or a result is open; pauses the camera.
  active: boolean;
  onCapture: (capture: Capture) => void;
  onOpenBoard: () => void;
};

export function ScanScreen({ active, onCapture, onOpenBoard }: ScanScreenProps) {
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { scans } = useScans();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const flash = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const cameraUsable = !!permission?.granted && !cameraError;
  // iOS can pause a mounted camera; Android can't, so unmount it there instead.
  const mountCamera = cameraUsable && (Platform.OS === 'ios' || active);

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    haptics.shutter();
    flash.set(withSequence(withTiming(0.85, { duration: 60 }), withTiming(0, { duration: 380 })));
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) onCapture({ uri: photo.uri, width: photo.width });
    } catch (error) {
      console.warn('Capture failed', error);
      showToast({ message: 'That photo didn’t take. Give it another go.' });
    } finally {
      setCapturing(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onCapture({ uri: asset.uri, width: asset.width });
      }
    } catch (error) {
      console.warn('Picker failed', error);
      showToast({ message: 'Couldn’t open your photos.' });
    }
  };

  const latest = scans[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.topBar}>
        <View style={styles.wordmark}>
          <Stripe width={18} band={3} gap={2} />
          <Text style={styles.wordmarkText} color={colors.cream}>
            find my bin
          </Text>
          {IS_DEMO_CLASSIFIER && (
            <View style={styles.demoTag}>
              <Text variant="overline" color={colors.mustard} style={styles.demoText}>
                demo model
              </Text>
            </View>
          )}
        </View>
        {cameraUsable && (
          <RoundButton
            icon={torch ? 'flash' : 'flashOff'}
            label={torch ? 'Turn light off' : 'Turn light on'}
            active={torch}
            onPress={() => {
              haptics.select();
              setTorch((value) => !value);
            }}
          />
        )}
      </View>

      <View style={styles.viewfinder}>
        {mountCamera && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch && active}
            active={active}
            animateShutter={false}
            onCameraReady={() => setCameraReady(true)}
            onMountError={(event) => setCameraError(event.message)}
          />
        )}

        {permission && !permission.granted && (
          <CameraMessage
            title={permission.canAskAgain ? 'Let’s take a look' : 'The camera’s switched off'}
            body={
              permission.canAskAgain
                ? 'Find My Bin needs your camera to see what you’re about to toss.'
                : 'Turn it back on in Settings, or sort a photo from your library.'
            }
            actionLabel={permission.canAskAgain ? 'Turn on camera' : 'Open Settings'}
            onAction={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
            onPickPhoto={pickFromLibrary}
          />
        )}

        {permission?.granted && cameraError && (
          <CameraMessage
            title="No camera here"
            body="This device can’t open a camera, but you can still sort a photo from your library."
            onPickPhoto={pickFromLibrary}
          />
        )}

        {cameraUsable && (
          <>
            <FrameCorners />
            <View pointerEvents="none" style={styles.hint}>
              <Text variant="caption" color={colors.cream}>
                Fill the frame with one item
              </Text>
            </View>
          </>
        )}

        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
      </View>

      <View style={[styles.controls, { marginBottom: tabBarClearance(insets.bottom) - 6 }]}>
        <RoundButton icon="image" label="Choose a photo" size={52} onPress={pickFromLibrary} />

        <Shutter disabled={!cameraUsable || !cameraReady || capturing} onPress={takePhoto} />

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={latest ? 'Open your board' : 'Your board is empty'}
          onPress={onOpenBoard}
          style={styles.latest}
        >
          <View style={styles.latestTilt}>
            <Polaroid
              width={46}
              photoUri={latest ? photoUri(latest.photoFile) : null}
              placeholder={<View style={styles.latestEmpty} />}
            />
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

function Shutter({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Take photo"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.shutter, disabled && styles.shutterDisabled]}
    >
      <View style={styles.shutterDisc}>
        <View style={styles.shutterRing} />
      </View>
    </PressableScale>
  );
}

type RoundButtonProps = {
  icon: 'image' | 'flash' | 'flashOff';
  label: string;
  onPress: () => void;
  size?: number;
  active?: boolean;
};

function RoundButton({ icon, label, onPress, size = 40, active }: RoundButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.roundButton,
        { width: size, height: size, borderRadius: size / 2 },
        active && { backgroundColor: colors.mustard },
      ]}
    >
      <Icon name={icon} size={size * 0.46} color={active ? colors.espresso : colors.cream} />
    </PressableScale>
  );
}

function FrameCorners() {
  return (
    <View pointerEvents="none" style={styles.corners}>
      <View style={[styles.corner, styles.cornerTopLeft]} />
      <View style={[styles.corner, styles.cornerTopRight]} />
      <View style={[styles.corner, styles.cornerBottomLeft]} />
      <View style={[styles.corner, styles.cornerBottomRight]} />
    </View>
  );
}

type CameraMessageProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  onPickPhoto: () => void;
};

function CameraMessage({ title, body, actionLabel, onAction, onPickPhoto }: CameraMessageProps) {
  return (
    <View style={styles.message}>
      <View pointerEvents="none" style={styles.messageSun}>
        <Sunburst size={520} color={colors.mustard} intensity={0.22} />
      </View>
      <Text variant="title" color={colors.cream} style={styles.center}>
        {title}
      </Text>
      <Text variant="body" color={colors.onDarkSoft} style={[styles.center, styles.messageBody]}>
        {body}
      </Text>
      {actionLabel && onAction ? (
        <>
          <Button label={actionLabel} variant="accent" onPress={onAction} style={styles.messageButton} />
          <Pressable accessibilityRole="button" onPress={onPickPhoto} hitSlop={10} style={styles.messageLink}>
            <Text variant="label" color={colors.cream}>
              Choose a photo instead
            </Text>
          </Pressable>
        </>
      ) : (
        <Button
          label="Choose a photo"
          icon="image"
          variant="accent"
          onPress={onPickPhoto}
          style={styles.messageButton}
        />
      )}
    </View>
  );
}

const CORNER = 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.espresso,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, letterSpacing: -0.3 },
  demoTag: {
    borderWidth: 1,
    borderColor: 'rgba(224, 165, 38, 0.6)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  demoText: { fontSize: 9.5, letterSpacing: 1.2 },
  viewfinder: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 4,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1C130D',
  },
  flash: { backgroundColor: colors.paper },
  corners: { ...StyleSheet.absoluteFill, margin: 20 },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: 'rgba(244, 235, 221, 0.9)',
  },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  hint: {
    position: 'absolute',
    top: 34,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(43, 29, 20, 0.55)',
  },
  controls: {
    height: 116,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
  },
  roundButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onDarkFaint,
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.4 },
  shutterDisc: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: 'rgba(224, 165, 38, 0.85)',
  },
  latest: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  latestTilt: { transform: [{ rotate: '7deg' }] },
  latestEmpty: { flex: 1, backgroundColor: colors.espressoRaised },
  message: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  messageSun: { position: 'absolute', top: '50%', left: '50%', marginTop: -260, marginLeft: -260 },
  messageBody: { marginTop: 10, maxWidth: 300 },
  messageButton: { marginTop: 24, minWidth: 200 },
  messageLink: { marginTop: 18 },
  center: { textAlign: 'center' },
});
