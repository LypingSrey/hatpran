import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, text } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={text.title}>{user?.name}</Text>
        <Text style={text.muted}>{user?.email}</Text>
      </Card>

      <Button
        title="Log out"
        variant="secondary"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
        }}
      />

      <Text style={[text.muted, { textAlign: 'center', fontSize: 12 }]}>Server: {API_URL}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  card: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.onPrimary, fontSize: 30, fontWeight: '700' },
});
