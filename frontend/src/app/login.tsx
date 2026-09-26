import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorBanner, Field, useText } from '@/components/ui';
import { ApiError, API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { makeStyles, spacing, type } from '@/lib/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const styles = useStyles();
  const t = useText();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0));
      setSubmitting(false);
    }
  };

  const fieldErrors = error && Object.keys(error.errors).length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.logo}>HatPran</Text>
            <Text style={t.muted}>Log every set. Beat your records.</Text>
          </View>

          {error && !fieldErrors ? <ErrorBanner message={error.message} /> : null}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={error?.field('email')}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submit}
            error={error?.field('password')}
          />

          <Button title="Log in" onPress={submit} loading={submitting} disabled={!email || !password} />

          <Button title="New here? Create an account" variant="ghost" onPress={() => router.push('/register')} />

          <Text style={[t.caption, styles.server]}>Server: {API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((c) => ({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: c.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, gap: spacing.xl },
  brand: { gap: spacing.xs, marginBottom: spacing.md },
  logo: { ...type.largeTitle, fontSize: 44, lineHeight: 50, letterSpacing: -1, color: c.text },
  server: { textAlign: 'center' },
}));
