import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecordRow } from '@/components/RecordRow';
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
  const manual = useApi(() => api.manualRecords({ exercise_id: exerciseId }), [exerciseId]);

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
  const manualList = manual.data?.data ?? [];

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
      <Card style={{ gap: spacing.xs }}>
        {recordList.length === 0 && !records.isLoading ? (
          <Text style={text.muted}>No records yet. Finish a workout with this exercise, or add a best you set before.</Text>
        ) : null}
        {recordList.map((r) => (
          <View key={r.id} style={styles.record}>
            <Ionicons name="trophy" size={20} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <RecordRow record={r} />
            </View>
          </View>
        ))}
      </Card>

      {manualList.length > 0 ? (
        <>
          <Text style={text.heading}>Entered by you</Text>
          <Text style={text.muted}>Bests you added by hand. A logged set that beats one takes over as the record.</Text>
          <Card style={{ gap: spacing.xs }}>
            {manualList.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push({ pathname: '/record/manual', params: { id: m.id } })}
                accessibilityRole="button"
                accessibilityHint="Edit this record"
                style={({ pressed }) => [styles.manual, pressed && { opacity: 0.6 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={text.body}>{recordLabels[m.record_type]}</Text>
                  <Text style={text.muted}>{formatDate(m.achieved_at)}</Text>
                </View>
                <Text style={[text.body, { fontWeight: '700' }]}>{formatRecordValue(m.record_type, m.value)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      <Button
        title="+ Add a past record"
        variant="secondary"
        onPress={() => router.push({ pathname: '/record/manual', params: { exerciseId: item.id } })}
      />

      {item.is_custom ? <Button title="Delete custom exercise" variant="ghost" onPress={remove} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  record: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  manual: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
});
