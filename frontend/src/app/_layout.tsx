import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
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
