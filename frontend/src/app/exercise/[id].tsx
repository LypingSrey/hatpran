import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { RecordRow } from '@/components/RecordRow';
import { Button, Card, ErrorBanner, Loading, Rule, Section, useText } from '@/components/ui';
import { api } from '@/lib/api';
import { exerciseTypeLabels, formatDate, formatRecordValue, recordLabels } from '@/lib/format';
import { makeStyles, spacing, type, useColors } from '@/lib/theme';
import { errorMessage, useApi } from '@/lib/useApi';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const exercise = useApi(() => api.exercise(exerciseId), [exerciseId]);
  const records = useApi(() => api.exerciseRecords(exerciseId), [exerciseId]);
  const manual = useApi(() => api.manualRecords({ exercise_id: exerciseId }), [exerciseId]);
  const styles = useStyles();
  const t = useText();
  const c = useColors();

  const item = exercise.data?.data;
  if (exercise.isLoading && !item) return <Loading />;
  if (!item) {
    return (
      <View style={styles.container}>
        <ErrorBanner message={exercise.error ?? 'Exercise not found.'} onRetry={exercise.refresh} />
      </View>
    );
  }

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: item.name }} />

      <Card style={styles.intro}>
        <Text style={t.title}>{item.name}</Text>
        <Text style={t.muted}>
          {[item.muscle_group?.name, item.equipment?.name, exerciseTypeLabels[item.exercise_type]]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {item.description ? <Text style={[t.body, styles.paragraph]}>{item.description}</Text> : null}
        {item.instructions ? <Text style={[t.body, styles.paragraph]}>{item.instructions}</Text> : null}
      </Card>

      <Section title="Your records" style={styles.section}>
        {records.error ? <ErrorBanner message={records.error} onRetry={records.refresh} /> : null}
        <Card flush>
          {recordList.length === 0 && !records.isLoading ? (
            <Text style={[t.muted, styles.emptyLine]}>
              No records yet. Finish a workout with this exercise, or add a best you set before.
            </Text>
          ) : null}
          {recordList.map((r, index) => (
            <Fragment key={r.id}>
              {index > 0 ? <Rule /> : null}
              <RecordRow record={r} />
            </Fragment>
          ))}
        </Card>
      </Section>

      {manualList.length > 0 ? (
        <Section title="Entered by you" style={styles.section}>
          <Text style={t.caption}>Bests you added by hand. A logged set that beats one takes over as the record.</Text>
          <Card flush>
            {manualList.map((m, index) => (
              <Fragment key={m.id}>
                {index > 0 ? <Rule /> : null}
                <Pressable
                  onPress={() => router.push({ pathname: '/record/manual', params: { id: m.id } })}
                  accessibilityRole="button"
                  accessibilityHint="Edit this record"
                  style={({ pressed }) => [styles.manual, pressed && styles.pressed]}
                >
                  <View style={styles.flex}>
                    <Text style={t.body}>{recordLabels[m.record_type]}</Text>
                    <Text style={t.caption}>{formatDate(m.achieved_at)}</Text>
                  </View>
                  <Text style={styles.value}>{formatRecordValue(m.record_type, m.value)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
                </Pressable>
              </Fragment>
            ))}
          </Card>
        </Section>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Add a past record"
          icon="add"
          variant="secondary"
          onPress={() => router.push({ pathname: '/record/manual', params: { exerciseId: item.id } })}
        />
        {item.is_custom ? <Button title="Delete custom exercise" variant="danger" onPress={remove} /> : null}
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { backgroundColor: c.background },
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  intro: { gap: spacing.xs },
  paragraph: { marginTop: spacing.sm, color: c.textMuted },
  section: { marginTop: spacing.xl },
  emptyLine: { padding: spacing.lg },
  flex: { flex: 1 },
  manual: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 60, paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.6 },
  value: { ...type.bodyStrong, fontVariant: ['tabular-nums'], color: c.text },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
}));
