import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/colors';
import { tabBarClearance } from '@/theme/layout';

type ToastOptions = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

const VISIBLE_MS = 5500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    setToast({ ...options, id: nextId.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { bottom: tabBarClearance(insets.bottom) - 4 }]}>
        {toast && (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOutDown.duration(180)}
            style={styles.toast}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text variant="label" color={colors.cream} style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel && (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  haptics.tap();
                  toast.onAction?.();
                  setToast(null);
                }}
              >
                <Text variant="label" color={colors.mustard}>
                  {toast.actionLabel}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside ToastProvider');
  return show;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    maxWidth: 420,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: colors.espresso,
    shadowColor: colors.espresso,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  message: { flexShrink: 1 },
});
