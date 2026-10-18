import { Caveat_700Bold } from '@expo-google-fonts/caveat/700Bold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Fraunces_900Black } from '@expo-google-fonts/fraunces/900Black';

// Imported per weight so only these six files end up in the bundle.
export const fontAssets = {
  Fraunces_900Black,
  Fraunces_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  Caveat_700Bold,
};

export const fonts = {
  // Soft, chunky serif: the main 70s signal. Use for titles only.
  display: 'Fraunces_900Black',
  heading: 'Fraunces_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  // Marker-on-a-polaroid handwriting.
  hand: 'Caveat_700Bold',
} as const;
