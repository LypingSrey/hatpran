import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
import { exerciseTypeLabels, formatDate, formatRecordValue, recordLabels } from '@/lib/format';
import { colors, spacing } from '@/lib/theme';
import { errorMessage, useApi } from '@/lib/useApi';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const exercise = useApi(() => api.exercise(exerciseId), [exerciseId]);
  const records = useApi(() => api.exerciseRecords(exerciseId), [exerciseId]);

  const item = exercise.data?.data;
  if (exercise.isLoading && !item) return <Loading />;
  if (!item) return <ErrorBanner message={exercise.error ?? 'Exercise not found.'} onRetry={exercise.refresh} />;

  const remove = () => {
    const doDelete = async () => {
      try {
        await api.deleteExercise(item.id);
        router.back();
      } catch (e) {
        const message = errorMessage(e);
        if (Platform.OS === 'web') globalThis.alert?.(message);
        else Alert.alert('Could not delete', message);
      }
    };
    const warning = 'Deleting a custom exercise also removes it from every past workout and template.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(warning)) void doDelete();
      return;
    }
    Alert.alert('Delete exercise?', warning, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const recordList = records.data?.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: item.name }} />

      <Card style={{ gap: spacing.xs }}>
        <Text style={text.title}>{item.name}</Text>
        <Text style={text.muted}>
          {[item.muscle_group?.name, item.equipment?.name, exerciseTypeLabels[item.exercise_type]]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {item.description ? <Text style={[text.body, { marginTop: spacing.sm }]}>{item.description}</Text> : null}
        {item.instructions ? <Text style={[text.body, { marginTop: spacing.sm }]}>{item.instructions}</Text> : null}
      </Card>

      <Text style={text.heading}>Your records</Text>
      {records.error ? <ErrorBanner message={records.error} onRetry={records.refresh} /> : null}
      {recordList.length === 0 && !records.isLoading ? (
        <Text style={text.muted}>No records yet. Finish a workout with this exercise to set one.</Text>
      ) : null}
      {recordList.map((r) => (
        <Card key={r.id} style={styles.record}>
          <Ionicons name="trophy" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={text.body}>{recordLabels[r.record_type]}</Text>
            <Text style={text.muted}>{formatDate(r.achieved_at)}</Text>
          </View>
          <Text style={text.heading}>{formatRecordValue(r.record_type, r.value)}</Text>
        </Card>
      ))}

      {item.is_custom ? <Button title="Delete custom exercise" variant="ghost" onPress={remove} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  record: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
