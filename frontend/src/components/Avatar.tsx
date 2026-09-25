import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';
import type { User } from '@/lib/types';

/** The user's profile picture, or the first letter of their name on a coloured circle. */
export function Avatar({ user, size = 72 }: { user: Pick<User, 'name' | 'avatar_url'> | null; size?: number }) {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (user?.avatar_url) {
    return (
      <Image
        source={{ uri: user.avatar_url }}
        style={[circle, { backgroundColor: colors.surfaceMuted }]}
        accessibilityLabel={`${user.name}'s profile picture`}
      />
    );
  }

  return (
    <View style={[styles.fallback, circle]} accessibilityLabel={user ? `${user.name}'s initial` : undefined}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{user?.name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.onPrimary, fontWeight: '700' },
});
