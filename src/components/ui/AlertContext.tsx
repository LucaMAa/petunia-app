import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '../../styles/theme';

type AlertType = 'info' | 'success' | 'error';

type ShowAlertOptions = {
  duration?: number;
  type?: AlertType;
  actionLabel?: string;
  onAction?: () => void;
};

type AlertContextValue = {
  showAlert: (message: string, options?: ShowAlertOptions) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('info');
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const actionRef = useRef<(() => void) | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback(
    (msg: string, options?: ShowAlertOptions) => {
      const duration = Math.min(options?.duration ?? 3000, 3000);
      setMessage(msg);
      setType(options?.type ?? 'info');
      setActionLabel(options?.actionLabel ?? null);
      actionRef.current = options?.onAction ?? null;
      setVisible(true);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      hideTimeout.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
          setMessage('');
          setActionLabel(null);
          actionRef.current = null;
        });
      }, duration);
    },
    [anim],
  );

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {visible ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                },
              ],
              opacity: anim,
            },
          ]}
        >
          <View
            style={[
              styles.banner,
              type === 'error' && styles.error,
              type === 'success' && styles.success,
            ]}
          >
            <Text style={styles.text}>{message}</Text>
            {actionLabel ? (
              <Pressable
                onPress={() => {
                  try {
                    actionRef.current?.();
                  } catch {}
                  if (hideTimeout.current) clearTimeout(hideTimeout.current);
                  Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
                    () => {
                      setVisible(false);
                      setMessage('');
                      setActionLabel(null);
                      actionRef.current = null;
                    },
                  );
                }}
                style={styles.action}
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>{actionLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                if (hideTimeout.current) clearTimeout(hideTimeout.current);
                Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
                  () => {
                    setVisible(false);
                    setMessage('');
                    setActionLabel(null);
                    actionRef.current = null;
                  },
                );
              }}
              style={styles.close}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { ...typography.bodyMedium, flex: 1, color: colors.text },
  close: { marginLeft: spacing.md, paddingHorizontal: spacing.sm },
  closeText: { fontSize: 18, color: colors.textSecondary },
  error: { borderColor: colors.error, backgroundColor: colors.errorLight },
  success: { borderColor: colors.success, backgroundColor: colors.successLight },
  action: { marginLeft: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  actionText: { color: colors.primary, fontWeight: '700' },
});

export default AlertContext;
