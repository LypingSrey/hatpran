import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Button, ErrorBanner, Field, Loading, useText } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { parseDateTimeInput, toDateInput, toTimeInput } from '@/lib/format';
import { makeStyles, spacing } from '@/lib/theme';
import type { Workout } from '@/lib/types';
import { errorMessage } from '@/lib/useApi';

/** Edit a workout's name and notes, and for a finished one, when it happened and how long it took. */
export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [minutes, setMinutes] = useState('');
  const [localErrors, setLocalErrors] = useState<{ date?: string; time?: string; minutes?: string }>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const styles = useStyles();
  const t = useText();

  // Load once; refetching on focus would overwrite what the user is typing.
  useEffect(() => {
    let cancelled = false;
    api
      .workout(workoutId)
      .then(({ data }) => {
        if (cancelled) return;
        const started = new Date(data.started_at);
        setWorkout(data);
        setName(data.name);
        setNotes(data.notes ?? '');
        setDate(toDateInput(started));
        setTime(toTimeInput(started));
        setMinutes(String(Math.round((data.duration_seconds ?? 0) / 60)));
      })
      .catch((e) => !cancelled && setLoadError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  if (loadError) {
    return (
      <View style={styles.container}>
        <ErrorBanner message={loadError} />
      </View>
    );
  }
  if (!workout) return <Loading />;

  const original = new Date(workout.started_at);
  const originalMinutes = String(Math.round((workout.duration_seconds ?? 0) / 60));
  const timingChanged =
    workout.is_completed && (date !== toDateInput(original) || time !== toTimeInput(original) || minutes !== originalMinutes);

  const save = async () => {
    const errors: typeof localErrors = {};
    let timing: { started_at: string; completed_at: string } | null = null;

    // Only send times when they changed, so an untouched workout keeps its exact seconds.
    if (timingChanged) {
      const start = parseDateTimeInput(date, time);
      const duration = Number(minutes);
      if (!parseDateTimeInput(date)) errors.date = 'Use the format YYYY-MM-DD, e.g. 2026-09-21.';
      else if (!start) errors.time = 'Use 24-hour HH:MM, e.g. 07:30 or 18:45.';
      if (!minutes.trim() || !Number.isInteger(duration) || duration < 0 || duration > 24 * 60) {
        errors.minutes = 'Enter whole minutes, up to 24 hours.';
      }
      if (start && !errors.minutes) {
        const end = new Date(start.getTime() + duration * 60_000);
        if (end.getTime() > Date.now()) errors.time = "The workout can't finish in the future.";
        else timing = { started_at: start.toISOString(), completed_at: end.toISOString() };
      }
    }

    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      await api.updateWorkout(workout.id, {
        name: name.trim() || workout.name,
        notes: notes.trim() || null,
        ...(timing ?? {}),
      });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0));
      setSaving(false);
    }
  };

  const serverTimeError = error?.field('started_at') ?? error?.field('completed_at');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error && !serverTimeError && !error.field('name') ? <ErrorBanner message={error.message} /> : null}

        <Field label="Name" value={name} onChangeText={setName} error={error?.field('name')} />
        <Field
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="How did it go?"
          multiline
          style={styles.notes}
        />

        {workout.is_completed ? (
          <>
            <Text style={[t.heading, styles.when]} accessibilityRole="header">
              When
            </Text>
            <DateField label="Date" value={date} onChange={setDate} error={localErrors.date} />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field
                  label="Start time"
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  error={localErrors.time ?? serverTimeError}
                />
              </View>
              <View style={styles.flex}>
                <Field
                  label="Duration (minutes)"
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="number-pad"
                  maxLength={4}
                  error={localErrors.minutes}
                />
              </View>
            </View>
            <Text style={t.caption}>Changing when a workout happened also updates the dates on its records.</Text>
          </>
        ) : null}

        <Button title="Save" onPress={save} loading={saving} style={styles.save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((c) => ({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
    backgroundColor: c.background,
    flexGrow: 1,
  },
  notes: { minHeight: 96, paddingTop: spacing.sm, textAlignVertical: 'top' },
  when: { marginTop: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  save: { marginTop: spacing.lg },
}));
