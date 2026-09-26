import { Image, Text, View } from 'react-native';

import { fonts, makeStyles } from '@/lib/theme';
import type { User } from '@/lib/types';

/** The user's profile picture, or the first letter of their name in ballpoint blue on a pale circle. */
export function Avatar({ user, size = 72 }: { user: Pick<User, 'name' | 'avatar_url'> | null; size?: number }) {
  const styles = useStyles();
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (user?.avatar_url) {
    return (
      <Image
        source={{ uri: user.avatar_url }}
        style={[circle, styles.image]}
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

const useStyles = makeStyles((c) => ({
  image: { backgroundColor: c.surfaceMuted },
  fallback: { backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  initial: { color: c.accent, fontFamily: fonts.bold },
}));
