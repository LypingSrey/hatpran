import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Button, Loading, text } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

/** Shown when a saved sign-in couldn't be checked on launch, e.g. no signal at the gym. */
function CantConnect({ message }: { message: string }) {
  const { retryRestore, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.cantConnect}>
      <Text style={text.title}>Can’t connect to HatPran</Text>
      <Text style={[text.body, styles.center]}>You’re still signed in. Check your connection and try again.</Text>
      <Text style={[text.muted, styles.center]}>{message}</Text>
      <Button title="Try again" onPress={() => void retryRestore()} style={styles.stretch} />
      <Button title="Log out" variant="ghost" onPress={() => void signOut()} />
    </SafeAreaView>
  );
}

function RootNavigator() {
  const { user, isLoading, restoreError } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (restoreError) {
    return <CantConnect message={restoreError} />;
  }

  const isSignedIn = user !== null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create account' }} />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
        <Stack.Screen name="workout/new" options={{ title: 'New workout', presentation: 'modal' }} />
        <Stack.Screen name="template/[id]" options={{ title: 'Template' }} />
        <Stack.Screen name="template/new" options={{ title: 'New template', presentation: 'modal' }} />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise' }} />
        <Stack.Screen name="exercise/new" options={{ title: 'Custom exercise', presentation: 'modal' }} />
        <Stack.Screen name="workout/edit/[id]" options={{ title: 'Edit workout', presentation: 'modal' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit profile', presentation: 'modal' }} />
        <Stack.Screen name="record/manual" options={{ title: 'Record', presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cantConnect: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: spacing.sm },
});
