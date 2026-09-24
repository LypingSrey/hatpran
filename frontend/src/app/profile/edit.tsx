import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Card, ErrorBanner, Field, text } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

function asApiError(e: unknown): ApiError {
  return e instanceof ApiError ? e : new ApiError('Something went wrong.', 0);
}

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [emailPassword, setEmailPassword] = useState('');
  const [detailsError, setDetailsError] = useState<ApiError | null>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState<ApiError | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const emailChanged = email.trim() !== user.email;
  const detailsChanged = name.trim() !== user.name || emailChanged;

  const saveDetails = async () => {
    setSavingDetails(true);
    setDetailsError(null);
    setDetailsSaved(false);
    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        ...(emailChanged ? { current_password: emailPassword } : {}),
      });
      updateUser(updated);
      setEmailPassword('');
      setDetailsSaved(true);
    } catch (e) {
      setDetailsError(asApiError(e));
    } finally {
      setSavingDetails(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      await api.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmation,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setPasswordSaved(true);
    } catch (e) {
      setPasswordError(asApiError(e));
    } finally {
      setSavingPassword(false);
    }
  };

  const hasFieldErrors = (error: ApiError | null) => error && Object.keys(error.errors).length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.section}>
          <Text style={text.heading}>Details</Text>
          {detailsError && !hasFieldErrors(detailsError) ? <ErrorBanner message={detailsError.message} /> : null}
          <Field
            label="Name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setDetailsSaved(false);
            }}
            autoComplete="name"
            error={detailsError?.field('name')}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setDetailsSaved(false);
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={detailsError?.field('email')}
          />
          {emailChanged ? (
            <Field
              label="Current password (needed to change your email)"
              value={emailPassword}
              onChangeText={setEmailPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              error={detailsError?.field('current_password')}
            />
          ) : null}
          {detailsSaved ? <Text style={styles.saved}>Profile saved.</Text> : null}
          <Button
            title="Save details"
            onPress={saveDetails}
            loading={savingDetails}
            disabled={!detailsChanged || !name.trim() || !email.trim() || (emailChanged && !emailPassword)}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={text.heading}>Change password</Text>
          <Text style={text.muted}>Other devices signed in to your account will be signed out.</Text>
          {passwordError && !hasFieldErrors(passwordError) ? <ErrorBanner message={passwordError.message} /> : null}
          <Field
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            error={passwordError?.field('current_password')}
          />
          <Field
            label="New password (min. 8 characters)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={passwordError?.field('password')}
          />
          <Field
            label="Confirm new password"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={savePassword}
          />
          {passwordSaved ? <Text style={styles.saved}>Password changed.</Text> : null}
          <Button
            title="Change password"
            onPress={savePassword}
            loading={savingPassword}
            disabled={!currentPassword || !newPassword || !confirmation}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  section: { gap: spacing.md },
  saved: { color: colors.success, fontSize: 14, fontWeight: '600' },
});
