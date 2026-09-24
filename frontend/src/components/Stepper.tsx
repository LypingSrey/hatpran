import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/lib/theme';

export function Stepper({ onMinus, onPlus, label }: { onMinus: () => void; onPlus: () => void; label: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} accessibilityRole="button" accessibilityLabel={`Fewer ${label}`} hitSlop={6}>
        <Ionicons name="remove-circle-outline" size={28} color={colors.primary} />
      </Pressable>
      <Pressable onPress={onPlus} accessibilityRole="button" accessibilityLabel={`More ${label}`} hitSlop={6}>
        <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', gap: spacing.sm },
});
