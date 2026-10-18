import * as Haptics from 'expo-haptics';

// Mirrors the user's setting so haptics can be fired from anywhere without
// threading the settings context through every component.
let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

function run(effect: () => Promise<void>) {
  if (!enabled) return;
  effect().catch(() => {
    // Haptics are best-effort; unsupported devices just stay quiet.
  });
}

export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  shutter: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  thud: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  select: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
