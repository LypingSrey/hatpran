import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, ErrorBanner, Field, text } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { colors, radius, spacing } from '@/lib/theme';
import type { Exercise } from '@/lib/types';

interface Entry {
  exercise: Exercise;
  targetSets: string;
  targetReps: string;
}

function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function NewTemplateScreen() {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const save = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.createTemplate({
        name: name.trim(),
        notes: notes.trim() || null,
        exercises: entries.map((e) => ({
          exercise_id: e.exercise.id,
          target_sets: toInt(e.targetSets),
          target_reps: toInt(e.targetReps),
        })),
      });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0));
      setSubmitting(false);
    }
  };

  const update = (index: number, patch: Partial<Entry>) =>
    setEntries((current) => current.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error && !error.field('name') ? <ErrorBanner message={error.message} /> : null}
      <Field label="Template name" value={name} onChangeText={setName} placeholder="e.g. Push Day A" error={error?.field('name')} />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

      <Text style={text.heading}>Exercises</Text>
      {entries.map((entry, index) => (
        <Card key={entry.exercise.id} style={{ gap: spacing.sm }}>
          <View style={styles.entryHeader}>
            <Text style={[text.body, { flex: 1 }]}>{entry.exercise.name}</Text>
            <Pressable
              onPress={() => setEntries((current) => current.filter((_, i) => i !== index))}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${entry.exercise.name}`}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.targets}>
            <TargetInput label="Sets" value={entry.targetSets} onChange={(v) => update(index, { targetSets: v })} />
            <Text style={text.muted}>×</Text>
            <TargetInput label="Reps" value={entry.targetReps} onChange={(v) => update(index, { targetReps: v })} />
          </View>
        </Card>
      ))}

      <Button title="+ Add exercises" variant="secondary" onPress={() => setPickerOpen(true)} />
      <Button
        title="Save template"
        onPress={save}
        loading={submitting}
        disabled={!name.trim() || entries.length === 0}
      />

      <ExercisePicker
        visible={pickerOpen}
        excludeIds={entries.map((e) => e.exercise.id)}
        onClose={() => setPickerOpen(false)}
        onDone={(picked) => {
          setEntries((current) => [
            ...current,
            ...picked.map((exercise) => ({ exercise, targetSets: '3', targetReps: '10' })),
          ]);
          setPickerOpen(false);
        }}
      />
    </ScrollView>
  );
}

function TargetInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.target}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        style={styles.targetInput}
        accessibilityLabel={`Target ${label.toLowerCase()}`}
        selectTextOnFocus
      />
      <Text style={text.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targets: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  target: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targetInput: {
    width: 56,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
  },
});
