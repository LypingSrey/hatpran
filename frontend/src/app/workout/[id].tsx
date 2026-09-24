import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SetRow } from '@/components/SetRow';
import { Button, Card, ErrorBanner, Loading, text } from '@/components/ui';
import { api, type SetInput } from '@/lib/api';
import { formatDate, formatDuration, formatNumber, formatRecordValue, recordLabels, setFieldsFor } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { ExerciseSet, PersonalRecord, Workout, WorkoutExercise } from '@/lib/types';
import { errorMessage, useApi } from '@/lib/useApi';

/** Confirm on native; window.confirm on web where Alert buttons aren't supported. */
function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

function showError(e: unknown) {
  const message = errorMessage(e);
  if (Platform.OS === 'web') globalThis.alert?.(message);
  else Alert.alert('Could not save', message);
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const { data, error, isLoading, refresh, setData } = useApi(() => api.workout(workoutId), [workoutId]);
  const [newRecords, setNewRecords] = useState<PersonalRecord[] | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const workout = data?.data;

  // Live timer while the workout is in progress.
  useEffect(() => {
    if (!workout || workout.is_completed) return;
    const tick = () => setElapsed(Math.max(0, (Date.now() - new Date(workout.started_at).getTime()) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [workout]);

  if (isLoading && !workout) return <Loading />;
  if (!workout) return <ErrorBanner message={error ?? 'Workout not found.'} onRetry={refresh} />;

  // Totals are derived locally so they update as sets are ticked, before any refetch.
  const completedSets = (workout.exercises ?? []).flatMap((we) => we.sets ?? []).filter((s) => s.is_completed);
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);

  const replaceWorkout = (updater: (w: Workout) => Workout) =>
    setData((current) => (current ? { data: updater(current.data) } : current));

  const replaceSets = (workoutExerciseId: number, updater: (sets: ExerciseSet[]) => ExerciseSet[]) =>
    replaceWorkout((w) => ({
      ...w,
      exercises: w.exercises?.map((we) => (we.id === workoutExerciseId ? { ...we, sets: updater(we.sets ?? []) } : we)),
    }));

  const saveSet = async (we: WorkoutExercise, set: ExerciseSet, changes: SetInput) => {
    try {
      const { data: updated } = await api.updateSet(set.id, changes);
      replaceSets(we.id, (sets) => sets.map((s) => (s.id === updated.id ? updated : s)));
    } catch (e) {
      showError(e);
    }
  };

  const addSet = async (we: WorkoutExercise) => {
    // Pre-fill with the previous set so the next one is a single tap.
    const last = we.sets?.at(-1);
    const prefill: SetInput = last
      ? {
          weight_kg: last.weight_kg,
          reps: last.reps,
          distance_meters: last.distance_meters,
          duration_seconds: last.duration_seconds,
        }
      : {};
    try {
      const { data: created } = await api.addSet(we.id, prefill);
      replaceSets(we.id, (sets) => [...sets, created]);
    } catch (e) {
      showError(e);
    }
  };

  const deleteSet = (we: WorkoutExercise, set: ExerciseSet) =>
    confirm('Delete set?', `Set ${set.set_number} will be removed.`, 'Delete', async () => {
      try {
        await api.deleteSet(set.id);
        replaceSets(we.id, (sets) => sets.filter((s) => s.id !== set.id));
      } catch (e) {
        showError(e);
      }
    });

  const finish = async () => {
    const pending = (workout.exercises ?? []).flatMap((we) => we.sets ?? []).filter((s) => !s.is_completed).length;
    const doFinish = async () => {
      setFinishing(true);
      try {
        const response = await api.completeWorkout(workout.id);
        setData(() => ({ data: response.data }));
        setNewRecords(response.personal_records);
      } catch (e) {
        showError(e);
      } finally {
        setFinishing(false);
      }
    };
    if (pending > 0) {
      confirm(
        'Finish workout?',
        `${pending} set${pending === 1 ? ' is' : 's are'} not ticked and won't count toward volume or records.`,
        'Finish',
        doFinish,
      );
    } else {
      await doFinish();
    }
  };

  const remove = () =>
    confirm('Delete workout?', 'This workout and its sets will be permanently deleted.', 'Delete', async () => {
      try {
        await api.deleteWorkout(workout.id);
        router.back();
      } catch (e) {
        showError(e);
      }
    });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: workout.name }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {newRecords ? <RecordsCelebration records={newRecords} /> : null}

        <Card style={styles.summary}>
          <SummaryItem
            label={workout.is_completed ? 'Duration' : 'Elapsed'}
            value={formatDuration(workout.is_completed ? workout.duration_seconds : elapsed)}
          />
          <SummaryItem label="Volume" value={`${formatNumber(totalVolume, 0)} kg`} />
          <SummaryItem label="Sets done" value={String(completedSets.length)} />
        </Card>
        <Text style={text.muted}>
          Started {formatDate(workout.started_at)}
          {workout.template ? ` · from “${workout.template.name}”` : ''}
        </Text>

        {(workout.exercises ?? []).length === 0 ? (
          <Card>
            <Text style={text.muted}>This workout has no exercises.</Text>
          </Card>
        ) : null}

        {(workout.exercises ?? []).map((we) => {
          const exerciseType = we.exercise?.exercise_type ?? 'weight_reps';
          return (
            <Card key={we.id} style={{ gap: spacing.sm }}>
              <Text style={[text.heading, { color: colors.primary }]}>{we.exercise?.name ?? 'Exercise'}</Text>
              {we.notes ? <Text style={text.muted}>{we.notes}</Text> : null}

              <View style={styles.columns}>
                <Text style={[styles.columnLabel, { width: 36 }]}>Set</Text>
                {setFieldsFor(exerciseType).map(({ field, label }) => (
                  <Text key={field} style={[styles.columnLabel, { flex: 1 }]}>
                    {label}
                  </Text>
                ))}
                <View style={{ width: 40 }} />
              </View>

              {(we.sets ?? []).map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  exerciseType={exerciseType}
                  onSave={(changes) => saveSet(we, set, changes)}
                  onDelete={() => deleteSet(we, set)}
                />
              ))}

              <Button title="+ Add set" variant="secondary" onPress={() => addSet(we)} />
            </Card>
          );
        })}

        <Text style={[text.muted, { textAlign: 'center' }]}>
          Tap a set number to switch warmup / drop / failure. Long-press it to delete.
        </Text>

        {!workout.is_completed ? <Button title="Finish workout" onPress={finish} loading={finishing} /> : null}
        <Button title="Delete workout" variant="ghost" onPress={remove} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={text.muted}>{label}</Text>
    </View>
  );
}

function RecordsCelebration({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) {
    return (
      <Card style={{ alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="checkmark-circle" size={36} color={colors.success} />
        <Text style={text.heading}>Workout complete</Text>
        <Text style={text.muted}>No new records this time. Keep pushing!</Text>
      </Card>
    );
  }
  return (
    <View style={styles.celebration}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="trophy" size={28} color={colors.gold} />
        <Text style={text.heading}>
          {records.length} new personal record{records.length === 1 ? '' : 's'}!
        </Text>
      </View>
      {records.map((r) => (
        <View key={r.id} style={styles.recordLine}>
          <Text style={[text.body, { flex: 1 }]}>
            {r.exercise?.name} · {recordLabels[r.record_type]}
          </Text>
          <Text style={[text.body, { fontWeight: '700' }]}>{formatRecordValue(r.record_type, r.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  summary: { flexDirection: 'row' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  columns: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs },
  columnLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  celebration: {
    backgroundColor: colors.goldMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  recordLine: { flexDirection: 'row', gap: spacing.sm },
});
