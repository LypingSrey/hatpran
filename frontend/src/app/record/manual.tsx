import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, Chip, ErrorBanner, Field, Loading, text } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { confirm, notify, showError } from '@/lib/dialogs';
import {
  formatDate,
  formatRecordValue,
  parseDateTimeInput,
  recordInputs,
  recordLabels,
  recordTypesFor,
  toDateInput,
} from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Exercise, ManualRecord, PersonalRecord, RecordType } from '@/lib/types';
import { errorMessage } from '@/lib/useApi';

/**
 * Add a best the user set outside the app, or edit/delete one they entered before.
 * Params: `id` edits that entry; `exerciseId` pre-selects the exercise for a new one.
 */
export default function ManualRecordScreen() {
  const params = useLocalSearchParams<{ id?: string; exerciseId?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const presetExerciseId = params.exerciseId ? Number(params.exerciseId) : null;

  const [existing, setExisting] = useState<ManualRecord | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(() => toDateInput(new Date()));
  // Other entries and current records for the chosen exercise, to avoid duplicates and give context.
  const [siblings, setSiblings] = useState<ManualRecord[]>([]);
  const [currentRecords, setCurrentRecords] = useState<PersonalRecord[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(editingId !== null || presetExerciseId !== null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [localErrors, setLocalErrors] = useState<{ value?: string; date?: string }>({});
  const [saving, setSaving] = useState(false);

  // Load the entry being edited, or the preset exercise, once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (editingId !== null) {
          const { data } = await api.manualRecord(editingId);
          if (cancelled) return;
          setExisting(data);
          setExercise(data.exercise ?? null);
          setRecordType(data.record_type);
          setValue(String(data.value));
          setDate(toDateInput(new Date(data.achieved_at)));
        } else if (presetExerciseId !== null) {
          const { data } = await api.exercise(presetExerciseId);
          if (!cancelled) chooseExercise(data);
        }
      } catch (e) {
        if (!cancelled) setLoadError(errorMessage(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingId, presetExerciseId]);

  const exerciseId = exercise?.id;
  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    Promise.all([api.manualRecords({ exercise_id: exerciseId }), api.exerciseRecords(exerciseId)])
      .then(([manual, records]) => {
        if (cancelled) return;
        setSiblings(manual.data);
        setCurrentRecords(records.data);
      })
      .catch(() => {
        // Context only; saving still works and the API rejects duplicates.
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  function chooseExercise(next: Exercise) {
    setExercise(next);
    const types = recordTypesFor(next.exercise_type);
    setRecordType((current) => (current && types.includes(current) ? current : types[0]));
  }

  if (isLoading) return <Loading />;
  if (loadError) {
    return (
      <View style={styles.container}>
        <ErrorBanner message={loadError} />
      </View>
    );
  }

  const isEditing = existing !== null;
  const types = exercise ? recordTypesFor(exercise.exercise_type) : [];
  const input = recordType ? recordInputs[recordType] : null;
  const duplicate = !isEditing ? siblings.find((m) => m.record_type === recordType) : undefined;
  const current = currentRecords.find((r) => r.record_type === recordType);

  const save = async () => {
    if (!exercise || !recordType || !input) return;

    const number = Number(value.replace(',', '.'));
    const errors: typeof localErrors = {};
    if (!value.trim() || !Number.isFinite(number) || number <= 0) errors.value = 'Enter a number above zero.';
    else if (!input.decimals && !Number.isInteger(number)) errors.value = 'Enter a whole number.';

    // Records are dated at midday so the day doesn't shift across time zones, but never in the future.
    const day = parseDateTimeInput(date, '12:00');
    if (!day) errors.date = 'Use the format YYYY-MM-DD, e.g. 2025-06-01.';
    else if (toDateInput(day) > toDateInput(new Date())) errors.date = "The date can't be in the future.";

    setLocalErrors(errors);
    if (errors.value || errors.date || !day) return;

    const achievedAt = new Date(Math.min(day.getTime(), Date.now())).toISOString();

    setSaving(true);
    setError(null);
    try {
      const response = existing
        ? await api.updateManualRecord(existing.id, { value: number, achieved_at: achievedAt })
        : await api.createManualRecord({
            exercise_id: exercise.id,
            record_type: recordType,
            value: number,
            achieved_at: achievedAt,
          });

      const record = response.personal_record;
      if (record && record.source === 'workout') {
        notify(
          'Saved',
          `Your logged best of ${formatRecordValue(record.record_type, record.value)} is at least as good, so it stays your record.`,
          () => router.back(),
        );
      } else {
        router.back();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0));
      setSaving(false);
    }
  };

  const remove = () =>
    existing &&
    confirm('Delete this record?', 'Your records will be rebuilt from your logged workouts.', 'Delete', async () => {
      try {
        await api.deleteManualRecord(existing.id);
        router.back();
      } catch (e) {
        showError(e);
      }
    });

  const fieldErrors = error?.errors ?? {};
  const generalError = error && !fieldErrors.value && !fieldErrors.achieved_at ? error.message : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: isEditing ? 'Edit record' : 'Add a past record' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {!isEditing ? (
          <Text style={text.muted}>
            Add a best you set before using HatPran. If you beat it in a workout later, the new best takes over.
          </Text>
        ) : null}
        {generalError ? <ErrorBanner message={generalError} /> : null}

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>Exercise</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            disabled={isEditing}
            accessibilityRole="button"
            accessibilityLabel={exercise ? `Exercise: ${exercise.name}` : 'Choose exercise'}
            style={[styles.select, isEditing && { backgroundColor: colors.surfaceMuted }]}
          >
            <Text style={[text.body, { flex: 1 }, !exercise && { color: colors.textMuted }]}>
              {exercise?.name ?? 'Choose exercise'}
            </Text>
            {!isEditing ? <Ionicons name="chevron-down" size={18} color={colors.textMuted} /> : null}
          </Pressable>
        </View>

        {exercise ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={styles.label}>Record</Text>
            <View style={styles.chips}>
              {types.map((type) => (
                <Chip
                  key={type}
                  label={recordLabels[type]}
                  selected={type === recordType}
                  onPress={() => !isEditing && setRecordType(type)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {duplicate ? (
          <Card style={styles.notice}>
            <Text style={text.body}>
              You already entered {formatRecordValue(duplicate.record_type, duplicate.value)} for this on{' '}
              {formatDate(duplicate.achieved_at)}.
            </Text>
            <Button
              title="Edit that entry"
              variant="secondary"
              onPress={() => router.replace({ pathname: '/record/manual', params: { id: duplicate.id } })}
            />
          </Card>
        ) : null}

        {exercise && input && !duplicate ? (
          <>
            {current ? (
              <Text style={text.muted}>
                Current record: {formatRecordValue(current.record_type, current.value)} ·{' '}
                {current.source === 'manual' ? 'entered by you' : formatDate(current.achieved_at)}
              </Text>
            ) : null}
            <Field
              label={input.label}
              value={value}
              onChangeText={setValue}
              keyboardType={input.decimals ? 'decimal-pad' : 'number-pad'}
              placeholder="0"
              error={localErrors.value ?? fieldErrors.value?.[0]}
            />
            <DateField
              label="Date you set it"
              value={date}
              onChange={setDate}
              error={localErrors.date ?? fieldErrors.achieved_at?.[0]}
            />
            <Button title={isEditing ? 'Save changes' : 'Save record'} onPress={save} loading={saving} />
          </>
        ) : null}

        {isEditing ? <Button title="Delete record" variant="ghost" onPress={remove} /> : null}
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        single
        onClose={() => setPickerOpen(false)}
        onDone={([picked]) => {
          if (picked) chooseExercise(picked);
          setPickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  select: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: { gap: spacing.md, backgroundColor: colors.goldMuted, borderColor: colors.goldMuted },
});
