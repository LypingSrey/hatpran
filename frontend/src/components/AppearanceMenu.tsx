import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appearanceOptions, type AppearancePreference } from '@/lib/appearance';
import { useAppearance } from '@/lib/appearanceContext';
import { makeStyles, radius, spacing, type, useColors } from '@/lib/theme';

const icons: Record<AppearancePreference, ComponentProps<typeof Ionicons>['name']> = {
  system: 'contrast',
  light: 'sunny',
  dark: 'moon',
};

/**
 * The appearance setting as one round icon for a screen's title row. The icon shows the current choice;
 * tapping it opens a small menu with System, Light and Dark, a check on the current one.
 */
export function AppearanceMenu() {
  const { preference, setPreference } = useAppearance();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const c = useColors();
  const currentLabel = appearanceOptions.find((o) => o.value === preference)?.label ?? 'System';

  const choose = (value: AppearancePreference) => {
    setPreference(value);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Appearance: ${currentLabel}`}
        accessibilityHint="Choose light, dark or follow your phone"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.button, (open || pressed) && styles.buttonActive]}
      >
        <Ionicons name={icons[preference]} size={22} color={c.text} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close appearance menu">
          {/* The menu drops from where the icon sits in the title row. */}
          <View style={[styles.menu, { top: insets.top + spacing.md + 52 }]} accessibilityRole="menu">
            <Text style={styles.menuTitle}>Appearance</Text>
            {appearanceOptions.map((option) => {
              const selected = option.value === preference;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => choose(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => [styles.item, (selected || pressed) && styles.itemSelected]}
                >
                  <Ionicons name={icons[option.value]} size={22} color={c.text} />
                  <Text style={[styles.itemText, selected && styles.itemTextSelected]}>{option.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={22} color={c.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: c.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: { backgroundColor: c.iconButtonActive },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  menu: {
    position: 'absolute',
    right: spacing.lg,
    width: 232,
    padding: spacing.xs + 2,
    borderRadius: radius.lg + 2,
    backgroundColor: c.menu,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuTitle: { ...type.caption, color: c.textMuted, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemSelected: { backgroundColor: c.menuSelected },
  itemText: { ...type.body, color: c.text, flex: 1 },
  itemTextSelected: { fontFamily: type.bodyStrong.fontFamily },
}));
