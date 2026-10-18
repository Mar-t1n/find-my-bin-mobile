import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { ScansProvider, useScans } from '@/store/scans';
import { SettingsProvider, useSettings } from '@/store/settings';
import { colors } from '@/theme/colors';
import { fontAssets } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ScansProvider>
          <ToastProvider>
            <RootStack fontsReady={fontsLoaded || !!fontError} />
          </ToastProvider>
        </ScansProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { ready: settingsReady, settings } = useSettings();
  const { ready: scansReady } = useScans();
  const ready = fontsReady && settingsReady && scansReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // The native splash stays up until everything is loaded.
  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={settings.onboarded}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="scan/[id]"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [1],
            sheetGrabberVisible: true,
            sheetCornerRadius: 30,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!settings.onboarded}>
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
