import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { makeStyles, radius, spacing, useColors } from '@/lib/theme';

/** Minus and plus buttons for a small count, each a full 44pt target. */
export function Stepper({ onMinus, onPlus, label }: { onMinus: () => void; onPlus: () => void; label: string }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onMinus}
        accessibilityRole="button"
        accessibilityLabel={`Fewer ${label}`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={22} color={c.accent} />
      </Pressable>
      <Pressable
        onPress={onPlus}
        accessibilityRole="button"
        accessibilityLabel={`More ${label}`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={22} color={c.accent} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  stepper: { flexDirection: 'row', gap: spacing.sm },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
}));
