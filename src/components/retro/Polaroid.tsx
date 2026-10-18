import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { PushPin } from '@/components/retro/PushPin';
import { Tape } from '@/components/retro/Tape';
import { Text } from '@/components/Text';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

export function polaroidMetrics(width: number) {
  const pad = Math.round(width * 0.055);
  const photo = width - pad * 2;
  const bottom = Math.round(width * 0.21);
  return { pad, photo, bottom, height: pad + photo + bottom };
}

type PolaroidProps = {
  width: number;
  photoUri?: string | null;
  caption?: string;
  // Smaller handwritten note on the right of the caption, e.g. a time.
  meta?: string;
  attachment?: 'pin' | 'tape' | 'none';
  // Pin color.
  accent?: string;
  tapeAngle?: number;
  // Rendered on top of the photo (absolutely position it yourself).
  photoOverlay?: ReactNode;
  // Shown in the photo area when there's no photo.
  placeholder?: ReactNode;
  // Rendered on top of the whole card.
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Polaroid({
  width,
  photoUri,
  caption,
  meta,
  attachment = 'none',
  accent = colors.orange,
  tapeAngle = -4,
  photoOverlay,
  placeholder,
  children,
  style,
}: PolaroidProps) {
  const { pad, photo, bottom } = polaroidMetrics(width);
  const captionSize = Math.min(30, Math.max(16, width * 0.105));
  const pinSize = Math.min(30, Math.max(18, width * 0.13));
  const tapeWidth = width * 0.42;
  const tapeHeight = Math.max(14, width * 0.11);

  return (
    <View style={[{ width }, style]}>
      <View style={[styles.frame, { padding: pad, paddingBottom: 0, borderRadius: Math.max(2, width * 0.012) }]}>
        <View style={[styles.photo, { width: photo, height: photo }]}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={180}
              recyclingKey={photoUri}
              accessibilityIgnoresInvertColors
            />
          ) : (
            placeholder
          )}
          <View pointerEvents="none" style={styles.photoEdge} />
          {photoOverlay}
        </View>
        <View style={[styles.captionRow, { height: bottom }]}>
          {caption ? (
            <Text
              numberOfLines={1}
              style={[styles.caption, { fontSize: captionSize, lineHeight: captionSize * 1.15 }]}
              color={colors.ink}
            >
              {caption}
            </Text>
          ) : null}
          {meta ? (
            <Text
              numberOfLines={1}
              style={[styles.caption, { fontSize: captionSize * 0.72, lineHeight: captionSize }]}
              color={colors.inkFaint}
            >
              {meta}
            </Text>
          ) : null}
        </View>
      </View>

      {attachment === 'pin' && (
        <View pointerEvents="none" style={[styles.attachment, { top: -pinSize * 0.42, left: width / 2 - pinSize / 2 }]}>
          <PushPin color={accent} size={pinSize} />
        </View>
      )}
      {attachment === 'tape' && (
        <View
          pointerEvents="none"
          style={[
            styles.attachment,
            { top: -tapeHeight * 0.5, left: width / 2 - tapeWidth / 2, transform: [{ rotate: `${tapeAngle}deg` }] },
          ]}
        >
          <Tape width={tapeWidth} height={tapeHeight} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.paper,
    shadowColor: '#2B1D14',
    shadowOpacity: 0.3,
    shadowRadius: 7,
    shadowOffset: { width: 1, height: 5 },
    elevation: 5,
  },
  photo: {
    backgroundColor: colors.creamDeep,
    overflow: 'hidden',
  },
  photoEdge: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(43, 29, 20, 0.12)',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 2,
  },
  caption: {
    fontFamily: fonts.hand,
    flexShrink: 1,
    // Caveat's glyphs overhang their box on the right; give them room.
    paddingRight: 4,
  },
  attachment: {
    position: 'absolute',
  },
});
