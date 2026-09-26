import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Card, ErrorBanner, Field, Section, useText } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { avatarForm, CameraPermissionError, pickAvatar, type AvatarSource } from '@/lib/avatar';
import { confirm } from '@/lib/dialogs';
import { makeStyles, spacing, type, useColors } from '@/lib/theme';

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

  const [pictureBusy, setPictureBusy] = useState<AvatarSource | 'remove' | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const styles = useStyles();
  const t = useText();

  if (!user) return null;

  const changePicture = async (source: AvatarSource) => {
    setPictureError(null);
    try {
      const asset = await pickAvatar(source);
      if (!asset) return;
      setPictureBusy(source);
      updateUser(await api.uploadAvatar(await avatarForm(asset)));
    } catch (e) {
      if (e instanceof ApiError) setPictureError(e.field('avatar') ?? e.message);
      else if (e instanceof CameraPermissionError) setPictureError(e.message);
      // The simulator and some desktops have no camera; the picker throws rather than opening.
      else setPictureError(source === 'camera' ? 'No camera is available on this device.' : 'Could not open your photos.');
    } finally {
      setPictureBusy(null);
    }
  };

  const removePicture = () =>
    confirm('Remove profile picture?', 'Your initial will be shown instead.', 'Remove', async () => {
      setPictureBusy('remove');
      setPictureError(null);
      try {
        updateUser(await api.deleteAvatar());
      } catch (e) {
        setPictureError(asApiError(e).message);
      } finally {
        setPictureBusy(null);
      }
    });

  // The API stores emails in lowercase, so a change of case alone isn't a new email.
  const emailChanged = email.trim().toLowerCase() !== user.email;
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.picture}>
          <Avatar user={user} size={112} />
          {pictureError ? <Text style={styles.error}>{pictureError}</Text> : null}
          <View style={styles.pictureButtons}>
            <Button
              title="Choose photo"
              variant="secondary"
              onPress={() => changePicture('library')}
              loading={pictureBusy === 'library'}
              disabled={pictureBusy !== null}
              style={styles.flex}
            />
            <Button
              title="Take photo"
              variant="secondary"
              onPress={() => changePicture('camera')}
              loading={pictureBusy === 'camera'}
              disabled={pictureBusy !== null}
              style={styles.flex}
            />
          </View>
          {user.avatar_url ? (
            <Button
              title="Remove picture"
              variant="ghost"
              onPress={removePicture}
              loading={pictureBusy === 'remove'}
              disabled={pictureBusy !== null}
            />
          ) : null}
        </Card>

        <Section title="Details" style={styles.section}>
          <Card style={styles.card}>
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
            {detailsSaved ? <Saved message="Profile saved." /> : null}
            <Button
              title="Save details"
              onPress={saveDetails}
              loading={savingDetails}
              disabled={!detailsChanged || !name.trim() || !email.trim() || (emailChanged && !emailPassword)}
            />
          </Card>
        </Section>

        <Section title="Change password" style={styles.section}>
          <Card style={styles.card}>
            <Text style={t.caption}>Other devices signed in to your account will be signed out.</Text>
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
            {passwordSaved ? <Saved message="Password changed." /> : null}
            <Button
              title="Change password"
              onPress={savePassword}
              loading={savingPassword}
              disabled={!currentPassword || !newPassword || !confirmation}
            />
          </Card>
        </Section>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** A confirmation line with a check, so success reads by shape as well as color. */
function Saved({ message }: { message: string }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={styles.savedRow} accessibilityRole="alert">
      <Ionicons name="checkmark-circle" size={18} color={c.accent} />
      <Text style={styles.saved}>{message}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  flex: { flex: 1 },
  screen: { backgroundColor: c.background },
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl },
  picture: { alignItems: 'center', gap: spacing.md },
  section: { marginTop: spacing.lg },
  card: { gap: spacing.lg },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  saved: { ...type.label, color: c.accent },
  error: { ...type.label, color: c.danger, textAlign: 'center' },
  pictureButtons: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
}));
