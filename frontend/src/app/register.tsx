import { useState } from 'react';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { Button, ErrorBanner, Field, useText } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { makeStyles, spacing } from '@/lib/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const styles = useStyles();
  const t = useText();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signUp(name.trim(), email.trim(), password, confirmation);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0));
      setSubmitting(false);
    }
  };

  const hasFieldErrors = error && Object.keys(error.errors).length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error && !hasFieldErrors ? <ErrorBanner message={error.message} /> : null}

        <Field label="Name" value={name} onChangeText={setName} autoComplete="name" error={error?.field('name')} />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          error={error?.field('email')}
        />
        <Field
          label="Password (min. 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={error?.field('password')}
        />
        <Field
          label="Confirm password"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />

        <Button
          title="Create account"
          onPress={submit}
          loading={submitting}
          disabled={!name || !email || !password || !confirmation}
        />

        <Text style={[t.caption, styles.center]}>
          By creating an account you agree to the{' '}
          <Link href="/legal/terms" style={t.link}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" style={t.link}>
            Privacy Policy
          </Link>
          .
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((c) => ({
  flex: { flex: 1, backgroundColor: c.background },
  center: { textAlign: 'center' },
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl },
}));
