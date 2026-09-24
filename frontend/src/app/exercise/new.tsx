import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Chip, ErrorBanner, Field, text } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { exerciseTypeLabels } from '@/lib/format';
import { spacing } from '@/lib/theme';
import type { ExerciseType } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const exerciseTypes = Object.keys(exerciseTypeLabels) as ExerciseType[];

export default function NewExerciseScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('weight_reps');
  const [muscleGroupId, setMuscleGroupId] = useState<number | null>(null);
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const muscleGroups = useApi(() => api.muscleGroups());
  const equipment = useApi(() => api.equipment());

  const save = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.createExercise({
        name: name.trim(),
        exercise_type: exerciseType,
        muscle_group_id: muscleGroupId,
        equipment_id: equipmentId,
        description: description.trim() || null,
      });
      router.replace(`/exercise/${data.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0));
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error && !error.field('name') ? <ErrorBanner message={error.message} /> : null}
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Zercher Squat" error={error?.field('name')} />
      <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline />

      <Section title="How is it measured?">
        {exerciseTypes.map((type) => (
          <Chip key={type} label={exerciseTypeLabels[type]} selected={exerciseType === type} onPress={() => setExerciseType(type)} />
        ))}
      </Section>

      <Section title="Muscle group">
        {(muscleGroups.data?.data ?? []).map((mg) => (
          <Chip
            key={mg.id}
            label={mg.name}
            selected={muscleGroupId === mg.id}
            onPress={() => setMuscleGroupId(muscleGroupId === mg.id ? null : mg.id)}
          />
        ))}
      </Section>

      <Section title="Equipment">
        {(equipment.data?.data ?? []).map((eq) => (
          <Chip
            key={eq.id}
            label={eq.name}
            selected={equipmentId === eq.id}
            onPress={() => setEquipmentId(equipmentId === eq.id ? null : eq.id)}
          />
        ))}
      </Section>

      <Button title="Save exercise" onPress={save} loading={submitting} disabled={!name.trim()} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={text.heading}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
