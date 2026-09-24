import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExercisePicker } from '@/components/ExercisePicker';
import { Stepper } from '@/components/Stepper';
import { Button, Card, ErrorBanner, Field, text } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import type { Exercise } from '@/lib/types';
import { errorMessage } from '@/lib/useApi';

interface Entry {
  exercise: Exercise;
  sets: number;
}

function defaultName(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning workout';
  if (hour < 17) return 'Afternoon workout';
  return 'Evening workout';
}

export default function NewWorkoutScreen() {
  const [name, setName] = useState(defaultName);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.createWorkout({
        name: name.trim() || defaultName(),
        exercises: entries.map((e) => ({
          exercise_id: e.exercise.id,
          sets: Array.from({ length: e.sets }, () => ({})),
        })),
      });
      router.replace(`/workout/${data.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  };

  const changeSets = (index: number, delta: number) =>
    setEntries((current) =>
      current.map((e, i) => (i === index ? { ...e, sets: Math.min(20, Math.max(1, e.sets + delta)) } : e)),
    );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <ErrorBanner message={error} /> : null}
      <Field label="Workout name" value={name} onChangeText={setName} />

      <Text style={text.heading}>Exercises</Text>
      {entries.length === 0 ? (
        <Text style={text.muted}>Add the exercises you plan to do. You can add more sets as you go.</Text>
      ) : null}

      {entries.map((entry, index) => (
        <Card key={entry.exercise.id} style={styles.entry}>
          <View style={{ flex: 1 }}>
            <Text style={text.body}>{entry.exercise.name}</Text>
            <Text style={text.muted}>{entry.sets} sets</Text>
          </View>
          <Stepper label="sets" onMinus={() => changeSets(index, -1)} onPlus={() => changeSets(index, 1)} />
          <Pressable
            onPress={() => setEntries((current) => current.filter((_, i) => i !== index))}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${entry.exercise.name}`}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={24} color={colors.textMuted} />
          </Pressable>
        </Card>
      ))}

      <Button title="+ Add exercises" variant="secondary" onPress={() => setPickerOpen(true)} />
      <Button title="Start workout" onPress={start} loading={submitting} />

      <ExercisePicker
        visible={pickerOpen}
        excludeIds={entries.map((e) => e.exercise.id)}
        onClose={() => setPickerOpen(false)}
        onDone={(picked) => {
          setEntries((current) => [...current, ...picked.map((exercise) => ({ exercise, sets: 3 }))]);
          setPickerOpen(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
