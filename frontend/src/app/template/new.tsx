import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, ErrorBanner, Field, Rule, Section, useText } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { makeStyles, radius, spacing, type, useColors } from '@/lib/theme';
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
  const styles = useStyles();
  const t = useText();
  const c = useColors();

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error && !error.field('name') ? <ErrorBanner message={error.message} /> : null}
      <Field label="Template name" value={name} onChangeText={setName} placeholder="e.g. Push Day A" error={error?.field('name')} />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

      <Section title="Exercises" style={styles.section}>
        {entries.length > 0 ? (
          <Card flush>
            {entries.map((entry, index) => (
              <Fragment key={entry.exercise.id}>
                {index > 0 ? <Rule /> : null}
                <View style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={[t.body, styles.flex]}>{entry.exercise.name}</Text>
                    <Pressable
                      onPress={() => setEntries((current) => current.filter((_, i) => i !== index))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${entry.exercise.name}`}
                      style={styles.remove}
                    >
                      <Ionicons name="close" size={22} color={c.textMuted} />
                    </Pressable>
                  </View>
                  <View style={styles.targets}>
                    <TargetInput label="Sets" value={entry.targetSets} onChange={(v) => update(index, { targetSets: v })} />
                    <Text style={t.muted}>×</Text>
                    <TargetInput label="Reps" value={entry.targetReps} onChange={(v) => update(index, { targetReps: v })} />
                  </View>
                </View>
              </Fragment>
            ))}
          </Card>
        ) : (
          <Text style={t.muted}>Add the exercises this routine uses, with target sets and reps.</Text>
        )}
        <Button title="Add exercises" icon="add" variant="secondary" onPress={() => setPickerOpen(true)} />
      </Section>

      <Button
        title="Save template"
        onPress={save}
        loading={submitting}
        disabled={!name.trim() || entries.length === 0}
        style={styles.save}
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
  const styles = useStyles();
  const t = useText();
  const c = useColors();
  return (
    <View style={styles.target}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        selectionColor={c.accent}
        style={styles.targetInput}
        accessibilityLabel={`Target ${label.toLowerCase()}`}
        selectTextOnFocus
      />
      <Text style={t.muted}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { backgroundColor: c.background },
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl },
  section: { marginTop: spacing.md },
  flex: { flex: 1 },
  entry: { gap: spacing.sm, paddingVertical: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.sm },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  targets: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  target: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targetInput: {
    ...type.numeral,
    fontSize: 20,
    width: 64,
    height: 44,
    paddingVertical: 0,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    textAlign: 'center',
    color: c.text,
  },
  save: { marginTop: spacing.md },
}));
